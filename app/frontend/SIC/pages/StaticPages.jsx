import { useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

const FAQS = [
  {
    q: "Who is Volvaura for?",
    a: "For creators who want editors with taste, and for editors who want to cut for creators they actually care about. Hand-picked matches — not open marketplaces.",
  },
  {
    q: "How does curation work?",
    a: "Every editor in the roster is reviewed by us. We look at their reels, past clients, and how they think about pacing, narrative, and craft.",
  },
  {
    q: "Do you take a cut?",
    a: "For v1, no fees. Volvaura is free while we build the room. Payments will be added later — you'll keep control of your rates.",
  },
  {
    q: "What niches do you cover?",
    a: "Documentary, long-form YouTube, high-retention Shorts/Reels, motion graphics, and AI-assisted editing. If you don't see your niche — we're probably scouting for it.",
  },
  {
    q: "Can I be both a creator and editor?",
    a: "You'll pick one role at signup, but you can create a second account with a different email if you truly straddle both worlds.",
  },
];

export function HowItWorks() {
  const steps = [
    { n: "01", title: "Sign up", body: "Pick your side of the room — creator or editor — and set up your profile." },
    { n: "02", title: "Browse or be found", body: "Creators filter the roster by niche, style, budget. Editors get discovered by the right briefs." },
    { n: "03", title: "Send the collab", body: "Message inside Volvaura. Lock in scope. Cut something worth watching." },
  ];
  return (
    <div className="min-h-screen bg-[#050505] pt-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">/how it works</div>
        <h1 className="mt-4 font-display text-6xl leading-[0.9] tracking-tight text-white md:text-8xl">
          Three cuts.<br /><span className="italic text-white/60">One match.</span>
        </h1>
        <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div key={s.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.1 }} className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-8">
              <div className="font-mono text-sm text-violet-bright">{s.n}</div>
              <div className="mt-6 font-display text-3xl text-white">{s.title}</div>
              <div className="mt-4 text-white/60">{s.body}</div>
            </motion.div>
          ))}
        </div>
        <div className="h-32" />
      </div>
    </div>
  );
}

export function About() {
  return (
    <div className="min-h-screen bg-[#050505] pt-32">
      <div className="mx-auto max-w-[900px] px-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">/about</div>
        <h1 className="mt-4 font-display text-6xl leading-[0.9] tracking-tight text-white md:text-8xl">
          Volvaura is a room, not a marketplace.
        </h1>
        <div className="mt-12 space-y-6 text-lg leading-relaxed text-white/70">
          <p>We started Volvaura because the editing world is broken in two directions. Creators can't find editors who care about their story. Editors can't find creators who respect the craft.</p>
          <p>Volvaura fixes both by refusing to be an open bazaar. Every editor is hand-picked. Every creator is vetted. We introduce you like a friend making the right call, not like a job board.</p>
          <p>The result: fewer, better collaborations. Longer relationships. Work you're actually proud to sign.</p>
        </div>
        <div className="h-32" />
      </div>
    </div>
  );
}

export function Contact() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/contact", f);
      setSent(true);
      setF({ name: "", email: "", message: "" });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  };
  return (
    <div className="min-h-screen bg-[#050505] pt-32">
      <div className="mx-auto max-w-[900px] px-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">/contact</div>
        <h1 className="mt-4 font-display text-6xl leading-[0.9] tracking-tight text-white md:text-7xl">Talk to us.</h1>
        {sent ? (
          <div data-testid="contact-sent" className="mt-12 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-emerald-200">
            Got it. We'll be in touch shortly.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-12 space-y-4">
            <TInput label="Name" testid="contact-name" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
            <TInput label="Email" testid="contact-email" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} />
            <label>
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-white/40">Message</div>
              <textarea data-testid="contact-message" required rows={6} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white focus:border-violet focus:outline-none" />
            </label>
            <button data-testid="contact-submit" className="btn-violet">Send message →</button>
          </form>
        )}
        <div className="h-32" />
      </div>
    </div>
  );
}

export function FAQ() {
  return (
    <div className="min-h-screen bg-[#050505] pt-32">
      <div className="mx-auto max-w-[900px] px-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">/faq</div>
        <h1 className="mt-4 font-display text-6xl leading-[0.9] tracking-tight text-white md:text-7xl">Questions.</h1>
        <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
          {FAQS.map((f, i) => (
            <details key={i} className="group py-6">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-2xl text-white marker:content-['']">
                {f.q}
                <span className="font-mono text-2xl text-white/40 transition group-open:rotate-45">+</span>
              </summary>
              <div className="mt-4 text-white/60">{f.a}</div>
            </details>
          ))}
        </div>
        <div className="h-32" />
      </div>
    </div>
  );
}

function TInput({ label, value, onChange, type = "text", testid }) {
  return (
    <label className="block">
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-white/40">{label}</div>
      <input data-testid={testid} type={type} value={value} onChange={(e) => onChange(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white focus:border-violet focus:outline-none" />
    </label>
  );
}
