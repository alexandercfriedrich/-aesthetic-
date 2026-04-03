#!/usr/bin/env tsx
/**
 * CLI script: ÄsthOp-Daten scrapen + DIREKT in doctor_profiles (draft) importieren
 *
 * Aufruf:
 *   npx tsx scripts/import-aesthop.ts
 *   npx tsx scripts/import-aesthop.ts --bundesland Wien --bundesland "Niederösterreich"
 *   npx tsx scripts/import-aesthop.ts --bundesland Wien --dry-run
 *
 * Optionale Flags:
 *   --bundesland <name>   Nur dieses Bundesland scrapen (wiederholbar)
 *   --operation  <name>   Nur diese Operation scrapen (wiederholbar)
 *   --no-enrich           Google-Places-Anreicherung überspringen
 *   --dry-run             Scrapen, aber nicht in die DB schreiben
 *   --force               Bereits importierte Ärzte NICHT skippen (re-importieren)
 *   --limit <n>           Nur die ersten N Ärzte importieren (Test-Modus)
 *
 * WORKFLOW:
 *   1. Script scraped Ärztekammer + schreibt direkt in doctor_profiles mit
 *      profile_status = 'draft'
 *   2. Admin reviewed die Draft-Profile im Admin-UI
 *   3. Admin approved → profile_status wird auf 'published' gesetzt
 *   4. Erst dann ist das Profil für Patienten sichtbar
 *
 * MULTI-LOCATION:
 *   Die Ärztekammer listet jeden Arzt pro Arbeitsstätte separat.
 *   Ein Arzt kann mehrere Standorte haben (Ordination + Krankenhaus, etc.).
 *   Dieses Script:
 *   - Sammelt alle Adressen eines Arztes in addresses[]
 *   - Erkennt Ordinationen via institutionName (dgName) + Namensteile
 *   - Setzt is_primary=true für die Ordination (höchste Priorität)
 *   - Speichert ALLE Standorte in der locations-Tabelle
 *
 * IDEMPOTENZ / SKIP-LOGIK:
 *   Vor dem Importieren wird geprüft, ob ein Arzt mit gleichem
 *   public_display_name (normalisiert) bereits in der DB existiert.
 *   Falls ja: Arzt wird geskippt → der Job kann beliebig oft neu gestartet
 *   werden, ohne Duplikate zu erzeugen.
 *   Mit --force wird diese Prüfung übersprungen.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import type { AesthOpDoctor } from "../src/lib/scrapers/aesthetische-operationen";
import { scrapeAesthOpDoctors } from "../src/lib/scrapers/aesthetische-operationen";
import { enrichWithGooglePlaces, type EnrichResult } from "../src/lib/scrapers/aesthop-enrich";
import { geocodeAddress } from "../src/lib/google/geocoding";

// ─── Load .env.local ────────────────────────────────────────────────────────

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    process.env[key] ??= val;
  }
}

// ─── CLI flags ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const bundeslaender: string[] = [];
const operations: string[] = [];
let enrich = true;
let dryRun = false;
let force = false;
let limitDoctors: number | null = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--bundesland" && args[i + 1]) {
    bundeslaender.push(args[++i]);
  } else if (args[i] === "--operation" && args[i + 1]) {
    operations.push(args[++i]);
  } else if (args[i] === "--no-enrich") {
    enrich = false;
  } else if (args[i] === "--dry-run") {
    dryRun = true;
  } else if (args[i] === "--force") {
    force = true;
  } else if (args[i] === "--limit") {
    const limitArg = args[i + 1];

    if (!limitArg || !/^\d+$/.test(limitArg)) {
      console.error(
        "[aesthop-import] FEHLER: --limit muss als positive ganze Zahl angegeben werden.",
      );
      process.exit(1);
    }

    const parsedLimit = Number.parseInt(limitArg, 10);
    if (parsedLimit <= 0) {
      console.error(
        "[aesthop-import] FEHLER: --limit muss größer als 0 sein.",
      );
      process.exit(1);
    }

    limitDoctors = parsedLimit;
    i++;
  }
}

// ─── Supabase client ─────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "[aesthop-import] FEHLER: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugifyDoctor(name: string): string {
  return name
    .toLowerCase()
    .replace(/[äöüß]/g, (c) =>
      ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c,
    )
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseName(fullName: string): {
  titlePrefix: string | null;
  firstName: string;
  lastName: string;
  displayName: string;
} {
  const titlePatterns = [
    /^(Univ\.Prof\.\s*\([^)]+\)\s*Dr\.med\.)\s+/i,
    /^(Ass\.\s*Prof\.\s*\([^)]+\)\s*Dr\.med\.)\s+/i,
    /^(Dr\.med\.univ\.)\s+/i,
    /^(Dr\.med\.)\s+/i,
    /^(Priv\.-?Doz\.\s*Dr\.)\s+/i,
    /^(Univ\.Prof\.\s*Dr\.)\s+/i,
    /^(Ass\.Prof\.\s*Dr\.)\s+/i,
    /^(Prof\.\s*Dr\.)\s+/i,
    /^(Univ\.Doz\.\s*Dr\.)\s+/i,
    /^(a\.o\.Univ\.Prof\.\s*Dr\.)\s+/i,
    /^(Prim\.\s*Univ\.Doz\.\s*Dr\.)\s+/i,
    /^(DDr\.)\s+/i,
    /^(Doz\.\s*Dr\.)\s+/i,
    /^(Dr\.)\s+/i,
  ];

  let titlePrefix: string | null = null;
  let rest = fullName.trim();

  for (const pattern of titlePatterns) {
    const match = rest.match(pattern);
    if (match) {
      titlePrefix = match[1].trim();
      rest = rest.slice(match[0].length).trim();
      break;
    }
  }

  const parts = rest.split(/\s+/);
  const firstName = parts.slice(0, -1).join(" ") || rest;
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

  return {
    titlePrefix,
    firstName,
    lastName: lastName || firstName,
    displayName: fullName.trim(),
  };
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("0043")) return `+43${digits.slice(4)}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0") && !digits.startsWith("00")) {
    return `+43${digits.slice(1)}`;
  }
  return digits || null;
}

/**
 * Normalisiert einen String fürs Matching:
 * - Kleinbuchstaben
 * - äöüß → ae/oe/ue/ss
 * - alle Nicht-Alphanumerischen entfernen
 */
