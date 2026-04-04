import { useState } from "react";
import {
  LayoutDashboard, User, Zap, FolderOpen, Calendar,
  Star, Lock, Bell, LogOut, ChevronRight, Menu, X, CalendarCheck
} from "lucide-react";

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
  if (avatar.startsWith("http")) return avatar; // Google avatar
  return `http://localhost:5000${avatar}`;       // local upload
};

export default function AppLayout({ user, activePage, onNavigate, onLogout, children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isWorker  = user?.role === "worker" || user?.type === "worker";
  const avatarSrc = resolveAvatar(user?.avatar);

  const initials = user
    ? ((user.firstName || user.prenom || user.name || "?")[0] +
       (user.lastName && user.lastName !== "N/A" ? user.lastName[0] : "")).toUpperCase()
    : "?";

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
  min-height: 100vh;
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
}
.al-sidebar {
  width: 256px;
  flex-shrink: 0;
  background: var(--ink, #0f172e);
  padding: 24px 16px 32px;
  display: flex; flex-direction: column; gap: 2px;
  overflow-y: auto;
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
@media (max-width: 768px) {
  .al-mobile-menu-btn { display: flex; }
  .al-sidebar:not(.al-sidebar-mobile) { display: none; }
  .al-main { padding: 24px 16px; }
}
`;