import { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function Pricing() {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/payments/packages").then((r) => setPackages(r.data));
  }, []);

  const checkout = async (pkgId) => {
    if (!user) {
      toast.error("Please sign in to purchase a boost.");
      return navigate("/login");
    }
    if (user.role !== "editor") {
      return toast.error("Only editors can purchase Featured slots.");
    }
    setLoading(pkgId);
    try {
      const { data } = await api.post("/payments/checkout", {
        package_id: pkgId,
        origin_url: window.location.origin,
      });
      window.location.href = data.checkout_url;
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
      setLoading("");
    }
  };

  const highlight = (id) => id === "boost_pro";

  return (
    <div className="min-h-screen bg-[#050505] pt-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
          /featured slots
        </div>
        <h1 className="mt-4 font-display text-6xl leading-[0.9] tracking-tight text-white md:text-8xl">
          Get on the
          <br />
          <span className="italic text-white/60">front page.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/60">
          Editors: buy a Featured slot and jump to the top of the roster —
          more inbound requests, more work you actually want.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {packages.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              className={`relative overflow-hidden rounded-2xl border p-8 ${
                highlight(p.id)
                  ? "border-violet/50 bg-[#0F0713]"
                  : "border-white/10 bg-[#0A0A0A]"
              }`}
              data-testid={`pricing-card-${p.id}`}
            >
              {highlight(p.id) && (
                <div className="absolute right-6 top-6 chip border-violet/40 text-violet-bright">
                  <Sparkles className="h-3 w-3" /> Most popular
                </div>
              )}
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                {p.id.replace("boost_", "")}
              </div>
              <div className="mt-4 font-display text-3xl text-white">{p.name}</div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-6xl text-white">${p.amount}</span>
                <span className="text-sm text-white/50">one-time</span>
              </div>
              <div className="mt-4 text-sm text-white/60">{p.description}</div>
              <ul className="mt-6 space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-bright" /> Pinned to top of roster</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-bright" /> Featured badge on your card</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-bright" /> {p.duration_days}-day duration</li>
                {p.id === "boost_elite" && (
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-bright" /> Priority curation matches</li>
                )}
              </ul>
              <button
                data-testid={`checkout-btn-${p.id}`}
                onClick={() => checkout(p.id)}
                disabled={loading === p.id}
                className={`${highlight(p.id) ? "btn-violet" : "btn-primary"} mt-8 w-full disabled:opacity-60`}
              >
                {loading === p.id ? "Redirecting…" : "Buy this slot →"}
              </button>
            </motion.div>
          ))}
        </div>
        <p className="mt-10 text-xs text-white/40">
          Test mode. Use card <span className="font-mono text-white/60">4242 4242 4242 4242</span>, any future date, any CVC.
        </p>
        <div className="h-32" />
      </div>
    </div>
  );
}

export function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState({ status: "pending" });
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    if (status.payment_status === "paid" || attempts >= 10) return;
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/payments/status/${sessionId}`);
        setStatus(data);
      } catch (e) {
        /* ignore */
      }
      setAttempts((a) => a + 1);
    }, 2000);
    return () => clearTimeout(t);
  }, [sessionId, attempts, status.payment_status]);

  const paid = status.payment_status === "paid";
  const timeout = attempts >= 10 && !paid;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0A0A0A] p-10 text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          /payment · {sessionId?.slice(0, 12)}…
        </div>
        {paid ? (
          <>
            <h1 className="mt-6 font-display text-5xl leading-tight text-white">
              You're featured. ✦
            </h1>
            <p className="mt-4 text-white/60">
              Your Featured slot is live. Editors and creators will start seeing you at the top of the roster.
            </p>
            <Link to="/editor" data-testid="success-dashboard-btn" className="btn-violet mt-8 inline-flex">
              Go to dashboard →
            </Link>
          </>
        ) : timeout ? (
          <>
            <h1 className="mt-6 font-display text-4xl text-white">Still processing…</h1>
            <p className="mt-4 text-white/60">Refresh in a moment — the webhook will finalize your boost.</p>
          </>
        ) : (
          <>
            <h1 className="mt-6 font-display text-4xl text-white">Confirming payment…</h1>
            <div className="mx-auto mt-6 h-1 w-40 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-violet" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function PaymentCancel() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0A0A0A] p-10 text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          /payment
        </div>
        <h1 className="mt-6 font-display text-5xl text-white">Cancelled.</h1>
        <p className="mt-4 text-white/60">No charges made. Come back when you're ready.</p>
        <Link to="/pricing" data-testid="cancel-back-btn" className="btn-ghost mt-8 inline-flex">
          ← Back to pricing
        </Link>
      </div>
    </div>
  );
}
