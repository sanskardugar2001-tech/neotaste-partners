"use client";

import { useState } from "react";
import Link from "next/link";
import { NeoTasteLogo } from "@/components/NeoTasteLogo";

/* ───────── Timeline Events ───────── */
const timeline = [
  {
    day: "Day 0",
    title: "Onboarding Complete",
    desc: "Creator signs up and receives their unique code and dashboard access.",
    color: "bg-neo-green",
  },
  {
    day: "Day 7",
    title: "First Video Nudge",
    desc: "If no content posted, send a friendly reminder with content ideas.",
    color: "bg-yellow-400",
  },
  {
    day: "Day 14+",
    title: "Engagement Loop",
    desc: "Weekly check-ins and milestone celebrations keep creators active.",
    color: "bg-blue-400",
  },
  {
    day: "Milestones",
    title: "Achievement Rewards",
    desc: "Celebrate 1st referral, 10 referrals, 50 referrals and more.",
    color: "bg-purple-400",
  },
];

/* ───────── Automation Rules ───────── */
const automations = [
  {
    id: 1,
    title: "First Video Nudge",
    trigger: "7 days after signup, no content posted",
    channel: "Email",
    channelColor: "bg-blue-500/20 text-blue-400",
    template: `Hi {{first_name}} 👋

Welcome to NeoTaste! We noticed you haven't posted your first video yet — no pressure at all!

Here are some quick ideas to get started:
• Visit a trending restaurant and share your honest review
• Try our "Top 5 dishes" format — it always performs well
• Share a quick story about a hidden gem in {{city}}

Your code is {{creator_code}} — share it whenever you're ready!

Best,
The NeoTaste Team`,
  },
  {
    id: 2,
    title: "Weekly Inactive Reminder",
    trigger: "7+ days since last activity",
    channel: "WhatsApp",
    channelColor: "bg-[#25D366]/20 text-[#25D366]",
    template: `Hey {{first_name}}! 🍽️

It's been a while since your last post. Your audience is waiting!

Quick stats:
• Your code {{creator_code}} has been used {{code_uses}} times
• You have {{paying_subscribers}} paying subscribers
• Current earnings: {{total_earnings}}

Need content ideas? Check your dashboard for trending restaurants in {{city}}.

Keep creating! 🚀`,
  },
  {
    id: 3,
    title: "First Referral Celebration",
    trigger: "First successful referral conversion",
    channel: "Email",
    channelColor: "bg-blue-500/20 text-blue-400",
    template: `🎉 Congratulations {{first_name}}!

You just earned your FIRST referral! Someone used your code {{creator_code}} and converted to a paying subscriber.

That's £25 earned! 💰

Here's how to keep the momentum going:
• Pin your NeoTaste content to your profile
• Add your code to your bio
• Create a "why I love NeoTaste" video

You're on your way! 🌟`,
  },
  {
    id: 4,
    title: "10 Referrals Milestone",
    trigger: "10 successful referral conversions",
    channel: "Email",
    channelColor: "bg-blue-500/20 text-blue-400",
    template: `🔥 10 Referrals! Amazing work {{first_name}}!

You've hit double digits — 10 people are now enjoying NeoTaste thanks to you!

Your earnings so far: £{{total_earnings}}

As a thank you, we've upgraded your food expense limit. You can now claim up to £75 per restaurant visit (was £50).

Keep going — the top creators earn over £80,000! 🏆`,
  },
  {
    id: 5,
    title: "50 Referrals Milestone — Star Creator",
    trigger: "50 successful referral conversions",
    channel: "WhatsApp",
    channelColor: "bg-[#25D366]/20 text-[#25D366]",
    template: `⭐ STAR CREATOR STATUS! ⭐

{{first_name}}, you are officially a NeoTaste Star Creator!

50 referrals is incredible. You're in the top 5% of all creators.

Your rewards:
🌟 Star Creator badge on your profile
🍽️ Unlimited food expense coverage
📸 Priority access to new restaurant partners
💬 Direct line to our creator success team

Total earned: £{{total_earnings}}

Thank you for being amazing! 🙌`,
  },
  {
    id: 6,
    title: "Content Ideas Weekly",
    trigger: "Every Monday at 9:00 AM",
    channel: "Email",
    channelColor: "bg-blue-500/20 text-blue-400",
    template: `Good morning {{first_name}}! ☀️

Here are this week's content ideas for {{city}}:

🆕 New on NeoTaste:
{{new_restaurants}}

🔥 Trending this week:
{{trending_restaurants}}

💡 Content format idea:
"{{weekly_format_suggestion}}"

Quick tip: Videos posted on {{best_day}} tend to get {{engagement_lift}}% more engagement!

Happy creating! 🎬`,
  },
];

