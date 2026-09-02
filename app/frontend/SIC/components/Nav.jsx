import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { to: "/editors", label: "Browse editors" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
];

export default function Nav() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const dashHref = user && user.role === "editor" ? "/editor" : "/creator";

  return (
    <header
      data-testid="site-nav"
      className="fixed inset-x-0 top-0 z-50 border-b border-white/5"
    >
      <div className="glass">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
          <Link
            to="/"
            data-testid="nav-logo"
            className="group flex items-center gap-2"
          >
            <span className="relative inline-block h-2.5 w-2.5 rounded-full bg-violet">
              <span className="absolute inset-0 animate-ping rounded-full bg-violet/70" />
            </span>
            <span className="font-display text-lg tracking-tight text-white">
              VOLVAURA
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 sm:inline">
              /agency
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                data-testid={`nav-link-${l.to.replace(/\//g, "")}`}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {user && user !== false ? (
              <>
                <Link
                  to={dashHref}
                  data-testid="nav-dashboard-btn"
                  className="btn-ghost !py-2 !px-4"
                >
                  Dashboard
                </Link>
                <button
                  data-testid="nav-logout-btn"
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                  className="btn-ghost !py-2 !px-4"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  data-testid="nav-login-btn"
                  className="btn-ghost !py-2 !px-4"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  data-testid="nav-register-btn"
                  className="btn-violet !py-2 !px-4"
                >
                  Join Volvaura
                </Link>
              </>
            )}
          </div>

          <button
            data-testid="nav-mobile-toggle"
            className="btn-ghost !py-2 !px-3 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-white/5 px-6 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5"
                >
                  {l.label}
                </NavLink>
              ))}
              <div className="mt-2 h-px w-full bg-white/10" />
              {user && user !== false ? (
                <Link
                  to={dashHref}
                  onClick={() => setOpen(false)}
                  className="btn-violet w-full"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="btn-ghost flex-1"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="btn-violet flex-1"
                  >
                    Join
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
