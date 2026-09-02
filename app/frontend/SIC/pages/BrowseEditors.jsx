import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import EditorCard from "@/components/EditorCard";
import { Search } from "lucide-react";

const PLATFORMS = ["YouTube", "Instagram", "TikTok"];
const NICHES = ["Documentary", "Shorts", "Reels", "MotionGraphics", "AIEditing"];
const STYLES = ["Cinematic", "Fast-cut", "Editorial", "Narrative", "Experimental"];
const AVAIL = ["available", "limited", "unavailable"];

export default function BrowseEditors() {
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("");
  const [niche, setNiche] = useState("");
  const [style, setStyle] = useState("");
  const [availability, setAvailability] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (platform) params.platform = platform;
      if (niche) params.niche = niche;
      if (style) params.style = style;
      if (availability) params.availability = availability;
      const { data } = await api.get("/editors", { params });
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [platform, niche, style, availability]);

  return (
    <div className="min-h-screen bg-[#050505] pt-32">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
          /roster
        </div>
        <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-white md:text-7xl">
            Every editor.
            <br />
            <span className="italic text-white/60">Hand-picked.</span>
          </h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load();
            }}
            className="flex w-full max-w-md items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2"
          >
            <Search className="h-4 w-4 text-white/40" />
            <input
              data-testid="editor-search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search skills, names, styles…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
            <button
              data-testid="editor-search-submit"
              type="submit"
              className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black"
            >
              Search
            </button>
          </form>
        </div>

        {/* Filters */}
        <div className="mt-12 flex flex-wrap items-center gap-3">
          <FilterGroup label="Platform" options={PLATFORMS} value={platform} onChange={setPlatform} testid="filter-platform" />
          <FilterGroup label="Niche" options={NICHES} value={niche} onChange={setNiche} testid="filter-niche" />
          <FilterGroup label="Style" options={STYLES} value={style} onChange={setStyle} testid="filter-style" />
          <FilterGroup label="Availability" options={AVAIL} value={availability} onChange={setAvailability} testid="filter-availability" />
        </div>

        <div className="mt-12">
          {loading ? (
            <div className="font-mono text-xs uppercase tracking-widest text-white/40">
              Loading roster…
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-12 text-center text-white/60">
              No editors match those filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((e, i) => (
                <EditorCard key={e.id} editor={e} index={i} />
              ))}
            </div>
          )}
        </div>
        <div className="h-32" />
      </div>
    </div>
  );
}

function FilterGroup({ label, options, value, onChange, testid }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="mr-1 font-mono text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </span>
      <button
        onClick={() => onChange("")}
        data-testid={`${testid}-all`}
        className={`rounded-full border px-3 py-1 text-xs transition ${value === "" ? "border-violet bg-violet text-white" : "border-white/10 text-white/60 hover:border-white/30"}`}
      >
        All
      </button>
      {options.map((o) => (
        <button
          key={o}
          data-testid={`${testid}-${o}`}
          onClick={() => onChange(o)}
          className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
            value === o
              ? "border-violet bg-violet text-white"
              : "border-white/10 text-white/60 hover:border-white/30"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
