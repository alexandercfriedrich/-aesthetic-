/**
 * Scraper for the Österreichische Ärztekammer ÄsthOp-Suche.
 * Source: https://www.aerztekammer.at/aesthetische-operationen-suche
 *
 * Approach:
 * 1. Open the page with Playwright and intercept XHR/fetch network requests to
 *    discover whether the form is backed by a REST API.
 * 2. If an API endpoint is found, use it directly for all operation × Bundesland
 *    combinations (fast path).
 * 3. If no API endpoint is found, fall back to full Playwright DOM scraping across
 *    all combinations.
 *
 * Note: Playwright + Chromium must be available in the runtime environment.
 * Install browsers with: npx playwright install chromium
 */

import { chromium, type Page } from "playwright";

const BASE_URL =
  "https://www.aerztekammer.at/aesthetische-operationen-suche";

/** All aesthetic operations regulated by ÄsthOp-VO 2013 */
export const AESTHOP_OPERATIONS = [
  "Nasenkorrektur (Rhinoplastik)",
  "Ohranlegung (Otoplastik)",
  "Lider- und Brauenkorrektur (Blepharoplastik)",
  "Gesichtsstraffung (Facelift, Browlift, Halslift)",
  "Fettabsaugung (Liposuktion)",
  "Bauchdeckenstraffung (Abdominoplastik)",
  "Brustvergrößerung",
  "Bruststraffung und -verkleinerung",
  "Brustaufbau und -rekonstruktion",
  "Oberschenkelstraffung",
  "Oberarmstraffung",
  "Gesäßstraffung (Gluteoplastik)",
  "Implantate (außer Brustimplantate)",
];

/** All Austrian federal states */
export const BUNDESLAENDER = [
  "Wien",
  "Niederösterreich",
  "Oberösterreich",
  "Steiermark",
  "Tirol",
  "Salzburg",
  "Kärnten",
  "Burgenland",
  "Vorarlberg",
];

export interface AesthOpDoctor {
  /** Raw name as returned by the source */
  name: string;
  /** Specialty / title, e.g. "Facharzt für Plastische, Ästhetische und Rekonstruktive Chirurgie" */
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
  /** Federal state */
  bundesland: string;
  /** Source page URL for the detail record */
  sourceUrl: string | null;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Intercepts a single form submission to sniff the API URL & response shape.
 * Returns the endpoint URL if found, otherwise null.
 */
async function discoverApiEndpoint(page: Page): Promise<string | null> {
  let apiUrl: string | null = null;

  // Listen for all fetch/XHR requests during the initial form trigger
  page.on("request", (req) => {
    const url = req.url();
    const method = req.method();
    // Typical patterns: /api/*, /*.json, /search*, REST paths
    if (
      method === "POST" &&
      (url.includes("/api/") ||
        url.includes("/search") ||
        url.includes("json") ||
        url.includes("ajax") ||
        url.includes("suche"))
    ) {
      apiUrl = url;
    }
  });

  await page.goto(BASE_URL, { waitUntil: "load", timeout: 30_000 });

  // Select first operation and first Bundesland, then submit
  const operationSelect = page.locator("select").first();
  const bundeslandSelect = page.locator("select").nth(1);

  const operationOptions = await operationSelect.locator("option").all();
  const bundeslandOptions = await bundeslandSelect.locator("option").all();

  if (operationOptions.length > 1 && bundeslandOptions.length > 1) {
    await operationSelect.selectOption({ index: 1 });
    await bundeslandSelect.selectOption({ index: 1 });

    const submitBtn = page.locator(
      'button[type="submit"], input[type="submit"]',
    );
    if ((await submitBtn.count()) > 0) {
      await Promise.all([
        page.waitForResponse(() => true, { timeout: 10_000 }).catch(() => null),
        submitBtn.first().click(),
      ]);
    }
  }

  await page.waitForLoadState("domcontentloaded").catch(() => null);
  return apiUrl;
}

/**
 * Scrapes results for one operation × Bundesland combination via Playwright DOM.
 */
async function scrapeOneCombination(
  page: Page,
  operation: string,
  bundesland: string,
): Promise<AesthOpDoctor[]> {
  const doctors: AesthOpDoctor[] = [];

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });

  // Fill the search form
  const operationSelect = page.locator("select").first();
  const bundeslandSelect = page.locator("select").nth(1);

  // Try to select by visible text
  await operationSelect
    .selectOption({ label: operation })
    .catch(() => operationSelect.selectOption({ value: operation }));
  await bundeslandSelect
    .selectOption({ label: bundesland })
    .catch(() => bundeslandSelect.selectOption({ value: bundesland }));

  const submitBtn = page.locator('button[type="submit"], input[type="submit"]');
  if ((await submitBtn.count()) > 0) {
    await submitBtn.first().click();
    await page.waitForLoadState("load", { timeout: 15_000 });
  }

  // Extract result rows — aerztekammer.at typically renders a table or dl/dt/dd list
  // Try table rows first
  const tableRows = await page.locator("table tbody tr").all();
  if (tableRows.length > 0) {
    for (const row of tableRows) {
      const cells = await row.locator("td").all();
      const texts = await Promise.all(cells.map((c) => c.innerText()));
      if (texts.length === 0) continue;
      const link = await row.locator("a").first().getAttribute("href").catch((err) => {
        console.warn("[aesthop] Could not read link href:", err);
        return null;
      });
      doctors.push(
        parseTableRow(texts, bundesland, operation, link ?? null),
      );
    }
    return doctors;
  }

  // Fallback: look for definition lists / article cards
  const cards = await page
    .locator("article, .result-item, .arzt-item, [class*='result'], [class*='arzt']")
    .all();
  for (const card of cards) {
    const text = await card.innerText();
    const link = await card
      .locator("a")
      .first()
      .getAttribute("href")
      .catch(() => null);
    const parsed = parseTextBlock(text, bundesland, operation, link ?? null);
    if (parsed) doctors.push(parsed);
  }

  return doctors;
}

