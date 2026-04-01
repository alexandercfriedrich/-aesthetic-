import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Registrieren | aesthetic" };

export default function RegistrierenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm">
        <Link href="/" className="mb-8 block text-center text-xl font-bold text-primary">
          aesthetic
        </Link>
        <h1 className="mb-6 text-center text-xl font-semibold">Konto erstellen</h1>
        <form className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name</label>
            <input
              type="text"
              name="full_name"
              required
              autoComplete="name"
              className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">E-Mail</label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Passwort</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
          </div>
          <button
            type="submit"
            className="h-10 w-full rounded-xl bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Registrieren
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Bereits ein Konto?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </main>
  );
}
