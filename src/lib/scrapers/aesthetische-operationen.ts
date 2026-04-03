/**
 * Scraper for the Österreichische Ärztekammer ÄsthOp-Suche.
 * Source: https://www.aerztekammer.at/aesthetische-operationen-suche
 *
 * Uses the real REST API discovered via browser network inspection:
 * GET https://www.aerztekammer.at/api/aestop/arzts
 *   ?opcode=<code>&bundesLands=<code>&page=<n>&size=100&sort=familienname&sortDirection=asc
 *
 * No Playwright / browser required.
 *
 * IMPORTANT NOTE on arztNr uniqueness:
 * arztNr is assigned by each Länderkammer independently. The same number can
 * refer to different doctors in different Bundesländer. The dedup key therefore
 * MUST include the Bundesland: `nr:${bundesland}:${arztNr}`.
 */

const API_BASE = "https://www.aerztekammer.at/api/aestop/arzts";
const PAGE_SIZE = 100;

/**
 * Maps human-readable operation name → opcode used by the API.
 * Source: ÄsthOp-VO 2013 Anlage (all 45 operations, opcodes 01–45).
 */
export const OPERATION_CODES: Record<string, string> = {
  // Gesicht
  "Kinnkorrektur (Genioplastik)": "01",
  "Nasenkorrektur (Rhinoplastik)": "02",
  "Ohranlegung (Otoplastik)": "03",
  "Lider- und Brauenkorrektur (Blepharoplastik)": "04",
  "Gesichtsstraffung (Facelift, Browlift, Halslift)": "05",
  // Körperkontour
  "Fettabsaugung (Liposuktion)": "06",
  "Bauchdeckenstraffung (Abdominoplastik)": "07",
  // Brust
  "Brustvergrößerung": "08",
  "Bruststraffung und -verkleinerung": "09",
  "Brustaufbau und -rekonstruktion": "10",
  // Extremitäten
  "Oberschenkelstraffung": "11",
  "Oberarmstraffung": "12",
  // Körper
  "Gesäßstraffung (Gluteoplastik)": "13",
  "Implantate (außer Brustimplantate)": "14",
  // Injektionsbehandlungen / minimal-invasiv
  "Injektionsbehandlungen mit Botulinumtoxin": "15",
  "Injektionsbehandlungen mit Füllmaterialien (Filler)": "16",
  "Eigenblutbehandlungen (PRP)": "17",
  "Fadenlift (Fadenbehandlung)": "18",
  // Haut
  "Chemisches Peeling (mitteltief, tief)": "19",
  "Laserbehandlungen der Haut": "20",
  "Lichtbehandlungen der Haut (IPL)": "21",
  "Radiofrequenzbehandlungen": "22",
  "Ultraschallbehandlungen (HIFU)": "23",
  "Kryolipolyse": "24",
  "Mesotherapie": "25",
  "Mikronadeln (Microneedling)": "26",
  "Permanent Make-up (Tattöwierungen im Gesicht)": "27",
  // Haare
  "Haartransplantation": "28",
  "Laserbehandlungen der Haare": "29",
  // Intimchirurgie
  "Intimchirurgie (Labioplastik u.a.)": "30",
  // Weitere chirurgische Eingriffe
  "Lidhebung ohne Operation (nicht-chirurgisch)": "31",
  "Fettgewebstransplantation (Lipofilling)": "32",
  "Narbenkorrektur": "33",
  "Afterkorrektur": "34",
  "Penisverlängerung/-vergrößerung": "35",
  "Hymenrekonstruktion": "36",
  "Sterilisation": "37",
  "Vasektomie": "38",
  "Ohrläppchenkorrekturen": "39",
  "Zahnfleischkorrekturen (Gingivoplastik)": "40",
  "Entfernung von Tattöwierungen": "41",
  "Entfernung von Besenreisern / Venenbehandlung": "42",
  "Behandlung von Hyperhidrose": "43",
  "Behandlung von Alopezie": "44",
  "Sonstige ästhetische Operationen und Behandlungen": "45",
};

