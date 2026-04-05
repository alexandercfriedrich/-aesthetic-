"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { BodyRegion } from "@/lib/bodymap/regions";

interface SearchIntentProps {
  selectedCategory: BodyRegion | null;
  onClear: () => void;
}

const BUNDESLAENDER = [
  { id: "oesterreichweit", label: "🇦🇹 Österreichweit" },
  { id: "wien", label: "Wien" },
  { id: "niederoesterreich", label: "Niederösterreich" },
  { id: "oberoesterreich", label: "Oberösterreich" },
  { id: "steiermark", label: "Steiermark" },
  { id: "tirol", label: "Tirol" },
  { id: "salzburg", label: "Salzburg" },
  { id: "kaernten", label: "Kärnten" },
  { id: "vorarlberg", label: "Vorarlberg" },
  { id: "burgenland", label: "Burgenland" },
];

export function SearchIntent({ selectedCategory, onClear }: SearchIntentProps) {
  const router = useRouter();
  const [bundesland, setBundesland] = useState<string>("oesterreichweit");

  if (!selectedCategory) {
    return (
      <p className="text-center text-muted-foreground text-sm py-4">
        ← Klicke auf eine Körperregion, um eine Behandlung zu wählen
      </p>
    );
  }

  function handleSearch() {
    if (!selectedCategory) return;
    const params = new URLSearchParams({ kategorie: selectedCategory.id });
    if (bundesland !== "oesterreichweit") params.set("bundesland", bundesland);
    router.push(`/suche?${params.toString()}`);
  }

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4 animate-in slide-in-from-bottom-2 duration-300">
      {/* Selected category */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Behandlung:</span>
        <span className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
          {selectedCategory.label}
          <button
            type="button"
            onClick={onClear}
            className="ml-1 hover:text-primary/70 transition-colors"
            aria-label="Behandlung entfernen"
          >
            <X size={12} />
          </button>
        </span>
      </div>

      {/* Bundesland chips */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Region:</p>
        <div className="flex flex-wrap gap-2">
          {BUNDESLAENDER.map((bl) => (
            <button
              key={bl.id}
              type="button"
              onClick={() => setBundesland(bl.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
                bundesland === bl.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {bl.label}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleSearch}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3 font-semibold text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
      >
        Ärzte finden →
      </button>
    </div>
  );
}
