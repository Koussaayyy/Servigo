import { useEffect, useMemo, useState, useRef } from "react";
import {
  Search, MapPin, Wrench, Zap, Paintbrush, Hammer, Snowflake,
  ShieldCheck, Star, Bookmark, SlidersHorizontal,
  CheckCircle2, Clock3, X, Filter,
} from "lucide-react";
import { avatarUrl, workerApi } from "../api";

/* ─── Data ────────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { key: "Plombier",      icon: Wrench,      aliases: ["plombier","plumbing","plumber"] },
  { key: "Électricien",   icon: Zap,         aliases: ["electricien","electrician","electricity"] },
  { key: "Peintre",       icon: Paintbrush,  aliases: ["peintre","painter","painting"] },
  { key: "Menuisier",     icon: Hammer,      aliases: ["menuisier","carpenter","woodwork"] },
  { key: "Climatisation", icon: Snowflake,   aliases: ["climatisation","hvac","air condition"] },
  { key: "Serrurier",     icon: ShieldCheck, aliases: ["serrurier","locksmith"] },
];

const normalize = (v) =>
  String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9 ]+/g, " ").trim();

const professionMatches = (profs = [], cat = "") => {
  if (!cat) return true;
  const sel     = normalize(cat);
  const aliases = CATEGORIES.find((c) => c.key === cat)?.aliases || [];
  return profs.map(normalize).some(
    (p) => p.includes(sel) || aliases.some((a) => p.includes(normalize(a)))
  );
};

const avatarInitials = (n) => (n?.[0] || "?").toUpperCase();

/* ─── WorkerCard ─────────────────────────────────────────────────────────── */
function WorkerCard({ worker, onReserve, onNavigate }) {
  const [saved, setSaved] = useState(false);
  const [hov,   setHov]   = useState(false);

  const fn      = worker?.firstName || "Pro";
  const ln      = worker?.lastName  || "";
  const profs   = worker?.workerProfile?.professions || [];
  const city    = worker?.workerProfile?.city || "—";
  const rate    = Number(worker?.workerProfile?.hourlyRate || 0);
  const rating  = Number(worker?.workerProfile?.rating    || 0);
  const reviews = Number(worker?.workerProfile?.totalReviews || 0);
  const avail   = worker?.workerProfile?.isAvailable !== false;
  const avatar  = typeof avatarUrl === "function" ? avatarUrl(worker?.avatar) : null;

  const handleViewProfile = () => {
    if (typeof onNavigate === "function") {
      onNavigate("profile", { profileUser: worker });
    }
  };

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff",
        border: hov ? "1.5px solid rgba(6,182,212,0.4)" : "1.5px solid #e2e8f0",
        borderRadius: 12,
        padding: 22,
        transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov
          ? "0 12px 40px rgba(6,182,212,0.1), 0 4px 16px rgba(0,0,0,0.05)"
          : "0 1px 6px rgba(0,0,0,0.04)",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {hov && (
        <div style={{ position:"absolute",top:0,left:0,right:0,height:2.5,background:"linear-gradient(90deg,#06b6d4,#22d3ee)",borderRadius:"12px 12px 0 0" }} />
      )}

      {/* Header */}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          {avatar ? (
            <img src={avatar} alt={fn} style={{ width:44,height:44,borderRadius:10,objectFit:"cover",border:"2px solid #e2e8f0" }} />
          ) : (
            <div style={{ width:44,height:44,borderRadius:10,background:hov?"#0f172e":"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:700,color:hov?"#06b6d4":"#64748b",flexShrink:0,transition:"all 0.25s" }}>
              {avatarInitials(fn)}
            </div>
          )}
          <div>
            <div style={{ fontSize:14,fontWeight:700,color:"#0f172e" }}>{fn} {ln}</div>
            <div style={{ fontSize:11,fontWeight:600,color:"#06b6d4",marginTop:2,letterSpacing:"0.06em" }}>{profs[0] || "Service"}</div>
          </div>
        </div>
        <button
          onClick={() => setSaved(s => !s)}
          style={{ background:saved?"rgba(6,182,212,0.1)":"transparent",border:`1.5px solid ${saved?"rgba(6,182,212,0.35)":"#e2e8f0"}`,borderRadius:7,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s",color:saved?"#06b6d4":"#94a3b8" }}
        >
          <Bookmark size={12} fill={saved?"#06b6d4":"none"} />
        </button>
      </div>

      {/* City + availability */}
      <div style={{ display:"flex",alignItems:"center",gap:4,marginBottom:14 }}>
        <MapPin size={10} color="#94a3b8" />
        <span style={{ fontSize:12,color:"#64748b" }}>{city}</span>
        <span style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:5 }}>
          <div style={{ width:5,height:5,borderRadius:"50%",background:avail?"#10b981":"#f59e0b" }} />
          <span style={{ fontSize:11,color:avail?"#059669":"#d97706",fontWeight:600 }}>
            {avail ? "Disponible" : "Indisponible"}
          </span>
        </span>
      </div>

      {/* Tags */}
      {profs.length > 1 && (
        <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginBottom:14 }}>
          {profs.slice(0,3).map((p) => (
            <span key={p} style={{ border:"1px solid rgba(6,182,212,0.18)",color:"#334155",background:"#f8fafc",borderRadius:999,fontSize:10,padding:"3px 8px" }}>{p}</span>
          ))}
        </div>
      )}

      {/* Meta */}
      <div style={{ display:"flex",gap:8,marginBottom:16 }}>
        <div style={{ flex:1,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 10px" }}>
          <div style={{ fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4 }}>Note</div>
          <div style={{ display:"flex",alignItems:"center",fontSize:13,fontWeight:700,color:"#0f172e",gap:4 }}>
            <Star size={11} color="#f59e0b" fill="#f59e0b" />{rating.toFixed(1)}
            <span style={{ fontSize:11,color:"#94a3b8",fontWeight:400 }}>({reviews})</span>
          </div>
        </div>
        <div style={{ flex:1,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 10px" }}>
          <div style={{ fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4 }}>Tarif</div>
          <div style={{ fontSize:13,fontWeight:700,color:"#0f172e" }}>{rate > 0 ? `${rate} TND/h` : "Sur devis"}</div>
        </div>
      </div>

      {/* Buttons row */}
      <div style={{ display:"flex",gap:8 }}>
        <button
          onClick={() => typeof onReserve === "function" && onReserve(worker)}
          style={{ flex:1,background:hov?"#0f172e":"#f8fafc",color:hov?"#06b6d4":"#0f172e",border:`1.5px solid ${hov?"#0f172e":"#e2e8f0"}`,borderRadius:8,padding:"10px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.12em",textTransform:"uppercase",transition:"all 0.25s" }}
        >
          Réserver
        </button>
        <button
          onClick={handleViewProfile}
          style={{ flex:1,background:"transparent",color:"#06b6d4",border:"1.5px solid rgba(6,182,212,0.35)",borderRadius:8,padding:"10px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.12em",textTransform:"uppercase",transition:"all 0.25s" }}
        >
          Voir profil
        </button>
      </div>
    </div>
  );
}

/* ─── Explore ─────────────────────────────────────────────────────────────── */

const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { background:#f8fafc; color:#0f172e; font-family:'Sora',sans-serif; -webkit-font-smoothing:antialiased; }
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
input,textarea,select,button{font-family:'Sora',sans-serif}

@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.ex-anim-1{animation:fadeUp .4s ease both}
.ex-anim-2{animation:fadeUp .4s .07s ease both}
.ex-anim-3{animation:fadeUp .4s .14s ease both}

.ex-root {
  min-height: 100vh;
  background:
    radial-gradient(ellipse 55% 45% at 10% 10%, rgba(6,182,212,0.05), transparent),
    radial-gradient(ellipse 50% 50% at 90% 90%, rgba(6,182,212,0.03), transparent),
    repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(6,182,212,0.012) 60px, rgba(6,182,212,0.012) 61px),
    #f8fafc;
}

/* NAVBAR */
.ex-nav {
  position: fixed; top:0; left:0; right:0; z-index:1000;
  background: rgba(248,250,252,0.94);
  backdrop-filter: blur(20px);
  border-bottom: 1.5px solid #e2e8f0;
  box-shadow: 0 2px 16px rgba(0,0,0,0.05);
  height: 64px;
}
.ex-nav-inner {
  max-width: 1280px; margin: 0 auto; height: 64px;
  display: flex; align-items: center; gap: 16px; padding: 0 28px;
}
.ex-logo-wrap {
  display: flex; align-items: center; gap: 10px; flex-shrink:0; margin-right: 8px;
}
.ex-logo-box {
  width:34px; height:34px; border:2px solid #06b6d4; border-radius:6px;
  display:flex; align-items:center; justify-content:center;
  font-weight:800; font-size:16px; color:#06b6d4;
}
.ex-logo-text { font-weight:700; font-size:16px; letter-spacing:-0.3px; color:#0f172e; }
.ex-nav-auth { display:flex; gap:10px; }
.ex-btn-ghost {
  border:1.5px solid #e2e8f0; background:#fff; color:#0f172e;
  border-radius:8px; padding:8px 18px; font-size:12px; font-weight:600;
  cursor:pointer; transition:all .2s; white-space:nowrap;
}
.ex-btn-ghost:hover { border-color:#cbd5e1; }
.ex-btn-solid {
  border:none; background:#0f172e; color:#06b6d4;
  border-radius:8px; padding:8px 18px; font-size:11px; font-weight:700;
  cursor:pointer; letter-spacing:0.1em; text-transform:uppercase;
  box-shadow:0 4px 16px rgba(6,182,212,0.15); white-space:nowrap; transition:all .2s;
}
.ex-btn-solid:hover { background:#1e293b; }

/* HERO BAND */
.ex-hero {
  position: relative; z-index:1;
  padding: 88px 28px 48px;
  background: #0f172e;
  border-bottom: 1.5px solid rgba(6,182,212,0.15);
}
.ex-hero-inner { max-width:1280px; margin:0 auto; }
.ex-hero-badge {
  display:inline-flex; align-items:center; gap:7px;
  background:rgba(6,182,212,0.07); border:1.5px solid rgba(6,182,212,0.2);
  border-radius:999px; padding:6px 14px; font-size:10px; font-weight:700;
  color:#06b6d4; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:16px;
}
.ex-hero h1 {
  font-size:38px; font-weight:800; letter-spacing:-1.5px; color:#fff;
  line-height:1.1; margin-bottom:12px;
}
.ex-hero h1 em { font-style:italic; color:#06b6d4; }
.ex-hero p { font-size:14px; color:#64748b; line-height:1.8; max-width:520px; margin-bottom:28px; }

/* HERO SEARCH BAR */
.ex-hero-search {
  display: flex; align-items: center; gap: 10px;
  background: #fff; border: 2px solid rgba(6,182,212,0.3);
  border-radius: 12px; padding: 0 18px; height: 52px;
  max-width: 600px;
  box-shadow: 0 8px 32px rgba(6,182,212,0.15);
  transition: border-color .2s, box-shadow .2s;
}
.ex-hero-search:focus-within {
  border-color: rgba(6,182,212,0.7);
  box-shadow: 0 8px 32px rgba(6,182,212,0.25);
}
.ex-hero-search input {
  flex: 1; border: none; outline: none;
  font-size: 14px; color: #0f172e; background: transparent;
  font-family: 'Sora', sans-serif;
}
.ex-hero-search input::placeholder { color: #94a3b8; }
.ex-hero-search-btn {
  background: #06b6d4; border: none; border-radius: 8px;
  width: 34px; height: 34px; display: flex; align-items: center;
  justify-content: center; cursor: pointer; flex-shrink: 0;
  transition: background .2s;
}
.ex-hero-search-btn:hover { background: #0891b2; }

/* CATEGORIES */
.ex-cats {
  position:relative; z-index:1;
  background:#fff; padding:28px 28px 20px;
  border-bottom:1.5px solid #e2e8f0;
}
.ex-cats-inner { max-width:1280px; margin:0 auto; }
.ex-cats-grid {
  display:flex; flex-wrap:wrap; gap:8px; margin-top:16px;
}
.ex-cat-btn {
  display:inline-flex; align-items:center; gap:7px;
  background:#f8fafc; border:1.5px solid #e2e8f0;
  border-radius:999px; padding:8px 18px; font-size:11px; font-weight:700;
  cursor:pointer; letter-spacing:0.08em; text-transform:uppercase;
  color:#64748b; transition:all .2s;
}
.ex-cat-btn.active, .ex-cat-btn:hover {
  background:rgba(6,182,212,0.08); border-color:rgba(6,182,212,0.35); color:#06b6d4;
}
.ex-cat-all {
  background:#0f172e; border:1.5px solid #0f172e; color:#06b6d4;
}
.ex-cat-all:hover { background:#1e293b; }

/* MAIN LAYOUT */
.ex-body {
  position:relative; z-index:1;
  max-width:1280px; margin:0 auto;
  display:grid; grid-template-columns:280px minmax(0,1fr);
  gap:24px; padding:32px 28px 64px; align-items:start;
}

/* FILTERS */
.ex-filters {
  background:#fff; border:1.5px solid #e2e8f0; border-radius:12px;
  padding:20px; position:sticky; top:80px;
}
.ex-filters-title {
  display:flex; align-items:center; gap:8px;
  font-size:13px; font-weight:700; color:#0f172e; margin-bottom:20px;
}
.ex-filter-label {
  font-size:9px; font-weight:700; color:#94a3b8;
  letter-spacing:0.2em; text-transform:uppercase; margin-bottom:7px; display:block;
}
.ex-filter-group { margin-bottom:18px; }
.ex-filter-group select, .ex-filter-group input {
  width:100%; background:#f8fafc; border:1.5px solid #e2e8f0;
  border-radius:8px; padding:9px 12px; font-size:13px; color:#0f172e;
  outline:none; appearance:none; -webkit-appearance:none; cursor:pointer;
  transition:border-color .2s;
}
.ex-filter-group select:focus, .ex-filter-group input:focus {
  border-color:#06b6d4; background:#fff;
}
.ex-price-row { display:grid; grid-template-columns:1fr 16px 1fr; align-items:center; gap:6px; }
.ex-price-row span { text-align:center; font-size:12px; color:#94a3b8; }
.ex-divider { height:1px; background:#e2e8f0; margin:4px 0 18px; }
.ex-filter-reset {
  width:100%; border:1.5px solid #e2e8f0; background:#f8fafc; color:#64748b;
  border-radius:8px; padding:9px; font-size:11px; font-weight:700;
  cursor:pointer; letter-spacing:0.1em; text-transform:uppercase; transition:all .2s;
}
.ex-filter-reset:hover { border-color:#cbd5e1; color:#0f172e; }

/* RESULTS */
.ex-results-head {
  display:flex; justify-content:space-between; align-items:center;
  margin-bottom:20px; flex-wrap:wrap; gap:10px;
}
.ex-results-head h2 { font-size:22px; font-weight:800; letter-spacing:-0.5px; color:#0f172e; margin:0; }
.ex-results-count {
  font-size:11px; color:#64748b; text-transform:uppercase;
  letter-spacing:0.12em; background:#f8fafc; border:1.5px solid #e2e8f0;
  border-radius:999px; padding:5px 12px;
}
.ex-cards-grid {
  display:grid; grid-template-columns:repeat(auto-fill,minmax(285px,1fr)); gap:14px;
}
.ex-state {
  grid-column:1/-1; text-align:center; padding:60px 20px;
  color:#94a3b8; font-size:14px; background:#fff; border:1.5px solid #e2e8f0;
  border-radius:12px;
}
.ex-state.error { color:#b91c1c; border-color:rgba(239,68,68,.35); }

/* AVAIL TOGGLE */
.ex-avail-toggle {
  display:flex; align-items:center; justify-content:space-between;
  gap:12px; padding:8px 0;
}
.ex-toggle-label { font-size:12px; color:#0f172e; font-weight:600; }
.ex-toggle {
  width:36px; height:20px; border-radius:999px; border:none; cursor:pointer;
  position:relative; transition:background .2s; flex-shrink:0;
}
.ex-toggle::after {
  content:''; position:absolute; top:3px; width:14px; height:14px;
  border-radius:50%; background:#fff; transition:left .2s;
}
.ex-toggle.on  { background:#06b6d4; }
.ex-toggle.off { background:#e2e8f0; }
.ex-toggle.on::after  { left:19px; }
.ex-toggle.off::after { left:3px; }

/* MOBILE */
.ex-mobile-filter-btn {
  display:none; align-items:center; gap:8px;
  background:#0f172e; color:#06b6d4; border:none;
  border-radius:8px; padding:10px 18px; font-size:11px; font-weight:700;
  cursor:pointer; letter-spacing:0.1em; text-transform:uppercase;
  margin-bottom:16px;
}
.ex-drawer-overlay {
  position:fixed; inset:0; z-index:900;
  background:rgba(0,0,0,0.4); display:flex; align-items:flex-end;
}
.ex-drawer {
  width:100%; background:#fff; border-radius:16px 16px 0 0;
  padding:24px; max-height:85vh; overflow-y:auto;
}
.ex-drawer-head {
  display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;
}
.ex-drawer-title { font-size:16px; font-weight:800; color:#0f172e; }
.ex-drawer-close {
  background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:8px;
  width:32px; height:32px; display:flex; align-items:center; justify-content:center;
  cursor:pointer; color:#64748b;
}

@media(max-width:1024px) {
  .ex-body { grid-template-columns:1fr; }
  .ex-filters { display:none; position:static; }
  .ex-mobile-filter-btn { display:flex; }
}
@media(max-width:768px) {
  .ex-hero h1 { font-size:28px; }
  .ex-nav-inner { padding:0 16px; }
  .ex-body { padding:24px 16px 48px; }
  .ex-cats { padding:20px 16px; }
  .ex-hero { padding:80px 16px 36px; }
  .ex-hero-search { max-width:unset; }
}
@media(max-width:480px) {
  .ex-cards-grid { grid-template-columns:1fr; }
  .ex-nav-auth .ex-btn-ghost { display:none; }
}
`;

export default function Explore({ onLogin, onSignup, onHome, onExplore, onReserveWorker, user, onLogout, onNavigate }) {
  const [workers,    setWorkers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  const [search,     setSearch]     = useState("");
  const [city,       setCity]       = useState("");
  const [profession, setProfession] = useState("");
  const [minRating,  setMinRating]  = useState(0);
  const [priceMin,   setPriceMin]   = useState(0);
  const [priceMax,   setPriceMax]   = useState(500);
  const [availOnly,  setAvailOnly]  = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen,setProfileOpen]= useState(false);

  const profileRef  = useRef(null);
  const userInitial = avatarInitials(user?.firstName || user?.name || user?.email || "U");

  useEffect(() => {
    const onDocClick = (e) => {
      if (!profileRef.current?.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError("");
      try {
        const data = await workerApi.getMarketplaceWorkers({ profession, city });
        setWorkers(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || "Impossible de charger les prestataires");
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profession, city]);

  const cityOptions = useMemo(() => {
    const s = new Set();
    workers.forEach(w => { const c = String(w?.workerProfile?.city || "").trim(); if (c) s.add(c); });
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [workers]);

  const visible = useMemo(() => {
    const q = normalize(search);
    return workers.filter(w => {
      const profs  = w?.workerProfile?.professions || [];
      const wCity  = String(w?.workerProfile?.city || "").trim();
      const rating = Number(w?.workerProfile?.rating || 0);
      const rate   = Number(w?.workerProfile?.hourlyRate || 0);
      const avail  = w?.workerProfile?.isAvailable !== false;
      const hay    = normalize([w?.firstName, w?.lastName, wCity, ...profs].join(" "));

      if (q && !hay.includes(q)) return false;
      if (!professionMatches(profs, profession)) return false;
      if (minRating > 0 && rating < minRating) return false;
      if (rate > 0 && rate < priceMin) return false;
      if (rate > 0 && rate > priceMax) return false;
      if (availOnly && !avail) return false;
      return true;
    });
  }, [workers, search, profession, minRating, priceMin, priceMax, availOnly]);

  const resetFilters = () => {
    setSearch(""); setCity(""); setProfession(""); setMinRating(0);
    setPriceMin(0); setPriceMax(500); setAvailOnly(false);
  };

  const safeNavigate = (page, state = {}) => {
    if (typeof onNavigate === "function") {
      onNavigate(page, state);
    }
  };

  const navLinks = [
    { label: "Explorer",     action: onExplore,                          active: true,  authRequired: false },
    { label: "Profil",       action: () => safeNavigate("profile"),      active: false, authRequired: true  },
    { label: "Réservations", action: () => safeNavigate("reservations"), active: false, authRequired: true  },
    { label: "Dashboard",    action: () => safeNavigate("dashboard"),    active: false, authRequired: true  },
  ].filter(item => !item.authRequired || !!user);

  const FilterPanel = () => (
    <>
      <div className="ex-filter-group">
        <span className="ex-filter-label">Ville</span>
        <select value={city} onChange={e => setCity(e.target.value)}>
          <option value="">Toutes les villes</option>
          {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="ex-filter-group">
        <span className="ex-filter-label">Métier</span>
        <select value={profession} onChange={e => setProfession(e.target.value)}>
          <option value="">Tous</option>
          {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.key}</option>)}
        </select>
      </div>
      <div className="ex-filter-group">
        <span className="ex-filter-label">Note minimale</span>
        <select value={minRating} onChange={e => setMinRating(Number(e.target.value))}>
          <option value={0}>Toutes</option>
          <option value={3}>3+ étoiles</option>
          <option value={4}>4+ étoiles</option>
          <option value={5}>5 étoiles seulement</option>
        </select>
      </div>
      <div className="ex-filter-group">
        <span className="ex-filter-label">Prix (TND/h)</span>
        <div className="ex-price-row">
          <input type="number" min={0} value={priceMin} onChange={e => setPriceMin(Number(e.target.value) || 0)} placeholder="Min" />
          <span>–</span>
          <input type="number" min={0} value={priceMax} onChange={e => setPriceMax(Number(e.target.value) || 0)} placeholder="Max" />
        </div>
      </div>
      <div className="ex-divider" />
      <div className="ex-avail-toggle">
        <span className="ex-toggle-label">Disponibles uniquement</span>
        <button className={`ex-toggle ${availOnly ? "on" : "off"}`} onClick={() => setAvailOnly(v => !v)} />
      </div>
      <div className="ex-divider" />
      <button className="ex-filter-reset" onClick={resetFilters}>Réinitialiser</button>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0,background:"radial-gradient(ellipse 55% 45% at 10% 10%, rgba(6,182,212,0.05), transparent), radial-gradient(ellipse 50% 50% at 90% 90%, rgba(6,182,212,0.03), transparent), repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(6,182,212,0.012) 60px, rgba(6,182,212,0.012) 61px)" }} />

      <div className="ex-root">

        {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
        <nav className="ex-nav">
          <div className="ex-nav-inner">

            <div className="ex-logo-wrap" onClick={onHome} style={{ cursor:"pointer" }}>
              <div className="ex-logo-box">S</div>
              <span className="ex-logo-text">servigo</span>
            </div>

            <div style={{ display:"flex",gap:2,alignItems:"center",flexShrink:0 }}>
              {navLinks.map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  style={{
                    background:  item.active ? "rgba(6,182,212,0.08)" : "none",
                    border:      item.active ? "1.5px solid rgba(6,182,212,0.2)" : "1.5px solid transparent",
                    color:       item.active ? "#06b6d4" : "#64748b",
                    cursor:"pointer", fontSize:12, fontWeight:600, letterSpacing:"0.06em",
                    padding:"7px 14px", borderRadius:24, transition:"all .2s", whiteSpace:"nowrap",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background="rgba(6,182,212,0.08)"; e.currentTarget.style.borderColor="rgba(6,182,212,0.2)"; e.currentTarget.style.color="#06b6d4"; }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background  = item.active ? "rgba(6,182,212,0.08)" : "none";
                    e.currentTarget.style.borderColor = item.active ? "rgba(6,182,212,0.2)"  : "transparent";
                    e.currentTarget.style.color       = item.active ? "#06b6d4"              : "#64748b";
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display:"flex",alignItems:"center",gap:10,flexShrink:0,position:"relative" }} ref={profileRef}>

              {user && (
                <button
                  style={{ width:36,height:36,borderRadius:"50%",border:"1.5px solid #e2e8f0",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative",flexShrink:0,transition:"all .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.35)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  <div style={{ position:"absolute",top:6,right:6,width:7,height:7,borderRadius:"50%",background:"#ef4444",border:"1.5px solid #fff" }} />
                </button>
              )}

              {user ? (
                <>
                  <button
                    onClick={() => setProfileOpen(p => !p)}
                    style={{ width:36,height:36,borderRadius:"50%",border:"1.5px solid rgba(6,182,212,0.35)",background:"#0f172e",color:"#06b6d4",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden" }}
                  >
                    {user.avatar ? (
                      <img
                        src={typeof avatarUrl === "function" ? avatarUrl(user.avatar) : user.avatar}
                        style={{ width:36,height:36,borderRadius:"50%",objectFit:"cover" }}
                        alt=""
                      />
                    ) : (
                      userInitial
                    )}
                  </button>

                  {profileOpen && (
                    <div style={{ position:"absolute",top:44,right:0,minWidth:190,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:10,boxShadow:"0 14px 36px rgba(15,23,46,0.12)",padding:8,zIndex:1200,display:"grid",gap:4 }}>
                      <div style={{ padding:"8px 12px 10px",borderBottom:"1px solid #f1f5f9",marginBottom:4 }}>
                        <div style={{ fontSize:13,fontWeight:700,color:"#0f172e" }}>{user.firstName || user.name || "Utilisateur"}</div>
                        <div style={{ fontSize:11,color:"#94a3b8",marginTop:2 }}>{user.email || ""}</div>
                      </div>
                      <button onClick={() => { setProfileOpen(false); safeNavigate("profile"); }}       style={{ background:"#fff",border:"none",textAlign:"left",padding:"10px 12px",borderRadius:8,cursor:"pointer",fontSize:13,color:"#0f172e",fontWeight:600 }}>Mon Profil</button>
                      <button onClick={() => { setProfileOpen(false); safeNavigate("reservations"); }} style={{ background:"#fff",border:"none",textAlign:"left",padding:"10px 12px",borderRadius:8,cursor:"pointer",fontSize:13,color:"#0f172e",fontWeight:600 }}>Mes Réservations</button>
                      <button onClick={() => { setProfileOpen(false); onLogout?.(); }}                 style={{ background:"#fff",border:"none",textAlign:"left",padding:"10px 12px",borderRadius:8,cursor:"pointer",fontSize:13,color:"#b91c1c",fontWeight:700 }}>Déconnexion</button>
                    </div>
                  )}
                </>
              ) : (
                <div className="ex-nav-auth">
                  <button className="ex-btn-ghost" onClick={onLogin}>Se connecter</button>
                  <button className="ex-btn-solid" onClick={onSignup}>Créer un compte</button>
                </div>
              )}
            </div>

          </div>
        </nav>

        {/* ── HERO BAND ──────────────────────────────────────────────────── */}
        <section className="ex-hero">
          <div className="ex-hero-inner">
            <div className="ex-anim-1">
              <div className="ex-hero-badge">
                <div style={{ width:5,height:5,borderRadius:"50%",background:"#06b6d4" }} />
                Artisans certifiés en Tunisie
              </div>
            </div>
            <h1 className="ex-anim-2">
              Trouvez le bon<br /><em>prestataire</em>
            </h1>
            <p className="ex-anim-3">
              Comparez et réservez les meilleurs artisans qualifiés en quelques clics.
            </p>
          </div>
        </section>

        {/* ── CATEGORY PILLS ─────────────────────────────────────────────── */}
        <div className="ex-cats">
          <div className="ex-cats-inner">
            <div className="ex-cats-grid">
              <button
                className="ex-cat-btn ex-cat-all"
                onClick={() => setProfession("")}
                style={profession === "" ? { background:"#0f172e",borderColor:"#0f172e",color:"#06b6d4" } : { background:"#fff",borderColor:"#e2e8f0",color:"#64748b" }}
              >
                TOUS
              </button>
              {CATEGORIES.map(c => {
                const Icon   = c.icon;
                const active = profession === c.key;
                return (
                  <button
                    key={c.key}
                    className={`ex-cat-btn ${active ? "active" : ""}`}
                    onClick={() => setProfession(active ? "" : c.key)}
                  >
                    <Icon size={13} />{c.key.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── MAIN ───────────────────────────────────────────────────────── */}
        <div className="ex-body">

          <aside className="ex-filters">
            <div className="ex-filters-title">
              <SlidersHorizontal size={15} />
              Filtres
            </div>
            <FilterPanel />
          </aside>

          <div>
            <button className="ex-mobile-filter-btn" onClick={() => setDrawerOpen(true)}>
              <Filter size={14} />
              Filtres
              {(profession || city || minRating > 0 || availOnly) && (
                <span style={{ background:"#06b6d4",color:"#0f172e",borderRadius:999,width:18,height:18,fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center" }}>!</span>
              )}
            </button>

            {/* ── SEARCH BAR ── */}
            <div className="ex-hero-search" style={{ maxWidth:"unset",marginBottom:16 }}>
              <Search size={16} color="#94a3b8" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Plombier, électricien, ville..."
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ background:"none",border:"none",cursor:"pointer",color:"#94a3b8",display:"flex",padding:0 }}
                >
                  <X size={14} />
                </button>
              )}
              <button className="ex-hero-search-btn">
                <Search size={14} color="#fff" />
              </button>
            </div>

            <div className="ex-results-head">
              <h2>Prestataires</h2>
              <span className="ex-results-count">{visible.length} résultat{visible.length > 1 ? "s" : ""}</span>
            </div>

            <div className="ex-cards-grid">
              {loading && <div className="ex-state">Chargement des prestataires…</div>}
              {!loading && error && <div className="ex-state error">{error}</div>}
              {!loading && !error && visible.length === 0 && (
                <div className="ex-state">
                  Aucun prestataire pour ces critères.<br /><br />
                  <button onClick={resetFilters} style={{ background:"#0f172e",color:"#06b6d4",border:"none",borderRadius:8,padding:"10px 20px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase" }}>
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
              {!loading && !error && visible.map(w => (
                <WorkerCard
                  key={w._id}
                  worker={w}
                  onReserve={onReserveWorker}
                  onNavigate={safeNavigate}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="ex-drawer-overlay" onClick={e => { if (e.target === e.currentTarget) setDrawerOpen(false); }}>
            <div className="ex-drawer">
              <div className="ex-drawer-head">
                <span className="ex-drawer-title">Filtres</span>
                <button className="ex-drawer-close" onClick={() => setDrawerOpen(false)}>
                  <X size={15} />
                </button>
              </div>
              <FilterPanel />
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ width:"100%",background:"#0f172e",color:"#06b6d4",border:"none",borderRadius:8,padding:"13px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.12em",textTransform:"uppercase",marginTop:16 }}
              >
                Voir les résultats ({visible.length})
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}