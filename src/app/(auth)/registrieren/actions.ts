"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = ((formData.get("full_name") as string) ?? "").slice(0, 200).trim();

  if (!email || !password) {
    redirect("/registrieren?error=" + encodeURIComponent("E-Mail und Passwort erforderlich"));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    const msg =
      error.status === 422
        ? "Diese E-Mail-Adresse ist bereits registriert."
        : "Registrierung fehlgeschlagen. Bitte versuche es erneut.";
    redirect("/registrieren?error=" + encodeURIComponent(msg));
  }

  redirect("/dashboard");
}
