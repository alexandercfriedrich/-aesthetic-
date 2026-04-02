"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useState, useTransition, useRef } from "react";
import { startGooglePlacesBatchAction } from "@/app/admin/imports/actions";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function NewBatchDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await startGooglePlacesBatchAction(formData);
        setOpen(false);
        formRef.current?.reset();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ein Fehler ist aufgetreten",
        );
      }
    });
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button className="rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
          Neuen Batch anlegen (via API)
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <DialogPrimitive.Title className="text-base font-semibold">
                Neuen Batch anlegen
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-0.5 text-xs text-muted-foreground">
                Ärzte/Kliniken via Google Places (New) importieren und in
                import_candidates speichern.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <button
                className="rounded-lg p-1 hover:bg-slate-100 transition-colors"
                disabled={isPending}
                aria-label="Schließen"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </DialogPrimitive.Close>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            {/* source_label */}
            <div className="space-y-1">
              <label
                htmlFor="nb-source-label"
                className="text-sm font-medium"
              >
                Bezeichnung
              </label>
              <input
                id="nb-source-label"
                name="source_label"
                required
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Google Places – Wien Chirurgen"
              />
            </div>

            {/* query */}
            <div className="space-y-1">
              <label htmlFor="nb-query" className="text-sm font-medium">
                Suchbegriff
              </label>
              <input
                id="nb-query"
                name="query"
                required
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Plastischer Chirurg"
              />
            </div>

            {/* city */}
            <div className="space-y-1">
              <label htmlFor="nb-city" className="text-sm font-medium">
                Stadt
              </label>
              <input
                id="nb-city"
                name="city"
                required
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Wien"
              />
            </div>

            {/* entity_kind */}
            <div className="space-y-1">
              <label
                htmlFor="nb-entity-kind"
                className="text-sm font-medium"
              >
                Art
              </label>
              <select
                id="nb-entity-kind"
                name="entity_kind"
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="doctor">Arzt</option>
                <option value="clinic">Klinik</option>
              </select>
            </div>

            {/* max_results */}
            <div className="space-y-1">
              <label
                htmlFor="nb-max-results"
                className="text-sm font-medium"
              >
                Max. Ergebnisse{" "}
                <span className="text-muted-foreground font-normal">
                  (max. 200)
                </span>
              </label>
              <input
                id="nb-max-results"
                name="max_results"
                type="number"
                defaultValue={60}
                min={1}
                max={200}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <DialogPrimitive.Close asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                >
                  Abbrechen
                </Button>
              </DialogPrimitive.Close>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Läuft…" : "Batch starten"}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
