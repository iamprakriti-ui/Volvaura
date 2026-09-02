import { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import EditorCard from "@/components/EditorCard";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function CreatorHome() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  useEffect(() => {
    api.get("/projects/mine").then((r) => setProjects(r.data)).catch(() => {});
    api.get("/requests/outgoing").then((r) => setRequests(r.data)).catch(() => {});
  }, []);
  return (
    <div>
      <PageHead eyebrow="/dashboard" title={`Hi, ${user?.name?.split(" ")[0] || "creator"}.`} sub="Post a brief, browse hand-picked editors, and lock in a collab." />
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Projects posted" value={projects.length} />
        <Stat label="Requests sent" value={requests.length} />
        <Stat label="Accepted" value={requests.filter((r) => r.status === "accepted").length} />
        <Stat label="Pending" value={requests.filter((r) => r.status === "pending").length} />
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/creator/new" className="btn-violet">+ Post a project</Link>
        <Link to="/editors" className="btn-ghost">Browse editors</Link>
      </div>
    </div>
  );
}

export function NewProject() {
  const [f, setF] = useState({ title: "", description: "", budget: "", style: "", platform: "", deadline: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/projects", { ...f, budget: f.budget ? Number(f.budget) : null });
      toast.success("Project posted.");
      setF({ title: "", description: "", budget: "", style: "", platform: "", deadline: "" });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <PageHead eyebrow="/new project" title="Post a brief." sub="Give editors the shape of what you're building." />
      <form onSubmit={submit} className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <TInput label="Title" value={f.title} onChange={(v) => setF({ ...f, title: v })} testid="proj-title" />
        <TInput label="Budget (USD)" value={f.budget} onChange={(v) => setF({ ...f, budget: v })} type="number" testid="proj-budget" />
        <TInput label="Style (e.g., cinematic)" value={f.style} onChange={(v) => setF({ ...f, style: v })} testid="proj-style" />
        <TInput label="Platform" value={f.platform} onChange={(v) => setF({ ...f, platform: v })} testid="proj-platform" />
        <TInput label="Deadline" value={f.deadline} onChange={(v) => setF({ ...f, deadline: v })} testid="proj-deadline" />
        <label className="md:col-span-2">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-white/40">Description</div>
          <textarea data-testid="proj-desc" required rows={6} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white focus:border-violet focus:outline-none" />
        </label>
        <div className="md:col-span-2">
          <button data-testid="proj-submit" disabled={loading} className="btn-violet">
            {loading ? "Posting…" : "Post brief →"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function MyProjects() {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    api.get("/projects/mine").then((r) => setProjects(r.data));
  }, []);
  return (
    <div>
      <PageHead eyebrow="/projects" title="My briefs." />
      <div className="mt-10 space-y-4">
        {projects.length === 0 && <Empty text="No projects yet. Post your first brief." />}
        {projects.map((p) => (
          <div key={p.id} className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-display text-2xl text-white">{p.title}</div>
                <div className="mt-2 text-sm text-white/60">{p.description}</div>
              </div>
              <div className="text-right">
                {p.budget && <div className="font-display text-xl text-white">${p.budget}</div>}
                <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/40">{p.status}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.style && <span className="chip">{p.style}</span>}
              {p.platform && <span className="chip">{p.platform}</span>}
              {p.deadline && <span className="chip">Due {p.deadline}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CreatorRequests() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/requests/outgoing").then((r) => setItems(r.data));
  }, []);
  return (
    <div>
      <PageHead eyebrow="/requests" title="Outgoing." />
      <div className="mt-10 space-y-3">
        {items.length === 0 && <Empty text="You haven't sent any requests yet." />}
        {items.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0A0A0A] p-5">
            <div>
              <div className="font-display text-lg text-white">To {r.editor_name || "editor"}</div>
              <div className="mt-1 text-sm text-white/60">{r.message}</div>
            </div>
            <StatusBadge status={r.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SavedEditors() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/saved").then((r) => setItems(r.data));
  }, []);
  return (
    <div>
      <PageHead eyebrow="/saved" title="Saved roster." />
      {items.length === 0 ? (
        <div className="mt-8"><Empty text="You haven't saved any editors yet. Browse the roster." /></div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((e, i) => (<EditorCard key={e.id} editor={e} index={i} />))}
        </div>
      )}
    </div>
  );
}

// ---- Shared UI ----
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
      <div className="mt-2 font-display text-4xl text-white">{value}</div>
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
export function StatusBadge({ status }) {
  const map = {
    pending: "border-amber-400/30 text-amber-300",
    accepted: "border-emerald-400/30 text-emerald-300",
    declined: "border-red-400/30 text-red-300",
  };
  return (
    <span className={`chip capitalize ${map[status] || ""}`}>{status}</span>
  );
}
