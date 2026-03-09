import { NextRequest, NextResponse } from "next/server";
import type { FlashDeal } from "@/lib/supabase";

// ─── Notion helpers (will be moved to src/lib/notion.ts when API is connected) ───

interface NotionPropertyValue {
  title?: { text: { content: string } }[];
  rich_text?: { text: { content: string } }[];
  date?: { start: string };
  select?: { name: string };
}

interface NotionPage {
  id: string;
  properties: Record<string, NotionPropertyValue>;
}

function parseNotionPage(page: NotionPage): FlashDeal {
  const p = page.properties;
  return {
    id: page.id,
    restaurant_name: p.Name?.title?.[0]?.text?.content ?? "",
    deal_offer: p.Deal?.rich_text?.[0]?.text?.content ?? "",
    start_date: p["Start Date"]?.date?.start ?? "",
    end_date: p["End Date"]?.date?.start ?? p["Start Date"]?.date?.start ?? "",
    city: p.City?.select?.name ?? "",
  };
}

async function fetchDealsFromNotion(): Promise<FlashDeal[]> {
  const token = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DATABASE_ID;

  if (!token || !dbId) {
    // Return empty when Notion is not configured yet
    return [];
  }

  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    next: { revalidate: 300 }, // cache for 5 minutes
  });

  if (!res.ok) {
    console.error("Notion API error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return (data.results as NotionPage[]).map(parseNotionPage);
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

// ─── GET /api/deals?city=London ───

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city");

  if (!city) {
    return NextResponse.json(
      { error: "City parameter is required" },
      { status: 400 }
    );
  }

  // Try Notion first; fall back to mock data if not configured
  let deals = await fetchDealsFromNotion();

  if (deals.length === 0) {
    deals = MOCK_DEALS;
  }

  // Filter by city (case-insensitive)
  const filtered = deals
    .filter((d) => d.city.toLowerCase() === city.toLowerCase())
    .filter((d) => new Date(d.end_date) >= new Date());

  return NextResponse.json(filtered);
}
