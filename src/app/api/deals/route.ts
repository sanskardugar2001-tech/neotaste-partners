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

function parseNotionPage(page: NotionPage): FlashDeal {
  const p = page.properties;
  const timing = p["Timing"]?.date;
  return {
    id: page.id,
    restaurant_name: getTextContent(p["In-App name"]),
    deal_offer: getTextContent(p["Event Deal."]),
    start_date: timing?.start ?? "",
    end_date: timing?.end ?? timing?.start ?? "",
    city:
      p["Location (City)"]?.multi_select?.[0]?.name ??
      p["Location (City)"]?.select?.name ??
      "",
    deals_per_day: p["Deals per Day"]?.number ?? undefined,
  };
}

async function fetchDealsFromNotion(): Promise<{ deals: FlashDeal[]; error?: string; raw_count?: number }> {
  const token = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DATABASE_ID;

  if (!token || !dbId) {
    return { deals: [], error: `Missing config: token=${!!token}, dbId=${!!dbId}` };
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      cache: "no-store", // always fetch fresh data
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Notion API error:", res.status, errorText);
      return { deals: [], error: `Notion API ${res.status}: ${errorText}` };
    }

    const data = await res.json();
    const pages = data.results as NotionPage[];
    console.log(`Notion returned ${pages.length} pages`);

    const deals = pages.map(parseNotionPage);
    return { deals, raw_count: pages.length };
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
  let source = "notion";

  if (deals.length === 0 && !notionResult.error) {
    // Notion returned 0 results but no error — might be empty database
    deals = MOCK_DEALS;
    source = "mock (notion returned 0 results)";
  } else if (notionResult.error) {
    deals = MOCK_DEALS;
    source = `mock (${notionResult.error})`;
  }

  // Filter by city (case-insensitive)
  const filtered = deals
    .filter((d) => d.city.toLowerCase() === city.toLowerCase())
    .filter((d) => new Date(d.end_date) >= new Date());

  if (debug) {
    return NextResponse.json({
      source,
      notion_raw_count: notionResult.raw_count ?? 0,
      notion_error: notionResult.error ?? null,
      total_deals: deals.length,
      city_filter: city,
      all_cities: [...new Set(deals.map((d) => d.city))],
      filtered_count: filtered.length,
      deals: filtered,
    });
  }

  return NextResponse.json(filtered);
}
