import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Zap } from "lucide-react";

export default function EditorCard({ editor, index = 0 }) {
  const cover =
    editor.cover_url ||
    editor.avatar_url ||
    "https://images.unsplash.com/photo-1514168757508-07ffe9ae125b?w=1200";
  const availabilityColor =
    editor.availability === "available"
      ? "text-emerald-400"
      : editor.availability === "limited"
        ? "text-amber-400"
        : "text-white/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[#0A0A0A]"
      data-testid={`editor-card-${editor.id}`}
    >
      <Link to={`/editors/${editor.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={cover}
            alt={editor.name}
            className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <div className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-widest text-white/70">
            00:{String((index + 1) * 4).padStart(2, "0")}:23:12
          </div>
          <div className={`absolute right-4 top-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest ${availabilityColor}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {editor.availability}
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-2xl leading-tight text-white">
                {editor.name}
              </div>
              <div className="mt-1 line-clamp-1 text-sm text-white/60">
                {editor.headline || "Editor"}
              </div>
            </div>
            {editor.price_per_video != null && (
              <div className="shrink-0 text-right">
                <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                  from
                </div>
                <div className="font-display text-lg text-white">
                  ${editor.price_per_video}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {(editor.skills || []).slice(0, 3).map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-white/50">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              {editor.location || "Remote"}
            </div>
            {editor.turnaround_days != null && (
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                {editor.turnaround_days}-day turnaround
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
