import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Film, Play, Sparkles, Zap } from "lucide-react";
import KineticHeadline from "@/components/KineticHeadline";
import Marquee from "@/components/Marquee";
import EditorCard from "@/components/EditorCard";
import { api } from "@/lib/api";

const CATEGORIES = [
  { name: "Documentary & Essays", tag: "Long-form", desc: "Deep dives, retention-optimized storytelling." },
  { name: "High-Retention Shorts", tag: "Short-form", desc: "TikTok, Reels, Shorts. Hook-driven pacing." },
  { name: "Motion Graphics", tag: "VFX", desc: "Custom assets, kinetic typography, 3D tracking." },
  { name: "AI Assisted Editing", tag: "Experimental", desc: "Generative fill, voice cloning, hyper-speed workflows." },
];

const MANIFESTO = [
  { n: "01", title: "Narrative over noise", desc: "We don't just chop footage. We sculpt stories." },
  { n: "02", title: "Pace is a weapon", desc: "Every frame must earn its place. Zero dead air." },
  { n: "03", title: "The invisible art", desc: "The best cuts are the ones the audience never feels." },
  { n: "04", title: "No templates", desc: "Bespoke edits only. Your signature — amplified." },
  { n: "05", title: "Ruthless curation", desc: "Top 1% talent pool. Professional grade or nothing." },
];

const HERO_IMG = "https://images.unsplash.com/photo-1644353224392-7e532d7b8f4b?w=1600";