function normStr(s: string): string {
  return s
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
    .replace(/[^a-z0-9]/g, "");
}

function normAliases(s: string): string[] {
  const base = normStr(s);
  const oeToOo = base.replace(/oe/g, "oo");
  const ooToOe = base.replace(/oo/g, "oe");
  return Array.from(new Set([base, oeToOo, ooToOe]));
}

function normWords(s: string): string[] {
  const raw = s
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);
  const expanded = raw.flatMap((w) => [w, w.replace(/oe/g, "oo"), w.replace(/oo/g, "oe")]);
  return Array.from(new Set(expanded));
}

// ─── Location type detection ──────────────────────────────────────────────────

type LocationType = "ordination" | "krankenhaus" | "kassenambulanz" | "other";

/**
 * Erkennt den Typ einer Arbeitsstätte anhand des Institutionsnamens.
 *
 * Ordinations-Erkennung (Priorität 1):
 *   - Enthält "ordination", "ord." oder "oard." (case-insensitive)
 *   - ODER enthält Teile des Nachnamens (mind. 3 Zeichen)
 *   - ODER enthält Teile des Vornamens (mind. 3 Zeichen)
 *
 * Krankenhaus-Erkennung (Priorität 2):
 *   - Enthält "klinik", "krankenhaus", "kh ", "spital", "hospital"
 *
 * Kassenambulanz-Erkennung (Priorität 3):
 *   - Enthält "svs", "kassen", "gesundheitszentrum", "ambulanz"
 */
