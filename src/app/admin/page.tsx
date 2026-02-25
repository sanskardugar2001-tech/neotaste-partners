"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type {
  InvoiceWithCreator,
  InvoiceStatus,
  InvoiceType,
  VideoWithCreator,
  VideoStatus,
} from "@/lib/supabase";
import { currencySymbol } from "@/lib/supabase";
import { NeoTasteIcon } from "@/components/NeoTasteLogo";

/* ═══════════════════════════════════════════
   LOGIN
   ═══════════════════════════════════════════ */
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    onLogin();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neo-dark flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <NeoTasteIcon className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Admin Portal
        </h1>
        <p className="text-white/50 text-center text-sm mb-8">
          Sign in to manage creator invoices &amp; videos
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-neo-dark-card border border-neo-dark-light rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-neo-green focus:outline-none transition-colors"
              placeholder="admin@neotaste.app"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-neo-dark-card border border-neo-dark-light rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-neo-green focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neo-green text-neo-dark py-3 rounded-xl font-semibold hover:bg-neo-green/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SHARED: Status Badges
   ═══════════════════════════════════════════ */

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const styles: Record<InvoiceStatus, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    approved: "bg-neo-green/20 text-neo-green",
    declined: "bg-red-500/20 text-red-400",
  };
  const dots: Record<InvoiceStatus, string> = {
    pending: "bg-yellow-400",
    approved: "bg-neo-green",
    declined: "bg-red-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function VideoStatusBadge({ status }: { status: VideoStatus }) {
  const styles: Record<VideoStatus, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    approved: "bg-neo-green/20 text-neo-green",
    rejected: "bg-red-500/20 text-red-400",
  };
  const dots: Record<VideoStatus, string> = {
    pending: "bg-yellow-400",
    approved: "bg-neo-green",
    rejected: "bg-red-400",
  };
  const labels: Record<VideoStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {labels[status]}
    </span>
  );
}

/* ═══════════════════════════════════════════
   INVOICES SECTION
   ═══════════════════════════════════════════ */

