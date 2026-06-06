import { useState, useEffect } from "react";
import "./App.css";
import { authApi, workerApi } from "./api";
import LoginForm            from "./pages/LoginForm";
import SignupPicker         from "./pages/SignupPicker";
import ResetPassword        from "./pages/ResetPassword";
import Explore              from "./pages/Explore";
import HomePage             from "./pages/HomePage";
import GoogleCompleteSignup from "./pages/GoogleCompleteSignup";
import Onboarding           from "./pages/Onboarding/Onboarding";
import Profile              from "./pages/Profile";
import ReservationsPage     from "./pages/ReservationsPage";
import AuthModal            from "./components/AuthModal";
import AdminLoginModal      from "./components/AdminLoginModal";
import AdminDashboard       from "./pages/AdminDashboard";
import EmailVerification    from "./pages/EmailVerification";
import ReservationDialog    from "./components/ReservationDialog";
import ChatBot              from "./components/ChatBot";
import SavedWorkersPage     from "./pages/SavedWorkersPage";
import WorkerDashboard      from "./pages/WorkerDashboard";
import Settings             from "./pages/Settings";

export default function App() {
  const [mode, setMode]             = useState("home");
  const [signupType, setSignupType] = useState(null);
  const [exiting, setExiting]       = useState(false);
  const [panelKey, setPanelKey]     = useState(0);
  const [activePage, setActivePage] = useState("explore");
  const [profileTarget, setProfileTarget] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileTab, setProfileTab] = useState("overview");
  const [resetToken, setResetToken]             = useState(null);
  const [googleCredential, setGoogleCredential] = useState(null);
  const [onboardingUser, setOnboardingUser]     = useState(null);
  const [authModalOpen, setAuthModalOpen]       = useState(false);
  const [authModalMode, setAuthModalMode]       = useState("login");
  const [pendingEmailVerification, setPendingEmailVerification] = useState(null);

  const [admin, setAdmin] = useState(() => {
    try {
      const a = localStorage.getItem("admin");
      return a ? JSON.parse(a) : null;
    } catch { return null; }
  });

  const [pendingReservation, setPendingReservation] = useState(() => {
    try {
      const raw = localStorage.getItem("pendingReservation");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [loggedUser, setLoggedUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });

  // ── SYNC MODE FROM URL ON LOAD ──────────────────────────────────────────
  // Each in-app page has its own URL so refresh restores the correct page.
  useEffect(() => {
    const path = window.location.pathname.replace(/^\//, "");

    if (admin) {
      setMode("admin-dashboard");
      return;
    }

    switch (path) {
      case "explore":
        setMode("explore");
        window.history.replaceState({ mode:"explore" }, "", "/explore");
        break;

      case "profile":
        setMode("app");
        setActivePage("profile");
        setProfileTarget(null);
        window.history.replaceState({ mode:"app", activePage:"profile" }, "", "/profile");
        break;

      case "reservations":
        setMode("app");
        setActivePage("reservations");
        window.history.replaceState({ mode:"app", activePage:"reservations" }, "", "/reservations");
        break;

      case "dashboard":
        setMode("app");
        setActivePage("dashboard");
        window.history.replaceState({ mode:"app", activePage:"dashboard" }, "", "/dashboard");
        break;

      case "saved":
        setMode("app");
        setActivePage("saved");
        window.history.replaceState({ mode:"app", activePage:"saved" }, "", "/saved");
        break;

      case "settings":
        setMode("app");
        setActivePage("settings");
        window.history.replaceState({ mode:"app", activePage:"settings" }, "", "/settings");
        break;

      case "app":
        setMode("explore");
        window.history.replaceState({ mode:"explore" }, "", "/explore");
        break;

      case "":
      case "home":
        setMode("home");
        window.history.replaceState({ mode:"home" }, "", "/");
        break;

      default:
        if (path.startsWith("profile/")) {
          const wId = path.replace("profile/", "");
          setMode("app");
          setActivePage("profile");
          setProfileTarget(null);
          window.history.replaceState({ mode:"app", activePage:"profile" }, "", `/${path}`);
          setProfileLoading(true);
          workerApi.getById(wId)
            .then((w) => setProfileTarget(w))
            .catch(() => setProfileTarget(null))
            .finally(() => setProfileLoading(false));
        } else {
          setMode("home");
          window.history.replaceState({ mode:"home" }, "", "/");
        }
        break;
    }
  }, [admin]);

  // ── HANDLE BACK / FORWARD BUTTON ───────────────────────────────────────
  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      if (state?.mode) {
        setMode(state.mode);
        if (state?.activePage) setActivePage(state.activePage);
        if (state?.profileTarget) setProfileTarget(state.profileTarget);
        else setProfileTarget(null);
        setProfileTab(state?.profileTab || "overview");
      } else {
        // No state — reconstruct from URL (e.g. initial page load entry)
        const path = window.location.pathname.replace(/^\//, "");
        const APP_PAGES = ["reservations","dashboard","saved","profile","settings"];
        if (path === "explore") {
          setMode("explore");
        } else if (APP_PAGES.includes(path) || path.startsWith("profile/")) {
          setMode("app");
          setActivePage(path.startsWith("profile/") ? "profile" : path);
          setProfileTarget(null);
        } else {
          setMode("home");
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ── DETECT RESET TOKEN ──────────────────────────────────────────────────
  useEffect(() => {
    const match = window.location.pathname.match(/^\/reset-password\/(.+)$/);
    if (match) setResetToken(match[1]);
  }, []);

  // ── NAVIGATION HELPERS ──────────────────────────────────────────────────
  const switchTo = (newMode, newType = null) => {
    setAuthModalOpen(false);
    const path = newMode === "home" ? "/" : `/${newMode}`;
    window.history.pushState({ mode: newMode }, "", path);
    setExiting(true);
    setTimeout(() => {
      setMode(newMode);
      setSignupType(newType);
      setPanelKey((k) => k + 1);
      setExiting(false);
    }, 150);
  };

  /**
   * Navigate to an in-app page.
   * Each page gets its own URL so browser refresh restores correctly:
   *   explore      → /explore
   *   profile      → /profile
   *   reservations → /reservations
   *   dashboard    → /dashboard
   */
  const handleNavigate = (page, state = {}) => {
    if (page === "explore") {
      switchTo("explore");
      return;
    }

    // ── FIX: push a distinct URL per page, not always "/app" ─────────────
    const pageUrlMap = {
      reservations: "/reservations",
      dashboard:    "/dashboard",
      saved:        "/saved",
      settings:     "/settings",
    };

    setMode("app");
    setActivePage(page);

    if (page === "profile") {
      const target = state?.profileUser || null;
      setProfileTarget(target);
      setProfileTab(state?.profileTab || "overview");
      const targetId = target?._id || target?.id;
      const url = targetId ? `/profile/${targetId}` : "/profile";
      window.history.pushState({ mode:"app", activePage:"profile", profileTab: state?.profileTab||"overview" }, "", url);
    } else {
      setProfileTarget(null);
      setProfileTab("overview");
      const url = pageUrlMap[page] || `/${page}`;
      window.history.pushState({ mode:"app", activePage:page }, "", url);
    }
  };

  const onSuccess = (user) => {
    // If email not verified, show verification screen
    if (!user.isVerified) {
      setPendingEmailVerification(user.email);
      return;
    }

    // If onboarding not complete, show onboarding
    if (!user.onboardingComplete) {
      setOnboardingUser(user);
      return;
    }

    // Otherwise, log in
    setLoggedUser(user);
    localStorage.setItem("user", JSON.stringify(user));
    const pending = localStorage.getItem("pendingReservation");
    if (pending) {
      try { setPendingReservation(JSON.parse(pending)); } catch { /* ignore */ }
    }
    switchTo("explore");
  };

  const onLogout = () => {
    localStorage.clear();
    setLoggedUser(null);
    setProfileTarget(null);
    switchTo("home");
  };

  const Redirect = ({ to }) => {
    useEffect(() => { switchTo(to); }, [to]);
    return null;
  };

  const openAuthModal = (m = "login") => {
    setAuthModalMode(m);
    setAuthModalOpen(true);
  };

  const authModalNode = authModalOpen ? (
    <AuthModal
      mode={authModalMode}
      onClose={() => setAuthModalOpen(false)}
      onSuccess={onSuccess}
    />
  ) : null;

  const adminLoginNode = mode === "admin-login" ? (
    <AdminLoginModal
      onClose={() => setMode("home")}
      onSuccess={(adminData) => {
        setAdmin(adminData);
        setMode("admin-dashboard");
      }}
    />
  ) : null;

  // ── RESET PASSWORD ──────────────────────────────────────────────────────
  if (resetToken) {
    return <ResetPassword token={resetToken} />;
  }

  // ── EMAIL VERIFICATION ──────────────────────────────────────────────────
  if (pendingEmailVerification) {
    return (
      <EmailVerification
        email={pendingEmailVerification}
        onSuccess={(result) => {
          const user = result?.user;
          const token = result?.token;
          if (!user) return;
          setPendingEmailVerification(null);
          if (token) {
            localStorage.setItem("token", token);
          }
          if (!user.onboardingComplete) {
            setOnboardingUser(user);
          } else {
            setLoggedUser(user);
            localStorage.setItem("user", JSON.stringify(user));
            switchTo("explore");
          }
        }}
        onResendCode={(email) => authApi.resendVerificationCode(email)}
      />
    );
  }

  // ── ONBOARDING ──────────────────────────────────────────────────────────
  if (onboardingUser) {
    return (
      <Onboarding
        user={onboardingUser}
        onComplete={(u) => {
          setLoggedUser(u);
          setOnboardingUser(null);
          switchTo("explore");
        }}
      />
    );
  }

  // ── ADMIN DASHBOARD ─────────────────────────────────────────────────────
  if (mode === "admin-dashboard" && admin) {
    return (
      <AdminDashboard
        admin={admin}
        onLogout={() => {
          setAdmin(null);
          switchTo("home");
        }}
      />
    );
  }

  // ── ADMIN LOGIN MODAL ───────────────────────────────────────────────────
  if (mode === "admin-login") {
    return adminLoginNode;
  }

  // ── Shared chatbot node for all logged-in routes ────────────────────────
  const chatBotNode = (
    <ChatBot
      user={loggedUser}
      onViewWorker={(worker) => handleNavigate("profile", { profileUser: worker })}
    />
  );

  // ── EXPLORE ─────────────────────────────────────────────────────────────
  if (mode === "explore") {
    return (
      <>
        <Explore
          onHome={() => switchTo("home")}
          onExplore={() => switchTo("explore")}
          onReserveWorker={(worker) => {
            if (loggedUser) {
              setPendingReservation(worker);
            } else {
              localStorage.setItem("pendingReservation", JSON.stringify(worker));
              openAuthModal("login");
            }
          }}
          user={loggedUser}
          onLogout={onLogout}
          onLogin={() => openAuthModal("login")}
          onSignup={() => openAuthModal("signup")}
          onNavigate={handleNavigate}
        />
        {authModalNode}
        {pendingReservation && loggedUser && (
          <ReservationDialog
            worker={pendingReservation}
            user={loggedUser}
            onClose={() => {
              setPendingReservation(null);
              localStorage.removeItem("pendingReservation");
            }}
            onSuccess={() => {
              setPendingReservation(null);
              localStorage.removeItem("pendingReservation");
            }}
          />
        )}
        {chatBotNode}
      </>
    );
  }

  // ── LOGGED-IN ROUTES ────────────────────────────────────────────────────
  if (loggedUser) {

    if (mode === "home") {
      return (
        <>
          <HomePage
            onLogin={() => openAuthModal("login")}
            onSignup={() => openAuthModal("signup")}
            onExplore={() => switchTo("explore")}
            user={loggedUser}
            onLogout={onLogout}
            onNavigate={handleNavigate}
            onAdminAccess={() => setMode("admin-login")}
          />
          {authModalNode}
          {adminLoginNode}
          {chatBotNode}
        </>
      );
    }

    // ── Profile ────────────────────────────────────────────────────────────
    if (mode === "app" && activePage === "profile") {
      if (profileLoading) {
        return (
          <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f8fafc" }}>
            <div style={{ fontSize:13, color:"#94a3b8", fontFamily:"'Sora',sans-serif" }}>Chargement du profil…</div>
          </div>
        );
      }
      return (
        <>
          <Profile
            key={profileTarget?._id || profileTarget?.id || loggedUser?._id}
            profileUser={profileTarget || loggedUser}
            currentUser={loggedUser}
            initialTab={profileTab}
            onBack={() => switchTo("explore")}
            onHome={() => switchTo("home")}
            onNavigate={handleNavigate}
            onLogout={onLogout}
            onUpdateUser={(updated) => {
              setLoggedUser(updated);
              localStorage.setItem("user", JSON.stringify(updated));
            }}
          />
          {authModalNode}
          {chatBotNode}
        </>
      );
    }

    // ── Reservations ───────────────────────────────────────────────────────
    if (mode === "app" && activePage === "reservations") {
      return (
        <>
          <ReservationsPage
            user={loggedUser}
            onHome={() => switchTo("home")}
            onNavigate={handleNavigate}
            onLogout={onLogout}
          />
          {authModalNode}
          {chatBotNode}
        </>
      );
    }

    // ── Dashboard (workers only) ───────────────────────────────────────────
    if (mode === "app" && activePage === "dashboard") {
      return (
        <>
          <WorkerDashboard
            user={loggedUser}
            onHome={() => switchTo("home")}
            onNavigate={handleNavigate}
            onLogout={onLogout}
          />
          {authModalNode}
          {chatBotNode}
        </>
      );
    }

    // ── Saved Workers ──────────────────────────────────────────────────────
    if (mode === "app" && activePage === "saved") {
      return (
        <>
          <SavedWorkersPage
            user={loggedUser}
            onHome={() => switchTo("home")}
            onNavigate={handleNavigate}
            onLogout={onLogout}
          />
          {chatBotNode}
        </>
      );
    }

    // ── Settings ───────────────────────────────────────────────────────────
    if (mode === "app" && activePage === "settings") {
      return (
        <>
          <Settings
            user={loggedUser}
            onNavigate={handleNavigate}
            onLogout={onLogout}
            onUpdateUser={(updated) => {
              setLoggedUser(updated);
              localStorage.setItem("user", JSON.stringify(updated));
            }}
          />
          {chatBotNode}
        </>
      );
    }

    // stray /app — redirect to explore
    if (mode === "app") {
      return <Redirect to="explore" />;
    }
  }

  // ── UNAUTHENTICATED user hits a protected route — redirect to explore ───
  if (mode === "app") {
    return <Redirect to="explore" />;
  }

  // ── PUBLIC HOME ─────────────────────────────────────────────────────────
  if (mode === "home") {
    return (
      <>
        <HomePage
          onLogin={() => openAuthModal("login")}
          onSignup={() => openAuthModal("signup")}
          onExplore={() => switchTo("explore")}
          onAdminAccess={() => setMode("admin-login")}
        />
        {authModalNode}
        {adminLoginNode}
      </>
    );
  }

  // ── AUTH SCREENS ────────────────────────────────────────────────────────
  return (
    <>
      <div className="main">
        <button onClick={() => switchTo("home")}>← Home</button>
        <button
          onClick={() => setMode("admin-login")}
          style={{
            position: "fixed", bottom: 20, right: 20,
            padding: "10px 16px", background: "#0f172e", color: "#06b6d4",
            border: "none", borderRadius: 8, cursor: "pointer",
            fontSize: 12, fontWeight: 700,
          }}
        >
          Admin Access
        </button>
        {mode === "login"  && <LoginForm onSuccess={onSuccess} />}
        {mode === "signup" && <SignupPicker />}
      </div>
      {authModalNode}
      <ChatBot
        user={loggedUser}
        onViewWorker={(worker) => handleNavigate("profile", { profileUser: worker })}
      />
    </>
  );
}