export default function Landing() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);

  const [editors, setEditors] = useState([]);

  useEffect(() => {
    api
      .get("/editors")
      .then((r) => setEditors(r.data || []))
      .catch(() => setEditors([]));
  }, []);

  return (
    <div className="grain bg-[#050505] text-white">
      {/* ------------- HERO ------------- */}
      <section ref={heroRef} className="relative min-h-[100svh] overflow-hidden pt-24">
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-10%] top-[10%] h-[500px] w-[500px] rounded-full bg-violet/25 blur-[140px] animate-float-slow" />
          <div className="absolute right-[-8%] top-[40%] h-[400px] w-[400px] rounded-full bg-fuchsia-600/20 blur-[140px] animate-float-slow" />
        </div>

        {/* Parallax hero portrait */}
        <motion.div
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
          className="pointer-events-none absolute right-[-6%] top-24 -z-0 h-[75vh] w-[46vw] overflow-hidden rounded-3xl border border-white/10 md:right-[4%]"
        >
          <img src={HERO_IMG} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-transparent to-violet/20" />
          <div className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-widest text-white/60">
            REEL_001 · 00:04:23:12
          </div>
          <div className="absolute right-4 top-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            REC
          </div>
        </motion.div>

        <div className="relative mx-auto max-w-[1400px] px-6">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.8 }}
            className="mb-8 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-white/60"
          >
            <span className="inline-block h-px w-8 bg-white/40" />
            A creative agency for creators & editors — est. 2026
          </motion.div>

          <KineticHeadline
            className="text-[clamp(3rem,10vw,10rem)] text-white"
            lines={["The cut is", "everything."]}
          />

          {/* Sub */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.9 }}
            className="mt-10 grid max-w-[1100px] grid-cols-1 gap-8 md:grid-cols-3"
          >
            <div className="md:col-span-2">
              <p className="max-w-xl text-lg leading-relaxed text-white/70 md:text-xl">
                Volvaura curates the world's most dangerous editors and pairs
                them with creators who refuse to blend in. Not another
                marketplace. A hand-picked room.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/editors" data-testid="hero-find-editor-cta" className="btn-primary">
                  <Play className="h-4 w-4 fill-black" />
                  Find your editor
                </Link>
                <Link to="/register" data-testid="hero-apply-cta" className="btn-ghost">
                  <Film className="h-4 w-4" />
                  Apply to edit
                </Link>
              </div>
            </div>
            <div className="flex flex-col justify-end gap-4 border-l border-white/10 pl-6">
              <div>
                <div className="font-display text-4xl text-white">1%</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/50">
                  Talent acceptance rate
                </div>
              </div>
              <div>
                <div className="font-display text-4xl text-white">48h</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/50">
                  Average match time
                </div>
              </div>
            </div>
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="mt-20 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40"
          >
            <span>Scroll</span>
            <span className="inline-block h-px w-16 bg-white/20" />
            <span>the reel</span>
          </motion.div>
        </div>
      </section>

      {/* ------------- MARQUEE ------------- */}
      <Marquee items={["Color grade", "Sound design", "Motion graphics", "VFX", "Rough cut", "Narrative", "Pacing", "Transitions"]} />

      {/* ------------- MANIFESTO ------------- */}
      <section data-testid="manifesto-section" className="mx-auto max-w-[1400px] px-6 py-32">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
              /manifesto
            </div>
            <h2 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight text-white md:text-6xl">
              Five things
              <br />
              we <span className="italic text-white/60">believe.</span>
            </h2>
          </div>
          <div className="md:col-span-8">
            <ul>
              {MANIFESTO.map((m, i) => (
                <motion.li
                  key={m.n}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.8, delay: i * 0.06 }}
                  className="group grid grid-cols-12 items-baseline gap-6 border-t border-white/10 py-8 last:border-b"
                >
                  <span className="col-span-2 font-mono text-sm text-white/40 md:col-span-1">
                    {m.n}
                  </span>
                  <div className="col-span-10 md:col-span-6">
                    <div className="font-display text-3xl uppercase leading-tight tracking-tight text-white md:text-4xl">
                      {m.title}
                    </div>
                  </div>
                  <div className="col-span-12 text-sm text-white/60 md:col-span-5">
                    {m.desc}
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ------------- HOW IT WORKS ------------- */}
      <section className="border-t border-white/5 bg-[#0A0A0A] px-6 py-32">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-end justify-between">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
                /how it works
              </div>
              <h2 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight text-white md:text-7xl">
                Three cuts.
                <br />
                One perfect match.
              </h2>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { n: "01", title: "Post the brief", desc: "Tell us your niche, style, budget, and deadline. Two minutes." },
              { n: "02", title: "We hand-pick", desc: "Our curators shortlist editors whose sensibility matches yours." },
              { n: "03", title: "You cut the deal", desc: "Review reels, message, and lock in a collab — all inside Volvaura." },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: i * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-black p-8"
              >
                <div className="font-mono text-xs uppercase tracking-widest text-violet-bright">
                  Step {s.n}
                </div>
                <div className="mt-6 font-display text-3xl leading-tight text-white">
                  {s.title}
                </div>
                <div className="mt-4 text-sm leading-relaxed text-white/60">
                  {s.desc}
                </div>
                <ArrowUpRight className="absolute right-6 top-6 h-5 w-5 text-white/30 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------- CATEGORIES ------------- */}
      <section className="mx-auto max-w-[1400px] px-6 py-32">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
              /disciplines
            </div>
            <h2 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight text-white md:text-6xl">
              Every craft.
              <br />
              <span className="italic text-white/60">One roster.</span>
            </h2>
            <p className="mt-6 max-w-md text-white/60">
              From viral 15-second hooks to award-worthy long-form documentary
              — we curate specialists, not generalists.
            </p>
          </div>
          <div className="grid md:col-span-7 grid-cols-1 gap-4 sm:grid-cols-2">
            {CATEGORIES.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[#0A0A0A] p-6 transition-colors hover:border-violet/50"
              >
                <div className="flex items-start justify-between">
                  <span className="chip">{c.tag}</span>
                  <Sparkles className="h-4 w-4 text-white/30 transition-colors group-hover:text-violet-bright" />
                </div>
                <div className="mt-8 font-display text-2xl leading-tight text-white">
                  {c.name}
                </div>
                <div className="mt-2 text-sm text-white/50">{c.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------- FEATURED EDITORS ------------- */}
      <section className="border-t border-white/5 bg-black px-6 py-32">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
                /the roster
              </div>
              <h2 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight text-white md:text-7xl">
                Featured editors.
              </h2>
            </div>
            <Link to="/editors" data-testid="see-all-editors-link" className="hidden items-center gap-2 text-sm text-white/70 hover:text-white md:inline-flex">
              See the full roster <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {editors.slice(0, 3).map((e, i) => (
              <EditorCard key={e.id} editor={e} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ------------- TESTIMONIAL ------------- */}
      <section className="mx-auto max-w-[1400px] px-6 py-32">
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9 }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
            /trusted by
          </div>
          <p className="mt-8 font-display text-3xl leading-tight text-white/90 md:text-5xl">
            "Volvaura matched me with an editor in 32 hours. He didn't just cut
            my footage — he found the show inside it."
          </p>
          <div className="mt-8 font-mono text-xs uppercase tracking-widest text-white/50">
            — Long-form YouTube creator, 1.2M subs
          </div>
        </motion.blockquote>
      </section>

      {/* ------------- CTA ------------- */}
      <section className="relative overflow-hidden border-t border-white/5 bg-[#050505] px-6 py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/25 blur-[160px]" />
        </div>
        <div className="mx-auto max-w-[1400px]">
          <div className="rounded-3xl border border-white/10 bg-black/50 p-10 md:p-20">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
              /the last cut
            </div>
            <h2 className="mt-6 font-display text-5xl leading-[0.9] tracking-tight text-white md:text-8xl">
              Stop editing
              <br />
              <span className="italic text-white/60">alone.</span>
            </h2>
            <p className="mt-8 max-w-xl text-lg text-white/60">
              Whether you're a creator drowning in raw footage or an editor
              hunting for creators worth cutting for — you belong in the room.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/register" data-testid="cta-join-btn" className="btn-primary">
                <Zap className="h-4 w-4 fill-black" />
                Join Volvaura
              </Link>
              <Link to="/editors" data-testid="cta-browse-btn" className="btn-ghost">
                Browse editors
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
