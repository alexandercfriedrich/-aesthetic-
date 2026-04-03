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
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
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
    /^(Priv\.Doz\.\s*Dr\.)\s+/i,
    /^(Univ\.Prof\.\s*Dr\.)\s+/i,
    /^(Ass\.Prof\.\s*Dr\.)\s+/i,
    /^(Prof\.\s*Dr\.)\s+/i,
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
 * - ö in Täto/Tattö wird als 'oo' erkannt via Extra-Alias
 */
function normStr(s: string): string {
  return s
    .toLowerCase()
    // Ärztekammer-Sonderfall: Tattöwierungen → tattoewierungen
    // DB hat: tattoo-entfernung → tattooentfernung
    // Der oe/oo Unterschied bleibt, daher extra alias unten
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
    .replace(/[^a-z0-9]/g, "");
}

/** Erzeugt alle Alias-Varianten für einen normalisierten String */
function normAliases(s: string): string[] {
  const base = normStr(s);
  // oe <-> oo Variante für 'tattoewierungen' <-> 'tattooentfernung'
  const oeToOo = base.replace(/oe/g, "oo");
  const ooToOe = base.replace(/oo/g, "oe");
  return Array.from(new Set([base, oeToOo, ooToOe]));
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

/**
 * Mappt Ärztekammer-Bezeichnungen auf procedures.id
 * Matching-Reihenfolge:
 *  1. name_de exact match (nach Normalisierung inkl. oe/oo Aliase)
 *  2. name_de contains / vice versa (nach Normalisierung)
 *  3. aesthop_code numeric match
 */
function matchProcedures(
  operationNames: string[],
  procedures: ProcedureRow[],
): string[] {
  const ids = new Set<string>();

  for (const opName of operationNames) {
    const opAliases = normAliases(opName);
    let found = false;

    for (const proc of procedures) {
      const procAliases = normAliases(proc.name_de);

      // 1. Exact match (any alias combination)
      const exactMatch = opAliases.some((oa) => procAliases.some((pa) => oa === pa));
      if (exactMatch) {
        ids.add(proc.id);
        found = true;
        break;
      }

      // 2. Contains match (any alias combination)
      const containsMatch = opAliases.some((oa) =>
        procAliases.some((pa) => pa.includes(oa) || oa.includes(pa)),
      );
      if (containsMatch) {
        ids.add(proc.id);
        found = true;
        break;
      }
    }

    if (!found) {
      // 3. aesthop_code match
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

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("[aesthop-import] Starte Scraping…");
  if (bundeslaender.length) console.log(`  Bundesländer: ${bundeslaender.join(", ")}`);
  if (operations.length) console.log(`  Operationen: ${operations.join(", ")}`);
  if (dryRun) console.log("  --dry-run: keine DB-Schreibvorgänge");

  if (!dryRun) await checkConnection();

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

  // 2. Procedures aus DB laden (für Matching)
  const procedures = await loadProcedures();
  console.log(`[aesthop-import] ${procedures.length} Procedures geladen.`);

  // 3. Import-Batch anlegen (Audit-Trail)
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

      // 4b. Google Places Anreicherung (optional)
      const enriched = enrich
        ? await enrichWithGooglePlaces(doc).catch(() => null)
        : null;

      // 4c. Geocodierung
      const addressStr = [doc.address, doc.postalCode, doc.city]
        .filter(Boolean)
        .join(", ");
      const geo = addressStr
        ? await geocodeAddress(addressStr).catch(() => null)
        : null;

      const websiteUrl = enriched?.websiteUri ?? doc.website ?? null;

      // 4d. Specialty
      const { data: specialtyRow } = await supabase
        .from("specialties")
        .select("id")
        .ilike("name_de", `%plastisch%`)
        .limit(1)
        .maybeSingle();

      // 4e. doctor_profiles upsert
      // profile_status = 'draft' → Admin muss erst approven!
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
            profile_status: "draft", // ← DRAFT: nicht sichtbar bis Admin approved
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

      // 4f. Location: DELETE existing primary + INSERT neu
      // (Statt UPSERT mit fehlerhaftem Partial-Unique-Constraint)
      if (doc.city) {
        // Vorhandene Primary-Location dieses Arztes löschen
        await supabase
          .from("locations")
          .delete()
          .eq("doctor_id", doctorId)
          .eq("is_primary", true);

        const streetParts = (doc.address ?? "").trim().split(/\s+/);
        const houseNumber =
          streetParts.at(-1)?.match(/^\d/) ? streetParts.pop() ?? null : null;
        const street = streetParts.join(" ") || null;

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
          });

        if (locationError) {
          console.warn(
            `[aesthop-import]   ⚠ Location FEHLER für ${doc.name}: ${JSON.stringify(locationError)}`,
          );
        }
      }

      // 4g. doctor_procedures
      const procedureIds = matchProcedures(doc.operations ?? [], procedures);

      for (const procedureId of procedureIds) {
        const { error: dpError } = await supabase
          .from("doctor_procedures")
          .upsert(
            { doctor_id: doctorId, procedure_id: procedureId, is_active: true },
            { onConflict: "doctor_id,procedure_id,clinic_id", ignoreDuplicates: true },
          );

        if (dpError) {
          console.warn(
            `[aesthop-import]   ⚠ doctor_procedures FEHLER: ${JSON.stringify(dpError)}`,
          );
        }
      }

      processed++;
      console.log(
        `[aesthop-import] ✓ ${displayName} (${doc.city ?? "?"}): ${procedureIds.length} Eingriffe → draft`,
      );
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
