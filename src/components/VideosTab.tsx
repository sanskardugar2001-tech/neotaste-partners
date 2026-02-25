"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Video, VideoStatus } from "@/lib/supabase";

const DEMO_CREATOR_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

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
    pending: "Pending Review",
    approved: "Approved",
    rejected: "Changes Requested",
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

/* ───────── Submit Form ───────── */
function SubmitVideoForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [useUpload, setUseUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!useUpload && !videoUrl.trim()) {
      setError("Please paste a video link or switch to file upload.");
      return;
    }
    if (useUpload && !file) {
      setError("Please select a video file to upload.");
      return;
    }
    if (
      useUpload &&
      file &&
      !file.type.startsWith("video/") &&
      !file.name.match(/\.(mp4|mov)$/i)
    ) {
      setError("Only MP4 and MOV files are accepted.");
      return;
    }
    if (useUpload && file && file.size > 500 * 1024 * 1024) {
      setError("File size must be under 500MB.");
      return;
    }

    setSubmitting(true);

    try {
      let videoFileUrl: string | null = null;
      let finalVideoUrl = videoUrl.trim();

      if (useUpload && file) {
        const fileName = `${DEMO_CREATOR_ID}/${Date.now()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("videos")
          .upload(fileName, file, { contentType: file.type });

        if (uploadErr) {
          setError(`Upload failed: ${uploadErr.message}`);
          setSubmitting(false);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("videos").getPublicUrl(fileName);

        videoFileUrl = publicUrl;
        finalVideoUrl = publicUrl;
      }

      const { error: insertErr } = await supabase.from("videos").insert({
        creator_id: DEMO_CREATOR_ID,
        title: title.trim(),
        video_url: finalVideoUrl,
        video_file_url: videoFileUrl,
        description: description.trim() || null,
        status: "pending",
      });

      if (insertErr) {
        setError(`Failed to submit: ${insertErr.message}`);
        setSubmitting(false);
        return;
      }

      onSubmitted();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm text-white/70 mb-1.5">
          Video Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='e.g. "February NeoTaste Review"'
          className="w-full bg-neo-dark border border-neo-dark-light rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-neo-green focus:outline-none transition-colors"
        />
      </div>

      {/* Link vs Upload toggle */}
      <div>
        <label className="block text-sm text-white/70 mb-2">Video Source *</label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setUseUpload(false)}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              !useUpload
                ? "bg-neo-green text-neo-dark"
                : "bg-neo-dark border border-neo-dark-light text-white/70 hover:border-neo-green/40"
            }`}
          >
            Paste Link
          </button>
          <button
            type="button"
            onClick={() => setUseUpload(true)}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              useUpload
                ? "bg-neo-green text-neo-dark"
                : "bg-neo-dark border border-neo-dark-light text-white/70 hover:border-neo-green/40"
            }`}
          >
            Upload File
          </button>
        </div>

        {!useUpload ? (
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Paste your WeTransfer, Google Drive, TikTok, or Instagram link"
            className="w-full bg-neo-dark border border-neo-dark-light rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-neo-green focus:outline-none transition-colors"
          />
        ) : (
          <div>
            <input
              type="file"
              accept="video/mp4,video/quicktime,.mp4,.mov"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-white/60 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-neo-dark-light file:text-white hover:file:bg-neo-dark-light/80 file:cursor-pointer file:transition-colors"
            />
            <p className="text-xs text-white/30 mt-1">
              MP4 or MOV, max 500MB
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-white/70 mb-1.5">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Any notes about this video..."
          className="w-full bg-neo-dark border border-neo-dark-light rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-neo-green focus:outline-none transition-colors resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-neo-green text-neo-dark py-3 rounded-xl font-semibold hover:bg-neo-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting..." : "Submit Video"}
      </button>
    </form>
  );
}

/* ───────── Resubmit Form (for rejected videos) ───────── */
function ResubmitForm({
  video,
  onDone,
}: {
  video: Video;
  onDone: () => void;
}) {
  const [videoUrl, setVideoUrl] = useState(video.video_url);
  const [useUpload, setUseUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleResubmit = async () => {
    setError("");

    if (!useUpload && !videoUrl.trim()) {
      setError("Please paste a video link.");
      return;
    }
    if (useUpload && !file) {
      setError("Please select a file.");
      return;
    }

    setSubmitting(true);

    try {
      let videoFileUrl: string | null = video.video_file_url;
      let finalVideoUrl = videoUrl.trim();

      if (useUpload && file) {
        const fileName = `${DEMO_CREATOR_ID}/${Date.now()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("videos")
          .upload(fileName, file, { contentType: file.type });

        if (uploadErr) {
          setError(`Upload failed: ${uploadErr.message}`);
          setSubmitting(false);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("videos").getPublicUrl(fileName);

        videoFileUrl = publicUrl;
        finalVideoUrl = publicUrl;
      }

      const { error: updateErr } = await supabase
        .from("videos")
        .update({
          video_url: finalVideoUrl,
          video_file_url: videoFileUrl,
          status: "pending",
          admin_comment: null,
          reviewed_at: null,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", video.id);

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
    <div className="mt-4 p-4 bg-neo-dark rounded-xl space-y-3">
      <p className="text-sm font-medium text-white/80">Resubmit Video</p>

      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setUseUpload(false)}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            !useUpload
              ? "bg-neo-green text-neo-dark"
              : "bg-neo-dark-card border border-neo-dark-light text-white/70"
          }`}
        >
          Paste Link
        </button>
        <button
          type="button"
          onClick={() => setUseUpload(true)}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            useUpload
              ? "bg-neo-green text-neo-dark"
              : "bg-neo-dark-card border border-neo-dark-light text-white/70"
          }`}
        >
          Upload File
        </button>
      </div>

      {!useUpload ? (
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Paste your updated video link"
          className="w-full bg-neo-dark-card border border-neo-dark-light rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-neo-green focus:outline-none"
        />
      ) : (
        <input
          type="file"
          accept="video/mp4,video/quicktime,.mp4,.mov"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-xs text-white/60 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-neo-dark-light file:text-white file:cursor-pointer"
        />
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        onClick={handleResubmit}
        disabled={submitting}
        className="bg-neo-green text-neo-dark px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Resubmitting..." : "Resubmit"}
      </button>
    </div>
  );
}

