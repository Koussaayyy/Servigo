import { useState } from "react";
import "./App.css";
import SidePanel    from "./components/SidePanel";
import LoginForm    from "./pages/LoginForm";
import SignupPicker from "./pages/SignupPicker";
import ClientSignup from "./pages/ClientSignup";
import WorkerSignup from "./pages/WorkerSignup";

// ── Post-login pages
import AppLayout    from "./components/AppLayout";
import ProfilePage  from "./pages/profile/ProfilePage";
import Dashboard    from "./components/Dashboard";

export default function App() {
  const [mode, setMode]           = useState("login");
  const [signupType, setSignupType] = useState(null);
  const [exiting, setExiting]     = useState(false);
  const [panelKey, setPanelKey]   = useState(0);

  // ── Current page when logged in: "dashboard" | "profile"
  const [activePage, setActivePage] = useState("dashboard");

  const [loggedUser, setLoggedUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });

  const switchTo = (newMode, newType = null) => {
    setExiting(true);
    setTimeout(() => {
      setMode(newMode);
      setSignupType(newType);
      setPanelKey((k) => k + 1);
      setExiting(false);
    }, 150);
  };

  const onSuccess = (user) => {
    setLoggedUser(user);
    setActivePage("dashboard");
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLoggedUser(null);
    switchTo("login");
  };

  // ── Logged-in view
  if (loggedUser) {
    // Pages that are "sub-sections" of the profile
    const PROFILE_SUBPAGES = ["profile", "competences", "portfolio", "disponibilite", "avis", "securite", "notifications"];
    const isProfilePage = PROFILE_SUBPAGES.includes(activePage);

    return (
      <AppLayout
        user={loggedUser}
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={onLogout}
      >
        {!isProfilePage && (
          <Dashboard user={loggedUser} onLogout={onLogout} onNavigate={setActivePage} />
        )}
        {isProfilePage && (
          <ProfilePage
            user={loggedUser}
            subPage={activePage}
            onSave={(updated) => {
              const merged = { ...loggedUser, ...updated };
              localStorage.setItem("user", JSON.stringify(merged));
              setLoggedUser(merged);
            }}
          />
        )}
      </AppLayout>
    );
  }

  // ── Auth view (login / signup)
  return (
    <>
      <div className="bg-deco" />
      <div className="wrapper">
        <SidePanel />
        <div className="main">
          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => switchTo("login")}
            >
              Sign In
            </button>
            <button
              className={`mode-tab ${mode === "signup" ? "active" : ""}`}
              onClick={() => switchTo("signup")}
            >
              Create Account
            </button>
          </div>

          <div className={exiting ? "panel-exit" : ""} key={panelKey}>
            {mode === "login" && <LoginForm onSuccess={onSuccess} />}

            {mode === "signup" && !signupType && (
              <SignupPicker onSelect={(t) => switchTo("signup", t)} />
            )}
            {mode === "signup" && signupType === "client" && (
              <ClientSignup
                onBack={() => switchTo("signup", null)}
                onSuccess={onSuccess}
              />
            )}
            {mode === "signup" && signupType === "worker" && (
              <WorkerSignup
                onBack={() => switchTo("signup", null)}
                onSuccess={onSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}