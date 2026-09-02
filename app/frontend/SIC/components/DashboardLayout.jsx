import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, PlusSquare, Folder, Send, Bookmark, Palette, Inbox, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CREATOR_LINKS = [
  { to: "/creator", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/creator/new", label: "New project", icon: PlusSquare },
  { to: "/creator/projects", label: "My projects", icon: Folder },
  { to: "/creator/requests", label: "Requests", icon: Send },
  { to: "/creator/saved", label: "Saved editors", icon: Bookmark },
];

const EDITOR_LINKS = [
  { to: "/editor", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/editor/portfolio", label: "Portfolio", icon: Palette },
  { to: "/editor/requests", label: "Incoming", icon: Inbox },
  { to: "/editor/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = role === "editor" ? EDITOR_LINKS : CREATOR_LINKS;

  return (
    <div className="min-h-screen bg-[#050505] pt-24">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-4 lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 px-2 py-2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">Signed in as</div>
            <div className="mt-1 truncate font-display text-lg text-white">{user?.name}</div>
            <div className="truncate text-xs capitalize text-violet-bright">/{user?.role}</div>
          </div>
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                data-testid={`sidebar-link-${l.label.toLowerCase().replace(/\s/g, "-")}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                    isActive ? "bg-violet/15 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 border-t border-white/10 pt-4">
            <button
              data-testid="sidebar-logout-btn"
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </aside>

        <main className="min-h-[70vh]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
