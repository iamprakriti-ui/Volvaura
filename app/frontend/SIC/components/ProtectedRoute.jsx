import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (user === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="font-mono text-xs uppercase tracking-widest text-white/40">
          Loading…
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    // send them to their correct dashboard
    const target = user.role === "editor" ? "/editor" : "/creator";
    return <Navigate to={target} replace />;
  }
  return children;
}