/** Parses a table row of text cells into an AesthOpDoctor. */
function parseTableRow(
  cells: string[],
  bundesland: string,
  operation: string,
  link: string | null,
): AesthOpDoctor {
  const [rawName = "", specialty = "", addressRaw = "", phone = ""] =
    cells.map((c) => c.trim());

  const { street, postalCode, city } = parseAddress(addressRaw);

  return {
    name: rawName,
    specialty: specialty || null,
    address: street || null,
    postalCode,
    city,
    phone: phone || null,
    website: null,
    operations: [operation],
    bundesland,
    sourceUrl: link,
  };
}

/** Parses a free-text block into an AesthOpDoctor (best-effort). */
function parseTextBlock(
  text: string,
  bundesland: string,
  operation: string,
  link: string | null,
): AesthOpDoctor | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const name = lines[0] ?? "";
  const phoneMatch = text.match(/(?:Tel\.?|Telefon):?\s*([\d\s/+\-()]+)/i);
  const webMatch = text.match(/https?:\/\/[^\s]+/);
  const postalMatch = text.match(/\b(\d{4})\s+([A-ZÄÖÜ][a-zA-ZäöüÄÖÜ\s-]+)/);

  return {
    name,
    specialty: lines[1] ?? null,
    address: lines[2] ?? null,
    postalCode: postalMatch?.[1] ?? null,
    city: postalMatch?.[2]?.trim() ?? null,
    phone: phoneMatch?.[1]?.trim() ?? null,
    website: webMatch?.[0] ?? null,
    operations: [operation],
    bundesland,
    sourceUrl: link,
  };
}

