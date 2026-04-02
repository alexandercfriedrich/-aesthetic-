"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { fetchGooglePlacesCandidates } from "@/lib/google/places";
import { geocodeAddress } from "@/lib/google/geocoding";
import { scrapeAesthOpDoctors } from "@/lib/scrapers/aesthetische-operationen";
import type { Json } from "@/types/database";

const AESTHOP_BASE_URL =
  "https://www.aerztekammer.at/aesthetische-operationen-suche";

async function assertAdminOrEditor() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Unauthorized");

  const { data: me } = await supabase
    .from("app_users")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (!me || !["admin", "editor"].includes(me.role)) {
    throw new Error("Kein Zugriff");
  }
  return { supabase };
}

export async function startGooglePlacesBatchAction(formData: FormData) {
  const { supabase } = await assertAdminOrEditor();

  const sourceLabel = formData.get("source_label") as string;
  const query = formData.get("query") as string;
  const city = formData.get("city") as string;
  const entityKind = (formData.get("entity_kind") as string) ?? "doctor";
  const maxResults = Math.min(
    Number(formData.get("max_results") ?? 60),
    200,
  );

  // 1. Import-Batch anlegen
  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      source_type: "google_places",
      source_label: sourceLabel,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (batchError || !batch)
    throw batchError ?? new Error(`Batch konnte nicht angelegt werden: ${JSON.stringify(batchError)}`);

  // 2. Google Places API aufrufen (Places New – Text Search) + False-Positive-Filter
  const { places: candidates, rawCount } = await fetchGooglePlacesCandidates({
    query: `${query} ${city}`,
    maxResults,
  });

  // 3. Kandidaten mit Geocoding anreichern + in DB einfügen
  let processed = 0;
  let errorCount = 0;

  for (const place of candidates) {
    try {
      const coords = await geocodeAddress(place.formattedAddress);

      await supabase.from("import_candidates").insert({
        batch_id: batch.id,
        entity_kind: entityKind,
        status: "new",
        source_external_id: place.id,
        source_url: place.googleMapsUri,
        raw_json: place as unknown as Json,
        normalized_name: place.displayName?.text ?? null,
        normalized_website_domain: (() => {
          try {
            return place.websiteUri
              ? new URL(place.websiteUri).hostname.replace(/^www\./, "")
              : null;
          } catch {
            return null;
          }
        })(),
        normalized_phone: place.internationalPhoneNumber ?? null,
        city: city,
        postal_code: coords?.postalCode ?? null,
        specialty_text: query,
        confidence_score: 0,
      });

      processed++;
    } catch (err) {
      console.error(
        `[import] Fehler beim Verarbeiten von Place ${place.id}:`,
        err,
      );
      errorCount++;
    }
  }

  // 4. Batch abschließen
  // total_rows = rohe Google-Ergebnisse (vor Filter), processed_rows = tatsächlich importiert
  await supabase
    .from("import_batches")
    .update({
      status:
        errorCount > 0 && processed === 0 ? "failed" : "needs_review",
      total_rows: rawCount,
      processed_rows: processed,
      error_count: errorCount,
      finished_at: new Date().toISOString(),
    })
    .eq("id", batch.id);

  revalidatePath("/admin/imports");
}

// ─── ÄsthOp (Ärztekammer) scraper action ─────────────────────────────────────

export async function startAesthOpBatchAction(formData: FormData) {
  const { supabase } = await assertAdminOrEditor();

  const sourceLabel =
    (formData.get("source_label") as string) ||
    "Ärztekammer ÄsthOp – alle Bundesländer";
  const bundeslaenderRaw = formData.get("bundeslaender") as string | null;
  const operationsRaw = formData.get("operations") as string | null;

  // Parse optional comma-separated filter lists
  const bundeslaender = bundeslaenderRaw
    ? bundeslaenderRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  const operations = operationsRaw
    ? operationsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  // 1. Create import batch
  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      source_type: "aesthop_scraper",
      source_label: sourceLabel,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (batchError || !batch)
    throw batchError ?? new Error("Batch konnte nicht angelegt werden");

  // 2. Run the scraper
  const { doctors, rawCount } = await scrapeAesthOpDoctors({
    bundeslaender,
    operations,
  });

  // 3. Geocode and insert candidates
  let processed = 0;
  let errorCount = 0;

  for (const doc of doctors) {
    try {
      // Build a geocodable address
      const addressForGeocode = [doc.address, doc.postalCode, doc.city]
        .filter(Boolean)
        .join(", ");
      const coords = await geocodeAddress(addressForGeocode || null);

      await supabase.from("import_candidates").insert({
        batch_id: batch.id,
        entity_kind: "doctor",
        status: "new",
        source_external_id: doc.sourceUrl ?? null,
        source_url: doc.sourceUrl ?? AESTHOP_BASE_URL,
        raw_json: doc as unknown as Json,
        normalized_name: doc.name || null,
        normalized_website_domain: (() => {
          try {
            return doc.website
              ? new URL(doc.website).hostname.replace(/^www\./, "")
              : null;
          } catch {
            return null;
          }
        })(),
        normalized_phone: doc.phone ?? null,
        city: doc.city ?? null,
        postal_code: coords?.postalCode ?? doc.postalCode ?? null,
        specialty_text: doc.specialty ?? doc.operations.join(", "),
        confidence_score: 100, // official registry — highest confidence
      });

      processed++;
    } catch (err) {
      console.error(`[aesthop] Fehler beim Insert von ${doc.name}:`, err);
      errorCount++;
    }
  }

  // 4. Finalise batch
  await supabase
    .from("import_batches")
    .update({
      status:
        errorCount > 0 && processed === 0 ? "failed" : "needs_review",
      total_rows: rawCount,
      processed_rows: processed,
      error_count: errorCount,
      finished_at: new Date().toISOString(),
    })
    .eq("id", batch.id);

  revalidatePath("/admin/imports");
}
