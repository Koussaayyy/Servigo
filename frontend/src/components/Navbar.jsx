import { useState, useEffect, useRef } from "react";
import { avatarUrl, clientApi, workerApi } from "../api";
import { Bell, Bookmark, CheckCheck, Calendar, CheckCircle, XCircle, Star, MessageSquare } from "lucide-react";

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
  letter-spacing:0.06em; padding:7px 14px;
  transition:all .2s; white-space:nowrap;
  font-family:'Sora',sans-serif; border-radius:24px;
}
.nb-link.active { background:rgba(6,182,212,0.08); border-color:rgba(6,182,212,0.2); color:#06b6d4; }
.nb-link:hover  { background:rgba(6,182,212,0.08); border-color:rgba(6,182,212,0.2); color:#06b6d4; }
.nb-spacer { flex:1; }
.nb-right { display:flex; align-items:center; gap:8px; flex-shrink:0; position:relative; }
.nb-icon-btn {
  width:36px; height:36px; border-radius:50%;
  border:1.5px solid #e2e8f0; background:#fff;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; position:relative; transition:all .2s; flex-shrink:0;
}
.nb-icon-btn:hover { border-color:rgba(6,182,212,0.35); background:rgba(6,182,212,0.04); }
.nb-icon-btn .nb-badge {
  position:absolute; top:4px; right:4px;
  width:8px; height:8px; border-radius:50%;
  background:#ef4444; border:1.5px solid #fff;
}
.nb-icon-btn .nb-count {
  position:absolute; top:-4px; right:-4px;
  min-width:16px; height:16px; border-radius:999px;
  background:#06b6d4; border:1.5px solid #fff;
  font-size:9px; font-weight:800; color:#fff;
  display:flex; align-items:center; justify-content:center;
  padding:0 3px; font-family:'Sora',sans-serif;
}
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
.nb-dropdown-header { padding:8px 12px 10px; border-bottom:1px solid #f1f5f9; margin-bottom:4px; }
.nb-dropdown-name  { font-size:13px; font-weight:700; color:#0f172e; }
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
  cursor:pointer; transition:all .2s; white-space:nowrap; font-family:'Sora',sans-serif;
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
/* ── Notification dropdown ── */
.nb-notif-panel {
  position:absolute; top:44px; right:44px; width:340px;
  background:#fff; border:1.5px solid #e2e8f0; border-radius:12px;
  box-shadow:0 14px 36px rgba(15,23,46,0.14);
  z-index:1200; overflow:hidden; font-family:'Sora',sans-serif;
}
.nb-notif-head {
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 16px 10px; border-bottom:1px solid #f1f5f9;
}
.nb-notif-title { font-size:13px; font-weight:700; color:#0f172e; }
.nb-notif-mark-btn {
  background:none; border:none; cursor:pointer;
  font-size:11px; font-weight:600; color:#06b6d4;
  font-family:'Sora',sans-serif; display:flex; align-items:center; gap:4px;
}
.nb-notif-mark-btn:hover { color:#0891b2; }
.nb-notif-list { max-height:340px; overflow-y:auto; }
.nb-notif-item {
  display:flex; gap:10px; padding:12px 16px; cursor:pointer;
  border-bottom:1px solid #f8fafc; transition:background .15s;
}
.nb-notif-item:hover { background:#f8fafc; }
.nb-notif-item.unread { background:rgba(6,182,212,0.04); }
.nb-notif-dot { width:7px; height:7px; border-radius:50%; background:#06b6d4; flex-shrink:0; margin-top:5px; }
.nb-notif-dot.read { background:transparent; }
.nb-notif-body { flex:1; }
.nb-notif-item-title { font-size:12px; font-weight:700; color:#0f172e; margin-bottom:2px; }
.nb-notif-item-msg { font-size:11px; color:#64748b; line-height:1.4; }
.nb-notif-item-time { font-size:10px; color:#94a3b8; margin-top:3px; }
.nb-notif-empty { padding:28px 16px; text-align:center; font-size:12px; color:#94a3b8; }
@media(max-width:768px){ .nb-inner{ padding:0 16px; } .nb-notif-panel{ right:0; width:300px; } }
@media(max-width:480px){ .nb-btn-ghost{ display:none; } }
`;

function notifIcon(n) {
  const t = (n.title || "").toLowerCase();
  if (t.includes("accept"))   return { icon: CheckCircle,    color: "#10b981" };
  if (t.includes("refu") || t.includes("annul")) return { icon: XCircle, color: "#ef4444" };
  if (t.includes("termin"))   return { icon: CheckCircle,    color: "#06b6d4" };
  if (t.includes("avis") || t.includes("review")) return { icon: Star,   color: "#f59e0b" };
  if (t.includes("message"))  return { icon: MessageSquare,  color: "#8b5cf6" };
  return { icon: Calendar, color: "#06b6d4" };
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Il y a ${days}j`;
}

export default function Navbar({
  user,
  activePage,
  onHome,
  onNavigate,
  onLogout,
  onLogin,
  onSignup,
}) {
  const [open, setOpen]               = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [notifications, setNotifs]    = useState([]);
  const [unreadCount, setUnread]      = useState(0);
  const [savedCnt, setSavedCnt]       = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => {
      if (!ref.current?.contains(e.target)) {
        setOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (!user) return;
    const api = user.role === "worker" ? workerApi : clientApi;
    api.getNotifications().then(data => {
      setNotifs(data.notifications || []);
      setUnread(data.unreadCount || 0);
    }).catch(() => {});
    clientApi.getSavedWorkers().then(list => {
      setSavedCnt((list || []).length);
    }).catch(() => {});
  }, [user]);

  const openNotifs = () => {
    setOpen(false);
    setNotifOpen(p => !p);
  };

  const markAll = async () => {
    const api = user.role === "worker" ? workerApi : clientApi;
    try {
      await api.markAllNotificationsAsRead();
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  };

  const markOne = async (notif) => {
    if (notif.read) return;
    const api = user.role === "worker" ? workerApi : clientApi;
    try {
      await api.markNotificationAsRead(notif._id);
      setNotifs(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const go = (page, state) => {
    setOpen(false);
    setNotifOpen(false);
    onNavigate?.(page, state);
  };

  const links = [
    { label: "Explorer",     page: "explore",      authRequired: false },
    { label: "Réservations", page: "reservations", authRequired: true  },
    { label: "Profil",       page: "profile",      authRequired: true  },
    ...(user?.role === "worker" ? [{ label: "Portfolio", page: "portfolio", authRequired: true }] : []),
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
            {user && (
              <>
                {/* Saved workers icon */}
                <button className="nb-icon-btn" title="Prestataires sauvegardés" onClick={() => go("saved")}>
                  <Bookmark size={16} color="#64748b" />
                  {savedCnt > 0 && <span className="nb-count">{savedCnt > 9 ? "9+" : savedCnt}</span>}
                </button>

                {/* Notifications icon */}
                <button className="nb-icon-btn" title="Notifications" onClick={openNotifs}>
                  <Bell size={16} color="#64748b" />
                  {unreadCount > 0 && <span className="nb-badge" />}
                </button>

                {/* Notification panel */}
                {notifOpen && (
                  <div className="nb-notif-panel">
                    <div className="nb-notif-head">
                      <span className="nb-notif-title">
                        Notifications {unreadCount > 0 && `(${unreadCount})`}
                      </span>
                      {unreadCount > 0 && (
                        <button className="nb-notif-mark-btn" onClick={markAll}>
                          <CheckCheck size={12} /> Tout lire
                        </button>
                      )}
                    </div>
                    <div className="nb-notif-list">
                      {notifications.length === 0 ? (
                        <div className="nb-notif-empty">Aucune notification</div>
                      ) : notifications.map(n => {
                        const { icon: NIcon, color } = notifIcon(n);
                        return (
                        <div
                          key={n._id}
                          className={`nb-notif-item ${n.read ? "" : "unread"}`}
                          onClick={() => markOne(n)}
                        >
                          <NIcon size={14} color={n.read ? "#cbd5e1" : color} style={{ flexShrink:0, marginTop:2 }} />
                          <div className="nb-notif-body">
                            <div className="nb-notif-item-title">{n.title}</div>
                            <div className="nb-notif-item-msg">{n.message}</div>
                            <div className="nb-notif-item-time">{timeAgo(n.createdAt)}</div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {user ? (
              <>
                <button className="nb-avatar-btn" onClick={() => { setNotifOpen(false); setOpen(p => !p); }}>
                  {user.avatar ? (
                    <img
                      src={typeof avatarUrl === "function" ? avatarUrl(user.avatar) : user.avatar}
                      style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover" }}
                      alt=""
                    />
                  ) : userInitial}
                </button>

                {open && (
                  <div className="nb-dropdown">
                    <div className="nb-dropdown-header">
                      <div className="nb-dropdown-name">{user.firstName || user.name || "Utilisateur"}</div>
                      <div className="nb-dropdown-email">{user.email || ""}</div>
                    </div>
                    <button className="nb-dropdown-btn" onClick={() => go("profile")}>Mon Profil</button>
                    <button className="nb-dropdown-btn" onClick={() => go("reservations")}>Mes Réservations</button>
                    <button className="nb-dropdown-btn danger" onClick={() => { setOpen(false); onLogout?.(); }}>Déconnexion</button>
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
