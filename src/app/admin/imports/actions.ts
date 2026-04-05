"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { fetchGooglePlacesCandidates } from "@/lib/google/places";
import { geocodeAddress } from "@/lib/google/geocoding";
import type { Database, Json } from "@/types/database";

type ImportCandidateInsert =
  Database["public"]["Tables"]["import_candidates"]["Insert"];

// ─── Slug helpers ─────────────────────────────────────────────────────────────

function buildBaseSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  base: string,
): Promise<string> {
  const MAX_ATTEMPTS = 1000;
  let slug = base;
  let counter = 2;
  while (counter <= MAX_ATTEMPTS + 1) {
    const { data } = await supabase
      .from("doctor_profiles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
    slug = `${base}-${counter}`;
    counter++;
  }
  throw new Error(`Kein eindeutiger Slug für "${base}" nach ${MAX_ATTEMPTS} Versuchen gefunden.`);
}

function parseName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first_name: "", last_name: parts[0] };
  return {
    first_name: parts.slice(0, -1).join(" "),
    last_name: parts[parts.length - 1],
  };
}

// ─── Candidate review actions ─────────────────────────────────────────────────

export async function approveCandidateAction(candidateId: string) {
  const { supabase } = await assertAdminOrEditor();

  const { data: candidate, error: fetchErr } = await supabase
    .from("import_candidates")
    .select("batch_id")
    .eq("id", candidateId)
    .single();
  if (fetchErr || !candidate) throw new Error("Kandidat nicht gefunden");

  const { error } = await supabase
    .from("import_candidates")
    .update({ status: "approved" })
    .eq("id", candidateId);
  if (error) throw error;

  const { data: batchData } = await supabase
    .from("import_batches")
    .select("approved_rows")
    .eq("id", candidate.batch_id)
    .single();
  await supabase
    .from("import_batches")
    .update({ approved_rows: (batchData?.approved_rows ?? 0) + 1 })
    .eq("id", candidate.batch_id);

  revalidatePath("/admin/imports");
}