/* ───────── Main Tab ───────── */
export default function VideosTab({
  onNavigateToInvoices,
}: {
  onNavigateToInvoices?: (prefill: { videoTitle: string; videoId: string }) => void;
}) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [resubmitId, setResubmitId] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("creator_id", DEMO_CREATOR_ID)
      .order("submitted_at", { ascending: false });

    if (!error && data) {
      setVideos(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-neo-green/30 border-t-neo-green rounded-full animate-spin" />
      </div>
    );
  }

  const pendingVideo = videos.find((v) => v.status === "pending");
  const rejectedVideo = videos.find((v) => v.status === "rejected");
  const approvedVideos = videos.filter((v) => v.status === "approved");
  const canSubmitNew = !pendingVideo && !rejectedVideo;

  const handleExpenseInvoice = async (video: Video) => {
    if (onNavigateToInvoices) {
      onNavigateToInvoices({
        videoTitle: video.title,
        videoId: video.id,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Info card */}
      <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-neo-green/20 flex items-center justify-center shrink-0 mt-0.5">
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-white/70">
              Submit your video content for review. Once approved, you can submit a
              food expense invoice for that shoot. You can only have{" "}
              <span className="text-white font-medium">one video pending review</span>{" "}
              at a time.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Video */}
      {pendingVideo && (
        <div className="bg-neo-dark-card border border-yellow-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold">Video Under Review</h3>
          </div>

          <div className="bg-neo-dark rounded-xl p-4 mb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{pendingVideo.title}</span>
                  <VideoStatusBadge status="pending" />
                </div>
                {pendingVideo.description && (
                  <p className="text-sm text-white/50 mt-1">
                    {pendingVideo.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                  <span>
                    Submitted{" "}
                    {new Date(pendingVideo.submitted_at).toLocaleDateString()}
                  </span>
                  <a
                    href={pendingVideo.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neo-green hover:underline"
                  >
                    View Video
                  </a>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-yellow-400/80">
            Your video is being reviewed by the NeoTaste team. You&apos;ll be
            notified once it&apos;s approved.
          </p>
        </div>
      )}

      {/* Rejected Video */}
      {rejectedVideo && (
        <div className="bg-neo-dark-card border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-red-400"
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
            <h3 className="text-lg font-semibold">Changes Requested</h3>
          </div>

          <div className="bg-neo-dark rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{rejectedVideo.title}</span>
              <VideoStatusBadge status="rejected" />
            </div>
            {rejectedVideo.description && (
              <p className="text-sm text-white/50 mt-1">
                {rejectedVideo.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
              <span>
                Submitted{" "}
                {new Date(rejectedVideo.submitted_at).toLocaleDateString()}
              </span>
              <a
                href={rejectedVideo.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neo-green hover:underline"
              >
                View Video
              </a>
            </div>
          </div>

          {rejectedVideo.admin_comment && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm text-red-400">
                <span className="font-semibold">Feedback: </span>
                {rejectedVideo.admin_comment}
              </p>
            </div>
          )}

          {resubmitId === rejectedVideo.id ? (
            <ResubmitForm
              video={rejectedVideo}
              onDone={() => {
                setResubmitId(null);
                fetchVideos();
              }}
            />
          ) : (
            <button
              onClick={() => setResubmitId(rejectedVideo.id)}
              className="bg-neo-green text-neo-dark px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-neo-green/90 transition-colors"
            >
              Resubmit Video
            </button>
          )}
        </div>
      )}

      {/* Submit New Form */}
      {canSubmitNew && (
        <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Submit New Video</h3>
          <SubmitVideoForm onSubmitted={fetchVideos} />
        </div>
      )}

      {/* Approved Videos */}
      {approvedVideos.length > 0 && (
        <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Approved Videos</h3>
          <div className="space-y-3">
            {approvedVideos.map((v) => (
              <div
                key={v.id}
                className="border border-neo-dark-light rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{v.title}</span>
                      <VideoStatusBadge status="approved" />
                    </div>
                    {v.description && (
                      <p className="text-xs text-white/50 truncate">
                        {v.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                      <span>
                        Approved{" "}
                        {v.reviewed_at
                          ? new Date(v.reviewed_at).toLocaleDateString()
                          : ""}
                      </span>
                      <a
                        href={v.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neo-green hover:underline"
                      >
                        View Video
                      </a>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {!v.invoice_submitted ? (
                      <button
                        onClick={() => handleExpenseInvoice(v)}
                        className="bg-neo-green/20 text-neo-green px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-neo-green/30 transition-colors"
                      >
                        Submit Expense Invoice
                      </button>
                    ) : (
                      <span className="text-xs text-white/30 flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Invoice Submitted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
