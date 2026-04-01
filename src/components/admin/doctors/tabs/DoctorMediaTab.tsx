import { ImageIcon, Lock, Globe, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminDoctorDetail } from "@/lib/queries/doctors";

type MediaRow = {
  id: string;
  media_kind: string;
  visibility: string;
  alt_text?: string | null;
  approved_at?: string | null;
  object_path: string;
  bucket_id: string;
  mime_type?: string | null;
};

const kindLabel: Record<string, string> = {
  portrait: "Protraitfoto",
  clinic: "Klinikbild",
  certificate: "Zertifikat",
  logo: "Logo",
  gallery: "Galerie",
  other: "Sonstiges",
};

const visibilityConfig: Record<string, { label: string; icon: React.ReactNode; variant: "success" | "muted" | "warning" | "info" }> = {
  public: { label: "Öffentlich", icon: <Globe className="h-3 w-3" />, variant: "success" },
  private: { label: "Privat", icon: <Lock className="h-3 w-3" />, variant: "muted" },
  premium: { label: "Premium", icon: <Shield className="h-3 w-3" />, variant: "warning" },
  internal: { label: "Intern", icon: <Lock className="h-3 w-3" />, variant: "info" },
};

export function DoctorMediaTab({ doctor }: { doctor: AdminDoctorDetail }) {
  const assets = (doctor.media_assets ?? []) as MediaRow[];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl border bg-white p-5">
        <div>
          <h2 className="text-sm font-semibold">Medien</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Profilbilder, Klinikbilder und Zertifikate verwalten.
          </p>
        </div>
        <Button size="sm">Datei hochladen</Button>
      </div>

      {assets.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-white px-5 py-10 text-center text-sm text-muted-foreground">
          Noch keine Medien hochgeladen.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {assets.map((asset) => {
          const vis = visibilityConfig[asset.visibility] ?? visibilityConfig.private;
          const isApproved = !!asset.approved_at;

          return (
            <div
              key={asset.id}
              className={cn(
                "rounded-2xl border bg-white p-4 transition-shadow hover:shadow-sm",
                !isApproved && "opacity-70",
              )}
            >
              {/* Thumbnail placeholder */}
              <div className="mb-3 flex aspect-[4/3] items-center justify-center rounded-xl bg-slate-100">
                <ImageIcon className="h-8 w-8 text-slate-300" />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {kindLabel[asset.media_kind] ?? asset.media_kind}
                  </div>
                  {asset.alt_text && (
                    <div className="truncate text-xs text-muted-foreground">{asset.alt_text}</div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={vis.variant} className="gap-1">
                    {vis.icon}
                    {vis.label}
                  </Badge>
                  {isApproved ? (
                    <Badge variant="success" className="text-[10px]">Freigegeben</Badge>
                  ) : (
                    <Badge variant="warning" className="text-[10px]">Ausstehend</Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
