#!/usr/bin/env tsx
/**
 * CLI script: ÄsthOp-Daten scrapen + in Supabase importieren
 *
 * Aufruf:
 *   npx tsx scripts/import-aesthop.ts
 *   npx tsx scripts/import-aesthop.ts --bundesland Wien --bundesland "Niederösterreich"
 *   npx tsx scripts/import-aesthop.ts --operation "Brustvergrößerung"
 *
 * Optionale Flags:
 *   --bundesland <name>   Nur dieses Bundesland scrapen (wiederholbar)
 *   --operation  <name>   Nur diese Operation scrapen (wiederholbar)
 *   --no-enrich           Google-Places-Anreicherung überspringen
 *   --dry-run             Scrapen, aber nicht in die DB schreiben
 *
 * Umgebungsvariablen (aus .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL      Supabase-Projekt-URL
 *   SUPABASE_SERVICE_ROLE_KEY     Service-Role-Key (Bypass RLS)
 *   GOOGLE_MAPS_API_KEY           Für Google-Places-Anreicherung (optional)
 *
 * WICHTIG: Dieses Script läuft LOKAL oder in einem GitHub-Actions-Workflow,
 * NIEMALS in der Vercel-Serverless-Umgebung (Playwright benötigt Chromium).
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { scrapeAesthOpDoctors } from "../src/lib/scrapers/aesthetische-operationen";
import { enrichWithGooglePlaces } from "../src/lib/scrapers/aesthop-enrich";
import { geocodeAddress } from "../src/lib/google/geocoding";

// ─── Load .env.local for local development ────────────────────────────────────

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

// ─── Parse CLI flags ──────────────────────────────────────────────────────────

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

// ─── Supabase client ──────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "[aesthop-import] FEHLER: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.",
  );
  console.error("  Tipp: Stelle sicher, dass .env.local im Projektroot existiert.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("[aesthop-import] Starte Scraping…");
  if (bundeslaender.length)
    console.log(`  Bundesländer: ${bundeslaender.join(", ")}`);
  if (operations.length)
    console.log(`  Operationen: ${operations.join(", ")}`);
  if (dryRun) console.log("  --dry-run aktiv: keine DB-Schreibvorgänge");

  // 1. Batch anlegen
  let batchId: string | null = null;

  if (!dryRun) {
    const label =
      bundeslaender.length === 1
        ? `ÄsthOp – ${bundeslaender[0]}`
        : "ÄsthOp-Arztsuche (Österreichische Ärztekammer)";

    const { data: batch, error } = await supabase
      .from("import_batches")
      .insert({
        source_type: "aesthop_scraper",
        source_label: label,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !batch) {
      console.error("[aesthop-import] Batch konnte nicht angelegt werden:", error);
      process.exit(1);
    }
    batchId = batch.id as string;
    console.log(`[aesthop-import] Batch angelegt: ${batchId}`);
  }

  // 2. Scrapen
  const { doctors, rawCount } = await scrapeAesthOpDoctors({
    bundeslaender: bundeslaender.length ? bundeslaender : undefined,
    operations: operations.length ? operations : undefined,
  });

  console.log(
    `[aesthop-import] Gescraped: ${rawCount} Roheinträge → ${doctors.length} deduplizierte Ärzte`,
  );

  if (dryRun) {
    console.log("[aesthop-import] Dry-run abgeschlossen. Keine DB-Änderungen.");
    return;
  }

  // 3. Geocodieren + (optional) anreichern + inserieren
  let processed = 0;
  let errorCount = 0;

  for (const doc of doctors) {
    try {
      const addressForGeocode = [doc.address, doc.postalCode, doc.city]
        .filter(Boolean)
        .join(", ");

      const [coords, enriched] = await Promise.allSettled([
        geocodeAddress(addressForGeocode || null),
        enrich ? enrichWithGooglePlaces(doc) : Promise.resolve(null),
      ]);

      const geo = coords.status === "fulfilled" ? coords.value : null;
      const extra = enriched.status === "fulfilled" ? enriched.value : null;

      await supabase.from("import_candidates").insert({
        batch_id: batchId,
        entity_kind: "doctor",
        status: "new",
        source_external_id: doc.sourceUrl ?? null,
        source_url:
          doc.sourceUrl ?? "https://www.aerztekammer.at/aesthetische-operationen-suche",
        raw_json: doc as unknown as Record<string, unknown>,
        normalized_name: doc.name || null,
        normalized_website_domain: (() => {
          const site = extra?.websiteUri ?? doc.website;
          try {
            return site ? new URL(site).hostname.replace(/^www\./, "") : null;
          } catch {
            return null;
          }
        })(),
        normalized_phone: extra?.internationalPhoneNumber ?? doc.phone ?? null,
        city: doc.city ?? null,
        postal_code: geo?.postalCode ?? doc.postalCode ?? null,
        specialty_text: doc.specialty ?? doc.operations.join(", "),
        confidence_score: 100, // offizielle Ärztekammer-Daten — keine False Positives
        ...(extra?.id ? { source_google_place_id: extra.id } : {}),
      });

      processed++;
    } catch (err) {
      console.error(`[aesthop-import] Fehler bei ${doc.name}:`, err);
      errorCount++;
    }
  }

  // 4. Batch abschließen
  await supabase
    .from("import_batches")
    .update({
      status: errorCount > 0 && processed === 0 ? "failed" : "needs_review",
      total_rows: rawCount,
      processed_rows: processed,
      error_count: errorCount,
      finished_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  console.log(
    `[aesthop-import] Fertig. Importiert: ${processed}, Fehler: ${errorCount}`,
  );
}

main().catch((err) => {
  console.error("[aesthop-import] Unerwarteter Fehler:", err);
  process.exit(1);
});
