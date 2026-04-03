"use client";

import type { BodyRegion } from "@/lib/bodymap/regions";

interface BodyMapTooltipProps {
  region: BodyRegion;
  x: number;
  y: number;
}

const BODY_AREA_LABELS: Record<BodyRegion["bodyArea"], string> = {
  kopf: "Kopf",
  gesicht: "Gesicht",
  brust: "Brust",
  bauch: "Bauch",
  arme: "Arme",
  beine: "Beine",
  intimbereich: "Intimbereich",
  ruecken: "Rücken",
};

export function BodyMapTooltip({ region, x, y }: BodyMapTooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-full"
      style={{ left: x, top: y - 12 }}
    >
      <div className="rounded-xl bg-foreground/90 text-background px-3 py-1.5 text-sm font-medium shadow-lg backdrop-blur-sm whitespace-nowrap">
        <span className="text-xs text-background/60 block leading-none mb-0.5">
          {BODY_AREA_LABELS[region.bodyArea]}
        </span>
        {region.label}
        {/* Triangle arrow pointing down */}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground/90" />
      </div>
    </div>
  );
}
