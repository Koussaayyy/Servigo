import { useState, useEffect } from "react";
import "./App.css";
import SidePanel            from "./components/SidePanel";
import LoginForm            from "./pages/LoginForm";
import SignupPicker         from "./pages/SignupPicker";
import ClientSignup         from "./pages/ClientSignup";
import WorkerSignup         from "./pages/WorkerSignup";
import ResetPassword        from "./pages/ResetPassword";
import Explore              from "./pages/Explore";
import HomePage             from "./pages/HomePage";
import GoogleCompleteSignup from "./pages/GoogleCompleteSignup";
import Onboarding           from "./pages/Onboarding/Onboarding";
import AppLayout            from "./components/AppLayout";
import Profile              from "./pages/Profile";
import Dashboard            from "./components/Dashboard";
import ReservationsPage     from "./pages/ReservationsPage";
import AuthModal            from "./components/AuthModal";
import AdminLogin           from "./pages/AdminLogin";
import AdminDashboard       from "./pages/AdminDashboard";

export default function App() {
  const [mode, setMode]             = useState("home");
  const [signupType, setSignupType] = useState(null);
  const [exiting, setExiting]       = useState(false);
  const [panelKey, setPanelKey]     = useState(0);

  // Always start on dashboard — never restore "profile" from storage on refresh
  const [activePage, setActivePage] = useState("dashboard");

  // The user whose profile to display (null = own profile)
  const [profileTarget, setProfileTarget] = useState(null);

  const [resetToken, setResetToken]             = useState(null);
  const [googleCredential, setGoogleCredential] = useState(null);
  const [onboardingUser, setOnboardingUser]     = useState(null);
  const [authModalOpen, setAuthModalOpen]       = useState(false);
  const [authModalMode, setAuthModalMode]       = useState("login");

  // Admin state
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
  useEffect(() => {
    const path = window.location.pathname.replace("/", "");
    
    // If admin is in localStorage, restore admin mode
    if (admin) {
      setMode("admin-dashboard");
      return;
    }
    
    if (path === "explore") {
      setMode("explore");
    } else if (path === "app") {
      setMode("app");
      // On a hard refresh of /app, always land on dashboard — never profile
      setActivePage("dashboard");
      setProfileTarget(null);
    } else if (path) {
      setMode(path);
    }
  }, [admin]);

  // ── HANDLE BACK / FORWARD BUTTON ───────────────────────────────────────
  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      if (state?.mode) {
        setMode(state.mode);
        if (state?.activePage)    setActivePage(state.activePage);
        if (state?.profileTarget) setProfileTarget(state.profileTarget);
        else                      setProfileTarget(null);
      } else {
        const path = window.location.pathname.replace("/", "");
        setMode(path || "home");
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
   *
   * onNavigate("profile")                          → own profile (no sidebar)
   * onNavigate("profile", { profileUser: worker }) → another user's profile
   * onNavigate("dashboard")                        → dashboard (with sidebar)
   * onNavigate("reservations")                     → reservations (with sidebar)
   */
  const handleNavigate = (page, state = {}) => {
    setMode("app");
    setActivePage(page);

    if (page === "profile") {
      setProfileTarget(state?.profileUser || null);
    } else {
      setProfileTarget(null);
    }

    window.history.pushState(
      { mode: "app", activePage: page, profileTarget: state?.profileUser || null },
      "",
      "/app"
    );
  };

  const onSuccess = (user) => {
    if (!user.onboardingComplete) {
      setOnboardingUser(user);
      return;
    }
    setLoggedUser(user);
    setActivePage("dashboard");
  };

  const onLogout = () => {
    localStorage.clear();
    setLoggedUser(null);
    setProfileTarget(null);
    switchTo("home");
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

  // ── RESET PASSWORD ──────────────────────────────────────────────────────
  if (resetToken) {
    return <ResetPassword token={resetToken} />;
  }

  // ── ONBOARDING ──────────────────────────────────────────────────────────
  if (onboardingUser) {
    return (
      <Onboarding
        user={onboardingUser}
        onComplete={(u) => {
          setLoggedUser(u);
          setOnboardingUser(null);
        }}
      />
    );
  }

  // ── ADMIN LOGIN ──────────────────────────────────────────────────────────
  if (mode === "admin-login") {
    return (
      <AdminLogin
        onSuccess={(adminData) => {
          setAdmin(adminData);
          setMode("admin-dashboard");
        }}
      />
    );
  }

  // ── ADMIN DASHBOARD ──────────────────────────────────────────────────────
  if (mode === "admin-dashboard" && admin) {
    return (
      <AdminDashboard
        admin={admin}
        onLogout={() => {
          setAdmin(null);
          setMode("home");
        }}
      />
    );
  }

  // ── EXPLORE ─────────────────────────────────────────────────────────────
  if (mode === "explore") {
    return (
      <>
        <Explore
          onHome={() => switchTo("home")}
          onExplore={() => switchTo("explore")}
          onReserveWorker={() => {
            setActivePage("reservations");
            setMode("app");
          }}
          user={loggedUser}
          onLogout={onLogout}
          onLogin={() => openAuthModal("login")}
          onSignup={() => openAuthModal("signup")}
          onNavigate={handleNavigate}
        />
        {authModalNode}
      </>
    );
  }

  // ── LOGGED-IN USER ───────────────────────────────────────────────────────
  if (loggedUser) {

    // Home page (logged in)
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
        </>
      );
    }

    // ── PROFILE — standalone, NO AppLayout sidebar ───────────────────────
    if (activePage === "profile") {
      return (
        <Profile
          profileUser={profileTarget || loggedUser}
          currentUser={loggedUser}
          onBack={() => setActivePage("dashboard")}
          onHome={() => switchTo("home")}
          onNavigate={handleNavigate}
          onLogout={onLogout}
        />
      );
    }

    // ── ALL OTHER PAGES — wrapped in AppLayout (sidebar visible) ─────────
    return (
      <AppLayout user={loggedUser} onLogout={onLogout}>
        {activePage === "reservations" && <ReservationsPage user={loggedUser} />}
        {activePage === "dashboard"    && <Dashboard        user={loggedUser} />}
      </AppLayout>
    );
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
      </>
    );
  }

  // ── AUTH SCREENS ────────────────────────────────────────────────────────
  return (
    <>
      <SidePanel />
      <div className="main">
        <button onClick={() => switchTo("home")}>← Home</button>
        <button 
          onClick={() => setMode("admin-login")}
          style={{ position: "fixed", bottom: 20, right: 20, padding: "10px 16px", background: "#0f172e", color: "#06b6d4", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}
        >
          Admin Access
        </button>
        {mode === "login"  && <LoginForm   onSuccess={onSuccess} />}
        {mode === "signup" && <SignupPicker />}
      </div>
      {authModalNode}
    </>
  );
}