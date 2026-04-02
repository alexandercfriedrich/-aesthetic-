import { MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminDoctorDetail } from "@/lib/queries/doctors";

type Location = {
  id: string;
  city: string;
  postal_code?: string | null;
  street?: string | null;
  house_number?: string | null;
  state?: string | null;
  country_code?: string;
  is_primary: boolean;
};

export function DoctorLocationsTab({ doctor }: { doctor: AdminDoctorDetail }) {
  const locations = (doctor.locations ?? []) as Location[];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl border bg-white p-5">
        <div>
          <h2 className="text-sm font-semibold">Standorte</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Primären Standort und weitere Adressen verwalten.
          </p>
        </div>
        <Button size="sm">Standort hinzufügen</Button>
      </div>

      {locations.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-white px-5 py-10 text-center text-sm text-muted-foreground">
          Noch kein Standort hinterlegt.
        </div>
      )}

      {locations.map((loc) => (
        <div key={loc.id} className="rounded-2xl border bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {loc.city}
                    {loc.postal_code ? ` (${loc.postal_code})` : ""}
                  </span>
                  {loc.is_primary && (
                    <Badge variant="success" className="gap-1">
                      <Star className="h-2.5 w-2.5" />
                      Primär
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {[loc.street, loc.house_number].filter(Boolean).join(" ")}
                  {loc.state ? ` · ${loc.state}` : ""}
                  {loc.country_code && loc.country_code !== "AT" ? ` · ${loc.country_code}` : ""}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0 text-xs">
              Bearbeiten
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
