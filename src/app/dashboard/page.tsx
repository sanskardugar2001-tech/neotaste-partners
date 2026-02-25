"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NeoTasteLogo } from "@/components/NeoTasteLogo";
import InvoicesTab from "@/components/InvoicesTab";
import VideosTab from "@/components/VideosTab";
import { supabase } from "@/lib/supabase";

/* ───────── Mock Data ───────── */
const VOUCHER_CODE = "CREATOR47";
const REFERRAL_LINK = "https://neotaste.com/gb?code=CREATOR47&a=3";

const monthlyReferrals = [
  { month: "Sep", count: 4 },
  { month: "Oct", count: 8 },
  { month: "Nov", count: 5 },
  { month: "Dec", count: 12 },
  { month: "Jan", count: 6 },
  { month: "Feb", count: 12 },
];

const paymentHistory = [
  { date: "Feb 2024", referrals: 12, amount: 300, status: "pending" },
  { date: "Jan 2024", referrals: 6, amount: 150, status: "pending" },
  { date: "Dec 2023", referrals: 12, amount: 300, status: "paid" },
  { date: "Nov 2023", referrals: 5, amount: 125, status: "paid" },
  { date: "Oct 2023", referrals: 8, amount: 200, status: "paid" },
  { date: "Sep 2023", referrals: 4, amount: 100, status: "paid" },
];

const invoiceFAQ = [
  {
    q: "How to invoice referral payouts",
    a: "Send a separate invoice for your referral earnings each month to Modash. Include your creator code, the billing period, and total amount due.",
  },
  {
    q: "How to invoice food expenses",
    a: "Send a separate invoice for food expenses with receipts attached. Include photos of your receipts and the content you created.",
  },
  {
    q: "Can I combine referral and expense invoices?",
    a: "No, referral payouts and food expense reimbursements must be submitted as separate invoices.",
  },
];

/* ───────── Helper Components ───────── */
function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 bg-neo-dark-light hover:bg-neo-dark-light/80 px-3 py-1.5 rounded-lg text-sm transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 text-neo-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-neo-green">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-white/60">{label || "Copy"}</span>
        </>
      )}
    </button>
  );
}

