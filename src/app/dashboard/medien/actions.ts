"use server";

import { createClient } from "@/lib/supabase/server";

export async function createSignedUploadUrlAction(filename: string, contentType: string) {
  const safeName = filename.trim().toLowerCase();
  const ext = safeName.split(".").pop() ?? "";
  const allowedExt = new Set(["jpg", "jpeg", "png", "webp"]);
  const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);

  if (!allowedExt.has(ext) || !allowedMime.has(contentType)) {
    throw new Error("Ungültiger Dateityp. Erlaubt: JPG, PNG, WEBP.");
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Unauthorized");

  const objectPath = `${authData.user.id}/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("doctor-public")
    .createSignedUploadUrl(objectPath);

  if (error) throw error;

  return {
    path: objectPath,
    token: data.token,
    // caller uses: supabase.storage.from("doctor-public").uploadToSignedUrl(path, token, file)
  };
}
