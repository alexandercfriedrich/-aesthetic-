"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useState, useTransition, useRef } from "react";
import { startAesthOpBatchAction } from "@/app/admin/imports/actions";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  BUNDESLAENDER,
  AESTHOP_OPERATIONS,
} from "@/lib/scrapers/aesthetische-operationen";

export function AesthOpDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Multi-select state — empty means "all"
  const [selectedBundeslaender, setSelectedBundeslaender] = useState<string[]>(
    [],
  );
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);

  function toggleItem(
    item: string,
    list: string[],
    setter: (v: string[]) => void,
  ) {
    setter(
      list.includes(item) ? list.filter((x) => x !== item) : [...list, item],
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Inject multi-select values as comma-separated strings
    if (selectedBundeslaender.length > 0) {
      formData.set("bundeslaender", selectedBundeslaender.join(","));
    }
    if (selectedOperations.length > 0) {
      formData.set("operations", selectedOperations.join(","));
    }
    setError(null);
    startTransition(async () => {
      try {
        await startAesthOpBatchAction(formData);
        setOpen(false);
        formRef.current?.reset();
        setSelectedBundeslaender([]);
        setSelectedOperations([]);
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
          Ärztekammer ÄsthOp importieren
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-6 shadow-lg overflow-y-auto max-h-[90vh] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <DialogPrimitive.Title className="text-base font-semibold">
                Ärztekammer ÄsthOp importieren
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-0.5 text-xs text-muted-foreground">
                Importiert alle gemäß ÄsthOpG + ÄsthOp-VO 2013 zugelassenen
                Ärzte von aerztekammer.at als import_candidates.
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
                htmlFor="ao-source-label"
                className="text-sm font-medium"
              >
                Bezeichnung
              </label>
              <input
                id="ao-source-label"
                name="source_label"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Ärztekammer ÄsthOp – alle Bundesländer"
              />
            </div>

            {/* Bundesland multi-select */}
            <div className="space-y-1">
              <span className="text-sm font-medium">
                Bundesländer{" "}
                <span className="font-normal text-muted-foreground">
                  (leer = alle)
                </span>
              </span>
              <div className="grid grid-cols-3 gap-1.5 rounded-lg border p-2">
                {BUNDESLAENDER.map((bl) => (
                  <label
                    key={bl}
                    className="flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBundeslaender.includes(bl)}
                      onChange={() =>
                        toggleItem(bl, selectedBundeslaender, setSelectedBundeslaender)
                      }
                      className="h-3.5 w-3.5 rounded"
                    />
                    {bl}
                  </label>
                ))}
              </div>
            </div>

            {/* Operations multi-select */}
            <div className="space-y-1">
              <span className="text-sm font-medium">
                Operationen{" "}
                <span className="font-normal text-muted-foreground">
                  (leer = alle)
                </span>
              </span>
              <div className="space-y-1 rounded-lg border p-2">
                {AESTHOP_OPERATIONS.map((op) => (
                  <label
                    key={op}
                    className="flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOperations.includes(op)}
                      onChange={() =>
                        toggleItem(op, selectedOperations, setSelectedOperations)
                      }
                      className="h-3.5 w-3.5 rounded"
                    />
                    {op}
                  </label>
                ))}
              </div>
            </div>

            {isPending && (
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                Scraper läuft… Das kann mehrere Minuten dauern.
              </p>
            )}

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
                {isPending ? "Scraper läuft…" : "Import starten"}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
