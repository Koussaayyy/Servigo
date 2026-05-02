import { useState, useEffect, useRef } from "react";
import { avatarUrl } from "../api";

const avatarInitials = (n) => (n?.[0] || "?").toUpperCase();

const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
.nb-nav {
  position:fixed; top:0; left:0; right:0; z-index:1000;
  background:rgba(248,250,252,0.94); backdrop-filter:blur(20px);
  border-bottom:1.5px solid #e2e8f0; box-shadow:0 2px 16px rgba(0,0,0,0.05);
  height:64px; font-family:'Sora',sans-serif;
}
.nb-inner {
  max-width:1280px; margin:0 auto; height:64px;
  display:flex; align-items:center; gap:16px; padding:0 28px;
}
.nb-logo {
  display:flex; align-items:center; gap:10px;
  cursor:pointer; flex-shrink:0; margin-right:8px;
}
.nb-logo-box {
  width:34px; height:34px; border:2px solid #06b6d4; border-radius:6px;
  display:flex; align-items:center; justify-content:center;
  font-weight:800; font-size:16px; color:#06b6d4;
}
.nb-logo-text { font-weight:700; font-size:16px; letter-spacing:-0.3px; color:#0f172e; }
.nb-links { display:flex; gap:2px; align-items:center; flex-shrink:0; }
.nb-link {
  background:none; border:1.5px solid transparent;
  color:#64748b; cursor:pointer; font-size:12px; font-weight:600;
  letter-spacing:0.06em; padding:7px 14px; border-radius:24;
  transition:all .2s; white-space:nowrap; font-family:'Sora',sans-serif;
  border-radius:24px;
}
.nb-link.active {
  background:rgba(6,182,212,0.08);
  border-color:rgba(6,182,212,0.2);
  color:#06b6d4;
}
.nb-link:hover {
  background:rgba(6,182,212,0.08);
  border-color:rgba(6,182,212,0.2);
  color:#06b6d4;
}
.nb-spacer { flex:1; }
.nb-right { display:flex; align-items:center; gap:10px; flex-shrink:0; position:relative; }
.nb-avatar-btn {
  width:36px; height:36px; border-radius:50%;
  border:1.5px solid rgba(6,182,212,0.35);
  background:#0f172e; color:#06b6d4;
  font-weight:700; font-size:14px; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0; overflow:hidden; font-family:'Sora',sans-serif;
}
.nb-dropdown {
  position:absolute; top:44px; right:0; min-width:190px;
  background:#fff; border:1.5px solid #e2e8f0; border-radius:10px;
  box-shadow:0 14px 36px rgba(15,23,46,0.12);
  padding:8px; z-index:1200; display:grid; gap:4px;
}
.nb-dropdown-header {
  padding:8px 12px 10px; border-bottom:1px solid #f1f5f9; margin-bottom:4px;
}
.nb-dropdown-name { font-size:13px; font-weight:700; color:#0f172e; }
.nb-dropdown-email { font-size:11px; color:#94a3b8; margin-top:2px; }
.nb-dropdown-btn {
  background:#fff; border:none; text-align:left;
  padding:10px 12px; border-radius:8px; cursor:pointer;
  font-size:13px; color:#0f172e; font-weight:600;
  font-family:'Sora',sans-serif; width:100%;
}
.nb-dropdown-btn:hover { background:#f8fafc; }
.nb-dropdown-btn.danger { color:#b91c1c; }
.nb-btn-ghost {
  border:1.5px solid #e2e8f0; background:#fff; color:#0f172e;
  border-radius:8px; padding:8px 18px; font-size:12px; font-weight:600;
  cursor:pointer; transition:all .2s; white-space:nowrap;
  font-family:'Sora',sans-serif;
}
.nb-btn-ghost:hover { border-color:#cbd5e1; }
.nb-btn-solid {
  border:none; background:#0f172e; color:#06b6d4;
  border-radius:8px; padding:8px 18px; font-size:11px; font-weight:700;
  cursor:pointer; letter-spacing:0.1em; text-transform:uppercase;
  box-shadow:0 4px 16px rgba(6,182,212,0.15); white-space:nowrap;
  transition:all .2s; font-family:'Sora',sans-serif;
}
.nb-btn-solid:hover { background:#1e293b; }
@media(max-width:768px){
  .nb-inner { padding:0 16px; }
}
@media(max-width:480px){
  .nb-btn-ghost { display:none; }
}
`;

/*
  Props:
    user         — logged-in user object (null = not logged in)
    activePage   — "explore" | "profile" | "reservations"
    onHome       — logo click
    onNavigate   — (page, state?) => void
    onLogout     — () => void
    onLogin      — () => void  (shown when not logged in)
    onSignup     — () => void  (shown when not logged in)
*/
export default function Navbar({
  user,
  activePage,
  onHome,
  onNavigate,
  onLogout,
  onLogin,
  onSignup,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const go = (page, state) => {
    setOpen(false);
    onNavigate?.(page, state);
  };

  // Same links for both worker and client — content inside each page differs by role
  const links = [
    { label: "Explorer",     page: "explore",       authRequired: false },
    { label: "Réservations", page: "reservations",  authRequired: true  },
    { label: "Profil",       page: "profile",       authRequired: true  },
  ].filter((l) => !l.authRequired || !!user);

  const userInitial = avatarInitials(user?.firstName || user?.name || "U");

  return (
    <>
      <style>{css}</style>
      <nav className="nb-nav">
        <div className="nb-inner">

          {/* Logo */}
          <div className="nb-logo" onClick={onHome}>
            <div className="nb-logo-box">S</div>
            <span className="nb-logo-text">servigo</span>
          </div>

          {/* Nav links */}
          <div className="nb-links">
            {links.map((l) => (
              <button
                key={l.page}
                className={`nb-link ${activePage === l.page ? "active" : ""}`}
                onClick={() => go(l.page)}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="nb-spacer" />

          {/* Right side */}
          <div className="nb-right" ref={ref}>
            {user ? (
              <>
                <button className="nb-avatar-btn" onClick={() => setOpen((p) => !p)}>
                  {user.avatar ? (
                    <img
                      src={typeof avatarUrl === "function" ? avatarUrl(user.avatar) : user.avatar}
                      style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                      alt=""
                    />
                  ) : (
                    userInitial
                  )}
                </button>

                {open && (
                  <div className="nb-dropdown">
                    <div className="nb-dropdown-header">
                      <div className="nb-dropdown-name">
                        {user.firstName || user.name || "Utilisateur"}
                      </div>
                      <div className="nb-dropdown-email">{user.email || ""}</div>
                    </div>
                    <button className="nb-dropdown-btn" onClick={() => go("profile")}>
                      Mon Profil
                    </button>
                    <button className="nb-dropdown-btn" onClick={() => go("reservations")}>
                      Mes Réservations
                    </button>
                    <button
                      className="nb-dropdown-btn danger"
                      onClick={() => { setOpen(false); onLogout?.(); }}
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <button className="nb-btn-ghost" onClick={onLogin}>Se connecter</button>
                <button className="nb-btn-solid" onClick={onSignup}>Créer un compte</button>
              </>
            )}
          </div>

        </div>
      </nav>
    </>
  );
}