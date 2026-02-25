"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { NeoTasteLogo } from "@/components/NeoTasteLogo";

/* ───────── FAQ Data ───────── */
const faqItems = [
  {
    q: "How do I join?",
    a: "Fill out the application form on this page. Once approved, you'll receive your unique creator code and access to your personal dashboard where you can track everything.",
  },
  {
    q: "Where do I find my links & creatives?",
    a: "All your referral links, creative assets, and promotional materials are available in your creator dashboard after approval.",
  },
  {
    q: "What's the revenue share?",
    a: "You earn £25 per subscription when someone uses your code, completes the free trial, and converts to an annual subscription.",
  },
  {
    q: "When do I get paid?",
    a: "Payments are processed monthly via Modash. You'll need to send a monthly invoice to receive your earnings.",
  },
  {
    q: "Is there a minimum or maximum payout?",
    a: "There is no minimum or maximum payout. Our top referrer has earned over £80,000 through the program.",
  },
  {
    q: "Are there any deliverables?",
    a: "No deliverables at all! There are no content requirements or posting schedules. You can promote NeoTaste however you want, whenever you want.",
  },
  {
    q: "How do I get free access?",
    a: "After your application is approved, you'll receive a special personal-use code that gives you free access to NeoTaste for your own dining experiences.",
  },
  {
    q: "Creator code vs in-app referrals?",
    a: "Your creator code is specifically for sharing with your audience and tracking your referrals. In-app referrals are a separate system for regular users and are not connected to your creator earnings.",
  },
  {
    q: "Food expense for shoots?",
    a: "Food expenses are not covered for your first 2 videos. After that, you can claim up to £50 per shoot by submitting an invoice with a photo of your receipt.",
  },
];

/* ───────── Testimonials ───────── */
const testimonials = [
  {
    name: "Sarah K.",
    handle: "@sarahfoodie",
    text: "NeoTaste's creator program changed my content game. I was earning within the first week and the dashboard makes tracking so easy!",
  },
  {
    name: "James L.",
    handle: "@jamescityeats",
    text: "No deliverables, no pressure. I just share what I love and the earnings keep coming in. Best partnership I've ever had.",
  },
  {
    name: "Mia R.",
    handle: "@miatastesworld",
    text: "Hit 200 subscribers in my first month. The £25 per sub really adds up. Plus, they cover food expenses after your first two videos!",
  },
];

/* ───────── How It Works ───────── */
const steps = [
  {
    num: "01",
    title: "Apply",
    desc: "Fill out the application form and tell us about your content.",
  },
  {
    num: "02",
    title: "Get Your Code",
    desc: "Receive your unique creator code and dashboard access.",
  },
  {
    num: "03",
    title: "Share & Promote",
    desc: "Share your code with your audience however you like — no rules.",
  },
  {
    num: "04",
    title: "Dashboard & Payments",
    desc: "Track referrals in real-time and get paid monthly via Modash.",
  },
];

/* ───────── Benefits ───────── */
const benefits = [
  {
    icon: "👥",
    title: "No Follower Minimum",
    desc: "We welcome creators of all sizes. Quality content matters more than follower counts.",
  },
  {
    icon: "📊",
    title: "Real-time Dashboard",
    desc: "Track your referrals, earnings, and performance metrics in real-time.",
  },
  {
    icon: "💰",
    title: "Monthly Payouts",
    desc: "Get paid every month via Modash. No waiting around for your earnings.",
  },
  {
    icon: "🎨",
    title: "Creative Assets",
    desc: "Access branded templates, logos, and promotional materials in your dashboard.",
  },
  {
    icon: "🚫",
    title: "No Deliverables",
    desc: "Zero content requirements or posting schedules. Promote however you want.",
  },
  {
    icon: "🍽️",
    title: "Food Expenses Covered",
    desc: "After your first 2 videos, claim up to £50 per shoot with receipt.",
  },
];

/* ───────── Stats ───────── */
const stats = [
  { value: "7,000+", label: "Partner Restaurants" },
  { value: "£25", label: "Per Subscription" },
  { value: "4", label: "Countries Active" },
  { value: "£80K+", label: "Top Earner" },
];