function detectLocationType(
  institutionName: string | null,
  firstName: string,
  lastName: string,
): LocationType {
  if (!institutionName) return "other";

  const n = institutionName
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c);

  const normFirst = firstName
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c);
  const normLast = lastName
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c);

  // Ordination: keyword-Match
  const hasOrdKeyword = /\bord(ination|\.)?/.test(n) || n.includes("oard");

  // Ordination: Namensteile (Nachname zuerst, dann Vorname; mind. 3 Zeichen)
  const lastFragments = normLast.split(/\s+/).filter((w) => w.length >= 3);
  const firstFragments = normFirst.split(/\s+/).filter((w) => w.length >= 3);
  const hasLastNamePart = lastFragments.some((f) => n.includes(f));
  const hasFirstNamePart = firstFragments.some((f) => n.includes(f));

  if (hasOrdKeyword || hasLastNamePart || hasFirstNamePart) {
    return "ordination";
  }

  // Krankenhaus
  if (
    n.includes("klinik") ||
    n.includes("krankenhaus") ||
    /\bkh\b/.test(n) ||
    n.includes("spital") ||
    n.includes("hospital") ||
    n.includes("landstrasse") // "Klinik LANDSTRASSE"
  ) {
    return "krankenhaus";
  }

  // Kassenambulanz
  if (
    n.includes("svs") ||
    n.includes("kassen") ||
    n.includes("gesundheitszentrum") ||
    n.includes("ambulanz")
  ) {
    return "kassenambulanz";
  }

  return "other";
}

// ─── Procedure cache ──────────────────────────────────────────────────────────

type ProcedureRow = {
  id: string;
  slug: string;
  name_de: string;
  aesthop_code: string | null;
};

async function loadProcedures(): Promise<ProcedureRow[]> {
  const { data, error } = await supabase
    .from("procedures")
    .select("id, slug, name_de, aesthop_code")
    .eq("is_active", true);

  if (error) {
    console.error("[aesthop-import] Procedures laden FEHLER:", JSON.stringify(error));
    return [];
  }
  return (data ?? []) as ProcedureRow[];
}

function matchProcedures(
  operationNames: string[],
  procedures: ProcedureRow[],
): string[] {
  const ids = new Set<string>();

  for (const opName of operationNames) {
    const opAliases = normAliases(opName);
    const opWords = normWords(opName);
    let found = false;

    for (const proc of procedures) {
      const procAliases = normAliases(proc.name_de);
      const procWords = normWords(proc.name_de);

      if (opAliases.some((oa) => procAliases.some((pa) => oa === pa))) {
        ids.add(proc.id);
        found = true;
        break;
      }
      if (opAliases.some((oa) => procAliases.some((pa) => pa.includes(oa) || oa.includes(pa)))) {
        ids.add(proc.id);
        found = true;
        break;
      }
      const [shorter, longer] =
        opWords.length <= procWords.length
          ? [opWords, procWords]
          : [procWords, opWords];
      if (shorter.length > 0 && shorter.every((w) => longer.some((lw) => lw.includes(w) || w.includes(lw)))) {
        ids.add(proc.id);
        found = true;
        break;
      }
    }

    if (!found) {
      const codeMatch = opName.trim().match(/^(\d+)$/);
      if (codeMatch) {
        const byCode = procedures.find(
          (p) => p.aesthop_code === codeMatch[1].padStart(2, "0"),
        );
        if (byCode) {
          ids.add(byCode.id);
          found = true;
        }
      }
    }

    if (!found) {
      console.log(`[aesthop-import]   ⚠ kein Procedure-Match für "${opName}"`);
    }
  }

  return Array.from(ids);
}

// ─── DB check ────────────────────────────────────────────────────────────────

async function checkConnection(): Promise<void> {
  const { error } = await supabase
    .from("doctor_profiles")
    .select("id")
    .limit(1);
  if (error) {
    console.error("[aesthop-import] Supabase-Verbindung FEHLER:", JSON.stringify(error));
    process.exit(1);
  }
  console.log("[aesthop-import] Supabase-Verbindung OK.");
}

// ─── Google API preflight check ──────────────────────────────────────────────

