"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function isSafeRedirect(path: string | null): path is string {
  return (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/\\")
  );
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;

  if (!email || !password) {
    redirect("/login?error=" + encodeURIComponent("E-Mail und Passwort erforderlich"));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg =
      error.status === 400
        ? "E-Mail oder Passwort ungültig"
        : "Anmeldung fehlgeschlagen. Bitte versuche es erneut.";
    redirect("/login?error=" + encodeURIComponent(msg));
  }

  redirect(isSafeRedirect(redirectTo) ? redirectTo : "/dashboard");
}