export async function updateCandidateAction(
  candidateId: string,
  fields: {
    normalized_name?: string;
    city?: string;
    postal_code?: string;
    normalized_phone?: string;
    normalized_website_domain?: string;
    specialty_text?: string;
    entity_kind?: string;
    reviewer_notes?: string;
    operations?: string[];
  },
) {
  const { supabase } = await assertAdminOrEditor();

  const { operations, ...columnFields } = fields;

  // If operations were provided, merge them into raw_json
  if (operations) {
    const { data: existing } = await supabase
      .from("import_candidates")
      .select("raw_json")
      .eq("id", candidateId)
      .single();
    const currentRaw = (existing?.raw_json as Record<string, unknown>) ?? {};
    const updatedRaw = { ...currentRaw, operations };
    const { error } = await supabase
      .from("import_candidates")
      .update({
        ...columnFields,
        raw_json: updatedRaw,
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("import_candidates")
      .update({ ...columnFields, updated_at: new Date().toISOString() })
      .eq("id", candidateId);
    if (error) throw error;
  }

  revalidatePath("/admin/imports");
}

export async function mergeCandidateAction(
  candidateId: string,
  matchedProfileId: string,
) {
  const { supabase } = await assertAdminOrEditor();

  const { data: candidate, error: fetchErr } = await supabase
    .from("import_candidates")
    .select("batch_id")
    .eq("id", candidateId)
    .single();
  if (fetchErr || !candidate) throw new Error("Kandidat nicht gefunden");

  const { error } = await supabase
    .from("import_candidates")
    .update({ status: "approved", matched_doctor_id: matchedProfileId })
    .eq("id", candidateId);
  if (error) throw error;

  const { data: batchData } = await supabase
    .from("import_batches")
    .select("approved_rows")
    .eq("id", candidate.batch_id)
    .single();
  await supabase
    .from("import_batches")
    .update({ approved_rows: (batchData?.approved_rows ?? 0) + 1 })
    .eq("id", candidate.batch_id);

  revalidatePath("/admin/imports");
}

export async function rejectCandidateAction(candidateId: string) {
  const { supabase } = await assertAdminOrEditor();

  const { data: candidate, error: fetchErr } = await supabase
    .from("import_candidates")
    .select("batch_id")
    .eq("id", candidateId)
    .single();
  if (fetchErr || !candidate) throw new Error("Kandidat nicht gefunden");

  const { error } = await supabase
    .from("import_candidates")
    .update({ status: "rejected" })
    .eq("id", candidateId);
  if (error) throw error;

  const { data: batchData } = await supabase
    .from("import_batches")
    .select("rejected_rows")
    .eq("id", candidate.batch_id)
    .single();
  await supabase
    .from("import_batches")
    .update({ rejected_rows: (batchData?.rejected_rows ?? 0) + 1 })
    .eq("id", candidate.batch_id);

  revalidatePath("/admin/imports");
}

export async function approveAllCandidatesAction(batchId: string) {
  const { supabase } = await assertAdminOrEditor();

  const { error } = await supabase
    .from("import_candidates")
    .update({ status: "approved" })
    .eq("batch_id", batchId)
    .in("status", ["new", "needs_review"]);
  if (error) throw error;

  const { count } = await supabase
    .from("import_candidates")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batchId)
    .eq("status", "approved");

  await supabase
    .from("import_batches")
    .update({ approved_rows: count ?? 0 })
    .eq("id", batchId);

  revalidatePath("/admin/imports");
}

export async function publishBatchAction(batchId: string) {
  // Auth guard uses the regular (user) client; all writes go via the service client.
  await assertAdminOrEditor();
  const service = await createServiceClient();

  const { data: candidates, error: fetchErr } = await service
    .from("import_candidates")
    .select("*")
    .eq("batch_id", batchId)
    .eq("status", "approved");
  if (fetchErr) throw fetchErr;
  if (!candidates || candidates.length === 0) {
    throw new Error("Keine freigegebenen Kandidaten zum Veröffentlichen.");
  }

  for (const candidate of candidates) {
    const displayName = candidate.normalized_name ?? "Unbekannt";
    const baseSlug = buildBaseSlug(displayName);
    if (!baseSlug) continue;

    // ── 1. Resolve doctor_profiles id ──────────────────────────────────────
    let doctorId: string;

    // When the admin chose "merge into existing", matched_doctor_id is already
    // set by mergeCandidateAction — use that profile directly.
    // If the matched profile no longer exists (stale reference), fall through
    // to the create-new-profile path instead of silently skipping.
    let useCreatePath = !candidate.matched_doctor_id;

    if (candidate.matched_doctor_id && !useCreatePath) {
      const { data: matched } = await service
        .from("doctor_profiles")
        .select("id, is_claimed")
        .eq("id", candidate.matched_doctor_id)
        .maybeSingle();

      if (!matched) {
        console.warn(
          "[publish] matched_doctor_id not found, falling back to create-new:",
          candidate.matched_doctor_id,
        );
        useCreatePath = true;
      } else {
        // Respect claimed profile — do not modify its display name, just link
        if (!matched.is_claimed) {
          const { error: updateErr } = await service
            .from("doctor_profiles")
            .update({
              public_display_name: displayName,
              profile_status: "published",
              source_type: "aesthop_scraper",
              updated_at: new Date().toISOString(),
            })
            .eq("id", matched.id);
          if (updateErr) {
            console.error("[publish] doctor_profiles update failed:", updateErr);
            continue;
          }
        }
        doctorId = matched.id;
      }
    }

    if (useCreatePath) {
      // "Create new profile" path — slug-based lookup / insert
      const { data: existing } = await service
        .from("doctor_profiles")
        .select("id, is_claimed")
        .eq("slug", baseSlug)
        .maybeSingle();

      if (existing) {
        // Never overwrite a claimed profile
        if (existing.is_claimed) {
          doctorId = existing.id;
        } else {
          const { error: updateErr } = await service
            .from("doctor_profiles")
            .update({
              public_display_name: displayName,
              profile_status: "published",
              source_type: "aesthop_scraper",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          if (updateErr) {
            console.error("[publish] doctor_profiles update failed:", updateErr);
            continue;
          }
          doctorId = existing.id;
        }
      } else {
        const slug = await generateUniqueSlug(service, baseSlug);
        const { first_name, last_name } = parseName(displayName);
        const { data: inserted, error: insertErr } = await service
          .from("doctor_profiles")
          .insert({
            slug,
            first_name,
            last_name,
            public_display_name: displayName,
            profile_status: "published",
            source_type: "aesthop_scraper",
            source_url: candidate.source_url ?? null,
            source_confidence: candidate.confidence_score ?? 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (insertErr || !inserted) {
          console.error("[publish] doctor_profiles insert failed:", insertErr);
          continue;
        }
        doctorId = inserted.id;
      }
    }

    // ── 2. Location ─────────────────────────────────────────────────────────
    if (candidate.city) {
      const { data: existingLoc } = await service
        .from("locations")
        .select("id")
        .eq("doctor_id", doctorId!)
        .eq("city", candidate.city)
        .maybeSingle();

      if (!existingLoc) {
        await service.from("locations").insert({
          doctor_id: doctorId!,
          city: candidate.city,
          is_primary: true,
        });
      }
    }

    // ── 3. Doctor procedures ────────────────────────────────────────────────
    const rawJson = candidate.raw_json as Record<string, unknown> | null;
    const operations = Array.isArray(rawJson?.operations)
      ? (rawJson.operations as unknown[])
      : [];

    for (const op of operations) {
      const opName = typeof op === "string" ? op : null;
      if (!opName) continue;

      let proc: { id: string } | null = null;
      const { data: bySlug } = await service
        .from("procedures")
        .select("id")
        .eq("slug", opName)
        .maybeSingle();
      if (bySlug) {
        proc = bySlug;
      } else {
        const { data: byName } = await service
          .from("procedures")
          .select("id")
          .ilike("name_de", opName)
          .maybeSingle();
        proc = byName ?? null;
      }

      if (proc) {
        const { error: dpErr } = await service
          .from("doctor_procedures")
          .insert({
            doctor_id: doctorId!,
            procedure_id: proc.id,
          });
        if (dpErr && dpErr.code !== "23505") {
          console.error("[publish] doctor_procedures insert failed:", dpErr);
        }
      }
    }

    // ── 4. Update candidate ─────────────────────────────────────────────────
    await service
      .from("import_candidates")
      .update({
        status: "merged",
        matched_doctor_id: doctorId!,
      })
      .eq("id", candidate.id);
  }

  // ── 5. Close batch ────────────────────────────────────────────────────────
  await service
    .from("import_batches")
    .update({
      status: "completed",
      finished_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  revalidatePath("/admin/imports");
  revalidatePath("/admin/doctors");
}

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

  const rawEntityKind = formData.get("entity_kind");
  const entityKind =
    typeof rawEntityKind === "string" && rawEntityKind.trim() !== ""
      ? rawEntityKind
      : "doctor";

  const rawMaxResults = formData.get("max_results");
  let maxResults = 60;
  if (typeof rawMaxResults === "string" && rawMaxResults.trim() !== "") {
    const parsed = parseInt(rawMaxResults, 10);
    if (!Number.isNaN(parsed)) {
      maxResults = parsed;
    }
  }
  maxResults = Math.min(Math.max(maxResults, 1), 200);

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

  const { places: candidates, rawCount } = await fetchGooglePlacesCandidates({
    query: `${query} ${city}`,
    maxResults,
  });

  const CONCURRENCY = 5;
  const candidateRows: ImportCandidateInsert[] = [];
  let errorCount = 0;

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

  if (candidateRows.length > 0) {
    const { error: insertError } = await supabase
      .from("import_candidates")
      .insert(candidateRows);
    if (insertError) {
      console.error("[import] Bulk-Insert fehlgeschlagen:", insertError);
      errorCount += candidateRows.length;
    }
  }

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
  limit?: number;
}): Promise<{ workflowUrl: string }> {
  const { supabase } = await assertAdminOrEditor();
  void supabase;

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

  const dispatchRef =
    process.env.VERCEL_GIT_COMMIT_REF ??
    process.env.GITHUB_REF_NAME ??
    "main";

  const workflowInputs: Record<string, string> = {
    bundeslaender: params?.bundeslaender ?? "",
    operations: params?.operations ?? "",
    no_enrich: params?.noEnrich ? "true" : "false",
  };

  if (
    typeof params?.limit === "number" &&
    Number.isInteger(params.limit) &&
    params.limit > 0
  ) {
    workflowInputs.limit = String(params.limit);
  } else if (typeof params?.limit === "number") {
    throw new Error("`limit` muss eine positive ganze Zahl sein.");
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
        ref: dispatchRef,
        inputs: workflowInputs,
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
