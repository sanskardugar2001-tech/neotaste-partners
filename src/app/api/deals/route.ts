import { NextRequest, NextResponse } from "next/server";
import type { FlashDeal } from "@/lib/supabase";

// ─── Notion helpers (will be moved to src/lib/notion.ts when API is connected) ───

interface NotionPropertyValue {
  type?: string;
  title?: { text: { content: string } }[];
  rich_text?: { text: { content: string } }[];
  date?: { start: string; end: string | null };
  select?: { name: string };
  multi_select?: { name: string }[];
  number?: number | null;
  status?: { name: string };
}

interface NotionPage {
  id: string;
  properties: Record<string, NotionPropertyValue>;
}

function getTextContent(prop: NotionPropertyValue | undefined): string {
  if (!prop) return "";
  // Handle title type (first column in Notion is always title)
  if (prop.title?.[0]?.text?.content) return prop.title[0].text.content;
  // Handle rich_text type
  if (prop.rich_text?.[0]?.text?.content) return prop.rich_text[0].text.content;
  return "";
}

function findProperty(props: Record<string, NotionPropertyValue>, startsWith: string, type?: string): NotionPropertyValue | undefined {
  for (const [key, val] of Object.entries(props)) {
    if (key.toLowerCase().startsWith(startsWith.toLowerCase())) {
      if (!type || val.type === type) return val;
    }
  }
  return undefined;
}

function parseNotionPage(page: NotionPage): FlashDeal {
  const p = page.properties;
  const timing = p["Timing"]?.date;
  // "Event deal £" has encoding issues — find by prefix + type instead
  const dealOfferProp = findProperty(p, "Event deal", "rich_text");
  return {
    id: page.id,
    restaurant_name: getTextContent(p["In-App name"]),
    deal_offer: getTextContent(dealOfferProp),
    start_date: timing?.start ?? "",
    end_date: timing?.end ?? timing?.start ?? "",
    city:
      p["Location (City)"]?.multi_select?.[0]?.name ??
      p["Location (City)"]?.select?.name ??
      "",
    deals_per_day: p["Deals per Day"]?.number ?? undefined,
  };
}

async function fetchDealsFromNotion(): Promise<{ deals: FlashDeal[]; error?: string; raw_count?: number; raw_pages?: NotionPage[] }> {
  const token = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DATABASE_ID;

  if (!token || !dbId) {
    return { deals: [], error: `Missing config: token=${!!token}, dbId=${!!dbId}` };
  }

  try {
    let allPages: NotionPage[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    // Paginate through all results (Notion returns max 100 per request)
    while (hasMore) {
      const body: Record<string, unknown> = {};
      if (startCursor) body.start_cursor = startCursor;

      const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Notion API error:", res.status, errorText);
        return { deals: [], error: `Notion API ${res.status}: ${errorText}` };
      }

      const data = await res.json();
      const pages = data.results as NotionPage[];
      allPages = allPages.concat(pages);
      hasMore = data.has_more === true;
      startCursor = data.next_cursor ?? undefined;
    }

    console.log(`Notion returned ${allPages.length} total pages`);
    const deals = allPages.map(parseNotionPage);
    return { deals, raw_count: allPages.length, raw_pages: allPages };
  } catch (err) {
    console.error("Notion fetch error:", err);
    return { deals: [], error: `Fetch error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ─── Mock deals for development (used when Notion is not connected) ───

const MOCK_DEALS: FlashDeal[] = [
  {
    id: "mock-1",
    restaurant_name: "Byron Burgers",
    deal_offer: "£1 Smash Burger",
    start_date: "2026-03-05",
    end_date: "2026-03-07",
    city: "London",
  },
  {
    id: "mock-2",
    restaurant_name: "Pizza Pilgrims",
    deal_offer: "£1 Margherita Pizza",
    start_date: "2026-03-08",
    end_date: "2026-03-10",
    city: "London",
  },
  {
    id: "mock-3",
    restaurant_name: "Honest Burgers",
    deal_offer: "£2 Classic Burger",
    start_date: "2026-03-06",
    end_date: "2026-03-09",
    city: "Manchester",
  },
  {
    id: "mock-4",
    restaurant_name: "Rudy's Pizza",
    deal_offer: "£1 Neapolitan Pizza",
    start_date: "2026-03-10",
    end_date: "2026-03-12",
    city: "Manchester",
  },
  {
    id: "mock-5",
    restaurant_name: "The Ivy",
    deal_offer: "£3 Afternoon Tea",
    start_date: "2026-03-04",
    end_date: "2026-03-06",
    city: "Birmingham",
  },
  {
    id: "mock-6",
    restaurant_name: "Pieminister",
    deal_offer: "£1 Signature Pie",
    start_date: "2026-03-07",
    end_date: "2026-03-09",
    city: "Bristol",
  },
  {
    id: "mock-7",
    restaurant_name: "Burgermeister",
    deal_offer: "€1 Cheeseburger",
    start_date: "2026-03-05",
    end_date: "2026-03-08",
    city: "Berlin",
  },
  {
    id: "mock-8",
    restaurant_name: "L'Osteria",
    deal_offer: "€2 XXL Pizza",
    start_date: "2026-03-09",
    end_date: "2026-03-11",
    city: "Munich",
  },
];

// ─── GET /api/deals?city=London&debug=1 ───

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city");
  const debug = request.nextUrl.searchParams.get("debug");

  if (!city) {
    return NextResponse.json(
      { error: "City parameter is required" },
      { status: 400 }
    );
  }

  // Try Notion first; fall back to mock data if not configured
  const notionResult = await fetchDealsFromNotion();
  let deals = notionResult.deals;

  const source = notionResult.error
    ? `mock (${notionResult.error})`
    : deals.length === 0
      ? "mock (notion returned 0 results)"
      : "notion";

  if (deals.length === 0) {
    deals = MOCK_DEALS;
  }

  // Filter by city (case-insensitive)
  const filtered = deals
    .filter((d) => d.city.toLowerCase() === city.toLowerCase())
    .filter((d) => new Date(d.end_date) >= new Date());

  if (debug === "raw" && notionResult.raw_pages && notionResult.raw_pages.length > 0) {
    // Show raw property names and types from the first matching page
    const sample = notionResult.raw_pages.find(
      (pg) => {
        const city_val =
          pg.properties["Location (City)"]?.multi_select?.[0]?.name ??
          pg.properties["Location (City)"]?.select?.name ?? "";
        return city_val.toLowerCase() === city.toLowerCase();
      }
    ) ?? notionResult.raw_pages[0];
    const propSummary: Record<string, { type: string; value: string }> = {};
    for (const [key, val] of Object.entries(sample.properties)) {
      const v = val as NotionPropertyValue;
      propSummary[key] = {
        type: v.type ?? "unknown",
        value: getTextContent(v) || (v.number != null ? String(v.number) : (v.select?.name ?? v.multi_select?.[0]?.name ?? v.date?.start ?? "")),
      };
    }
    return NextResponse.json({ sample_id: sample.id, properties: propSummary });
  }

  if (debug) {
    return NextResponse.json({
      source,
      notion_raw_count: notionResult.raw_count ?? 0,
      notion_error: notionResult.error ?? null,
      total_deals: deals.length,
      city_filter: city,
      all_cities: Array.from(new Set(deals.map((d) => d.city))),
      filtered_count: filtered.length,
      deals: filtered,
    });
  }

  return NextResponse.json(filtered);
}
