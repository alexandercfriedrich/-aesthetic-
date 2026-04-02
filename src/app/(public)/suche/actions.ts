"use server";

import { redirect } from "next/navigation";

export async function searchDoctorsAction(formData: FormData) {
  const query = String(formData.get("query") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (city) params.set("city", city);

  redirect(`/suche?${params.toString()}`);
}
