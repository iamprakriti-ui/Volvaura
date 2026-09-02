import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiErrorDetail, api } from "@/lib/api";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const u = await login(email, password);
      navigate(u.role === "editor" ? "/editor" : "/creator");
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to the room.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" value={email} onChange={setEmail} type="email" testid="login-email-input" />
        <Field label="Password" value={password} onChange={setPassword} type="password" testid="login-password-input" />
        {err && <div data-testid="login-error" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
        <button data-testid="login-submit-btn" disabled={loading} className="btn-violet w-full disabled:opacity-60">
          {loading ? "Signing in…" : "Sign in →"}
        </button>
      </form>
      <div className="mt-6 flex items-center justify-between text-sm text-white/60">
        <Link data-testid="forgot-password-link" to="/forgot-password" className="hover:text-white">
          Forgot password?
        </Link>
        <Link data-testid="go-register-link" to="/register" className="hover:text-white">
          Create account →
        </Link>
      </div>
    </AuthShell>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("creator");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const u = await register({ name, email, password, role });
      navigate(u.role === "editor" ? "/editor" : "/creator");
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Join Volvaura" subtitle="Two-sided. Curated. Hand-picked.">
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-full border border-white/10 bg-black p-1">
        {["creator", "editor"].map((r) => (
          <button
            key={r}
            data-testid={`role-toggle-${r}`}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-full px-4 py-2 text-sm capitalize transition ${
              role === r ? "bg-violet text-white" : "text-white/60 hover:text-white"
            }`}
          >
            I'm a {r}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" value={name} onChange={setName} testid="register-name-input" />
        <Field label="Email" value={email} onChange={setEmail} type="email" testid="register-email-input" />
        <Field label="Password (6+)" value={password} onChange={setPassword} type="password" testid="register-password-input" />
        {err && <div data-testid="register-error" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
        <button data-testid="register-submit-btn" disabled={loading} className="btn-violet w-full disabled:opacity-60">
          {loading ? "Creating…" : `Create ${role} account →`}
        </button>
      </form>
      <div className="mt-6 text-center text-sm text-white/60">
        Already in? <Link data-testid="go-login-link" to="/login" className="text-white underline">Sign in</Link>
      </div>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setErr(formatApiErrorDetail(err.response?.data?.detail));
    }
  };
  return (
    <AuthShell title="Forgot password" subtitle="We'll send you a reset link.">
      {sent ? (
        <div data-testid="forgot-sent-msg" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          If an account exists for <b>{email}</b>, a reset link has been sent. Check the backend logs in dev mode.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email" value={email} onChange={setEmail} type="email" testid="forgot-email-input" />
          {err && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
          <button data-testid="forgot-submit-btn" className="btn-violet w-full">Send reset link →</button>
        </form>
      )}
      <div className="mt-6 text-center text-sm text-white/60">
        <Link to="/login" className="hover:text-white">← Back to sign in</Link>
      </div>
    </AuthShell>
  );
}

export function ResetPassword() {
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await api.post("/auth/reset-password", { token, new_password: pwd });
      setMsg("Password updated. You can now sign in.");
    } catch (err) {
      setErr(formatApiErrorDetail(err.response?.data?.detail));
    }
  };
  return (
    <AuthShell title="Reset password" subtitle="Choose a new password.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password" value={pwd} onChange={setPwd} type="password" testid="reset-pwd-input" />
        {err && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
        {msg && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{msg} <Link to="/login" className="underline">Sign in →</Link></div>}
        <button data-testid="reset-submit-btn" className="btn-violet w-full">Reset password →</button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="relative min-h-screen bg-[#050505] pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-violet/30 blur-[160px] animate-float-slow" />
      </div>
      <div className="mx-auto flex max-w-md flex-col items-stretch px-6 py-16">
        <Link to="/" className="mb-8 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40 hover:text-white">
          ← Volvaura
        </Link>
        <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-white">{title}</h1>
        <div className="mt-3 text-white/60">{subtitle}</div>
        <div className="glass mt-10 rounded-2xl p-8">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", testid }) {
  return (
    <label className="block">
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-white/40">{label}</div>
      <input
        data-testid={testid}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet focus:outline-none focus:ring-1 focus:ring-violet"
      />
    </label>
  );
}