async function checkGoogleApiKey(): Promise<void> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error(
      "[aesthop-import] FEHLER: GOOGLE_MAPS_API_KEY ist nicht gesetzt.\n" +
      "  → GitHub Secret 'GOOGLE_MAPS_API_KEY' hinterlegen oder --no-enrich verwenden.",
    );
    process.exit(1);
  }

  console.log("[aesthop-import] Google API Key gefunden – teste Verbindung…");

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName",
      },
      body: JSON.stringify({
        textQuery: "Arzt Wien",
        languageCode: "de",
        regionCode: "AT",
        pageSize: 1,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(
        `[aesthop-import] FEHLER: Google Places API antwortet mit HTTP ${res.status}.\n` +
        `  Details: ${body}`,
      );
      process.exit(1);
    }

    const data = (await res.json()) as { places?: unknown[]; error?: { message: string } };

    if (data.error) {
      console.error(
        `[aesthop-import] FEHLER: Google Places API Fehler: ${data.error.message}`,
      );
      process.exit(1);
    }

    console.log("[aesthop-import] Google Places API OK ✓");
  } catch (err) {
    console.error("[aesthop-import] FEHLER: Google Places API nicht erreichbar:", err);
    process.exit(1);
  }
}

// ─── Already-imported lookup ─────────────────────────────────────────────────

type ExistingProfileLookup = {
  normalizedNames: Set<string>;
  slugByNormalizedName: Map<string, string>;
  slugBySourceUrl: Map<string, string>;
};

/**
 * Lädt bestehende Profile einmalig vor der Import-Schleife, damit Reimports
 * vorhandene Slugs wiederverwenden und keine N+1-Queries entstehen.
 */
