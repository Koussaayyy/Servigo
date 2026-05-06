import { useState, useEffect } from "react";
import "./App.css";
import LoginForm              from "./pages/LoginForm";
import SignupPicker           from "./pages/SignupPicker";
import ResetPassword          from "./pages/ResetPassword";
import Explore                from "./pages/Explore";
import HomePage               from "./pages/HomePage";
import GoogleCompleteSignup   from "./pages/GoogleCompleteSignup";
import Onboarding             from "./pages/Onboarding/Onboarding";
import Profile                from "./pages/Profile";
import ReservationsManagePage from "./pages/ReservationsManagePage";
import AuthModal              from "./components/AuthModal";
import AdminLoginModal        from "./components/AdminLoginModal";
import AdminDashboard         from "./pages/AdminDashboard";
import SavedWorkers           from "./pages/SavedWorkers";
import ReservationDialog      from "./components/ReservationDialog";

export default function App() {
  const [mode, setMode]             = useState("home");
  const [signupType, setSignupType] = useState(null);
  const [exiting, setExiting]       = useState(false);
  const [panelKey, setPanelKey]     = useState(0);
  const [activePage, setActivePage] = useState("explore");
  const [profileTarget, setProfileTarget]         = useState(null);
  const [profileInitialTab, setProfileInitialTab] = useState("overview");
  const [resetToken, setResetToken]               = useState(null);
  const [googleCredential, setGoogleCredential]   = useState(null);
  const [onboardingUser, setOnboardingUser]       = useState(null);
  const [authModalOpen, setAuthModalOpen]         = useState(false);
  const [authModalMode, setAuthModalMode]         = useState("login");
  const [reservDialog, setReservDialog]           = useState(null);

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
    const path = window.location.pathname.replace(/^\//, "");

    if (admin) {
      setMode("admin-dashboard");
      return;
    }

    switch (path) {
      case "explore":
        setMode("explore");
        break;
      case "profile":
        setMode("app");
        setActivePage("profile");
        break;
      case "reservations":
        setMode("app");
        setActivePage("reservations");
        break;
      case "dashboard":
        setMode("app");
        setActivePage("dashboard");
        break;
      case "app":
        setMode("explore");
        window.history.replaceState({ mode: "explore" }, "", "/explore");
        break;
      case "":
      case "home":
        setMode("home");
        break;
      default:
        setMode(path);
        break;
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
        setProfileInitialTab(state?.profileInitialTab || "overview");
      } else {
        const path = window.location.pathname.replace(/^\//, "");
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

  const handleNavigate = (page, state = {}) => {
    if (page === "explore") {
      switchTo("explore");
      return;
    }

    if (page === "portfolio") {
      setMode("app");
      setActivePage("profile");
      setProfileTarget(null);
      setProfileInitialTab("portfolio");
      window.history.pushState({ mode: "app", activePage: "profile", profileInitialTab: "portfolio" }, "", "/profile");
      return;
    }

    const pageUrlMap = {
      profile:      "/profile",
      reservations: "/reservations",
      dashboard:    "/dashboard",
      saved:        "/saved",
    };
    const url = pageUrlMap[page] || `/${page}`;

    setMode("app");
    setActivePage(page);

    if (page === "profile") {
      setProfileTarget(state?.profileUser || null);
      setProfileInitialTab(state?.tab || "overview");
    } else {
      setProfileTarget(null);
      setProfileInitialTab("overview");
    }

    window.history.pushState(
      { mode: "app", activePage: page, profileTarget: state?.profileUser || null, profileInitialTab: state?.tab || "overview" },
      "",
      url,
    );
  };

  const onSuccess = (user) => {
    if (!user.onboardingComplete) {
      setOnboardingUser(user);
      return;
    }
    setLoggedUser(user);
    switchTo("explore");
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

  // ── DIALOG & HELPERS ────────────────────────────────────────────────────
  const handleReserveWorker = (worker) => {
    if (!loggedUser) { openAuthModal("login"); return; }
    setReservDialog({ worker });
  };

  const reservDialogNode = reservDialog && loggedUser ? (
    <ReservationDialog
      worker={reservDialog.worker}
      user={loggedUser}
      onClose={() => setReservDialog(null)}
      onSuccess={() => { setReservDialog(null); handleNavigate("reservations"); }}
    />
  ) : null;

  // ── EXPLORE ─────────────────────────────────────────────────────────────
  if (mode === "explore") {
    return (
      <>
        <Explore
          onHome={() => switchTo("home")}
          onExplore={() => switchTo("explore")}
          onReserveWorker={handleReserveWorker}
          user={loggedUser}
          onLogout={onLogout}
          onLogin={() => openAuthModal("login")}
          onSignup={() => openAuthModal("signup")}
          onNavigate={handleNavigate}
        />
        {authModalNode}
        {reservDialogNode}
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
        </>
      );
    }

    if (mode === "app" && activePage === "profile") {
      return (
        <>
          <Profile
            profileUser={profileTarget || loggedUser}
            currentUser={loggedUser}
            initialTab={profileInitialTab}
            onBack={() => switchTo("explore")}
            onHome={() => switchTo("home")}
            onNavigate={handleNavigate}
            onLogout={onLogout}
            onReserveWorker={handleReserveWorker}
            onProfileUpdate={(updatedUser) => {
              setLoggedUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
            }}
          />
          {authModalNode}
          {reservDialogNode}
        </>
      );
    }

    if (mode === "app" && activePage === "reservations") {
      return (
        <>
          <ReservationsManagePage
            user={loggedUser}
            onHome={() => switchTo("home")}
            onNavigate={handleNavigate}
            onLogout={onLogout}
          />
          {authModalNode}
        </>
      );
    }

    if (mode === "app" && activePage === "saved") {
      return (
        <>
          <SavedWorkers
            user={loggedUser}
            onHome={() => switchTo("home")}
            onNavigate={handleNavigate}
            onLogout={onLogout}
            onReserveWorker={handleReserveWorker}
          />
          {authModalNode}
          {reservDialogNode}
        </>
      );
    }

    if (mode === "app" && activePage === "dashboard") {
      return (
        <>
          <ReservationsManagePage
            user={loggedUser}
            onHome={() => switchTo("home")}
            onNavigate={handleNavigate}
            onLogout={onLogout}
          />
          {authModalNode}
        </>
      );
    }

    if (mode === "app") {
      setActivePage("explore");
      setMode("explore");
      return null;
    }
  }

  // ── UNAUTHENTICATED user hits a protected route ─────────────────────────
  if (mode === "app") {
    setMode("explore");
    return null;
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
    </>
  );
}
