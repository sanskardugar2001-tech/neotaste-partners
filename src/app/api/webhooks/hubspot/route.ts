import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client — bypasses RLS and has admin API access
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, voucher_code } = body;

    if (!email || !name || !voucher_code) {
      return NextResponse.json(
        { error: "Missing required fields: email, name, voucher_code" },
        { status: 400 }
      );
    }

    // 1. Create Supabase Auth user via admin API
    //    email_confirm: false means the user must verify their email.
    //    Supabase auto-sends a verification/magic-link email.
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: false,
      });

    if (authError) {
      if (
        authError.message?.includes("already been registered") ||
        authError.message?.includes("already exists")
      ) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `Auth error: ${authError.message}` },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // 2. Insert row in creators table
    const { error: insertError } = await supabaseAdmin
      .from("creators")
      .insert({
        id: userId,
        email,
        name,
        voucher_code,
      });

    if (insertError) {
      // Duplicate voucher_code or email in creators table
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Duplicate entry — email or voucher code already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, user_id: userId },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