/** Maps human-readable Bundesland → bundesLands code used by the API */
export const BUNDESLAND_CODES: Record<string, string> = {
  Wien: "W",
  Niederösterreich: "N",
  Oberösterreich: "O",
  Steiermark: "ST",
  Tirol: "T",
  Salzburg: "S",
  Kärnten: "K",
  Burgenland: "B",
  Vorarlberg: "V",
};

/** All aesthetic operations regulated by ÄsthOp-VO 2013 */
export const AESTHOP_OPERATIONS = Object.keys(OPERATION_CODES);

/** All Austrian federal states */
export const BUNDESLAENDER = Object.keys(BUNDESLAND_CODES);

export interface AesthOpDoctor {
  /** Full name incl. titles */
  name: string;
  /** Specialty text, e.g. "Facharzt für Plastische, Rekonstruktive und Ästhetische Chirurgie" */
  specialty: string | null;
  /** Street + house number */
  address: string | null;
  /** Postal code */
  postalCode: string | null;
  /** City */
  city: string | null;
  /** Phone number */
  phone: string | null;
  /** Website URL */
  website: string | null;
  /** Operations this doctor is licensed for */
  operations: string[];
  /** Primary federal state (first encountered — kept for backwards compatibility) */
  bundesland: string;
  /**
   * All federal states this doctor is licensed in.
   * A doctor can have registrations in multiple Länderkammern.
   */
  bundeslaender: string[];
  /** Source page URL for the detail record */
  sourceUrl: string | null;
  /** Internal Ärztekammer doctor number (unique per Länderkammer, NOT globally) */
  arztNr: number | null;
  /** OAK ID */
  oakid: string | null;
}

export interface ScrapeResult {
  doctors: AesthOpDoctor[];
  /** Total raw entries found before deduplication */
  rawCount: number;
}

// ─── Raw API response types ─────────────────────────────────────────────

interface RawArzt {
  bdldCode: string;
  arztNr: number;
  sex: string;
  titelPre: string;
  vorname: string;
  familienname: string;
  titelPost: string;
  fachCode: string;
  fachShort: string;
  fachText: string;
  plz: string;
  ort: string;
  strasse: string;
  dgName: string;
  oakid: string;
  www: string;
  lid: number;
}

interface ApiPage {
  content: RawArzt[];
  totalPages: number;
  totalElements: number;
  last: boolean;
  number: number;
}

// ─── Core fetch logic ─────────────────────────────────────────────────────