function InvoicesSection() {
  const [invoices, setInvoices] = useState<InvoiceWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "all">("all");
  const [filterType, setFilterType] = useState<InvoiceType | "all">("all");
  const [filterName, setFilterName] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineComment, setDeclineComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("invoices")
      .select("*, creators(id, name, email, voucher_code)")
      .order("submitted_at", { ascending: false });

    if (filterStatus !== "all") query = query.eq("status", filterStatus);
    if (filterType !== "all") query = query.eq("type", filterType);
    if (filterDateFrom) query = query.gte("invoice_date", filterDateFrom);
    if (filterDateTo) query = query.lte("invoice_date", filterDateTo);

    const { data, error } = await query;

    if (!error && data) {
      let filtered = data as unknown as InvoiceWithCreator[];
      if (filterName.trim()) {
        const search = filterName.toLowerCase();
        filtered = filtered.filter(
          (inv) =>
            inv.creators?.name?.toLowerCase().includes(search) ||
            inv.creators?.email?.toLowerCase().includes(search)
        );
      }
      setInvoices(filtered);
    }
    setLoading(false);
  }, [filterStatus, filterType, filterName, filterDateFrom, filterDateTo]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    const { error } = await supabase
      .from("invoices")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        admin_comment: null,
      })
      .eq("id", id);

    if (!error) {
      fetchInvoices();
      setExpandedId(null);
    }
    setActionLoading(false);
  };

  const handleDecline = async (id: string) => {
    if (!declineComment.trim()) return;
    setActionLoading(true);
    const { error } = await supabase
      .from("invoices")
      .update({
        status: "declined",
        reviewed_at: new Date().toISOString(),
        admin_comment: declineComment.trim(),
      })
      .eq("id", id);

    if (!error) {
      setDecliningId(null);
      setDeclineComment("");
      fetchInvoices();
      setExpandedId(null);
    }
    setActionLoading(false);
  };

  const totalCount = invoices.length;
  const pendingCount = invoices.filter((i) => i.status === "pending").length;
  const approvedCount = invoices.filter((i) => i.status === "approved").length;
  const declinedCount = invoices.filter((i) => i.status === "declined").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Invoices", value: totalCount, color: "text-white" },
          { label: "Pending", value: pendingCount, color: "text-yellow-400" },
          { label: "Approved", value: approvedCount, color: "text-neo-green" },
          { label: "Declined", value: declinedCount, color: "text-red-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-5"
          >
            <p className="text-sm text-white/50 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Search creator..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="bg-neo-dark border border-neo-dark-light rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-neo-green focus:outline-none"
          />
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as InvoiceStatus | "all")
            }
            className="bg-neo-dark border border-neo-dark-light rounded-xl px-3 py-2 text-sm text-white focus:border-neo-green focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
          </select>
          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as InvoiceType | "all")
            }
            className="bg-neo-dark border border-neo-dark-light rounded-xl px-3 py-2 text-sm text-white focus:border-neo-green focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="referral_payout">Referral Payout</option>
            <option value="food_expense">Food Expense</option>
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="bg-neo-dark border border-neo-dark-light rounded-xl px-3 py-2 text-sm text-white focus:border-neo-green focus:outline-none [color-scheme:dark]"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="bg-neo-dark border border-neo-dark-light rounded-xl px-3 py-2 text-sm text-white focus:border-neo-green focus:outline-none [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-neo-green/30 border-t-neo-green rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-16">
            No invoices found.
          </p>
        ) : (
          <div className="divide-y divide-neo-dark-light">
            {invoices.map((inv) => (
              <div key={inv.id}>
                <button
                  onClick={() =>
                    setExpandedId(expandedId === inv.id ? null : inv.id)
                  }
                  className="w-full text-left px-6 py-4 hover:bg-neo-dark-light/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm">
                          {inv.creators?.name || "Unknown"}
                        </span>
                        <InvoiceStatusBadge status={inv.status} />
                      </div>
                      <p className="text-xs text-white/40">
                        {inv.creators?.email}
                      </p>
                    </div>
                    <div className="text-sm text-white/70">
                      {inv.type === "referral_payout"
                        ? "Referral"
                        : "Food Expense"}
                    </div>
                    <div className="text-sm font-medium w-20 text-right">
                      {currencySymbol(inv.currency)}
                      {Number(inv.amount).toFixed(2)}
                    </div>
                    <div className="text-xs text-white/40 w-24 text-right">
                      {inv.invoice_date}
                    </div>
                    <div className="text-xs text-white/30 w-24 text-right">
                      {new Date(inv.submitted_at).toLocaleDateString()}
                    </div>
                    <svg
                      className={`w-4 h-4 text-white/30 shrink-0 transition-transform ${
                        expandedId === inv.id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {expandedId === inv.id && (
                  <div className="px-6 pb-5 bg-neo-dark/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-white/40 text-xs mb-0.5">Creator</p>
                        <p className="font-medium">{inv.creators?.name}</p>
                        <p className="text-xs text-white/50">
                          {inv.creators?.voucher_code}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs mb-0.5">Type</p>
                        <p>
                          {inv.type === "referral_payout"
                            ? "Referral Payout"
                            : "Food & Drinks Expense"}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs mb-0.5">Amount</p>
                        <p className="font-medium">
                          {currencySymbol(inv.currency)}
                          {Number(inv.amount).toFixed(2)} {inv.currency}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs mb-0.5">Reviewed</p>
                        <p>
                          {inv.reviewed_at
                            ? new Date(inv.reviewed_at).toLocaleString()
                            : "Not yet"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-white/40 text-xs mb-0.5">
                        Description
                      </p>
                      <p className="text-sm text-white/80">{inv.description}</p>
                    </div>

                    {inv.admin_comment && (
                      <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <p className="text-xs text-red-400">
                          <span className="font-medium">Admin comment: </span>
                          {inv.admin_comment}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <a
                        href={inv.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-neo-dark-light hover:bg-neo-dark-light/80 px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        View / Download PDF
                      </a>

                      {inv.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(inv.id)}
                            disabled={actionLoading}
                            className="bg-neo-green text-neo-dark px-4 py-2 rounded-lg text-sm font-semibold hover:bg-neo-green/90 transition-colors disabled:opacity-50"
                          >
                            {actionLoading ? "..." : "Approve"}
                          </button>

                          {decliningId === inv.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={declineComment}
                                onChange={(e) =>
                                  setDeclineComment(e.target.value)
                                }
                                placeholder="Reason for declining (required)..."
                                className="flex-1 bg-neo-dark border border-red-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-400"
                                autoFocus
                              />
                              <button
                                onClick={() => handleDecline(inv.id)}
                                disabled={
                                  actionLoading || !declineComment.trim()
                                }
                                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => {
                                  setDecliningId(null);
                                  setDeclineComment("");
                                }}
                                className="text-white/40 hover:text-white text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDecliningId(inv.id)}
                              className="border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/10 transition-colors"
                            >
                              Decline
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   VIDEOS SECTION
   ═══════════════════════════════════════════ */

function VideosSection() {
  const [videos, setVideos] = useState<VideoWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<VideoStatus | "all">("all");
  const [filterName, setFilterName] = useState("");

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVideos = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("videos")
      .select("*, creators(id, name, email, voucher_code)")
      .order("submitted_at", { ascending: false });

    if (filterStatus !== "all") query = query.eq("status", filterStatus);

    const { data, error } = await query;

    if (!error && data) {
      let filtered = data as unknown as VideoWithCreator[];
      if (filterName.trim()) {
        const search = filterName.toLowerCase();
        filtered = filtered.filter(
          (v) =>
            v.creators?.name?.toLowerCase().includes(search) ||
            v.creators?.email?.toLowerCase().includes(search) ||
            v.title?.toLowerCase().includes(search)
        );
      }
      setVideos(filtered);
    }
    setLoading(false);
  }, [filterStatus, filterName]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    const { error } = await supabase
      .from("videos")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        admin_comment: null,
      })
      .eq("id", id);

    if (!error) {
      fetchVideos();
      setExpandedId(null);
    }
    setActionLoading(false);
  };

  const handleReject = async (id: string) => {
    if (!rejectComment.trim()) return;
    setActionLoading(true);
    const { error } = await supabase
      .from("videos")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        admin_comment: rejectComment.trim(),
      })
      .eq("id", id);

    if (!error) {
      setRejectingId(null);
      setRejectComment("");
      fetchVideos();
      setExpandedId(null);
    }
    setActionLoading(false);
  };

  const totalCount = videos.length;
  const pendingCount = videos.filter((v) => v.status === "pending").length;
  const approvedCount = videos.filter((v) => v.status === "approved").length;
  const rejectedCount = videos.filter((v) => v.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Videos", value: totalCount, color: "text-white" },
          { label: "Pending", value: pendingCount, color: "text-yellow-400" },
          { label: "Approved", value: approvedCount, color: "text-neo-green" },
          { label: "Rejected", value: rejectedCount, color: "text-red-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-5"
          >
            <p className="text-sm text-white/50 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-5">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Search creator or title..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="bg-neo-dark border border-neo-dark-light rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-neo-green focus:outline-none"
          />
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as VideoStatus | "all")
            }
            className="bg-neo-dark border border-neo-dark-light rounded-xl px-3 py-2 text-sm text-white focus:border-neo-green focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Video List */}
      <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-neo-green/30 border-t-neo-green rounded-full animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-16">
            No videos found.
          </p>
        ) : (
          <div className="divide-y divide-neo-dark-light">
            {videos.map((v) => (
              <div key={v.id}>
                <button
                  onClick={() =>
                    setExpandedId(expandedId === v.id ? null : v.id)
                  }
                  className="w-full text-left px-6 py-4 hover:bg-neo-dark-light/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm">
                          {v.creators?.name || "Unknown"}
                        </span>
                        <VideoStatusBadge status={v.status} />
                      </div>
                      <p className="text-xs text-white/40">{v.title}</p>
                    </div>
                    <div className="text-xs text-white/40 w-28 text-right">
                      {new Date(v.submitted_at).toLocaleDateString()}
                    </div>
                    <svg
                      className={`w-4 h-4 text-white/30 shrink-0 transition-transform ${
                        expandedId === v.id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {expandedId === v.id && (
                  <div className="px-6 pb-5 bg-neo-dark/50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-white/40 text-xs mb-0.5">Creator</p>
                        <p className="font-medium">{v.creators?.name}</p>
                        <p className="text-xs text-white/50">
                          {v.creators?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs mb-0.5">Title</p>
                        <p className="font-medium">{v.title}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs mb-0.5">
                          Reviewed
                        </p>
                        <p>
                          {v.reviewed_at
                            ? new Date(v.reviewed_at).toLocaleString()
                            : "Not yet"}
                        </p>
                      </div>
                    </div>

                    {v.description && (
                      <div className="mb-4">
                        <p className="text-white/40 text-xs mb-0.5">
                          Description
                        </p>
                        <p className="text-sm text-white/80">{v.description}</p>
                      </div>
                    )}

                    {/* Video preview / link */}
                    <div className="mb-4">
                      <p className="text-white/40 text-xs mb-1.5">
                        Video
                      </p>
                      {v.video_file_url ? (
                        <div className="rounded-xl overflow-hidden bg-black max-w-lg">
                          <video
                            src={v.video_file_url}
                            controls
                            className="w-full max-h-64"
                          />
                        </div>
                      ) : (
                        <a
                          href={v.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-neo-dark-light hover:bg-neo-dark-light/80 px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          <svg
                            className="w-4 h-4 text-neo-green"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          Open Video Link
                        </a>
                      )}
                    </div>

                    {v.admin_comment && (
                      <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <p className="text-xs text-red-400">
                          <span className="font-medium">Admin comment: </span>
                          {v.admin_comment}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
                      <span>
                        Invoice submitted:{" "}
                        {v.invoice_submitted ? (
                          <span className="text-neo-green">Yes</span>
                        ) : (
                          <span className="text-white/50">No</span>
                        )}
                      </span>
                    </div>

                    {v.status === "pending" && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleApprove(v.id)}
                          disabled={actionLoading}
                          className="bg-neo-green text-neo-dark px-4 py-2 rounded-lg text-sm font-semibold hover:bg-neo-green/90 transition-colors disabled:opacity-50"
                        >
                          {actionLoading ? "..." : "Approve"}
                        </button>

                        {rejectingId === v.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={rejectComment}
                              onChange={(e) =>
                                setRejectComment(e.target.value)
                              }
                              placeholder="Reason for rejection (required)..."
                              className="flex-1 bg-neo-dark border border-red-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-400"
                              autoFocus
                            />
                            <button
                              onClick={() => handleReject(v.id)}
                              disabled={
                                actionLoading || !rejectComment.trim()
                              }
                              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => {
                                setRejectingId(null);
                                setRejectComment("");
                              }}
                              className="text-white/40 hover:text-white text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRejectingId(v.id)}
                            className="border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/10 transition-colors"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ADMIN DASHBOARD (Tabbed)
   ═══════════════════════════════════════════ */

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"invoices" | "videos">("invoices");

  return (
    <div className="min-h-screen bg-neo-dark text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-neo-dark/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NeoTasteIcon className="h-8 w-8" />
              <span className="font-semibold text-lg">Admin</span>
            </div>
            <button
              onClick={onLogout}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1">
            {(
              [
                { key: "invoices" as const, label: "Invoices" },
                { key: "videos" as const, label: "Videos" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === t.key
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "invoices" && <InvoicesSection />}
        {activeTab === "videos" && <VideosSection />}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════ */
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [connError, setConnError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setChecking(false);
      setConnError(
        "Connection timed out. Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correct in .env.local and restart the dev server."
      );
    }, 8000);

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        clearTimeout(timeout);
        if (error) {
          console.error("Supabase getSession error:", error);
          setConnError(error.message);
          setChecking(false);
          return;
        }
        setAuthed(!!data.session);
        setChecking(false);
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.error("Supabase connection failed:", err);
        setConnError(
          err instanceof Error ? err.message : "Failed to connect to Supabase"
        );
        setChecking(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthed(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-neo-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-neo-green/30 border-t-neo-green rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Connecting to Supabase...</p>
        </div>
      </div>
    );
  }

  if (connError) {
    return (
      <div className="min-h-screen bg-neo-dark flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Connection Error
          </h2>
          <p className="text-red-400 text-sm mb-4">{connError}</p>
          <p className="text-white/40 text-xs mb-6">
            Make sure your Supabase project is active, the API keys in .env.local
            are correct, and you&apos;ve restarted the dev server after changing
            environment variables.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-neo-green text-neo-dark px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-neo-green/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!authed) {
    return <LoginForm onLogin={() => setAuthed(true)} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
