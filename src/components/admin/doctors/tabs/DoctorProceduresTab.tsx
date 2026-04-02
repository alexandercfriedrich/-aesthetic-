import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import type { AdminDoctorDetail } from "@/lib/queries/doctors";

type DoctorProcedureRow = {
  id: string;
  procedure_id: string;
  description_short?: string | null;
  price_from?: number | null;
  price_to?: number | null;
  currency: string;
  is_price_verified: boolean;
  is_primary_focus: boolean;
  is_active: boolean;
  procedures?: { id: string; slug: string; name_de: string } | null;
};

export function DoctorProceduresTab({ doctor }: { doctor: AdminDoctorDetail }) {
  const items = (doctor.doctor_procedures ?? []) as DoctorProcedureRow[];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl border bg-white p-5">
        <div>
          <h2 className="text-sm font-semibold">Behandlungen</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Leistungen, Preisranges und Prioritäten pflegen.
          </p>
        </div>
        <Button size="sm">Behandlung hinzufügen</Button>
      </div>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-white px-5 py-10 text-center text-sm text-muted-foreground">
          Noch keine Behandlungen hinterlegt.
        </div>
      )}

      {items.map((item) => {
        const name = item.procedures?.name_de ?? "Unbekannte Behandlung";
        const hasPrice = item.price_from != null || item.price_to != null;

        return (
          <div
            key={item.id}
            className={cn(
              "rounded-2xl border bg-white p-5 transition-opacity",
              !item.is_active && "opacity-60",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm">{name}</span>
                  {item.is_primary_focus && (
                    <Badge variant="info" className="text-xs">Primärfokus</Badge>
                  )}
                  {!item.is_active && (
                    <Badge variant="muted" className="text-xs">Inaktiv</Badge>
                  )}
                </div>
                {item.description_short && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {item.description_short}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right">
                {hasPrice ? (
                  <>
                    <div className="text-sm font-medium">
                      {item.price_from != null && item.price_to != null
                        ? `${formatPrice(item.price_from, item.currency)} – ${formatPrice(item.price_to, item.currency)}`
                        : item.price_from != null
                          ? `ab ${formatPrice(item.price_from, item.currency)}`
                          : `bis ${formatPrice(item.price_to!, item.currency)}`}
                    </div>
                    <div className="mt-0.5 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      {item.is_price_verified ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-slate-300" />
                      )}
                      {item.is_price_verified ? "Preis verifiziert" : "Preis unbestätigt"}
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Kein Preis</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
