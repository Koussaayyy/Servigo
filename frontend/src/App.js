import { useState, useEffect } from "react";
import "./App.css";
import SidePanel            from "./components/SidePanel";
import LoginForm            from "./pages/LoginForm";
import SignupPicker         from "./pages/SignupPicker";
import ClientSignup         from "./pages/ClientSignup";
import WorkerSignup         from "./pages/WorkerSignup";
import ResetPassword        from "./pages/ResetPassword";
import Explore              from "./pages/Explore";
import HomePage             from "./pages/HomePage";          // ← your ServigoPro landing
import GoogleCompleteSignup from "./pages/GoogleCompleteSignup";
import Onboarding           from "./pages/Onboarding/Onboarding";
import AppLayout            from "./components/AppLayout";
import ProfilePage          from "./pages/profile/ProfilePage";
import Dashboard            from "./components/Dashboard";
import ReservationsPage     from "./pages/ReservationsPage";
import AuthModal            from "./components/AuthModal";

const PAGE_STORAGE_KEY = "activePage";
const VALID_PAGES = [
  "dashboard",
  "profile",
  "competences",
  "portfolio",
  "disponibilite",
  "avis",
  "securite",
  "notifications",
  "reservations",
];

export default function App() {
  // "home" = landing (ServigoPro), "explore" = marketplace, "login" / "signup" = auth
  const [mode, setMode]             = useState("home");
  const [signupType, setSignupType] = useState(null);
  const [exiting, setExiting]       = useState(false);
  const [panelKey, setPanelKey]     = useState(0);
  const [activePage, setActivePage] = useState(() => {
    const saved = localStorage.getItem(PAGE_STORAGE_KEY);
    return VALID_PAGES.includes(saved) ? saved : "dashboard";
  });
  const [resetToken, setResetToken]             = useState(null);
  const [googleCredential, setGoogleCredential] = useState(null);
  const [onboardingUser, setOnboardingUser]     = useState(null);
  const [authModalOpen, setAuthModalOpen]       = useState(false);
  const [authModalMode, setAuthModalMode]       = useState("login");
  const [pendingReservation, setPendingReservation] = useState(() => {
    try {
      const raw = localStorage.getItem("pendingReservation");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [loggedUser, setLoggedUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });

  // Detect reset-password token in URL
  useEffect(() => {
    const match = window.location.pathname.match(/^\/reset-password\/(.+)$/);
    if (match) setResetToken(match[1]);
  }, []);

  // Persist active page for logged-in users
  useEffect(() => {
    if (loggedUser && VALID_PAGES.includes(activePage)) {
      localStorage.setItem(PAGE_STORAGE_KEY, activePage);
    }
  }, [activePage, loggedUser]);

  const switchTo = (newMode, newType = null) => {
    setAuthModalOpen(false);
    setExiting(true);
    setTimeout(() => {
      setMode(newMode);
      setSignupType(newType);
      setPanelKey((k) => k + 1);
      setExiting(false);
    }, 150);
  };

  const onSuccess = (user) => {
    if (!user.onboardingComplete) {
      setOnboardingUser(user);
      return;
    }
    setLoggedUser(user);
    if (user.role === "client" && pendingReservation?.workerId) {
      setActivePage("reservations");
    } else {
      localStorage.removeItem("pendingReservation");
      setPendingReservation(null);
      setActivePage("dashboard");
    }
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem(PAGE_STORAGE_KEY);
    setLoggedUser(null);
    setOnboardingUser(null);
    setActivePage("dashboard");
    switchTo("home");           // go back to landing page on logout
  };

  const openAuthModal = (nextMode = "login") => {
    setAuthModalMode(nextMode);
    setAuthModalOpen(true);
  };

  const authModalNode = authModalOpen ? (
    <AuthModal
      mode={authModalMode}
      onClose={() => setAuthModalOpen(false)}
      onSuccess={onSuccess}
    />
  ) : null;

  // ── Reset password ────────────────────────────────────────────────────────
  if (resetToken) {
    return (
      <>
        <div className="bg-deco" />
        <div className="wrapper">
          <SidePanel />
          <div className="main">
            <ResetPassword
              token={resetToken}
              onSuccess={() => {
                setResetToken(null);
                window.history.pushState({}, "", "/");
                switchTo("login");
              }}
            />
          </div>
        </div>
      </>
    );
  }

  // ── Onboarding — full screen, no side panel ───────────────────────────────
  if (onboardingUser) {
    return (
      <div className="ob-fullpage">
        <Onboarding
          user={onboardingUser}
          onComplete={(updatedUser) => {
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setOnboardingUser(null);
            setLoggedUser(updatedUser);
            setActivePage("dashboard");
          }}
        />
      </div>
    );
  }

  // ── Logged-in ─────────────────────────────────────────────────────────────
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
            onNavigate={(page) => {
              setActivePage(page);
              setMode("app");
            }}
          />
          {authModalNode}
        </>
      );
    }

    const PROFILE_SUBPAGES   = ["profile","competences","portfolio","disponibilite","avis","securite","notifications"];
    const isProfilePage      = PROFILE_SUBPAGES.includes(activePage);
    const isReservationsPage = activePage === "reservations";

    return (
      <>
      <AppLayout
        user={loggedUser}
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={onLogout}
      >
        {!isProfilePage && !isReservationsPage && (
          <Dashboard user={loggedUser} onLogout={onLogout} onNavigate={setActivePage} />
        )}
        {isProfilePage && (
          <ProfilePage
            user={loggedUser}
            subPage={activePage}
            onAccountDeleted={onLogout}
            onSave={(updated) => {
              const merged = { ...loggedUser, ...updated };
              localStorage.setItem("user", JSON.stringify(merged));
              setLoggedUser(merged);
            }}
          />
        )}
        {isReservationsPage && (
          <ReservationsPage
            user={loggedUser}
            preselectedWorkerId={pendingReservation?.workerId || ""}
            preselectedProfession={pendingReservation?.profession || ""}
            onPrefillApplied={() => {
              localStorage.removeItem("pendingReservation");
              setPendingReservation(null);
            }}
          />
        )}
      </AppLayout>
      {authModalNode}
      </>
    );
  }

  // ── Public landing page ───────────────────────────────────────────────────
  if (mode === "home") {
    return (
      <>
        <HomePage
          onLogin={()   => openAuthModal("login")}
          onSignup={()  => openAuthModal("signup")}
          onExplore={()  => switchTo("explore")}   // "Voir les artisans" CTA
        />
        {authModalNode}
      </>
    );
  }

  // ── Marketplace (Explore) ─────────────────────────────────────────────────
  if (mode === "explore") {
    return (
      <>
        <Explore
          onLogin={()   => openAuthModal("login")}
          onSignup={()  => openAuthModal("signup")}
          onHome={()    => switchTo("home")}
          onReserveWorker={(worker) => {
            const payload = {
              workerId:   worker?._id,
              profession: worker?.workerProfile?.professions?.[0] || "",
            };
            localStorage.setItem("pendingReservation", JSON.stringify(payload));
            setPendingReservation(payload);
            openAuthModal("login");
          }}
        />
        {authModalNode}
      </>
    );
  }

  // ── Auth screens ──────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-deco" />
      <div className="wrapper">
        <SidePanel />
        <div className="main">
          <button className="step-back" onClick={() => switchTo("home")}> 
            ← Retour à l'accueil
          </button>
          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => switchTo("login")}
            >Sign In</button>
            <button
              className={`mode-tab ${mode === "signup" ? "active" : ""}`}
              onClick={() => switchTo("signup")}
            >Create Account</button>
          </div>
          <div className={exiting ? "panel-exit" : ""} key={panelKey}>
            {mode === "login" && <LoginForm onSuccess={onSuccess} />}
            {mode === "signup" && !signupType && !googleCredential && (
              <SignupPicker
                onSelect={(t) => switchTo("signup", t)}
                onGoogleSuccess={onSuccess}
                onGoogleComplete={(credential) => setGoogleCredential(credential)}
              />
            )}
            {mode === "signup" && googleCredential && (
              <GoogleCompleteSignup
                googleCredential={googleCredential}
                onSuccess={(user) => {
                  setGoogleCredential(null);
                  onSuccess(user);
                }}
              />
            )}
            {mode === "signup" && signupType === "client" && (
              <ClientSignup onBack={() => switchTo("signup", null)} onSuccess={onSuccess} />
            )}
            {mode === "signup" && signupType === "worker" && (
              <WorkerSignup onBack={() => switchTo("signup", null)} onSuccess={onSuccess} />
            )}
          </div>
        </div>
      </div>
      {authModalNode}
    </>
  );
}