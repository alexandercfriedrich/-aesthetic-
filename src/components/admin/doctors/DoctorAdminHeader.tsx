import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  ExternalLink,
  MoreHorizontal,
  ShieldCheck,
  Star,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AdminDoctorDetail } from "@/lib/queries/admin-doctors";

type ProfileStatus = "draft" | "pending_review" | "published" | "hidden" | "suspended";
type VerificationLevel = "unverified" | "email_verified" | "document_verified" | "premium";

const statusConfig: Record<ProfileStatus, { label: string; variant: "success" | "warning" | "muted" | "destructive" | "info" }> = {
  published: { label: "Publiziert", variant: "success" },
  pending_review: { label: "Wartet auf Review", variant: "warning" },
  draft: { label: "Entwurf", variant: "muted" },
  hidden: { label: "Versteckt", variant: "muted" },
  suspended: { label: "Gesperrt", variant: "destructive" },
};

const verificationConfig: Record<VerificationLevel, { label: string; variant: "success" | "warning" | "muted" | "info" }> = {
  premium: { label: "Premium", variant: "success" },
  document_verified: { label: "Verifiziert", variant: "info" },
  email_verified: { label: "E-Mail bestätigt", variant: "warning" },
  unverified: { label: "Unverified", variant: "muted" },
};

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function getDisplayName(doctor: AdminDoctorDetail) {
  const parts = [doctor.title, doctor.first_name, doctor.last_name].filter(Boolean);
  return parts.join(" ");
}

export function DoctorAdminHeader({ doctor }: { doctor: AdminDoctorDetail }) {
  const status = statusConfig[doctor.profile_status as ProfileStatus] ?? statusConfig.draft;
  const verification = verificationConfig[doctor.verification_level as VerificationLevel] ?? verificationConfig.unverified;
  const displayName = getDisplayName(doctor);

  return (
    <div className="rounded-2xl border bg-white">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 border-b px-5 py-3">
        <Link
          href="/admin/doctors"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Ärzte
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm font-medium truncate">{displayName}</span>
      </div>

      {/* Main header */}
      <div className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 rounded-xl border shadow-sm">
            <AvatarImage src={doctor.profile_image_url ?? undefined} alt={displayName} />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold">
              {getInitials(doctor.first_name, doctor.last_name)}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold leading-tight text-foreground">{displayName}</h1>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status */}
              <Badge variant={status.variant}>{status.label}</Badge>

              {/* Verification */}
              <Badge variant={verification.variant} className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                {verification.label}
              </Badge>

              {/* Premium */}
              {doctor.is_premium && (
                <Badge variant="warning" className="gap-1">
                  <Star className="h-3 w-3" />
                  Premium
                </Badge>
              )}

              {/* Claimed */}
              {doctor.owner_user_id ? (
                <Badge variant="success" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Geclaimed
                </Badge>
              ) : (
                <Badge variant="muted">Nicht geclaimed</Badge>
              )}

              {/* Specialty */}
              {(doctor.specialties as { name?: string } | null)?.name && (
                <span className="text-sm text-muted-foreground">
                  {(doctor.specialties as { name: string }).name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {doctor.website_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={doctor.website_url} target="_blank" rel="noopener noreferrer">
                <Globe className="h-3.5 w-3.5" />
                Website
              </a>
            </Button>
          )}

          <Button variant="outline" size="sm" asChild>
            <Link href={`/arzt/${doctor.slug}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
              Profil ansehen
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Mehr Aktionen</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Profil bearbeiten</DropdownMenuItem>
              <DropdownMenuItem>Slug ändern</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-amber-600">Profil verstecken</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Profil sperren</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t px-5 py-3">
        <MetaItem label="ID" value={doctor.id.slice(0, 8) + "…"} mono />
        <Separator orientation="vertical" className="h-4" />
        <MetaItem label="Slug" value={`/arzt/${doctor.slug}`} mono />
        {doctor.email && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <MetaItem label="E-Mail" value={doctor.email} />
          </>
        )}
        {doctor.phone && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <MetaItem label="Tel." value={doctor.phone} />
          </>
        )}
        <Separator orientation="vertical" className="h-4" />
        <MetaItem
          label="Erstellt"
          value={new Date(doctor.created_at).toLocaleDateString("de-AT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        />
      </div>
    </div>
  );
}

function MetaItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn("font-medium", mono && "font-mono text-[11px]")}>{value}</span>
    </div>
  );
}
