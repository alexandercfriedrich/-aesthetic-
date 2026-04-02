"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { fetchGooglePlacesCandidates } from "@/lib/google/places";
import { geocodeAddress } from "@/lib/google/geocoding";
import type { Json } from "@/types/database";

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

// ─── ÄsthOp: GitHub Actions workflow trigger ─────────────────────────────────

export async function triggerAesthOpWorkflowAction(params?: {
  bundeslaender?: string;
  operations?: string;
  noEnrich?: boolean;
}): Promise<{ workflowUrl: string }> {
  const { supabase } = await assertAdminOrEditor();
  void supabase; // auth guard used above; supabase not needed further here

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN ist nicht gesetzt. Bitte in den Vercel-Umgebungsvariablen konfigurieren.",
    );
  }

  const owner = process.env.GITHUB_REPO_OWNER ?? "alexandercfriedrich";
  const repo = process.env.GITHUB_REPO_NAME ?? "-aesthetic-";

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/import-aesthop.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          bundeslaender: params?.bundeslaender ?? "",
          operations: params?.operations ?? "",
          no_enrich: params?.noEnrich ? "true" : "false",
        },
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => String(res.status));
    throw new Error(`GitHub API Fehler: ${res.status} – ${errText}`);
  }

  return {
    workflowUrl: `https://github.com/${owner}/${repo}/actions/workflows/import-aesthop.yml`,
  };
}