async function loadExistingProfiles(): Promise<ExistingProfileLookup> {
  const normalizedNames = new Set<string>();
  const slugByNormalizedName = new Map<string, string>();
  const slugBySourceUrl = new Map<string, string>();
  let from = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("doctor_profiles")
      .select("slug, public_display_name, source_url")
      .range(from, from + PAGE - 1);

    if (error) {
      console.error("[aesthop-import] existing profiles laden FEHLER:", JSON.stringify(error));
      break;
    }

    if (!data || data.length === 0) break;

    for (const row of data) {
      if (row.public_display_name) {
        const normalizedName = normStr(row.public_display_name as string);
        normalizedNames.add(normalizedName);
        if (row.slug && !slugByNormalizedName.has(normalizedName)) {
          slugByNormalizedName.set(normalizedName, row.slug as string);
        }
      }

      if (row.source_url && row.slug && !slugBySourceUrl.has(row.source_url as string)) {
        slugBySourceUrl.set(row.source_url as string, row.slug as string);
      }
    }

    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`[aesthop-import] ${normalizedNames.size} bestehende Profile geladen.`);
  return {
    normalizedNames,
    slugByNormalizedName,
    slugBySourceUrl,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("[aesthop-import] Starte Scraping…");
  if (bundeslaender.length) console.log(`  Bundesländer: ${bundeslaender.join(", ")}`);
  if (operations.length) console.log(`  Operationen: ${operations.join(", ")}`);
  if (limitDoctors !== null) console.log(`  --limit: nur die ersten ${limitDoctors} Ärzte`);
  if (dryRun) console.log("  --dry-run: keine DB-Schreibvorgänge");
  if (force) console.log("  --force: Skip-Logik deaktiviert, alle Ärzte werden (re-)importiert");

  if (!dryRun) await checkConnection();
  if (enrich && !dryRun) await checkGoogleApiKey();

  // 1. Scrapen
  const { doctors, rawCount } = await scrapeAesthOpDoctors({
    bundeslaender: bundeslaender.length ? bundeslaender : undefined,
    operations: operations.length ? operations : undefined,
  });

  console.log(
    `[aesthop-import] Gescraped: ${rawCount} Roheinträge → ${doctors.length} deduplizierte Ärzte`,
  );

  if (dryRun) {
    console.log("[aesthop-import] Dry-run abgeschlossen.");
    return;
  }

  // Limit anwenden (Test-Modus)
  const doctorsToProcess = limitDoctors !== null
    ? doctors.slice(0, limitDoctors)
    : doctors;

  console.log(
    `[aesthop-import] Verarbeite ${doctorsToProcess.length} von ${doctors.length} Ärzten` +
    (limitDoctors !== null ? ` (TEST-MODUS: limit=${limitDoctors})` : ""),
  );

  // 2. Procedures aus DB laden
  const procedures = await loadProcedures();
  console.log(`[aesthop-import] ${procedures.length} Procedures geladen.`);

  // 3. Bereits importierte Ärzte laden (für Skip-Logik + Slug-Wiederverwendung).
  // Auch bei --force brauchen wir die Maps, damit Reimports denselben Slug treffen.
  const existingProfiles = await loadExistingProfiles();

  // 4. Alle Specialties aus der DB laden (für Matching)
  const { data: specialties } = await supabase
    .from("medical_specialties")
    .select("id, name_de");

  const specialtyMap = new Map<string, string>();
  for (const s of specialties ?? []) {
    if (s.name_de) specialtyMap.set(normStr(s.name_de as string), s.id as string);
  }

  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // 5. Jeden Arzt importieren
  for (const doc of doctorsToProcess) {
    const { titlePrefix, firstName, lastName, displayName } = parseName(doc.name);

    // Skip-Logik
    const normalizedName = normStr(displayName);
    if (!force && existingProfiles.normalizedNames.has(normalizedName)) {
      console.log(`[aesthop-import] ⏭ Skip (bereits importiert): ${displayName}`);
      skippedCount++;
      continue;
    }

    console.log(`[aesthop-import] → Importiere: ${displayName}`);

    // 5a. Google Places Anreicherung
    let enriched: EnrichResult | null = null;
    if (enrich) {
      const addressStr = [doc.address, doc.postalCode, doc.city].filter(Boolean).join(", ");
      enriched = await enrichWithGooglePlaces(
        displayName,
        addressStr || doc.city || "",
      ).catch((err) => {
        console.warn(`[aesthop-import]   ⚠ Google Places Fehler für ${displayName}:`, err);
        return {
          id: "",
          _matchStatus: "error" as const,
          _candidateCount: 0,
          _notes: err instanceof Error ? err.message : "Unbekannter Fehler",
        };
      });
      if (enriched) {
        const statusIcon: Record<string, string> = {
          matched_strict: "✅",
          no_results: "⚪",
          ambiguous: "⚠️",
          error: "❌",
        };
        console.log(
          `[aesthop-import]   ${statusIcon[enriched._matchStatus] ?? "?"} Google: ${enriched._matchStatus}` +
          (enriched._candidateCount > 1 ? ` (${enriched._candidateCount} Kandidaten)` : "") +
          (enriched._notes ? ` → ${enriched._notes}` : ""),
        );
      }
    }

    // 5b. Website URL
    const websiteUrl = enriched?.websiteUri ?? doc.website ?? null;

    // 5c. Specialty matching
    let specialtyRow: { id: string } | null = null;
    if (doc.specialty) {
      const normSpec = normStr(doc.specialty);
      const matchedId = specialtyMap.get(normSpec);
      if (matchedId) {
        specialtyRow = { id: matchedId };
      } else {
        // Partial match
        for (const [key, id] of specialtyMap.entries()) {
          if (normSpec.includes(key) || key.includes(normSpec)) {
            specialtyRow = { id };
            break;
          }
        }
      }
    }

    // 5d. Bestehenden Slug wiederverwenden, sonst neuen eindeutigen Slug generieren
    const baseSlug = slugifyDoctor(displayName);
    const existingSlug = (doc.sourceUrl
      ? existingProfiles.slugBySourceUrl.get(doc.sourceUrl)
      : undefined) ?? existingProfiles.slugByNormalizedName.get(normalizedName);

    let slug = existingSlug ?? baseSlug;

    if (!existingSlug) {
      let slugSuffix = 1;
      const MAX_SLUG_TRIES = 10;

      while (slugSuffix <= MAX_SLUG_TRIES) {
        const { data: slugCheck } = await supabase
          .from("doctor_profiles")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (!slugCheck) break;
        slug = `${baseSlug}-${++slugSuffix}`;
      }

      if (slugSuffix > MAX_SLUG_TRIES) {
        console.error(`[aesthop-import] FEHLER: Kein freier Slug für ${displayName} nach ${MAX_SLUG_TRIES} Versuchen`);
        errorCount++;
        continue;
      }
    }

    // 5e. Guard: prüfen ob Profil bereits existiert (für profile_status + claimed/verified Schutz)
    const { data: existing } = await supabase
      .from("doctor_profiles")
      .select("id, profile_status, is_claimed, is_verified")
      .eq("slug", slug)
      .maybeSingle();

    // Guard: published profiles must not be reset to draft (per issue requirement).
    // All other statuses (draft, archived, etc.) are set/kept as draft.
    const profileStatus = existing?.profile_status === "published"
      ? "published"
      : "draft";

    // Google match status berechnen
    const googleStatus = enriched?._matchStatus ?? (enrich ? "error" : "pending");
    const googleCandidateCount = enrich ? (enriched?._candidateCount ?? 0) : null;
    const googleLastCheckedAt = enrich ? new Date().toISOString() : null;
    const googleNotes = enriched?._notes ?? null;

    // 5f. doctor_profiles upsert
    const { data: profileData, error: profileError } = await supabase
      .from("doctor_profiles")
      .upsert(
        {
          slug,
          first_name: firstName,
          last_name: lastName,
          title_prefix: titlePrefix,
          public_display_name: displayName,
          primary_specialty_id: specialtyRow?.id ?? null,
          website_url: websiteUrl,
          phone_public: normalizePhone(
            enriched?.internationalPhoneNumber ?? doc.phone,
          ),
          profile_status: profileStatus,
          // For existing profiles: preserve is_claimed, is_verified, verification_level
          // (they may have been set manually). Only set defaults for new profiles.
          ...(existing ? {} : { is_claimed: false, is_verified: false, verification_level: "none" }),
          source_confidence: 1.0,
          source_type: "aesthop_scraper",
          source_url:
            doc.sourceUrl ??
            "https://www.aerztekammer.at/aesthetische-operationen-suche",
          last_verified_at: new Date().toISOString(),
          google_match_status: googleStatus,
          google_match_candidate_count: googleCandidateCount,
          google_match_last_checked_at: googleLastCheckedAt,
          google_match_notes: googleNotes,
        },
        { onConflict: "slug", ignoreDuplicates: false },
      )
      .select("id")
      .single();

    if (profileError || !profileData) {
      console.error(
        `[aesthop-import] doctor_profiles FEHLER für ${doc.name}:`,
        JSON.stringify(profileError),
      );
      errorCount++;
      continue;
    }

    const doctorId = profileData.id as string;
    existingProfiles.normalizedNames.add(normalizedName);
    existingProfiles.slugByNormalizedName.set(normalizedName, slug);
    if (doc.sourceUrl) {
      existingProfiles.slugBySourceUrl.set(doc.sourceUrl, slug);
    }

    // 5g. ALLE Locations speichern
    //
    // Strategie:
    //   - Alle bisherigen Locations löschen (sauberer Reimport)
    //   - Für jede Adresse in addresses[]: location_type via detectLocationType() bestimmen
    //   - institutionName (dgName aus API) ist in addr.institutionName verfügbar
    //   - Primäre Location = Adresse mit dem niedrigsten typeOrder-Rang
    //     (ordination > kassenambulanz > krankenhaus > other)

    if (doc.addresses.length > 0) {
      // Alle bestehenden Locations löschen
      await supabase
        .from("locations")
        .delete()
        .eq("doctor_id", doctorId);

      // Bestimme primäre Location anhand location_type:
      // Ordination hat höchste Priorität, danach kassenambulanz, krankenhaus, other.
      // Falls keine Ordination gefunden → erste Adresse = primary.
      const typeOrder: Record<string, number> = {
        ordination: 0,
        kassenambulanz: 1,
        krankenhaus: 2,
        other: 3,
      };
      const addrTypes = doc.addresses.map((a) =>
        detectLocationType(a.institutionName ?? null, firstName, lastName),
      );
      const primaryIdx = addrTypes.reduce(
        (best, t, i) => (typeOrder[t] < typeOrder[addrTypes[best]] ? i : best),
        0,
      );

      for (let i = 0; i < doc.addresses.length; i++) {
        const addr = doc.addresses[i];
        if (!addr.city) continue;

        // Straße parsen
        const streetParts = (addr.address ?? "").trim().split(/\s+/);
        const houseNumber =
          streetParts.at(-1)?.match(/^\d/) ? streetParts.pop() ?? null : null;
        const street = streetParts.join(" ") || null;

        // Geocoding nur für die primäre Adresse
        let lat: number | null = null;
        let lng: number | null = null;
        let resolvedPostalCode: string | null = addr.postalCode ?? null;

        if (i === primaryIdx) {
          const addressStr = [addr.address, addr.postalCode, addr.city]
            .filter(Boolean)
            .join(", ");
          if (addressStr) {
            const geo = await geocodeAddress(addressStr).catch(() => null);
            lat = geo?.lat ?? null;
            lng = geo?.lng ?? null;
            resolvedPostalCode = geo?.postalCode ?? addr.postalCode ?? null;
          }
        }

        const isPrimary = i === primaryIdx;
        const locType = addrTypes[i];

        const { error: locationError } = await supabase
          .from("locations")
          .insert({
            doctor_id: doctorId,
            country_code: "AT",
            city: addr.city,
            postal_code: resolvedPostalCode,
            street,
            house_number: houseNumber,
            latitude: lat,
            longitude: lng,
            is_primary: isPrimary,
            location_type: locType,
            location_label: addr.institutionName ?? null,
          });

        if (locationError) {
          console.warn(
            `[aesthop-import]   ⚠ Location[${i}] FEHLER für ${doc.name}: ${JSON.stringify(locationError)}`,
          );
        }
      }

      const locCount = doc.addresses.length;
      console.log(
        `[aesthop-import] ✓ ${displayName} (${doc.city ?? "?"}): ${locCount} Standort${locCount > 1 ? "e" : ""}, primary=${doc.addresses[primaryIdx]?.city ?? "?"}`,
      );
    } else if (doc.city) {
      // Fallback: nur city bekannt, keine addresses[]
      const streetParts = (doc.address ?? "").trim().split(/\s+/);
      const houseNumber =
        streetParts.at(-1)?.match(/^\d/) ? streetParts.pop() ?? null : null;
      const street = streetParts.join(" ") || null;

      const addressStr = [doc.address, doc.postalCode, doc.city]
        .filter(Boolean)
        .join(", ");
      const geo = addressStr
        ? await geocodeAddress(addressStr).catch(() => null)
        : null;

      await supabase.from("locations").delete().eq("doctor_id", doctorId);

      const { error: locationError } = await supabase
        .from("locations")
        .insert({
          doctor_id: doctorId,
          country_code: "AT",
          city: doc.city,
          postal_code: geo?.postalCode ?? doc.postalCode ?? null,
          street,
          house_number: houseNumber,
          latitude: geo?.lat ?? null,
          longitude: geo?.lng ?? null,
          is_primary: true,
          location_type: detectLocationType(doc.institutionName ?? null, firstName, lastName),
          location_label: doc.institutionName ?? null,
        });

      if (locationError) {
        console.warn(
          `[aesthop-import]   ⚠ Location FEHLER für ${doc.name}: ${JSON.stringify(locationError)}`,
        );
      }

      console.log(
        `[aesthop-import] ✓ ${displayName} (${doc.city ?? "?"}): 1 Standort`,
      );
    }

    // 5h. doctor_procedures
    const procedureIds = matchProcedures(doc.operations ?? [], procedures);

    for (const procedureId of procedureIds) {
      const { error: procError } = await supabase
        .from("doctor_procedures")
        .upsert(
          { doctor_id: doctorId, procedure_id: procedureId },
          { onConflict: "doctor_id,procedure_id", ignoreDuplicates: true },
        );

      if (procError) {
        console.warn(
          `[aesthop-import]   ⚠ doctor_procedures FEHLER für ${doc.name}: ${JSON.stringify(procError)}`,
        );
      }
    }

    console.log(
      `[aesthop-import] ✓ ${displayName}: ${procedureIds.length} Procedures verknüpft`,
    );

    importedCount++;
    existingNames.add(normalizedName);
  }

  console.log(
    `\n[aesthop-import] Fertig. Importiert: ${importedCount}, Übersprungen: ${skippedCount}, Fehler: ${errorCount}`,
  );
}

main().catch((err) => {
  console.error("[aesthop-import] Unerwarteter Fehler:", err);
  process.exit(1);
});
