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
  const debug = request.nextUrl.searchParams.get("debug");

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
        { error: "Creator not found or no voucher code assigned", debug_user_id: user.id },
        { status: 404 }
      );
    }

    // Check if Snowflake is configured
    const snowflakeConfigured =
      process.env.SNOWFLAKE_ACCOUNT &&
      process.env.SNOWFLAKE_USERNAME &&
      process.env.SNOWFLAKE_PASSWORD;

    if (!snowflakeConfigured) {
      if (debug) {
        return NextResponse.json({
          source: "mock",
          reason: "Snowflake not configured",
          voucher_code: creator.voucher_code,
          env_check: {
            account: !!process.env.SNOWFLAKE_ACCOUNT,
            username: !!process.env.SNOWFLAKE_USERNAME,
            password: !!process.env.SNOWFLAKE_PASSWORD,
            warehouse: process.env.SNOWFLAKE_WAREHOUSE || "not set",
          },
          stats: MOCK_STATS,
        });
      }
      return NextResponse.json(MOCK_STATS);
    }

    // Fetch real stats from Snowflake
    try {
      const stats = await getDashboardStats(creator.voucher_code);
      if (debug) {
        return NextResponse.json({
          source: "snowflake",
          voucher_code: creator.voucher_code,
          stats,
        });
      }
      return NextResponse.json(stats);
    } catch (snowflakeErr) {
      console.error("Snowflake error:", snowflakeErr);
      if (debug) {
        return NextResponse.json({
          source: "mock (snowflake error)",
          voucher_code: creator.voucher_code,
          error: snowflakeErr instanceof Error ? snowflakeErr.message : String(snowflakeErr),
          stats: MOCK_STATS,
        });
      }
      // Fall back to mock data on Snowflake errors
      return NextResponse.json(MOCK_STATS);
    }
  } catch (err) {
    console.error("Stats API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stats", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
