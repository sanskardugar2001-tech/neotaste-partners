"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { NeoTasteIcon } from "@/components/NeoTasteLogo";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) {
          router.replace("/dashboard");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        setChecking(false);
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      setLoading(false);
      return;
    }
    if (!voucherCode.trim()) {
      setError("Please enter your voucher code.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    // 1. Create Supabase Auth user
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    // Supabase returns user with empty identities if email already exists
    if (!authData.user || authData.user.identities?.length === 0) {
      setError("An account with this email already exists.");
      setLoading(false);
      return;
    }

    // 2. Insert row in creators table
    const { error: insertErr } = await supabase.from("creators").insert({
      id: authData.user.id,
      email,
      name: name.trim(),
      voucher_code: voucherCode.trim().toUpperCase(),
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        setError(
          "This email or voucher code is already registered. Try logging in instead."
        );
      } else {
        setError(`Failed to create profile: ${insertErr.message}`);
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-neo-dark flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-neo-green/30 border-t-neo-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neo-dark flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <NeoTasteIcon className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Create Your Account
        </h1>
        <p className="text-white/50 text-center text-sm mb-8">
          Set up your Creator Portal access
        </p>

        {success ? (
          <div className="space-y-4">
            <div className="bg-neo-green/10 border border-neo-green/30 rounded-xl px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-neo-green shrink-0"
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
                <p className="text-neo-green font-semibold text-sm">
                  Account created!
                </p>
              </div>
              <p className="text-sm text-white/70">
                Check your email to verify your account, then log in to your
                Creator Portal.
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full bg-neo-green text-neo-dark py-3 rounded-xl font-semibold text-center hover:bg-neo-green/90 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-neo-dark-card border border-neo-dark-light rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-neo-green focus:outline-none transition-colors"
                placeholder="Emma Smith"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-neo-dark-card border border-neo-dark-light rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-neo-green focus:outline-none transition-colors"
                placeholder="you@example.com"
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
                minLength={6}
                className="w-full bg-neo-dark-card border border-neo-dark-light rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-neo-green focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">
                Voucher Code
              </label>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                required
                className="w-full bg-neo-dark-card border border-neo-dark-light rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-neo-green focus:outline-none transition-colors uppercase"
                placeholder="EMMA25"
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
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        {!success && (
          <p className="text-center text-sm text-white/40 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-neo-green hover:underline font-medium"
            >
              Log in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