/* ───────── Creator Videos ───────── */
const creatorVideos = [
  "https://drive.google.com/file/d/19PaY4-CzIDeZ4R5lo-E5Y9aNGU295Fo-/preview",
  "https://drive.google.com/file/d/1SmHP01TOy_hJNnh_GZ6fafF8yOjWSyV0/preview",
];

/* ───────── FAQ Accordion Item ───────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-neo-dark-light rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-neo-dark-light/50 transition-colors"
      >
        <span className="font-semibold text-white pr-4">{q}</span>
        <svg
          className={`w-5 h-5 text-neo-green shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 text-white/70 leading-relaxed">{a}</div>
      )}
    </div>
  );
}

/* ───────── HubSpot Form ───────── */
function HubSpotForm() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const createForm = () => {
      if (cancelled || !containerRef.current) return;
      containerRef.current.innerHTML = "";
      window.hbspt.forms.create({
        portalId: "143252643",
        formId: "cf31950e-fbe1-4143-bcb1-a91f49d5bda1",
        region: "eu1",
        target: "#hubspot-form-container",
        onFormSubmitted: () => {
          setSubmitted(true);
        },
      });
    };

    if (window.hbspt) {
      createForm();
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://js-eu1.hsforms.net/forms/embed/v2.js"]'
    );

    if (existingScript) {
      const interval = setInterval(() => {
        if (window.hbspt) {
          clearInterval(interval);
          createForm();
        }
      }, 100);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    const script = document.createElement("script");
    script.src = "https://js-eu1.hsforms.net/forms/embed/v2.js";
    script.async = true;
    script.onload = () => {
      const interval = setInterval(() => {
        if (window.hbspt) {
          clearInterval(interval);
          createForm();
        }
      }, 100);
      setTimeout(() => clearInterval(interval), 10000);
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, []);

  if (submitted) {
    return (
      <div className="bg-neo-dark-card border border-neo-green/30 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-neo-green/20 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-neo-green"
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
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Application submitted!
        </h3>
        <p className="text-white/60 mb-6">
          Now create your portal account to start submitting content and
          invoices.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-neo-green text-neo-dark px-8 py-3 rounded-xl font-semibold text-lg hover:bg-neo-green/90 transition-colors"
        >
          Create Portal Account
        </Link>
      </div>
    );
  }

  return (
    <div
      id="hubspot-form-container"
      ref={containerRef}
      className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-8 min-h-[200px]"
    />
  );
}