function ShareButtons() {
  const shareText = `Use my code ${VOUCHER_CODE} to get NeoTaste!`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(REFERRAL_LINK);

  return (
    <div className="flex gap-2">
      <a
        href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-lg bg-[#25D366]/20 flex items-center justify-center hover:bg-[#25D366]/30 transition-colors"
        title="Share on WhatsApp"
      >
        <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        title="Share on Twitter"
      >
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <button
        onClick={() => {
          const url = `https://www.instagram.com/`;
          window.open(url, "_blank");
        }}
        className="w-9 h-9 rounded-lg bg-[#E1306C]/20 flex items-center justify-center hover:bg-[#E1306C]/30 transition-colors"
        title="Share on Instagram"
      >
        <svg className="w-4 h-4 text-[#E1306C]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      </button>
      <CopyButton text={REFERRAL_LINK} label="Copy" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return status === "paid" ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neo-green/20 text-neo-green">
      <span className="w-1.5 h-1.5 rounded-full bg-neo-green" />
      Paid
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
      Pending
    </span>
  );
}

function InvoiceFAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-neo-dark-light rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-neo-dark-light/50 transition-colors"
      >
        <span className="font-medium text-white text-sm">{q}</span>
        <svg
          className={`w-4 h-4 text-neo-green shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 text-white/60 text-sm leading-relaxed">{a}</div>
      )}
    </div>
  );
}

/* ───────── Bar Chart ───────── */
function BarChart() {
  const maxCount = Math.max(...monthlyReferrals.map((m) => m.count));

  return (
    <div className="flex items-end gap-4 h-48">
      {monthlyReferrals.map((m) => (
        <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
          <span className="text-xs text-white/60">{m.count}</span>
          <div
            className="w-full bg-neo-green rounded-t-lg transition-all"
            style={{ height: `${(m.count / maxCount) * 140}px` }}
          />
          <span className="text-xs text-white/40">{m.month}</span>
        </div>
      ))}
    </div>
  );
}

/* ───────── Dashboard Tabs ───────── */

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Voucher Code Card */}
      <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
        <h3 className="text-sm text-white/50 mb-3">Your Voucher Code</h3>
        <div className="flex items-center justify-between mb-4">
          <code className="text-3xl font-bold text-neo-green tracking-wider">
            {VOUCHER_CODE}
          </code>
          <CopyButton text={VOUCHER_CODE} label="Copy Code" />
        </div>
        <div className="border-t border-neo-dark-light pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-white/40 mb-1">Referral Link</p>
              <p className="text-sm text-white/70 break-all">{REFERRAL_LINK}</p>
            </div>
            <ShareButtons />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/50">Code Uses</span>
            <div className="w-8 h-8 rounded-lg bg-neo-green/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-neo-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold">47</div>
        </div>

        <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/50">Paying Subscribers</span>
            <div className="w-8 h-8 rounded-lg bg-neo-green/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-neo-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold">32</div>
        </div>

        <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/50">Your Earnings</span>
            <div className="w-8 h-8 rounded-lg bg-neo-green/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-neo-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold">£1,175</div>
          <div className="flex gap-3 mt-1 text-xs">
            <span className="text-neo-green">£975 paid</span>
            <span className="text-yellow-400">£200 pending</span>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-6">Monthly Referrals</h3>
        <BarChart />
      </div>

      {/* Payment History */}
      <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Payment History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neo-dark-light text-left text-white/40">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Referrals</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.map((p) => (
                <tr key={p.date} className="border-b border-neo-dark-light/50">
                  <td className="py-3 text-white/70">{p.date}</td>
                  <td className="py-3">{p.referrals}</td>
                  <td className="py-3 font-medium">£{p.amount}</td>
                  <td className="py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoicing & Expenses */}
      <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Invoicing & Expenses</h3>
        <div className="bg-neo-green/10 border border-neo-green/30 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-neo-green mb-2">
            Send invoices to:
          </p>
          <p className="text-sm text-white/80 leading-relaxed">
            Modash OÜ
            <br />
            Telliskivi 60a
            <br />
            10412 Tallinn, Estonia
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {invoiceFAQ.map((item) => (
            <InvoiceFAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PayoutsTab() {
  const totalPaid = paymentHistory
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = paymentHistory
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
          <p className="text-sm text-white/50 mb-1">Total Earnings</p>
          <p className="text-2xl font-bold">
            £{(totalPaid + totalPending).toLocaleString()}
          </p>
        </div>
        <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
          <p className="text-sm text-white/50 mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-neo-green">
            £{totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
          <p className="text-sm text-white/50 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">
            £{totalPending.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Full Table */}
      <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">All Payments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neo-dark-light text-left text-white/40">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Referrals</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.map((p) => (
                <tr key={p.date} className="border-b border-neo-dark-light/50">
                  <td className="py-3 text-white/70">{p.date}</td>
                  <td className="py-3">{p.referrals}</td>
                  <td className="py-3 font-medium">£{p.amount}</td>
                  <td className="py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ───────── Dashboard Page ───────── */
export default function DashboardPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"overview" | "videos" | "invoices" | "payouts">("overview");
  const [invoicePrefill, setInvoicePrefill] = useState<{ videoTitle: string; videoId: string } | null>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!data.session) {
          router.replace("/login");
        } else {
          setAuthed(true);
          setChecking(false);
        }
      })
      .catch(() => {
        router.replace("/login");
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (checking || !authed) {
    return (
      <div className="min-h-screen bg-neo-dark flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-neo-green/30 border-t-neo-green rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "videos" as const, label: "Videos" },
    { key: "invoices" as const, label: "Invoices" },
    { key: "payouts" as const, label: "Payouts" },
  ];

  return (
    <div className="min-h-screen bg-neo-dark text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-neo-dark/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-16 flex items-center justify-between">
            <Link href="/">
              <NeoTasteLogo className="h-7 w-auto" />
            </Link>
            <div className="flex items-center gap-5">
              <Link
                href="/nudges"
                className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Nudges
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-neo-green text-neo-green"
                    : "border-transparent text-white/50 hover:text-white/80"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {tab === "overview" && <OverviewTab />}
        {tab === "videos" && (
          <VideosTab
            onNavigateToInvoices={(prefill) => {
              setInvoicePrefill(prefill);
              setTab("invoices");
            }}
          />
        )}
        {tab === "invoices" && (
          <InvoicesTab
            prefill={invoicePrefill}
            onPrefillConsumed={() => setInvoicePrefill(null)}
          />
        )}
        {tab === "payouts" && <PayoutsTab />}
      </main>
    </div>
  );
}
