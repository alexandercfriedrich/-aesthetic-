"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { FEMALE_REGIONS, MALE_REGIONS, type BodyRegion } from "@/lib/bodymap/regions";
import { BodyMapTooltip } from "./BodyMapTooltip";
import { GenderToggle } from "./GenderToggle";
import { SearchIntent } from "./SearchIntent";

type View = "front" | "back" | "head";
type Gender = "female" | "male";

// Dimensions per view
const VIEW_DIMENSIONS: Record<View, { width: number; height: number; viewBox: string }> = {
  front: { width: 320, height: 640, viewBox: "0 0 100 200" },
  back: { width: 320, height: 640, viewBox: "0 0 100 200" },
  head: { width: 320, height: 384, viewBox: "0 0 100 120" },
};

const VIEW_LABELS: Record<View, string> = {
  front: "Vorderseite",
  back: "Rückseite",
  head: "Gesicht & Kopf",
};

// Primary color as RGBA for SVG fills (matches --primary: 346 77% 49%)
const PRIMARY_FILL_HOVER = "rgba(220, 38, 38, 0.22)";
const PRIMARY_FILL_SELECTED = "rgba(220, 38, 38, 0.35)";
const PRIMARY_STROKE_HOVER = "rgba(220, 38, 38, 0.55)";
const PRIMARY_STROKE_SELECTED = "rgba(220, 38, 38, 0.85)";

interface TouchInfo {
  regionId: string | null;
  confirmed: boolean;
}

