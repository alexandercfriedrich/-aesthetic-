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
 * IMPORTANT NOTES on API behaviour:
 *
 * 1. arztNr uniqueness: arztNr is assigned by each Länderkammer independently.
 *    The same number can refer to different doctors in different Bundesländer.
 *    Dedup key MUST include the Bundesland: `nr:${bundesland}:${arztNr}`.
 *
 * 2. Intra-query duplicates: The API returns the same doctor multiple times
 *    within a single opcode×bundesland query (e.g. doctors with multiple
 *    practice addresses). fetchAllForCombination deduplicates internally
 *    before returning, collecting all addresses in `addresses[]`.
 *
 * 3. opcode filtering: Some opcodes return identical result sets, suggesting
 *    the API ignores the opcode filter for certain operation codes. Dedup
 *    across all operation queries handles this correctly.
 *
 * 4. dgName: The raw API field `dgName` contains the institution name
 *    (e.g. "Ord. AGNESE", "Klinik LANDSTRASSE", "SVS-Gesundheitszentrum").
 *    This is now exposed in AesthOpDoctor as `institutionName` and
 *    `institutionNames[]` (one per address) for location type detection.
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

/**
 * Eine Arbeitsstätte eines Arztes mit Adresse + Institutionsname.
 * institutionName = dgName aus der API (z.B. "Ord. AGNESE", "Klinik LANDSTRASSE").
 */
export interface AesthOpAddress {
  address: string | null;
  postalCode: string | null;
  city: string | null;
  /** Originalname der Arbeitsstätte aus der API (dgName), z.B. "Ord. AGNESE" */
  institutionName: string | null;
}

export interface AesthOpDoctor {
  /** Full name incl. titles */
  name: string;
  /** Specialty text, e.g. "Facharzt für Plastische, Rekonstruktive und Ästhetische Chirurgie" */
  specialty: string | null;
  /** Primary address (first encountered) */
  address: string | null;
  /** Primary postal code */
  postalCode: string | null;
  /** Primary city */
  city: string | null;
  /** Primary institution name (dgName of first address) */
  institutionName: string | null;
  /**
   * All practice addresses for this doctor, including institution names.
   * Used for multi-location import.
   */
  addresses: AesthOpAddress[];
  /** Phone number */
  phone: string | null;
  /** Website URL */
  website: string | null;
  /** Operations this doctor is licensed for */
  operations: string[];
  /** Primary federal state (first encountered) */
  bundesland: string;
  /** All federal states this doctor is licensed in */
  bundeslaender: string[];
  /** Source page URL for the detail record */
  sourceUrl: string | null;
  /** Internal Ärztekammer doctor number (unique per Länderkammer) */
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

// ─── Core fetch logic ─────────────────────────────────────────────────────────

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

  const addr: AesthOpAddress = {
    address: raw.strasse?.trim() || null,
    postalCode: raw.plz?.trim() || null,
    city: raw.ort?.trim() || null,
    institutionName: raw.dgName?.trim() || null,
  };

  return {
    name: nameParts || `${raw.vorname} ${raw.familienname}`,
    specialty: raw.fachText?.trim() || null,
    address: addr.address,
    postalCode: addr.postalCode,
    city: addr.city,
    institutionName: addr.institutionName,
    addresses: [addr],
    phone: null,
    website: raw.www?.trim() || null,
    operations: [operation],
    bundesland,
    bundeslaender: [bundesland],
    sourceUrl: null,
    arztNr: raw.arztNr ?? null,
    oakid: raw.oakid?.trim() || null,
  };
}

/**
 * Fetches all doctors for one operation×bundesland combination.
 * Preserves all addresses including their institution names (dgName).
 */
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

  const rawDoctors: AesthOpDoctor[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const apiPage = await fetchPage(opcode, bundeslandCode, page);
    for (const raw of apiPage.content) {
      rawDoctors.push(mapRawToDoctor(raw, bundesland, operation));
    }
    totalPages = apiPage.totalPages;
    page++;
  }

  // Deduplicate within this single query result.
  const seen = new Map<string, AesthOpDoctor>();
  for (const doc of rawDoctors) {
    const key = doc.arztNr
      ? `nr:${doc.arztNr}`
      : `name:${doc.name.toLowerCase()}|${(doc.city ?? "").toLowerCase()}`;

    const existing = seen.get(key);
    if (existing) {
      // Collect additional address if different (match by institutionName + address)
      const addrKey = `${doc.institutionName}|${doc.address}|${doc.postalCode}|${doc.city}`;
      const existingAddrKeys = existing.addresses.map(
        (a) => `${a.institutionName}|${a.address}|${a.postalCode}|${a.city}`,
      );
      if (!existingAddrKeys.includes(addrKey)) {
        existing.addresses.push({
          address: doc.address,
          postalCode: doc.postalCode,
          city: doc.city,
          institutionName: doc.institutionName,
        });
      }
    } else {
      seen.set(key, { ...doc, addresses: [...doc.addresses] });
    }
  }

  return Array.from(seen.values());
}

// ─── Public API ────────────────────────────────────────────────────────────────────

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

  // Global dedup across all operation×bundesland combinations.
  const dedupMap = new Map<string, AesthOpDoctor>();

  for (const doc of allDoctors) {
    const key = doc.arztNr
      ? `nr:${doc.bundesland}:${doc.arztNr}`
      : `name:${doc.name.toLowerCase()}|${(doc.city ?? "").toLowerCase()}`;

    const existing = dedupMap.get(key);
    if (existing) {
      // Merge operations
      for (const op of doc.operations) {
        if (!existing.operations.includes(op)) existing.operations.push(op);
      }
      // Merge bundeslaender
      for (const bl of doc.bundeslaender) {
        if (!existing.bundeslaender.includes(bl)) existing.bundeslaender.push(bl);
      }
      // Merge addresses (unique by institutionName + address)
      for (const addr of doc.addresses) {
        const addrKey = `${addr.institutionName}|${addr.address}|${addr.postalCode}|${addr.city}`;
        const existingKeys = existing.addresses.map(
          (a) => `${a.institutionName}|${a.address}|${a.postalCode}|${a.city}`,
        );
        if (!existingKeys.includes(addrKey)) {
          existing.addresses.push(addr);
        }
      }
    } else {
      dedupMap.set(key, {
        ...doc,
        addresses: [...doc.addresses],
        bundeslaender: [...doc.bundeslaender],
      });
    }
  }

  const deduplicated: AesthOpDoctor[] = Array.from(dedupMap.values());

  const blCounts: Record<string, number> = {};
  for (const doc of deduplicated) {
    blCounts[doc.bundesland] = (blCounts[doc.bundesland] ?? 0) + 1;
  }
  for (const [bl, count] of Object.entries(blCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`[aesthop] Unique Ärzte in ${bl}: ${count}`);
  }

  return { doctors: deduplicated, rawCount };
}