async function fetchPage(
  opcode: string,
  bundeslandCode: string,
  page: number,
): Promise<ApiPage> {
  const url = new URL(API_BASE);
  url.searchParams.set("opcode", opcode);
  url.searchParams.set("bundesLands", bundeslandCode);
  url.searchParams.set("orts", "");
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(PAGE_SIZE));
  url.searchParams.set("sort", "familienname");
  url.searchParams.set("sortDirection", "asc");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "de-AT,de;q=0.9",
      Referer: "https://www.aerztekammer.at/aesthetische-operationen-suche",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url.toString()}`);
  }

  const text = await res.text();
  if (!text || text.trim() === "") {
    throw new Error(`Empty response for opcode=${opcode} bundesLands=${bundeslandCode} page=${page}`);
  }
  if (text.trim().startsWith("<")) {
    throw new Error(`Got HTML instead of JSON for opcode=${opcode} bundesLands=${bundeslandCode}`);
  }

  return JSON.parse(text) as ApiPage;
}

function mapRawToDoctor(raw: RawArzt, bundesland: string, operation: string): AesthOpDoctor {
  const nameParts = [raw.titelPre?.trim(), raw.vorname?.trim(), raw.familienname?.trim(), raw.titelPost?.trim()]
    .filter(Boolean)
    .join(" ");

  return {
    name: nameParts || `${raw.vorname} ${raw.familienname}`,
    specialty: raw.fachText?.trim() || null,
    address: raw.strasse?.trim() || null,
    postalCode: raw.plz?.trim() || null,
    city: raw.ort?.trim() || null,
    phone: null, // not provided by this API endpoint
    website: raw.www?.trim() || null,
    operations: [operation],
    bundesland,
    bundeslaender: [bundesland],
    sourceUrl: null,
    arztNr: raw.arztNr ?? null,
    oakid: raw.oakid?.trim() || null,
  };
}

async function fetchAllForCombination(
  operation: string,
  bundesland: string,
): Promise<AesthOpDoctor[]> {
  const opcode = OPERATION_CODES[operation];
  const bundeslandCode = BUNDESLAND_CODES[bundesland];

  if (!opcode || !bundeslandCode) {
    console.warn(`[aesthop] Unknown operation or bundesland: ${operation} × ${bundesland}`);
    return [];
  }

  const doctors: AesthOpDoctor[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const apiPage = await fetchPage(opcode, bundeslandCode, page);
    for (const raw of apiPage.content) {
      doctors.push(mapRawToDoctor(raw, bundesland, operation));
    }
    totalPages = apiPage.totalPages;
    page++;
  }

  return doctors;
}

// ─── Public API ────────────────────────────────────────────────────────────────────

/**
 * Fetches all ÄsthOp-licensed doctors from aerztekammer.at for the given
 * set of operations and Bundesländer using the real REST API.
 *
 * @param operations Subset of AESTHOP_OPERATIONS (defaults to all 45)
 * @param bundeslaender Subset of BUNDESLAENDER (defaults to all 9)
 */
export async function scrapeAesthOpDoctors({
  operations = AESTHOP_OPERATIONS,
  bundeslaender = BUNDESLAENDER,
}: {
  operations?: string[];
  bundeslaender?: string[];
} = {}): Promise<ScrapeResult> {
  const allDoctors: AesthOpDoctor[] = [];
  let rawCount = 0;

  for (const operation of operations) {
    for (const bundesland of bundeslaender) {
      try {
        const results = await fetchAllForCombination(operation, bundesland);
        console.log(`[aesthop] ${operation} × ${bundesland}: ${results.length} entries`);
        rawCount += results.length;
        allDoctors.push(...results);
      } catch (err) {
        console.error(`[aesthop] Error for ${operation} × ${bundesland}:`, err);
      }
    }
  }

  // Deduplicate by (bundesland, arztNr) — arztNr is unique only WITHIN a Länderkammer,
  // NOT globally across all 9 Bundesländer. A Wiener doctor with arztNr=12345 is a
  // different person than a Kärntner doctor with arztNr=12345.
  //
  // Key strategy:
  //   - Has arztNr → `nr:${bundesland}:${arztNr}`   (reliable, bundesland-scoped)
  //   - No arztNr  → `name:${normalizedName}|${city}` (fallback)
  //
  // On merge: union both `operations[]` and `bundeslaender[]`.
  const dedupMap = new Map<string, AesthOpDoctor>();

  for (const doc of allDoctors) {
    const key = doc.arztNr
      ? `nr:${doc.bundesland}:${doc.arztNr}`
      : `name:${doc.name.toLowerCase()}|${(doc.city ?? "").toLowerCase()}`;

    const existing = dedupMap.get(key);
    if (existing) {
      // Merge operations
      for (const op of doc.operations) {
        if (!existing.operations.includes(op)) {
          existing.operations.push(op);
        }
      }
      // Merge bundeslaender
      for (const bl of doc.bundeslaender) {
        if (!existing.bundeslaender.includes(bl)) {
          existing.bundeslaender.push(bl);
        }
      }
    } else {
      dedupMap.set(key, { ...doc, bundeslaender: [...doc.bundeslaender] });
    }
  }

  const deduplicated: AesthOpDoctor[] = Array.from(dedupMap.values());

  // Log per-bundesland breakdown
  const blCounts: Record<string, number> = {};
  for (const doc of deduplicated) {
    blCounts[doc.bundesland] = (blCounts[doc.bundesland] ?? 0) + 1;
  }
  for (const [bl, count] of Object.entries(blCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`[aesthop] Unique Ärzte in ${bl}: ${count}`);
  }

  return { doctors: deduplicated, rawCount };
}