/* ───────── Landing Page ───────── */
export default function LandingPage() {
  const [subscribers, setSubscribers] = useState(50);
  const earnings = subscribers * 25;
  const annualEarnings = earnings * 12;

  return (
    <div className="min-h-screen bg-neo-dark text-white">
      {/* ─── Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neo-dark/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#">
            <NeoTasteLogo className="h-8 w-auto" />
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-white/70 hover:text-white transition-colors">
              How it works
            </a>
            <a href="#faq" className="text-sm text-white/70 hover:text-white transition-colors">
              FAQ
            </a>
            <Link href="/dashboard" className="text-sm text-white/70 hover:text-white transition-colors">
              Creator Portal
            </Link>
            <a
              href="#apply"
              className="bg-neo-green text-neo-dark px-5 py-2 rounded-lg font-semibold text-sm hover:bg-neo-green/90 transition-colors"
            >
              Become a Partner
            </a>
          </div>
          <a
            href="#apply"
            className="md:hidden bg-neo-green text-neo-dark px-4 py-2 rounded-lg font-semibold text-sm"
          >
            Apply
          </a>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-neo-green/10 border border-neo-green/30 rounded-full px-4 py-1.5 text-neo-green text-sm font-medium mb-6">
            Creator Partner Program
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-800 leading-tight mb-6">
            Earn{" "}
            <span className="text-neo-green">£25</span> for every
            <br />
            NeoTaste subscriber
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10">
            Join our creator partner program and earn recurring revenue by sharing
            your love for great food experiences. No minimum followers, no
            deliverables.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#apply"
              className="bg-neo-green text-neo-dark px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-neo-green/90 transition-colors"
            >
              Apply Now
            </a>
            <a
              href="#how-it-works"
              className="border border-white/20 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-white/5 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="border-y border-white/10 bg-neo-dark-card">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-800 text-neo-green">
                {s.value}
              </div>
              <div className="text-sm text-white/50 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            How it works
          </h2>
          <p className="text-white/50 text-center mb-16 max-w-lg mx-auto">
            Get started in four simple steps and begin earning right away.
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div
                key={s.num}
                className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6 text-center hover:border-neo-green/40 transition-colors"
              >
                <div className="text-neo-green text-sm font-bold mb-3 tracking-widest">
                  STEP {s.num}
                </div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-white/50 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Benefits ─── */}
      <section className="py-24 px-6 bg-neo-dark-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why creators love us
          </h2>
          <p className="text-white/50 text-center mb-16 max-w-lg mx-auto">
            Everything you need to succeed as a NeoTaste creator partner.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="bg-neo-dark border border-neo-dark-light rounded-2xl p-6 hover:border-neo-green/40 transition-colors"
              >
                <div className="text-3xl mb-4">{b.icon}</div>
                <h3 className="text-lg font-bold mb-2">{b.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Earnings Calculator ─── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Earnings Calculator
          </h2>
          <p className="text-white/50 text-center mb-12">
            See how much you could earn as a NeoTaste partner.
          </p>

          <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-8">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm text-white/70">
                  Monthly subscribers
                </label>
                <span className="text-2xl font-bold text-neo-green">
                  {subscribers}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={500}
                value={subscribers}
                onChange={(e) => setSubscribers(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/30 mt-2">
                <span>1</span>
                <span>500</span>
              </div>
            </div>

            <div className="bg-neo-green rounded-xl p-6 text-neo-dark">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium opacity-70">
                    Monthly Earnings
                  </div>
                  <div className="text-3xl font-800">
                    £{earnings.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium opacity-70">
                    Annual Earnings
                  </div>
                  <div className="text-3xl font-800">
                    £{annualEarnings.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm opacity-60">
                Based on {subscribers} subscribers × £25 per subscription
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Creator Showcase ─── */}
      <section className="py-24 px-6 bg-neo-dark-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Creator Showcase
          </h2>
          <p className="text-white/50 text-center mb-12">
            See how our creators are sharing NeoTaste with their audience.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {creatorVideos.map((url, i) => (
              <div
                key={i}
                className="aspect-[9/16] max-h-[480px] rounded-2xl overflow-hidden border border-neo-dark-light"
              >
                <iframe
                  src={url}
                  allow="autoplay"
                  allowFullScreen
                  className="w-full h-full border-0"
                  title={`Creator Video ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            What creators say
          </h2>
          <p className="text-white/50 text-center mb-12">
            Hear from creators already in the program.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6"
              >
                <svg
                  className="w-8 h-8 text-neo-green/40 mb-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983z" />
                </svg>
                <p className="text-white/70 leading-relaxed mb-4">{t.text}</p>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-neo-green text-sm">{t.handle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 px-6 bg-neo-dark-card">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-white/50 text-center mb-12">
            Everything you need to know about the creator program.
          </p>
          <div className="flex flex-col gap-3">
            {faqItems.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── HubSpot Form ─── */}
      <section id="apply" className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Become a Partner
          </h2>
          <p className="text-white/50 text-center mb-12">
            Fill out the form below and we&apos;ll get back to you within 48
            hours.
          </p>
          <HubSpotForm />
        </div>
      </section>

      {/* ─── Already Applied? ─── */}
      <section className="py-16 px-6 bg-neo-dark-card border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Already applied?
          </h2>
          <p className="text-white/50 mb-6">
            Create your portal account to start submitting content and invoices.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-neo-green text-neo-dark px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-neo-green/90 transition-colors"
          >
            Create Portal Account
          </Link>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 px-6 bg-neo-green">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-neo-dark mb-4">
            Start earning today
          </h2>
          <p className="text-neo-dark/60 mb-8 text-lg">
            Join 1,000+ creators already earning with NeoTaste.
          </p>
          <a
            href="#apply"
            className="inline-block bg-neo-dark text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-neo-dark/90 transition-colors"
          >
            Apply Now
          </a>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <NeoTasteLogo className="h-7 w-auto" />
          <div className="flex gap-8 text-sm text-white/40">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Creator Portal
            </Link>
          </div>
          <p className="text-sm text-white/30">
            © 2024 NeoTaste. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
