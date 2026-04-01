import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profil bearbeiten | Dashboard" };

export default function DashboardProfilPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold">Profil bearbeiten</h1>
        <p className="mt-1 text-muted-foreground">
          Aktualisiere deine öffentlichen Profildaten.
        </p>

        <form className="mt-8 space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Vorname</label>
              <input
                type="text"
                name="firstName"
                className="h-10 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nachname</label>
              <input
                type="text"
                name="lastName"
                className="h-10 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Kurzbio</label>
            <textarea
              name="shortBio"
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Website</label>
            <input
              type="url"
              name="websiteUrl"
              placeholder="https://…"
              className="h-10 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Telefon (öffentlich)</label>
            <input
              type="tel"
              name="phonePublic"
              className="h-10 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Speichern
          </button>
        </form>
      </div>
    </main>
  );
}
