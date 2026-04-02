import { describe, it, expect } from "vitest";
import { isRelevantPlace } from "./places-filter";

describe("isRelevantPlace", () => {
  // ── Positive cases (should be KEPT) ────────────────────────────────────────

  it("keeps a place with allowlist type 'plastic_surgeon'", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Dr. Mayer Praxis" },
        types: ["plastic_surgeon", "doctor"],
      }),
    ).toBe(true);
  });

  it("keeps a place with allowlist type 'dermatologist'", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Hautarztpraxis Wien" },
        types: ["dermatologist"],
      }),
    ).toBe(true);
  });

  it("keeps a place with allowlist type 'medical_spa'", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "LuxSpa Klinik" },
        types: ["medical_spa"],
      }),
    ).toBe(true);
  });

  it("keeps a place with 'Botox' in the display name", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Botox & Filler Zentrum Wien" },
        types: ["doctor"],
      }),
    ).toBe(true);
  });

  it("keeps a place with 'ästhetisch' keyword in name", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Ästhetische Medizin Graz" },
        types: [],
      }),
    ).toBe(true);
  });

  it("keeps a place with 'plastisch' keyword in name", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Plastischer Chirurg Dr. Weber" },
        types: ["doctor"],
      }),
    ).toBe(true);
  });

  it("keeps a place with English keyword 'aesthetic clinic' in name", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Vienna Aesthetic Clinic" },
        types: ["health"],
      }),
    ).toBe(true);
  });

  it("keeps a place with 'haartransplantation' in name", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Haartransplantation Zentrum Salzburg" },
        types: [],
      }),
    ).toBe(true);
  });

  it("keeps a place with 'dermatologie' keyword even without allowlist type", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Dermatologie & Ästhetik am Ring" },
        types: ["health"],
      }),
    ).toBe(true);
  });

  it("keeps a place with allowlist type 'hair_transplantation_clinic'", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Hair Center Vienna" },
        types: ["hair_transplantation_clinic"],
      }),
    ).toBe(true);
  });

  // ── Negative cases (should be REJECTED) ────────────────────────────────────

  it("rejects a dentist", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Zahnarzt Praxis Müller" },
        types: ["dentist"],
      }),
    ).toBe(false);
  });

  it("rejects a pharmacy", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Apotheke am Markt" },
        types: ["pharmacy"],
      }),
    ).toBe(false);
  });

  it("rejects a regular beauty salon (no allowlist keyword in name)", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Salon Rosalie" },
        types: ["beauty_salon"],
      }),
    ).toBe(false);
  });

  it("rejects a gym", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "FitnessPark Wien" },
        types: ["gym"],
      }),
    ).toBe(false);
  });

  it("rejects an unrelated health place with no signals", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Allgemein-Praxis Müller" },
        types: ["doctor"],
      }),
    ).toBe(false);
  });

  it("rejects a nail salon", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Nails & Lashes Studio" },
        types: ["nail_salon"],
      }),
    ).toBe(false);
  });

  it("rejects a place with no types and no keywords", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Praxis Dr. Schmidt" },
        types: [],
      }),
    ).toBe(false);
  });

  it("rejects a hair salon without aesthetic keywords", () => {
    expect(
      isRelevantPlace({
        displayName: { text: "Friseur & Styling" },
        types: ["hair_salon"],
      }),
    ).toBe(false);
  });

  // ── Edge cases ──────────────────────────────────────────────────────────────

  it("handles missing displayName gracefully", () => {
    expect(
      isRelevantPlace({
        types: ["dermatologist"],
      }),
    ).toBe(true);
  });

  it("handles empty place object without throwing", () => {
    expect(isRelevantPlace({})).toBe(false);
  });
});
