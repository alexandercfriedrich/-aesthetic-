import type { Metadata } from "next";
import { Upload, ImageIcon } from "lucide-react";

export const metadata: Metadata = { title: "Medien | Dashboard" };

export default function DashboardMedienPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medien</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Profilfotos und Klinikbilder hochladen.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Upload className="h-4 w-4" />
          Datei hochladen
        </button>
      </div>

      <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center">
        <ImageIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h2 className="font-semibold">Noch keine Medien</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Lade dein Profilbild oder Klinikfotos hoch.
        </p>
      </div>
    </main>
  );
}
