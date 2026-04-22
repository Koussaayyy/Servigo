import { useState } from "react";
import {
  LayoutDashboard, User, Zap, FolderOpen, Calendar,
  Star, Lock, Bell, LogOut, ChevronRight, Menu, X, CalendarCheck, CheckCheck
} from "lucide-react";
import { workerApi } from "../api";
import { useEffect } from "react";

const NAV_PROFILE = [
  { key: "profile",        icon: User,       label: "Mon Profil" },
  { key: "reservations",   icon: CalendarCheck, label: "Réservations" },
  { key: "competences",    icon: Zap,        label: "Compétences & Services", workerOnly: true },
  { key: "portfolio",      icon: FolderOpen, label: "Portfolio",              workerOnly: true },
  { key: "disponibilite",  icon: Calendar,   label: "Disponibilités",         workerOnly: true },
  { key: "avis",           icon: Star,       label: "Avis & Évaluations",     workerOnly: true },
];
const NAV_ACCOUNT = [
  { key: "securite",      icon: Lock, label: "Sécurité" },
  { key: "notifications", icon: Bell, label: "Notifications" },
];

// ── Helper: resolve avatar URL ─────────────────────────────
const resolveAvatar = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  return `http://localhost:5000${avatar}`;
};

export default function AppLayout({ user, activePage, onNavigate, onLogout, children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const isWorker  = user?.role === "worker" || user?.type === "worker";
  const avatarSrc = resolveAvatar(user?.avatar);
  console.log("avatar raw:", user?.avatar);
console.log("avatar resolved:", resolveAvatar(user?.avatar));

  const initials = user
    ? ((user.firstName || user.prenom || user.name || "?")[0] +
       (user.lastName && user.lastName !== "N/A" ? user.lastName[0] : "")).toUpperCase()
    : "?";

  // Fetch notifications for workers
  useEffect(() => {
    if (!isWorker) return;
    const fetchNotifications = async () => {
      try {
        const res = await workerApi.getNotifications();
        setNotifications(res.notifications || []);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };
    fetchNotifications();
    // Refetch every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isWorker]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadNotifications = notifications.filter((n) => !n.read);

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await workerApi.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await workerApi.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification._id);
    setShowNotifications(false);
    // Navigate to reservations page
    onNavigate("reservations");
  };

  const handleToggleNotifications = async () => {
    if (showNotifications) {
      await handleMarkAllAsRead();
      setShowNotifications(false);
      return;
    }
    setShowNotifications(true);
  };

  const SidebarContent = () => (
    <>
      {/* Profile mini */}
      <div className="al-profile-mini">
        <div
          className="al-avatar"
          style={avatarSrc ? { backgroundImage: `url(${avatarSrc})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        >
          {!avatarSrc && initials}
        </div>
        <div className="al-profile-name">
          {user?.firstName || user?.prenom || user?.name || "Utilisateur"}{" "}
          {user?.lastName && user?.lastName !== "N/A" ? user.lastName : ""}
        </div>
        <span className={`al-role-badge ${isWorker ? "" : "client"}`}>
          {isWorker ? "Prestataire" : "Client"}
        </span>
      </div>

      <SideItem icon={LayoutDashboard} label="Tableau de bord" pageKey="dashboard" activePage={activePage} onNavigate={onNavigate} setMobileOpen={setMobileSidebarOpen} />

      <div className="al-nav-label">Profil</div>
      {NAV_PROFILE
        .filter(n => !n.workerOnly || isWorker)
        .map(n => (
          <SideItem key={n.key} icon={n.icon} label={n.label} pageKey={n.key} activePage={activePage} onNavigate={onNavigate} setMobileOpen={setMobileSidebarOpen} />
        ))}

      <div className="al-nav-label">Compte</div>
      {NAV_ACCOUNT.map(n => (
        <SideItem key={n.key} icon={n.icon} label={n.label} pageKey={n.key} activePage={activePage} onNavigate={onNavigate} setMobileOpen={setMobileSidebarOpen} />
      ))}

      <button className="al-logout-btn" onClick={onLogout}>
        <LogOut size={14} /> Déconnexion
      </button>
    </>
  );

  return (
    <div className="al-root">
      {/* ── Topbar ── */}
      <nav className="al-topbar">
        <div className="al-topbar-left">
          <button className="al-mobile-menu-btn" onClick={() => setMobileSidebarOpen(o => !o)}>
            {mobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="al-brand">
            <div className="al-brand-mark">S</div>
            <span className="al-brand-name">Servigo</span>
          </div>
        </div>
        <div className="al-topbar-right">
          {isWorker && (
            <div className="al-notification-container" style={{ position: "relative" }}>
              <button 
                className="al-notification-bell"
                onClick={handleToggleNotifications}
                style={{ position: "relative" }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="al-notification-badge">{unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <div className="al-notification-dropdown">
                  <div className="al-notif-header">
                    <span>Nouvelles notifications ({unreadCount})</span>
                    <button className="al-notif-readall" onClick={handleMarkAllAsRead} title="Tout marquer comme lu">
                      <CheckCheck size={14} />
                    </button>
                  </div>
                  <div className="al-notif-list">
                    {unreadNotifications.length === 0 ? (
                      <div className="al-notif-empty">Aucune notification</div>
                    ) : (
                      unreadNotifications.map(notif => (
                        <div 
                          key={notif._id}
                          className={`al-notif-item ${notif.read ? "read" : "unread"}`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="al-notif-title">{notif.title}</div>
                          <div className="al-notif-message">{notif.message}</div>
                          <div className="al-notif-time">
                            {new Date(notif.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="al-topbar-avatar" onClick={() => onNavigate("profile")}>
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" />
              : <span>{initials}</span>
            }
          </div>
        </div>
      </nav>

      <div className="al-body">
        <aside className="al-sidebar">
          <SidebarContent />
        </aside>

        {mobileSidebarOpen && (
          <>
            <div className="al-mobile-overlay" onClick={() => setMobileSidebarOpen(false)} />
            <aside className="al-sidebar al-sidebar-mobile">
              <SidebarContent />
            </aside>
          </>
        )}

        <main className="al-main">
          {children}
        </main>
      </div>

      <style>{styles}</style>
    </div>
  );
}

function SideItem({ icon: Icon, label, pageKey, activePage, onNavigate, setMobileOpen }) {
  const active = activePage === pageKey;
  return (
    <button
      className={`al-nav-item ${active ? "active" : ""}`}
      onClick={() => { onNavigate(pageKey); setMobileOpen(false); }}
    >
      <Icon size={15} />
      <span>{label}</span>
      {active && <ChevronRight size={12} className="al-nav-chevron" />}
    </button>
  );
  
}


const styles = `
.al-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  font-family: 'Sora', sans-serif;
  background: var(--paper, #f8fafc);
}
.al-topbar {
  position: sticky; top: 0; z-index: 200;
  background: var(--ink, #0f172e);
  height: 60px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 28px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.2);
  flex-shrink: 0;
}
.al-topbar-left { display: flex; align-items: center; gap: 14px; }
.al-mobile-menu-btn {
  display: none;
  background: transparent; border: none; color: var(--muted, #64748b);
  cursor: pointer; padding: 4px; border-radius: 6px;
  transition: color .2s;
}
.al-mobile-menu-btn:hover { color: #fff; }
.al-brand { display: flex; align-items: center; gap: 10px; }
.al-brand-mark {
  width: 32px; height: 32px; border: 2px solid var(--orange, #06b6d4);
  border-radius: 4px; display: flex; align-items: center; justify-content: center;
  font-family: 'Sora', sans-serif;
  color: var(--orange, #06b6d4); font-size: 16px; font-weight: 700;
}
.al-brand-name {
  font-size: 10px; letter-spacing: .38em; text-transform: uppercase;
  color: var(--muted, #64748b);
}
.al-topbar-right { display: flex; align-items: center; gap: 10px; }
.al-topbar-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg, var(--orange, #06b6d4), #0891b2);
  border: 2px solid rgba(6, 182, 212, 0.3);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; overflow: hidden; transition: border-color .2s;
  font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 700; color: #fff;
}
.al-topbar-avatar:hover { border-color: var(--orange, #06b6d4); }
.al-topbar-avatar img { width: 100%; height: 100%; object-fit: cover; }
.al-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden; 
}
.al-sidebar {
  width: 256px;
  flex-shrink: 0;
  background: var(--ink, #0f172e);
  padding: 24px 16px 32px;
  display: flex; flex-direction: column; gap: 2px;
    overflow-y: hidden;       
  overflow-x: hidden; 
  position: relative;
}
.al-sidebar::before {
  content: ''; position: absolute; top: -60px; right: -60px;
  width: 200px; height: 200px; border-radius: 50%;
  border: 1px solid rgba(6, 182, 212, 0.12); pointer-events: none;
}
.al-profile-mini {
  display: flex; flex-direction: column; align-items: center;
  padding: 20px 12px; margin-bottom: 20px;
  background: rgba(255,255,255,0.04); border-radius: 12px;
  border: 1px solid rgba(6, 182, 212, 0.15);
}
.al-avatar {
  width: 64px; height: 64px; border-radius: 50%;
  background: linear-gradient(135deg, var(--orange, #06b6d4), #0891b2);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Sora', sans-serif; font-size: 1.4rem; font-weight: 700; color: #fff;
  border: 2px solid rgba(6, 182, 212, 0.3);
  margin-bottom: 10px;
  background-size: cover; background-position: center;
}
.al-profile-name {
  font-family: 'Sora', sans-serif; font-size: .95rem; color: #fff; font-weight: 600;
  margin-bottom: 6px; text-align: center;
}
.al-role-badge {
  font-size: 9px; font-weight: 600; letter-spacing: .15em; text-transform: uppercase;
  padding: 3px 10px; border-radius: 100px;
  background: rgba(6, 182, 212, 0.15); color: var(--orange, #06b6d4);
  border: 1px solid rgba(6, 182, 212, 0.3);
}
.al-role-badge.client {
  background: rgba(100,116,139,0.15); color: var(--muted, #64748b);
  border-color: rgba(100,116,139,0.3);
}
.al-nav-label {
  font-size: 9px; text-transform: uppercase; letter-spacing: 1.8px;
  color: rgba(100,116,139,0.65); padding: 10px 12px 4px; margin-top: 6px;
}
.al-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 8px;
  cursor: pointer; font-size: 13px; color: var(--muted, #64748b);
  transition: all .2s; border: 1px solid transparent;
  background: transparent; width: 100%; text-align: left;
  font-family: 'Sora', sans-serif;
  position: relative;
}
.al-nav-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
.al-nav-item.active { background: rgba(6, 182, 212, 0.12); color: #fff; border-color: rgba(6, 182, 212, 0.25); }
.al-nav-item span { flex: 1; }
.al-nav-chevron { opacity: .5; }
.al-logout-btn {
  display: flex; align-items: center; gap: 8px;
  margin-top: auto; padding: 10px 14px; border-radius: 8px;
  border: 1.5px solid rgba(6, 182, 212, 0.2);
  background: transparent; color: var(--orange, #06b6d4);
  font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all .2s;
  letter-spacing: .05em; margin-top: 16px;
}
.al-logout-btn:hover { background: rgba(6, 182, 212, 0.08); }
.al-main {
  flex: 1;
  overflow-y: auto;
  padding: 36px 44px;
  min-width: 0;
}
.al-mobile-overlay {
  position: fixed; inset: 0; background: rgba(26,16,8,0.6);
  z-index: 150; backdrop-filter: blur(2px);
}
.al-sidebar-mobile {
  position: fixed; left: 0; top: 60px; bottom: 0;
  z-index: 160; width: 256px;
  box-shadow: 4px 0 24px rgba(0,0,0,0.3);
}

/* ── Notification Bell & Dropdown ─────── */
.al-notification-container { position: relative; }
.al-notification-bell {
  background: transparent;
  border: none;
  color: var(--muted, #64748b);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color .2s;
  position: relative;
}
.al-notification-bell:hover { color: #fff; }
.al-notification-badge {
  position: absolute;
  top: -4px; right: -4px;
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  width: 18px; height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--ink, #0f172e);
}
.al-notification-dropdown {
  position: absolute;
  top: 48px; right: 0;
  width: 320px;
  background: var(--ink, #0f172e);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  z-index: 300;
  max-height: 400px;
  overflow-y: auto;
}
.al-notif-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(6, 182, 212, 0.15);
  font-weight: 600;
  color: #fff;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.al-notif-readall {
  background: rgba(6, 182, 212, 0.18);
  border: 1px solid rgba(6, 182, 212, 0.45);
  color: #e0f7ff;
  border-radius: 6px;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.al-notif-readall:hover {
  background: rgba(6, 182, 212, 0.3);
}
.al-notif-list {
  display: flex;
  flex-direction: column;
}
.al-notif-empty {
  padding: 20px 16px;
  text-align: center;
  color: var(--muted, #64748b);
  font-size: 13px;
}
.al-notif-item {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(6, 182, 212, 0.1);
  cursor: pointer;
  transition: background .2s;
}
.al-notif-item:hover {
  background: rgba(6, 182, 212, 0.08);
}
.al-notif-item.unread {
  background: rgba(6, 182, 212, 0.12);
}
.al-notif-title {
  font-weight: 600;
  color: #fff;
  font-size: 13px;
  margin-bottom: 4px;
}
.al-notif-message {
  color: var(--muted, #64748b);
  font-size: 12px;
  margin-bottom: 6px;
  line-height: 1.4;
}
.al-notif-time {
  color: #94a3b8;
  font-size: 11px;
}

@media (max-width: 768px) {
  .al-mobile-menu-btn { display: flex; }
  .al-sidebar:not(.al-sidebar-mobile) { display: none; }
  .al-main { padding: 24px 16px; }
  .al-notification-dropdown {
    width: calc(100vw - 32px);
    right: auto;
    left: 16px;
  }
}
`;