import { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge } from "@/pages/creator/CreatorPages";
import { Check, X } from "lucide-react";

export function EditorHome() {
  const { user } = useAuth();
  const [reqs, setReqs] = useState([]);
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    api.get("/requests/incoming").then((r) => setReqs(r.data)).catch(() => {});
    api.get(`/editors/${user.id}`).then((r) => setProfile(r.data)).catch(() => {});
  }, [user.id]);
  return (
    <div>
      <PageHead eyebrow="/editor dashboard" title={`Hi, ${user?.name?.split(" ")[0] || "editor"}.`} sub="Manage your portfolio, availability, and incoming requests." />
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Incoming requests" value={reqs.length} />
        <Stat label="Pending" value={reqs.filter((r) => r.status === "pending").length} />
        <Stat label="Accepted" value={reqs.filter((r) => r.status === "accepted").length} />
        <Stat label="Availability" value={profile?.availability || "—"} />
      </div>
      {profile && (
        <div className="mt-10 rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">Public profile</div>
          <div className="mt-3 font-display text-2xl text-white">{profile.headline || "Add your headline in Portfolio →"}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.skills.length === 0 ? (
              <span className="text-sm text-white/50">No skills yet. Head to Portfolio to complete your profile.</span>
            ) : profile.skills.map((s) => <span key={s} className="chip">{s}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

export function EditorPortfolio() {
  const { user } = useAuth();
  const [p, setP] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/editors/${user.id}`).then((r) => setP(r.data));
  }, [user.id]);

  if (!p) return <div className="font-mono text-xs text-white/40">Loading…</div>;

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/editors/me", {
        bio: p.bio,
        headline: p.headline,
        skills: p.skills,
        platforms: p.platforms,
        niches: p.niches,
        styles: p.styles,
        price_per_video: p.price_per_video ? Number(p.price_per_video) : null,
        turnaround_days: p.turnaround_days ? Number(p.turnaround_days) : null,
        availability: p.availability,
        location: p.location,
        reel_url: p.reel_url,
        avatar_url: p.avatar_url,
        cover_url: p.cover_url,
        samples: p.samples,
      });
      toast.success("Portfolio updated.");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  const listInput = (key, label) => (
    <label>
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-white/40">{label} (comma separated)</div>
      <input
        data-testid={`portfolio-${key}`}
        value={(p[key] || []).join(", ")}
        onChange={(e) => setP({ ...p, [key]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
        className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white focus:border-violet focus:outline-none"
      />
    </label>
  );

  return (
    <div>
      <PageHead eyebrow="/portfolio" title="Your portfolio." sub="Craft the profile creators will see." />
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <TInput label="Headline" value={p.headline || ""} onChange={(v) => setP({ ...p, headline: v })} testid="portfolio-headline" />
        <TInput label="Location" value={p.location || ""} onChange={(v) => setP({ ...p, location: v })} testid="portfolio-location" />
        <TInput label="Rate (USD per video)" value={p.price_per_video ?? ""} onChange={(v) => setP({ ...p, price_per_video: v })} type="number" testid="portfolio-rate" />
        <TInput label="Turnaround days" value={p.turnaround_days ?? ""} onChange={(v) => setP({ ...p, turnaround_days: v })} type="number" testid="portfolio-turnaround" />
        <TInput label="Avatar URL" value={p.avatar_url || ""} onChange={(v) => setP({ ...p, avatar_url: v })} testid="portfolio-avatar" />
        <TInput label="Cover image URL" value={p.cover_url || ""} onChange={(v) => setP({ ...p, cover_url: v })} testid="portfolio-cover" />
        <TInput label="Reel URL" value={p.reel_url || ""} onChange={(v) => setP({ ...p, reel_url: v })} testid="portfolio-reel" />
        <label>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-white/40">Availability</div>
          <select data-testid="portfolio-availability" value={p.availability} onChange={(e) => setP({ ...p, availability: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white focus:border-violet focus:outline-none">
            <option value="available">Available</option>
            <option value="limited">Limited</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </label>
        {listInput("skills", "Skills")}
        {listInput("platforms", "Platforms")}
        {listInput("niches", "Niches")}
        {listInput("styles", "Styles")}
        <label className="md:col-span-2">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-white/40">Bio</div>
          <textarea data-testid="portfolio-bio" rows={5} value={p.bio || ""} onChange={(e) => setP({ ...p, bio: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white focus:border-violet focus:outline-none" />
        </label>
        <div className="md:col-span-2">
          <button data-testid="portfolio-save" onClick={save} disabled={saving} className="btn-violet">
            {saving ? "Saving…" : "Save portfolio →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditorRequests() {
  const [items, setItems] = useState([]);
  const load = () => api.get("/requests/incoming").then((r) => setItems(r.data));
  useEffect(() => {
    load();
  }, []);
  const respond = async (id, action) => {
    try {
      await api.post(`/requests/${id}/respond`, { action });
      toast.success(`Request ${action}ed.`);
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  };
  return (
    <div>
      <PageHead eyebrow="/requests" title="Incoming." />
      <div className="mt-10 space-y-3">
        {items.length === 0 && <Empty text="No incoming requests yet." />}
        {items.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0A0A0A] p-5">
            <div>
              <div className="font-display text-lg text-white">From {r.creator_name || "a creator"}</div>
              <div className="mt-1 text-sm text-white/60">{r.message}</div>
              {r.budget && <div className="mt-2 font-mono text-xs text-violet-bright">Budget ${r.budget}</div>}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={r.status} />
              {r.status === "pending" && (
                <>
                  <button data-testid={`req-accept-${r.id}`} onClick={() => respond(r.id, "accept")} className="rounded-full border border-emerald-400/40 bg-emerald-500/10 p-2 text-emerald-300 hover:bg-emerald-500/20" aria-label="Accept">
                    <Check className="h-4 w-4" />
                  </button>
                  <button data-testid={`req-decline-${r.id}`} onClick={() => respond(r.id, "decline")} className="rounded-full border border-red-400/40 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20" aria-label="Decline">
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EditorSettings() {
  const { user } = useAuth();
  return (
    <div>
      <PageHead eyebrow="/settings" title="Account settings." />
      <div className="mt-10 rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 text-sm text-white/70 space-y-2">
        <div><span className="text-white/40">Name:</span> {user.name}</div>
        <div><span className="text-white/40">Email:</span> {user.email}</div>
        <div><span className="text-white/40">Role:</span> {user.role}</div>
        <div className="pt-4 text-white/50">More settings coming soon.</div>
      </div>
    </div>
  );
}

function PageHead({ eyebrow, title, sub }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">{eyebrow}</div>
      <h1 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight text-white md:text-6xl">{title}</h1>
      {sub && <div className="mt-3 max-w-xl text-white/60">{sub}</div>}
    </div>
  );
}
function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">{label}</div>
      <div className="mt-2 font-display text-4xl capitalize text-white">{value}</div>
    </div>
  );
}
function TInput({ label, value, onChange, type = "text", testid }) {
  return (
    <label>
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-white/40">{label}</div>
      <input data-testid={testid} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white focus:border-violet focus:outline-none" />
    </label>
  );
}
function Empty({ text }) {
  return <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-8 text-white/50">{text}</div>;
}