/** Extracts street, postal code, and city from a raw address string. */
function parseAddress(raw: string): {
  street: string | null;
  postalCode: string | null;
  city: string | null;
} {
  // Pattern: "Musterstraße 1, 1010 Wien"
  const match = raw.match(/^(.*?),?\s*(\d{4})\s+(.+)$/);
  if (match) {
    return {
      street: match[1].trim() || null,
      postalCode: match[2],
      city: match[3].trim(),
    };
  }
  return { street: raw || null, postalCode: null, city: null };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ScrapeResult {
  doctors: AesthOpDoctor[];
  /** Total raw entries found before deduplication */
  rawCount: number;
}

/**
 * Scrapes all ÄsthOp-licensed doctors from aerztekammer.at for the given
 * set of operations and Bundesländer.
 *
 * @param operations Subset of AESTHOP_OPERATIONS (defaults to all)
 * @param bundeslaender Subset of BUNDESLAENDER (defaults to all)
 */
export async function scrapeAesthOpDoctors({
  operations = AESTHOP_OPERATIONS,
  bundeslaender = BUNDESLAENDER,
}: {
  operations?: string[];
  bundeslaender?: string[];
} = {}): Promise<ScrapeResult> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (compatible; aestheticBot/1.0; +https://aesthetic.at/bot)",
    locale: "de-AT",
  });

  const allDoctors: AesthOpDoctor[] = [];
  let rawCount = 0;

  try {
    const page = await context.newPage();

    // Step 1: discover API endpoint
    const apiUrl = await discoverApiEndpoint(page);

    if (apiUrl) {
      console.log(`[aesthop] API discovered at ${apiUrl}`);
      // Use the API for all combinations
      for (const operation of operations) {
        for (const bundesland of bundeslaender) {
          try {
            const results = await fetchViaApi(apiUrl, operation, bundesland);
            rawCount += results.length;
            allDoctors.push(...results);
          } catch (err) {
            console.error(
              `[aesthop] API error for ${operation} × ${bundesland}:`,
              err,
            );
          }
        }
      }
    } else {
      console.log("[aesthop] No API found — falling back to DOM scraping");
      // Fallback: DOM scrape every combination
      for (const operation of operations) {
        for (const bundesland of bundeslaender) {
          try {
            const results = await scrapeOneCombination(
              page,
              operation,
              bundesland,
            );
            rawCount += results.length;
            allDoctors.push(...results);
          } catch (err) {
            console.error(
              `[aesthop] DOM scrape error for ${operation} × ${bundesland}:`,
              err,
            );
          }
        }
      }
    }

    await page.close();
  } finally {
    await context.close();
    await browser.close();
  }

  // Deduplicate by name + city (same doctor can appear in multiple operation results)
  const dedupMap = new Map<string, AesthOpDoctor>();
  for (const doc of allDoctors) {
    const key = `${doc.name.toLowerCase()}|${(doc.city ?? "").toLowerCase()}`;
    const existing = dedupMap.get(key);
    if (existing) {
      // Merge additional operations into existing entry
      for (const op of doc.operations) {
        if (!existing.operations.includes(op)) {
          existing.operations.push(op);
        }
      }
    } else {
      dedupMap.set(key, { ...doc });
    }
  }

  const deduplicated: AesthOpDoctor[] = Array.from(dedupMap.values());

  return { doctors: deduplicated, rawCount };
}

// ─── API fast-path ────────────────────────────────────────────────────────────

/**
 * Calls the discovered API endpoint directly.
 * Response shape may vary — we apply best-effort parsing.
 */
async function fetchViaApi(
  apiUrl: string,
  operation: string,
  bundesland: string,
): Promise<AesthOpDoctor[]> {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, bundesland }),
  });

  if (!res.ok) {
    // Also try form-encoded POST
    const formRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ operation, bundesland }).toString(),
    });
    if (!formRes.ok) throw new Error(`API ${apiUrl} returned ${formRes.status}`);
    const data = (await formRes.json()) as unknown;
    return parseApiResponse(data, bundesland, operation);
  }

  const data = (await res.json()) as unknown;
  return parseApiResponse(data, bundesland, operation);
}

/** Parses a generic API response array into AesthOpDoctor records. */
function parseApiResponse(
  data: unknown,
  bundesland: string,
  operation: string,
): AesthOpDoctor[] {
  const items: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown>)?.results)
      ? ((data as Record<string, unknown>).results as unknown[])
      : Array.isArray((data as Record<string, unknown>)?.data)
        ? ((data as Record<string, unknown>).data as unknown[])
        : [];

  return items.map((item) => {
    const r = item as Record<string, unknown>;
    const addressRaw = String(r.address ?? r.adresse ?? r.anschrift ?? "");
    const { street, postalCode, city } = parseAddress(addressRaw);

    return {
      name: String(r.name ?? r.arztName ?? r.title ?? ""),
      specialty: String(r.specialty ?? r.fachgebiet ?? r.bezeichnung ?? "") || null,
      address: street,
      postalCode: String(r.postalCode ?? r.plz ?? postalCode ?? "") || null,
      city: String(r.city ?? r.ort ?? city ?? "") || null,
      phone: String(r.phone ?? r.tel ?? r.telefon ?? "") || null,
      website:
        String(r.website ?? r.url ?? r.homepage ?? "") || null,
      operations: [operation],
      bundesland,
      sourceUrl: String(r.url ?? r.link ?? r.detailUrl ?? "") || null,
    };
  });
}
