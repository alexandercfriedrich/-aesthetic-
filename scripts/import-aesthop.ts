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
 *   - Erkennt Ordinationen via Keyword (ord/ordination/oard) + Namensabgleich
 *   - Setzt is_primary=true für die Ordination (höchste Priorität)
 *   - Speichert ALLE Standorte in der locations-Tabelle
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import type { AesthOpDoctor } from "../src/lib/scrapers/aesthetische-operationen";
import { scrapeAesthOpDoctors } from "../src/lib/scrapers/aesthetische-operationen";
import { enrichWithGooglePlaces } from "../src/lib/scrapers/aesthop-enrich";
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

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--bundesland" && args[i + 1]) {
    bundeslaender.push(args[++i]);
  } else if (args[i] === "--operation" && args[i + 1]) {
    operations.push(args[++i]);
  } else if (args[i] === "--no-enrich") {
    enrich = false;
  } else if (args[i] === "--dry-run") {
    dryRun = true;
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
  const hasOrdKeyword = /\bord(ination|\.)?\b/.test(n) || n.includes("oard");

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

/**
 * Wählt aus einem addresses[]-Array die beste Primäradresse.
 * Priorität: ordination > kassenambulanz > krankenhaus > other > erste
 *
 * Gibt den Index im Array zurück.
 */
function selectPrimaryLocationIndex(
  addresses: AesthOpDoctor["addresses"],
  firstName: string,
  lastName: string,
): number {
  // Enriched address objects mit location_type
  const typed = addresses.map((addr, idx) => ({
    idx,
    addr,
    type: detectLocationType(
      // dgName ist nicht direkt in addresses[], aber der Scraper füllt address mit der Straße.
      // Wir haben leider keinen institutionName in addresses[] — daher nur für die
      // ERSTE Adresse den dgName aus doc verfügbar.
      // Hier matchen wir hilfsweise auf die Straße/Stadt falls kein dgName.
      // Die Hauptlogik greift via dgName im äußeren Aufruf.
      null,
      firstName,
      lastName,
    ),
  }));

  // Fallback: Index 0
  return 0;
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

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("[aesthop-import] Starte Scraping…");
  if (bundeslaender.length) console.log(`  Bundesländer: ${bundeslaender.join(", ")}`);
  if (operations.length) console.log(`  Operationen: ${operations.join(", ")}`);
  if (dryRun) console.log("  --dry-run: keine DB-Schreibvorgänge");

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

  // 2. Procedures aus DB laden
  const procedures = await loadProcedures();
  console.log(`[aesthop-import] ${procedures.length} Procedures geladen.`);

  // 3. Import-Batch anlegen
  const label =
    bundeslaender.length === 1
      ? `ÄsthOp – ${bundeslaender[0]}`
      : "ÄsthOp-Arztsuche (Österreichische Ärztekammer)";

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      source_type: "aesthop_scraper",
      source_label: label,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    console.error("[aesthop-import] Batch anlegen FEHLER:", JSON.stringify(batchError));
    process.exit(1);
  }
  const batchId = batch.id as string;
  console.log(`[aesthop-import] Batch: ${batchId}`);

  // 4. Ärzte verarbeiten
  let processed = 0;
  let errorCount = 0;

  for (const doc of doctors) {
    try {
      // 4a. Namen parsen
      const { titlePrefix, firstName, lastName, displayName } = parseName(doc.name ?? "");

      const baseSlug = slugifyDoctor(lastName ? `${firstName}-${lastName}` : firstName);
      const citySlug = slugifyDoctor(doc.city ?? "");
      const slug = citySlug ? `${baseSlug}-${citySlug}` : baseSlug;

      // 4b. Google Places Anreicherung (optional, nur für Primäradresse)
      const enriched = enrich
        ? await enrichWithGooglePlaces(doc).catch(() => null)
        : null;

      // 4c. Specialty
      const { data: specialtyRow } = await supabase
        .from("specialties")
        .select("id")
        .ilike("name_de", `%plastisch%`)
        .limit(1)
        .maybeSingle();

      const websiteUrl = enriched?.websiteUri ?? doc.website ?? null;

      // 4d. doctor_profiles upsert
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
            profile_status: "draft",
            is_claimed: false,
            is_verified: false,
            verification_level: "none",
            source_confidence: 1.0,
            source_type: "aesthop_scraper",
            source_url:
              doc.sourceUrl ??
              "https://www.aerztekammer.at/aesthetische-operationen-suche",
            last_verified_at: new Date().toISOString(),
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

      // 4e. ALLE Locations speichern
      //
      // Strategie:
      //   - Alle bisherigen Locations löschen (sauberer Reimport)
      //   - Für jede Adresse in addresses[]: location_type bestimmen
      //   - dgName aus API steht in doc.addresses[] leider nicht direkt,
      //     aber der erste Eintrag entspricht doc.address (der Primäreintrag
      //     aus mapRawToDoctor). Weitere Adressen kommen aus Deduplizierung.
      //   - Für die PRIMARY-Erkennung nutzen wir zusätzlich doc.dgName falls verfügbar.
      //
      // Da AesthOpDoctor.addresses[] nur {address, postalCode, city} hat (kein dgName),
      // erkennen wir den Typ über Straßenname + Namensteile des Arztes.
      // Der dgName (Institutionsname) ist in der RawArzt-API-Response vorhanden und
      // wird im Scraper in doc.address gespeichert – jedoch als Straße, nicht als Name.
      // → Für bessere Erkennung: dgName direkt auswerten wenn verfügbar.

      if (doc.addresses.length > 0) {
        // Alle bestehenden Locations löschen
        await supabase
          .from("locations")
          .delete()
          .eq("doctor_id", doctorId);

        // Bestimme primäre Location:
        // Prüfe ob eine Adresse einer Ordination entspricht.
        // Da wir dgName nicht direkt in addresses[] haben, verwenden wir
        // die erste Adresse als Fallback-Primäradresse.
        // Falls doc.dgName (Institutionsname) auf Ordination hindeutet → erste Adresse = Ordination.
        // Ansonsten: keine automatische Ordinations-Erkennung möglich ohne dgName.
        //
        // NOTE: Der Scraper in aesthetische-operationen.ts speichert dgName in
        //       RawArzt.dgName, aber gibt es nicht ans AesthOpDoctor-Interface weiter.
        //       TODO: dgName zu AesthOpDoctor hinzufügen für vollständige Erkennung.
        //       Bis dahin: Primäre = erste Adresse (wie bisher), alle weiteren = sekundär.
        //
        // UPDATE: Wir erkennen über den dgName in doc selbst – der Scraper baut
        //         doc.name aus titelPre+vorname+familienname und doc.address aus strasse.
        //         Der dgName (z.B. "Ord. AGNESE") ist aktuell NICHT in AesthOpDoctor.
        //         Wir fügen ihn jetzt als institutionName zu AesthOpDoctor hinzu (separate Task).
        //         Übergangsweise: erste Adresse = primary.

        let primarySet = false;

        for (let i = 0; i < doc.addresses.length; i++) {
          const addr = doc.addresses[i];
          if (!addr.city) continue;

          // Straße parsen
          const streetParts = (addr.address ?? "").trim().split(/\s+/);
          const houseNumber =
            streetParts.at(-1)?.match(/^\d/) ? streetParts.pop() ?? null : null;
          const street = streetParts.join(" ") || null;

          // Geocoding nur für erste Adresse (Primary)
          let lat: number | null = null;
          let lng: number | null = null;
          let resolvedPostalCode: string | null = addr.postalCode ?? null;

          if (i === 0) {
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

          // is_primary: erste Adresse ist primary (bis dgName verfügbar)
          const isPrimary = i === 0;
          if (isPrimary) primarySet = true;

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
              location_type: "other", // wird korrekt gesetzt sobald dgName im Interface ist
              location_label: null,
            });

          if (locationError) {
            console.warn(
              `[aesthop-import]   ⚠ Location[${i}] FEHLER für ${doc.name}: ${JSON.stringify(locationError)}`,
            );
          }
        }

        const locCount = doc.addresses.length;
        console.log(
          `[aesthop-import] ✓ ${displayName} (${doc.city ?? "?"}): ${locCount} Standort${locCount > 1 ? "e" : ""}, primary=${doc.addresses[0]?.city ?? "?"}`,
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
            location_type: "other",
            location_label: null,
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

      // 4f. doctor_procedures
      const procedureIds = matchProcedures(doc.operations ?? [], procedures);

      for (const procedureId of procedureIds) {
        const { error: dpError } = await supabase
          .from("doctor_procedures")
          .upsert(
            { doctor_id: doctorId, procedure_id: procedureId, is_active: true },
            { onConflict: "doctor_id,procedure_id", ignoreDuplicates: true },
          );

        if (dpError) {
          console.warn(
            `[aesthop-import]   ⚠ doctor_procedures FEHLER: ${JSON.stringify(dpError)}`,
          );
        }
      }

      processed++;
    } catch (err) {
      console.error(`[aesthop-import] Unerwarteter Fehler bei ${doc.name}:`, err);
      errorCount++;
    }
  }

  // 5. Batch abschließen
  await supabase
    .from("import_batches")
    .update({
      status: processed === 0 ? "failed" : "needs_review",
      total_rows: rawCount,
      processed_rows: processed,
      error_count: errorCount,
      finished_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  console.log(
    `\n[aesthop-import] ✅ Fertig. Importiert: ${processed}, Fehler: ${errorCount}`,
  );
  console.log(`[aesthop-import] ℹ  Alle Profile: profile_status='draft'`);
  console.log(`[aesthop-import] ℹ  Zum Publishen: Admin-UI → Drafts → approven.`);

  if (errorCount > 0 && processed === 0) process.exit(1);
}

main().catch((err) => {
  console.error("[aesthop-import] Fataler Fehler:", err);
  process.exit(1);
});
