import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Zap, Bookmark, Send } from "lucide-react";
import { toast } from "sonner";

export default function EditorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [editor, setEditor] = useState(null);
  const [msg, setMsg] = useState("");
  const [budget, setBudget] = useState("");
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get(`/editors/${id}`).then((r) => setEditor(r.data));
    if (user && user.role === "creator") {
      api
        .get("/saved")
        .then((r) => setSaved((r.data || []).some((e) => e.id === id)))
        .catch(() => {});
    }
  }, [id, user]);

  const sendRequest = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in as a creator to send a request.");
    if (user.role !== "creator") return toast.error("Only creators can send requests.");
    setSending(true);
    try {
      await api.post("/requests", {
        editor_id: id,
        message: msg,
        budget: budget ? Number(budget) : null,
      });
      toast.success("Request sent. The editor has been notified.");
      setMsg("");
      setBudget("");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setSending(false);
    }
  };

  const toggleSave = async () => {
    if (!user || user.role !== "creator") return toast.error("Sign in as a creator to save editors.");
    try {
      const { data } = await api.post(`/saved/${id}`);
      setSaved(data.saved);
      toast.success(data.saved ? "Saved to your roster" : "Removed from saved");
    } catch {
      toast.error("Could not update saved status.");
    }
  };

  if (!editor)
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="font-mono text-xs uppercase tracking-widest text-white/40">
          Loading editor…
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#050505] pt-32">
      <div className="mx-auto max-w-[1400px] px-6">
        {/* Cover */}
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A]">
          <img src={editor.cover_url || editor.avatar_url} alt="" className="h-full w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/60">
                /editor · {editor.location || "Remote"}
              </div>
              <h1 className="mt-2 font-display text-5xl leading-[0.95] tracking-tight text-white md:text-7xl">
                {editor.name}
              </h1>
              <div className="mt-2 max-w-2xl text-lg text-white/70">
                {editor.headline}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Left sticky */}
          <aside className="md:sticky md:top-32 md:col-span-4 md:self-start">
            <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs uppercase tracking-widest text-white/40">Rate</div>
                <div className="font-display text-3xl text-white">
                  {editor.price_per_video ? `$${editor.price_per_video}` : "—"}
                </div>
              </div>
              <div className="mt-4 h-px w-full bg-white/10" />
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>Turnaround</span>
                  <span className="text-white">{editor.turnaround_days ?? "—"} days</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Availability</span>
                  <span className="capitalize text-white">{editor.availability}</span>
                </div>
                <div className="flex items-center justify-between text-white/70">
                  <span>Location</span>
                  <span className="flex items-center gap-1 text-white">
                    <MapPin className="h-3 w-3" /> {editor.location || "Remote"}
                  </span>
                </div>
              </div>
              <button
                data-testid="save-editor-btn"
                onClick={toggleSave}
                className={`mt-6 w-full ${saved ? "btn-violet" : "btn-ghost"}`}
              >
                <Bookmark className="h-4 w-4" />
                {saved ? "Saved" : "Save editor"}
              </button>
            </div>

            {/* Contact form */}
            <form
              onSubmit={sendRequest}
              className="mt-6 rounded-2xl border border-white/10 bg-[#0A0A0A] p-6"
            >
              <div className="font-mono text-xs uppercase tracking-widest text-white/40">
                Send a collab request
              </div>
              <label className="mt-4 block text-sm text-white/70">Budget (USD)</label>
              <input
                data-testid="request-budget-input"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="500"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-violet focus:outline-none"
              />
              <label className="mt-4 block text-sm text-white/70">Message</label>
              <textarea
                data-testid="request-message-input"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                required
                rows={4}
                placeholder="Tell them about your project…"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-violet focus:outline-none"
              />
              <button
                data-testid="send-request-btn"
                type="submit"
                disabled={sending}
                className="btn-violet mt-4 w-full disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending…" : "Send request"}
              </button>
              {!user && (
                <div className="mt-3 text-center text-xs text-white/50">
                  <Link to="/login" className="underline hover:text-white">
                    Sign in
                  </Link>{" "}
                  as a creator to send.
                </div>
              )}
            </form>
          </aside>

          {/* Right content */}
          <div className="md:col-span-8">
            <section>
              <div className="font-mono text-xs uppercase tracking-widest text-white/40">
                /about
              </div>
              <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-white/80">
                {editor.bio || "No bio yet."}
              </p>
            </section>

            <section className="mt-12">
              <div className="font-mono text-xs uppercase tracking-widest text-white/40">
                /skills
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(editor.skills || []).map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
                {(editor.platforms || []).map((s) => (
                  <span key={s} className="chip border-violet/40 text-violet-bright">
                    <Zap className="h-3 w-3" /> {s}
                  </span>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <div className="font-mono text-xs uppercase tracking-widest text-white/40">
                /reel · work samples
              </div>
              {editor.samples && editor.samples.length > 0 ? (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {editor.samples.map((sample, i) => (
                    <div
                      key={i}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black"
                    >
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={sample.thumbnail}
                          alt={sample.title}
                          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-4">
                        <div className="font-display text-lg text-white">{sample.title}</div>
                        <div className="text-sm text-white/60">{sample.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-white/10 bg-[#0A0A0A] p-8 text-white/50">
                  No samples uploaded yet.
                </div>
              )}
            </section>
          </div>
        </div>
        <div className="h-32" />
      </div>
    </div>
  );
}
