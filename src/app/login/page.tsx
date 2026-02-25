"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { NeoTasteIcon } from "@/components/NeoTasteLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

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

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
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
          Creator Portal
        </h1>
        <p className="text-white/50 text-center text-sm mb-8">
          Sign in to access your dashboard
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

        <p className="text-center text-sm text-white/40 mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-neo-green hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
