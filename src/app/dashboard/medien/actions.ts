"use server";

import { createClient } from "@/lib/supabase/server";

export async function createSignedUploadUrlAction(filename: string, contentType: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Unauthorized");

  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
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
