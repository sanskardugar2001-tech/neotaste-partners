import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDashboardStats } from "@/lib/snowflake";

// Use the service role key so we can look up any creator's voucher code
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mock data fallback when Snowflake isn't configured yet
const MOCK_STATS = {
  codesRedeemed: 47,
  annualSubscribers: 28,
  monthlySubscribers: 19,
  totalEarnings: 940,
  monthlyReferrals: [
    { month: "Sep", count: 4 },
    { month: "Oct", count: 8 },
    { month: "Nov", count: 5 },
    { month: "Dec", count: 12 },
    { month: "Jan", count: 6 },
    { month: "Feb", count: 12 },
  ],
};

export async function GET(request: NextRequest) {
  try {
    // Get the creator's user ID from the auth header (session token)
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify the session and get the user
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up the creator's voucher code from the creators table
    const { data: creator, error: creatorError } = await supabaseAdmin
      .from("creators")
      .select("voucher_code")
      .eq("id", user.id)
      .single();

    if (creatorError || !creator?.voucher_code) {
      return NextResponse.json(
        { error: "Creator not found or no voucher code assigned" },
        { status: 404 }
      );
    }

    // Check if Snowflake is configured
    const snowflakeConfigured =
      process.env.SNOWFLAKE_ACCOUNT &&
      process.env.SNOWFLAKE_USERNAME &&
      process.env.SNOWFLAKE_PASSWORD;

    if (!snowflakeConfigured) {
      console.log(
        "Snowflake not configured, returning mock data for code:",
        creator.voucher_code
      );
      return NextResponse.json(MOCK_STATS);
    }

    // Fetch real stats from Snowflake
    const stats = await getDashboardStats(creator.voucher_code);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("Stats API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
