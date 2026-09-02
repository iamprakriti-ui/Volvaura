import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import SmoothScroll from "@/components/SmoothScroll";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";

import Landing from "@/pages/Landing";
import BrowseEditors from "@/pages/BrowseEditors";
import EditorProfile from "@/pages/EditorProfile";
import Login, { Register, ForgotPassword, ResetPassword } from "@/pages/auth/Auth";
import { HowItWorks, About, Contact, FAQ } from "@/pages/StaticPages";
import { CreatorHome, NewProject, MyProjects, CreatorRequests, SavedEditors } from "@/pages/creator/CreatorPages";
import { EditorHome, EditorPortfolio, EditorRequests, EditorSettings } from "@/pages/editor/EditorPages";

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function Shell() {
  const { pathname } = useLocation();
  const hideFooter = pathname.startsWith("/creator") || pathname.startsWith("/editor") || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/editors" element={<BrowseEditors />} />
        <Route path="/editors/:id" element={<EditorProfile />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/creator"
          element={
            <ProtectedRoute role="creator">
              <DashboardLayout role="creator" />
            </ProtectedRoute>
          }
        >
          <Route index element={<CreatorHome />} />
          <Route path="new" element={<NewProject />} />
          <Route path="projects" element={<MyProjects />} />
          <Route path="requests" element={<CreatorRequests />} />
          <Route path="saved" element={<SavedEditors />} />
        </Route>

        <Route
          path="/editor"
          element={
            <ProtectedRoute role="editor">
              <DashboardLayout role="editor" />
            </ProtectedRoute>
          }
        >
          <Route index element={<EditorHome />} />
          <Route path="portfolio" element={<EditorPortfolio />} />
          <Route path="requests" element={<EditorRequests />} />
          <Route path="settings" element={<EditorSettings />} />
        </Route>
      </Routes>
      {!hideFooter && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SmoothScroll>
          <ScrollTop />
          <Shell />
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "#0A0A0A",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
              },
            }}
          />
        </SmoothScroll>
      </BrowserRouter>
    </AuthProvider>
  );
}