/* ───────── Automation Card ───────── */
function AutomationCard({
  automation,
}: {
  automation: (typeof automations)[0];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl overflow-hidden hover:border-neo-green/30 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-semibold text-white">
                {automation.title}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${automation.channelColor}`}
              >
                {automation.channel}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Trigger: {automation.trigger}</span>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-white/40 shrink-0 transition-transform mt-1 ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-neo-dark-light pt-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-neo-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-neo-green">
              Message Template
            </span>
          </div>
          <pre className="bg-neo-dark rounded-xl p-4 text-sm text-white/70 whitespace-pre-wrap font-poppins leading-relaxed overflow-x-auto">
            {automation.template}
          </pre>
          <div className="mt-4 flex flex-wrap gap-2">
            {automation.template
              .match(/\{\{(\w+)\}\}/g)
              ?.filter((v, i, a) => a.indexOf(v) === i)
              .map((variable) => (
                <span
                  key={variable}
                  className="px-2 py-1 rounded-md bg-neo-dark text-xs text-neo-green font-mono"
                >
                  {variable}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Nudges Page ───────── */
export default function NudgesPage() {
  return (
    <div className="min-h-screen bg-neo-dark text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-neo-dark/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <NeoTasteLogo className="h-7" />
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <div className="inline-block bg-neo-green/10 border border-neo-green/30 rounded-full px-4 py-1.5 text-neo-green text-sm font-medium mb-4">
            Automated Engagement
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Creator Nudge System
          </h1>
          <p className="text-white/50 max-w-2xl">
            Automated messages that keep creators engaged, celebrate milestones,
            and provide timely content inspiration throughout their journey.
          </p>
        </div>

        {/* Timeline */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-6">Creator Journey</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {timeline.map((event, i) => (
              <div key={event.day} className="relative">
                {i < timeline.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%+32px)] right-0 h-0.5 bg-neo-dark-light" />
                )}
                <div className="bg-neo-dark-card border border-neo-dark-light rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${event.color}`} />
                    <span className="text-sm font-semibold text-neo-green">
                      {event.day}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1">{event.title}</h3>
                  <p className="text-sm text-white/50">{event.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Automation Rules */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Automation Rules</h2>
            <span className="text-sm text-white/40">
              {automations.length} active rules
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {automations.map((a) => (
              <AutomationCard key={a.id} automation={a} />
            ))}
          </div>
        </section>

        {/* Footer note */}
        <div className="mt-16 bg-neo-dark-card border border-neo-dark-light rounded-2xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-neo-green/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-neo-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold mb-1">About the Nudge System</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              All nudges are automated and personalized using creator data.
              Variables like{" "}
              <code className="text-neo-green/80 bg-neo-dark px-1 rounded">
                {"{{first_name}}"}
              </code>{" "}
              and{" "}
              <code className="text-neo-green/80 bg-neo-dark px-1 rounded">
                {"{{creator_code}}"}
              </code>{" "}
              are dynamically replaced with each creator&apos;s actual data. Creators
              can opt out of nudges at any time through their dashboard settings.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
