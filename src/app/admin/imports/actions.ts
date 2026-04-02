"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { fetchGooglePlacesCandidates } from "@/lib/google/places";
import { geocodeAddress } from "@/lib/google/geocoding";
import type { Database, Json } from "@/types/database";

type ImportCandidateInsert =
  Database["public"]["Tables"]["import_candidates"]["Insert"];

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

  // Normalize entity_kind: fall back to default when missing or blank
  const rawEntityKind = formData.get("entity_kind");
  const entityKind =
    typeof rawEntityKind === "string" && rawEntityKind.trim() !== ""
      ? rawEntityKind
      : "doctor";

  // Normalize and validate max_results: parseInt, default, and clamp to [1, 200]
  const rawMaxResults = formData.get("max_results");
  let maxResults = 60;
  if (typeof rawMaxResults === "string" && rawMaxResults.trim() !== "") {
    const parsed = parseInt(rawMaxResults, 10);
    if (!Number.isNaN(parsed)) {
      maxResults = parsed;
    }
  }
  maxResults = Math.min(Math.max(maxResults, 1), 200);

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

  // 3. Kandidaten mit Geocoding anreichern (begrenzte Parallelisierung) + Bulk-Insert
  const CONCURRENCY = 5;

  const candidateRows: ImportCandidateInsert[] = [];
  let errorCount = 0;

  // Process candidates in batches of CONCURRENCY
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const chunk = candidates.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map(async (place) => {
        const coords = await geocodeAddress(place.formattedAddress);
        return {
          batch_id: batch.id,
          entity_kind: entityKind,
          status: "new" as const,
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
        };
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        candidateRows.push(result.value);
      } else {
        console.error("[import] Fehler beim Verarbeiten eines Place:", result.reason);
        errorCount++;
      }
    }
  }

  // Bulk-insert all candidate rows at once
  if (candidateRows.length > 0) {
    const { error: insertError } = await supabase
      .from("import_candidates")
      .insert(candidateRows);
    if (insertError) {
      console.error("[import] Bulk-Insert fehlgeschlagen:", insertError);
      errorCount += candidateRows.length;
    }
  }

  // 4. Batch abschließen
  // total_rows = rohe Google-Ergebnisse (vor Filter), processed_rows = tatsächlich importiert
  const processed = candidateRows.length;
  await supabase
    .from("import_batches")
    .update({
      status:
        errorCount > 0 && processed === 0
          ? "failed"
          : errorCount === 0
            ? "completed"
            : "needs_review",
      total_rows: rawCount,
      processed_rows: candidateRows.length,
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

  let owner = process.env.GITHUB_REPO_OWNER;
  let repo = process.env.GITHUB_REPO_NAME;
  const repository = process.env.GITHUB_REPOSITORY;

  if ((!owner || !repo) && repository) {
    const [repoOwner, repoName] = repository.split("/");
    if (!owner) owner = repoOwner;
    if (!repo) repo = repoName;
  }

  if (!owner || !repo) {
    throw new Error(
      "GitHub-Repository ist nicht korrekt konfiguriert. Bitte GITHUB_REPO_OWNER und GITHUB_REPO_NAME oder GITHUB_REPOSITORY in den Umgebungsvariablen setzen.",
    );
  }

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
