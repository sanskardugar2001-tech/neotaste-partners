"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Invoice, InvoiceType, InvoiceStatus, Video } from "@/lib/supabase";
import { currencySymbol } from "@/lib/supabase";

const DEMO_CREATOR_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

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

function SubmitInvoiceForm({
  onSubmitted,
  prefill,
  eligibleVideos,
}: {
  onSubmitted: () => void;
  prefill: { videoTitle: string; videoId: string } | null;
  eligibleVideos: Video[];
}) {
  const [type, setType] = useState<InvoiceType>(
    prefill ? "food_expense" : "referral_payout"
  );
  const [currency, setCurrency] = useState<"GBP" | "EUR">("GBP");
  const [amount, setAmount] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [description, setDescription] = useState(
    prefill
      ? `Food & drinks expense for: ${prefill.videoTitle}`
      : ""
  );
  const [selectedVideoId, setSelectedVideoId] = useState<string>(
    prefill?.videoId || ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const hasFoodExpenseEligibility = eligibleVideos.length > 0;
  const foodExpenseBlocked = type === "food_expense" && !hasFoodExpenseEligibility;

  const handleTypeChange = (newType: InvoiceType) => {
    setType(newType);
    if (newType === "food_expense" && !hasFoodExpenseEligibility) {
      return;
    }
    if (newType === "referral_payout") {
      setSelectedVideoId("");
      if (description.startsWith("Food & drinks expense for:")) {
        setDescription("");
      }
    }
  };

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideoId(videoId);
    const video = eligibleVideos.find((v) => v.id === videoId);
    if (video) {
      setDescription(`Food & drinks expense for: ${video.title}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (type === "food_expense" && !hasFoodExpenseEligibility) {
      setError(
        "You need an approved video before submitting a food expense invoice. Go to the Videos tab to submit your content."
      );
      return;
    }
    if (type === "food_expense" && !selectedVideoId) {
      setError("Please select which approved video this expense is for.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!invoiceDate) {
      setError("Please select an invoice date.");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }
    if (!file) {
      setError("Please upload a PDF file.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }

    setSubmitting(true);

    try {
      const fileName = `${DEMO_CREATOR_ID}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("invoices")
        .upload(fileName, file, { contentType: "application/pdf" });

      if (uploadErr) {
        setError(`Upload failed: ${uploadErr.message}`);
        setSubmitting(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("invoices").getPublicUrl(fileName);

      const { error: insertErr } = await supabase.from("invoices").insert({
        creator_id: DEMO_CREATOR_ID,
        type,
        amount: parseFloat(amount),
        currency,
        description: description.trim(),
        invoice_date: invoiceDate,
        file_url: publicUrl,
        status: "pending",
      });

      if (insertErr) {
        setError(`Failed to submit invoice: ${insertErr.message}`);
        setSubmitting(false);
        return;
      }

      // Mark the video's invoice_submitted = true
      if (type === "food_expense" && selectedVideoId) {
        await supabase
          .from("videos")
          .update({ invoice_submitted: true })
          .eq("id", selectedVideoId);
      }

      setSuccess(true);
      setAmount("");
      setInvoiceDate("");
      setDescription("");
      setSelectedVideoId("");
      setFile(null);
      setType("referral_payout");
      const input = document.getElementById("invoice-file") as HTMLInputElement;
      if (input) input.value = "";
      onSubmitted();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type selector */}
      <div>
        <label className="block text-sm text-white/70 mb-2">Invoice Type</label>
        <div className="flex gap-2">
          {(
            [
              { key: "referral_payout", label: "Referral Payout" },
              { key: "food_expense", label: "Food & Drinks Expense" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleTypeChange(opt.key)}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                type === opt.key
                  ? "bg-neo-green text-neo-dark"
                  : "bg-neo-dark border border-neo-dark-light text-white/70 hover:border-neo-green/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Food expense restriction message */}
      {foodExpenseBlocked && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
          <p className="text-sm text-yellow-400">
            You need an approved video before submitting a food expense invoice.
            Go to the <span className="font-semibold">Videos</span> tab to submit
            your content.
          </p>
        </div>
      )}

      {/* Video selector for food expense */}
      {type === "food_expense" && hasFoodExpenseEligibility && (
        <div>
          <label className="block text-sm text-white/70 mb-1.5">
            For which video? *
          </label>
          <select
            value={selectedVideoId}
            onChange={(e) => handleVideoSelect(e.target.value)}
            className="w-full bg-neo-dark border border-neo-dark-light rounded-xl px-4 py-3 text-white focus:border-neo-green focus:outline-none transition-colors"
          >
            <option value="">Select a video...</option>
            {eligibleVideos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Amount + Currency + Date row */}
      {!foodExpenseBlocked && (
        <>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">
                Amount ({currencySymbol(currency)}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-neo-dark border border-neo-dark-light rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-neo-green focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">
                Currency
              </label>
              <div className="flex rounded-xl overflow-hidden border border-neo-dark-light h-[46px]">
                {(["GBP", "EUR"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`px-4 text-sm font-medium transition-colors ${
                      currency === c
                        ? "bg-neo-green text-neo-dark"
                        : "bg-neo-dark text-white/60 hover:text-white"
                    }`}
                  >
                    {c === "GBP" ? "£ GBP" : "€ EUR"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">
                Invoice Date *
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-neo-dark border border-neo-dark-light rounded-xl px-4 py-3 text-white focus:border-neo-green focus:outline-none transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-white/70 mb-1.5">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={
                type === "referral_payout"
                  ? "e.g. January 2024 referral payout — 12 conversions"
                  : "e.g. Restaurant visit for content shoot — receipt attached"
              }
              className="w-full bg-neo-dark border border-neo-dark-light rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-neo-green focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm text-white/70 mb-1.5">
              Invoice PDF *
            </label>
            <input
              id="invoice-file"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-white/60 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-neo-dark-light file:text-white hover:file:bg-neo-dark-light/80 file:cursor-pointer file:transition-colors"
            />
          </div>
        </>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-neo-green/10 border border-neo-green/30 rounded-xl px-4 py-3 text-neo-green text-sm">
          Invoice submitted successfully!
        </div>
      )}

      {!foodExpenseBlocked && (
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-neo-green text-neo-dark py-3 rounded-xl font-semibold hover:bg-neo-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Invoice"}
        </button>
      )}
    </form>
  );
}

function ReuploadForm({
  invoice,
  onDone,
}: {
  invoice: Invoice;
  onDone: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleReupload = async () => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const fileName = `${DEMO_CREATOR_ID}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("invoices")
        .upload(fileName, file, { contentType: "application/pdf" });

      if (uploadErr) {
        setError(`Upload failed: ${uploadErr.message}`);
        setSubmitting(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("invoices").getPublicUrl(fileName);

      const { error: updateErr } = await supabase
        .from("invoices")
        .update({
          file_url: publicUrl,
          status: "pending",
          admin_comment: null,
          reviewed_at: null,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", invoice.id);

      if (updateErr) {
        setError(`Update failed: ${updateErr.message}`);
        setSubmitting(false);
        return;
      }

      onDone();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 p-3 bg-neo-dark rounded-xl space-y-3">
      <p className="text-xs text-white/50">
        Upload a revised invoice to resubmit:
      </p>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="w-full text-xs text-white/60 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-neo-dark-light file:text-white file:cursor-pointer"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button
        onClick={handleReupload}
        disabled={!file || submitting}
        className="bg-neo-green text-neo-dark px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Uploading..." : "Resubmit"}
      </button>
    </div>
  );
}

export default function InvoicesTab({
  prefill,
  onPrefillConsumed,
}: {
  prefill?: { videoTitle: string; videoId: string } | null;
  onPrefillConsumed?: () => void;
}) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [eligibleVideos, setEligibleVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [reuploadId, setReuploadId] = useState<string | null>(null);
  const [activePrefill, setActivePrefill] = useState(prefill || null);

  // Consume prefill when it changes
  useEffect(() => {
    if (prefill) {
      setActivePrefill(prefill);
    }
  }, [prefill]);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);

    const [invoiceRes, videoRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("*")
        .eq("creator_id", DEMO_CREATOR_ID)
        .order("submitted_at", { ascending: false }),
      supabase
        .from("videos")
        .select("*")
        .eq("creator_id", DEMO_CREATOR_ID)
        .eq("status", "approved")
        .eq("invoice_submitted", false),
    ]);

    if (!invoiceRes.error && invoiceRes.data) {
      setInvoices(invoiceRes.data);
    }
    if (!videoRes.error && videoRes.data) {
      setEligibleVideos(videoRes.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleSubmitted = () => {
    setActivePrefill(null);
    onPrefillConsumed?.();
    fetchInvoices();
  };

  return (
    <div className="space-y-6">
      {/* Reminder + Invoice Address */}
      <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <svg
              className="w-4 h-4 text-yellow-400"
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
          <p className="text-sm text-white/70">
            Referral payouts and food expenses must be submitted as{" "}
            <span className="text-white font-medium">separate invoices</span>.
            Do not combine them.
          </p>
        </div>

        <div className="bg-neo-green/10 border border-neo-green/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-neo-green mb-1">
            Invoice addressed to:
          </p>
          <p className="text-sm text-white/80 leading-relaxed">
            Modash OÜ, Telliskivi 60a, 10412 Tallinn, Estonia
          </p>
        </div>
      </div>

      {/* Submit Invoice Form */}
      <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Submit New Invoice</h3>
        <SubmitInvoiceForm
          onSubmitted={handleSubmitted}
          prefill={activePrefill}
          eligibleVideos={eligibleVideos}
        />
      </div>

      {/* Invoice List */}
      <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Your Invoices</h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-neo-green/30 border-t-neo-green rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-8">
            No invoices submitted yet.
          </p>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="border border-neo-dark-light rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {inv.type === "referral_payout"
                          ? "Referral Payout"
                          : "Food & Drinks Expense"}
                      </span>
                      <InvoiceStatusBadge status={inv.status} />
                    </div>
                    <p className="text-xs text-white/50 truncate">
                      {inv.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                      <span>
                        {currencySymbol(inv.currency)}{Number(inv.amount).toFixed(2)}
                      </span>
                      <span>{inv.invoice_date}</span>
                      <a
                        href={inv.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neo-green hover:underline"
                      >
                        View PDF
                      </a>
                    </div>
                  </div>
                  <div className="text-right text-xs text-white/30 shrink-0">
                    {new Date(inv.submitted_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Declined comment */}
                {inv.status === "declined" && inv.admin_comment && (
                  <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-red-400">
                      <span className="font-medium">Reason: </span>
                      {inv.admin_comment}
                    </p>
                  </div>
                )}

                {/* Re-upload for declined */}
                {inv.status === "declined" && (
                  <>
                    {reuploadId === inv.id ? (
                      <ReuploadForm
                        invoice={inv}
                        onDone={() => {
                          setReuploadId(null);
                          fetchInvoices();
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => setReuploadId(inv.id)}
                        className="mt-3 text-xs text-neo-green hover:underline"
                      >
                        Upload revised invoice
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
