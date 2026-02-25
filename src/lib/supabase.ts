import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type InvoiceType = "referral_payout" | "food_expense";
export type InvoiceStatus = "pending" | "approved" | "declined";

export interface Invoice {
  id: string;
  creator_id: string;
  type: InvoiceType;
  amount: number;
  currency: string;
  description: string;
  invoice_date: string;
  file_url: string;
  status: InvoiceStatus;
  admin_comment: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface InvoiceWithCreator extends Invoice {
  creators: {
    id: string;
    name: string;
    email: string;
    voucher_code: string;
  };
}

export const currencySymbol = (c: string) => (c === "EUR" ? "€" : "£");

export type VideoStatus = "pending" | "approved" | "rejected";

export interface Video {
  id: string;
  creator_id: string;
  title: string;
  video_url: string;
  video_file_url: string | null;
  description: string | null;
  status: VideoStatus;
  admin_comment: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  invoice_submitted: boolean;
}

export interface VideoWithCreator extends Video {
  creators: {
    id: string;
    name: string;
    email: string;
    voucher_code: string;
  };
}

export interface Creator {
  id: string;
  email: string;
  name: string;
  voucher_code: string;
  created_at: string;
}