export function BodyMap() {
  const [gender, setGender] = useState<Gender>("female");
  const [view, setView] = useState<View>("front");
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<BodyRegion | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [touchInfo, setTouchInfo] = useState<TouchInfo>({ regionId: null, confirmed: false });
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  const [prevGender, setPrevGender] = useState<Gender | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const regions = gender === "female" ? FEMALE_REGIONS : MALE_REGIONS;
  const visibleRegions = regions.filter((r) => r.view === view);
  const { width, height, viewBox } = VIEW_DIMENSIONS[view];

  const handleGenderChange = useCallback(
    (g: Gender) => {
      if (g === gender) return;
      setPrevGender(gender);
      setGender(g);
      setView("front");
      setSelectedCategory(null);
      setHoveredRegion(null);
      setTouchInfo({ regionId: null, confirmed: false });
      // Clear prevGender after crossfade
      setTimeout(() => setPrevGender(null), 350);
    },
    [gender],
  );

  const handleViewChange = useCallback(
    (v: View) => {
      if (v === view) return;
      setIsViewTransitioning(true);
      setHoveredRegion(null);
      setTouchInfo({ regionId: null, confirmed: false });
      setTimeout(() => {
        setView(v);
        setIsViewTransitioning(false);
      }, 180);
    },
    [view],
  );

  function handleMouseMove(e: React.MouseEvent) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  function handleRegionClick(region: BodyRegion) {
    setSelectedCategory(region);
    setTouchInfo({ regionId: null, confirmed: false });
    document.getElementById("search-intent")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Touch: first tap shows tooltip, second tap selects
  function handleRegionTouch(e: React.TouchEvent, region: BodyRegion) {
    e.preventDefault();
    if (!containerRef.current) return;
    const touch = e.changedTouches[0];
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });

    if (touchInfo.regionId === region.id) {
      // Second tap: confirm selection
      handleRegionClick(region);
    } else {
      // First tap: show tooltip
      setHoveredRegion(region);
      setTouchInfo({ regionId: region.id, confirmed: false });
    }
  }

  function handleContainerTouch(e: React.TouchEvent) {
    // Tapping outside a region clears tooltip
    if ((e.target as SVGElement).tagName === "svg") {
      setHoveredRegion(null);
      setTouchInfo({ regionId: null, confirmed: false });
    }
  }

  const isRegionHovered = (region: BodyRegion) =>
    hoveredRegion?.id === region.id || touchInfo.regionId === region.id;
  const isRegionSelected = (region: BodyRegion) => selectedCategory?.id === region.id;

  return (
    <section className="relative flex flex-col items-center gap-6 py-12">
      {/* Gender Toggle */}
      <GenderToggle value={gender} onChange={handleGenderChange} />

      {/* View Switcher */}
      <div className="flex gap-2" role="group" aria-label="Ansicht wählen">
        {(["front", "back", "head"] as View[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => handleViewChange(v)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              view === v
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            aria-pressed={view === v}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      {/* Body Map Container */}
      <div
        ref={containerRef}
        className="relative select-none"
        style={{ width, height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredRegion(null)}
        onTouchStart={handleContainerTouch}
        aria-label="Körperkarte – klicke auf eine Region"
      >
        {/* Crossfade: previous gender fades out */}
        {prevGender && (
          <div
            className="absolute inset-0 transition-opacity duration-300 ease-in-out opacity-0"
            aria-hidden="true"
          >
            <Image
              src={`/images/bodymap/${prevGender}-${view}.svg`}
              alt=""
              fill
              className="object-contain pointer-events-none"
            />
          </div>
        )}

        {/* Current gender body image */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
            prevGender ? "animate-in fade-in duration-300" : "opacity-100"
          }`}
        >
          <Image
            src={`/images/bodymap/${gender}-${view}.svg`}
            alt={`${gender === "female" ? "Frau" : "Mann"} – ${VIEW_LABELS[view]}`}
            fill
            className="object-contain pointer-events-none"
            priority
          />
        </div>

        {/* SVG Overlay with clickable zones */}
        <svg
          viewBox={viewBox}
          preserveAspectRatio="none"
          className={`absolute inset-0 w-full h-full transition-all duration-200 ${
            isViewTransitioning ? "opacity-0 translate-x-[-8px]" : "opacity-100 translate-x-0"
          }`}
          style={{
            transitionProperty: "opacity, transform",
          }}
          aria-hidden="true"
        >
          <defs>
            <style>{`
              @media (prefers-reduced-motion: no-preference) {
                .region-glow-active {
                  animation: glow-pulse 1.5s ease-in-out infinite;
                }
              }
            `}</style>
          </defs>

          {visibleRegions.map((region) => {
            const hovered = isRegionHovered(region);
            const selected = isRegionSelected(region);
            return (
              <ellipse
                key={region.id}
                cx={region.cx}
                cy={region.cy}
                rx={region.rx}
                ry={region.ry}
                fill={
                  selected ? PRIMARY_FILL_SELECTED : hovered ? PRIMARY_FILL_HOVER : "transparent"
                }
                stroke={
                  selected
                    ? PRIMARY_STROKE_SELECTED
                    : hovered
                      ? PRIMARY_STROKE_HOVER
                      : "transparent"
                }
                strokeWidth="0.5"
                className={`cursor-pointer transition-all duration-200 ${hovered && !selected ? "region-glow-active" : ""}`}
                style={{
                  filter:
                    hovered || selected
                      ? "drop-shadow(0 0 6px rgba(220, 38, 38, 0.55))"
                      : "none",
                }}
                onMouseEnter={() => setHoveredRegion(region)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => handleRegionClick(region)}
                onTouchStart={(e) => handleRegionTouch(e, region)}
                role="button"
                aria-label={region.label}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleRegionClick(region);
                  }
                }}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredRegion && (
          <BodyMapTooltip region={hoveredRegion} x={tooltipPos.x} y={tooltipPos.y} />
        )}

        {/* Touch hint overlay for selected region */}
        {touchInfo.regionId && !touchInfo.confirmed && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <span className="rounded-full bg-foreground/80 text-background text-xs px-3 py-1.5 shadow-md whitespace-nowrap">
              Nochmal tippen zum Auswählen
            </span>
          </div>
        )}
      </div>

      {/* Search Intent Panel */}
      <div id="search-intent" className="w-full max-w-lg px-4">
        <SearchIntent
          selectedCategory={selectedCategory}
          onClear={() => {
            setSelectedCategory(null);
            setTouchInfo({ regionId: null, confirmed: false });
          }}
        />
      </div>
    </section>
  );
}
