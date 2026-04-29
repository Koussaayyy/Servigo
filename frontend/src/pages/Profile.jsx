import { useEffect, useState, useRef } from "react";
import {
  MapPin, Star, Briefcase, Clock, Edit3, Check, X,
  ChevronLeft, Wrench, Zap, Paintbrush, Hammer,
  Snowflake, ShieldCheck, Camera, Phone, Mail,
  Calendar, Award, DollarSign, ToggleLeft, ToggleRight,
} from "lucide-react";
import { avatarUrl, workerApi, userApi } from "../api";

/* ─────────────────────────────────────────────
   STYLES  (same token set as Explore.jsx)
───────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { background:#f8fafc; color:#0f172e; font-family:'Sora',sans-serif; -webkit-font-smoothing:antialiased; }
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
input,textarea,select,button{font-family:'Sora',sans-serif}

@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.pr-anim-1{animation:fadeUp .35s ease both}
.pr-anim-2{animation:fadeUp .35s .07s ease both}
.pr-anim-3{animation:fadeUp .35s .14s ease both}
.pr-anim-4{animation:fadeUp .35s .21s ease both}

/* ROOT */
.pr-root {
  min-height:100vh;
  background:
    radial-gradient(ellipse 55% 45% at 10% 10%, rgba(6,182,212,0.05), transparent),
    radial-gradient(ellipse 50% 50% at 90% 90%, rgba(6,182,212,0.03), transparent),
    repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(6,182,212,0.012) 60px, rgba(6,182,212,0.012) 61px),
    #f8fafc;
}

/* NAVBAR (identical to Explore) */
.pr-nav {
  position:fixed; top:0; left:0; right:0; z-index:1000;
  background:rgba(248,250,252,0.94); backdrop-filter:blur(20px);
  border-bottom:1.5px solid #e2e8f0; box-shadow:0 2px 16px rgba(0,0,0,0.05);
  height:64px;
}
.pr-nav-inner {
  max-width:1280px; margin:0 auto; height:64px;
  display:flex; align-items:center; gap:16px; padding:0 28px;
}
.pr-logo-wrap { display:flex; align-items:center; gap:10px; cursor:pointer; flex-shrink:0; margin-right:8px; }
.pr-logo-box  { width:34px; height:34px; border:2px solid #06b6d4; border-radius:6px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; color:#06b6d4; }
.pr-logo-text { font-weight:700; font-size:16px; letter-spacing:-0.3px; color:#0f172e; }
.pr-back-btn {
  display:inline-flex; align-items:center; gap:6px;
  border:1.5px solid #e2e8f0; background:#fff; color:#0f172e;
  border-radius:8px; padding:7px 14px; font-size:12px; font-weight:600;
  cursor:pointer; transition:all .2s; white-space:nowrap;
}
.pr-back-btn:hover { border-color:#cbd5e1; background:#f8fafc; }

/* HERO BANNER */
.pr-hero {
  padding:88px 28px 0;
  background:#0f172e;
  border-bottom:1.5px solid rgba(6,182,212,0.15);
  position:relative; overflow:hidden;
}
.pr-hero::before {
  content:''; position:absolute; inset:0;
  background:
    radial-gradient(ellipse 60% 80% at 70% 50%, rgba(6,182,212,0.06), transparent),
    repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(6,182,212,0.02) 40px, rgba(6,182,212,0.02) 41px);
}
.pr-hero-inner { max-width:1280px; margin:0 auto; padding-bottom:0; position:relative; }

/* AVATAR ZONE */
.pr-avatar-row {
  display:flex; align-items:flex-end; gap:20px;
  padding-bottom:0; position:relative;
}
.pr-avatar-wrap { position:relative; flex-shrink:0; }
.pr-avatar {
  width:100px; height:100px; border-radius:16px;
  border:3px solid rgba(6,182,212,0.4);
  background:#1e293b; display:flex; align-items:center;
  justify-content:center; font-size:36px; font-weight:800;
  color:#06b6d4; overflow:hidden; object-fit:cover;
}
.pr-avatar img { width:100%; height:100%; object-fit:cover; border-radius:13px; }
.pr-avatar-edit-btn {
  position:absolute; bottom:-6px; right:-6px;
  width:28px; height:28px; border-radius:8px;
  background:#06b6d4; border:2px solid #0f172e;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:background .2s;
}
.pr-avatar-edit-btn:hover { background:#0891b2; }

.pr-hero-info { flex:1; padding-bottom:20px; }
.pr-hero-name { font-size:26px; font-weight:800; letter-spacing:-0.5px; color:#fff; margin-bottom:6px; }
.pr-hero-meta { display:flex; flex-wrap:wrap; align-items:center; gap:12px; }
.pr-hero-badge {
  display:inline-flex; align-items:center; gap:6px;
  background:rgba(6,182,212,0.08); border:1.5px solid rgba(6,182,212,0.2);
  border-radius:999px; padding:4px 12px; font-size:10px; font-weight:700;
  color:#06b6d4; letter-spacing:0.15em; text-transform:uppercase;
}
.pr-role-badge {
  display:inline-flex; align-items:center; gap:5px;
  border-radius:999px; padding:4px 12px; font-size:10px; font-weight:700;
  letter-spacing:0.12em; text-transform:uppercase;
}
.pr-role-worker { background:rgba(16,185,129,0.12); color:#10b981; border:1.5px solid rgba(16,185,129,0.25); }
.pr-role-client { background:rgba(6,182,212,0.12); color:#06b6d4; border:1.5px solid rgba(6,182,212,0.25); }
.pr-role-admin  { background:rgba(245,158,11,0.12); color:#f59e0b; border:1.5px solid rgba(245,158,11,0.25); }

/* TABS */
.pr-tabs {
  display:flex; gap:0;
  border-bottom:1.5px solid rgba(255,255,255,0.08);
  position:relative; margin-top:20px;
  max-width:1280px; margin-left:auto; margin-right:auto;
}
.pr-tab {
  padding:14px 22px; font-size:12px; font-weight:700;
  letter-spacing:0.08em; text-transform:uppercase;
  background:none; border:none; cursor:pointer;
  color:#475569; border-bottom:2.5px solid transparent;
  transition:all .2s; white-space:nowrap;
}
.pr-tab.active { color:#06b6d4; border-bottom-color:#06b6d4; }
.pr-tab:hover:not(.active) { color:#94a3b8; }

/* CONTENT AREA */
.pr-content { max-width:1280px; margin:0 auto; padding:32px 28px 80px; }
.pr-grid { display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:20px; align-items:start; }
.pr-grid-full { display:grid; grid-template-columns:1fr; gap:20px; }

/* CARDS */
.pr-card {
  background:#fff; border:1.5px solid #e2e8f0; border-radius:12px;
  padding:22px; margin-bottom:0;
  transition:border-color .2s;
}
.pr-card-title {
  font-size:9px; font-weight:700; color:#94a3b8;
  letter-spacing:0.2em; text-transform:uppercase;
  margin-bottom:18px; display:flex; align-items:center;
  justify-content:space-between;
}
.pr-card-title-icon { display:flex; align-items:center; gap:8px; }

/* FIELDS */
.pr-field { margin-bottom:16px; }
.pr-field:last-child { margin-bottom:0; }
.pr-field-label { font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:5px; }
.pr-field-value { font-size:14px; color:#0f172e; font-weight:500; }
.pr-field-value.muted { color:#94a3b8; font-weight:400; font-style:italic; }
.pr-field-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.pr-field-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; }

/* EDIT INPUTS */
.pr-input {
  width:100%; background:#f8fafc; border:1.5px solid #e2e8f0;
  border-radius:8px; padding:9px 12px; font-size:13px; color:#0f172e;
  outline:none; transition:border-color .2s;
}
.pr-input:focus { border-color:#06b6d4; background:#fff; }
.pr-textarea {
  width:100%; background:#f8fafc; border:1.5px solid #e2e8f0;
  border-radius:8px; padding:9px 12px; font-size:13px; color:#0f172e;
  outline:none; transition:border-color .2s; resize:vertical; min-height:80px;
}
.pr-textarea:focus { border-color:#06b6d4; background:#fff; }
.pr-select {
  width:100%; background:#f8fafc; border:1.5px solid #e2e8f0;
  border-radius:8px; padding:9px 12px; font-size:13px; color:#0f172e;
  outline:none; appearance:none; -webkit-appearance:none; cursor:pointer;
  transition:border-color .2s;
}
.pr-select:focus { border-color:#06b6d4; background:#fff; }

/* EDIT / SAVE BUTTONS */
.pr-edit-btn {
  display:inline-flex; align-items:center; gap:6px;
  border:1.5px solid #e2e8f0; background:#f8fafc; color:#64748b;
  border-radius:8px; padding:6px 12px; font-size:11px; font-weight:700;
  cursor:pointer; transition:all .2s; letter-spacing:0.06em;
}
.pr-edit-btn:hover { border-color:rgba(6,182,212,0.35); color:#06b6d4; background:rgba(6,182,212,0.05); }
.pr-save-btn {
  display:inline-flex; align-items:center; gap:6px;
  border:none; background:#06b6d4; color:#fff;
  border-radius:8px; padding:6px 14px; font-size:11px; font-weight:700;
  cursor:pointer; transition:all .2s; letter-spacing:0.06em;
}
.pr-save-btn:hover { background:#0891b2; }
.pr-cancel-btn {
  display:inline-flex; align-items:center; gap:6px;
  border:1.5px solid #e2e8f0; background:#fff; color:#64748b;
  border-radius:8px; padding:6px 12px; font-size:11px; font-weight:700;
  cursor:pointer; transition:all .2s;
}
.pr-cancel-btn:hover { border-color:#ef4444; color:#ef4444; }
.pr-btn-row { display:flex; gap:8px; margin-top:16px; justify-content:flex-end; }

/* STATS ROW */
.pr-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:16px; }
.pr-stat {
  background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:8px;
  padding:12px; text-align:center;
}
.pr-stat-value { font-size:20px; font-weight:800; color:#0f172e; }
.pr-stat-label { font-size:9px; font-weight:700; color:#94a3b8; letter-spacing:0.15em; text-transform:uppercase; margin-top:2px; }

/* TAGS */
.pr-tags { display:flex; flex-wrap:wrap; gap:6px; }
.pr-tag {
  border:1px solid rgba(6,182,212,0.2); color:#334155;
  background:#f8fafc; border-radius:999px; font-size:11px; padding:4px 10px;
  font-weight:600;
}
.pr-tag-remove {
  background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2);
  color:#ef4444; border-radius:999px; font-size:11px; padding:4px 10px;
  font-weight:600; cursor:pointer;
}

/* AVAILABILITY GRID */
.pr-avail-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
.pr-avail-day-label { font-size:9px; font-weight:700; color:#94a3b8; letter-spacing:0.1em; text-transform:uppercase; text-align:center; margin-bottom:4px; }
.pr-avail-slot {
  aspect-ratio:1; border-radius:4px; border:1.5px solid #e2e8f0;
  background:#f8fafc; display:flex; align-items:center; justify-content:center;
  font-size:8px; color:#94a3b8; cursor:pointer; transition:all .15s; font-weight:600;
}
.pr-avail-slot.on { background:rgba(6,182,212,0.1); border-color:rgba(6,182,212,0.35); color:#06b6d4; }
.pr-avail-slot:hover { border-color:rgba(6,182,212,0.35); }

/* PORTFOLIO */
.pr-portfolio-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; }
.pr-portfolio-card {
  border:1.5px solid #e2e8f0; border-radius:10px; overflow:hidden;
  transition:border-color .2s, transform .2s;
}
.pr-portfolio-card:hover { border-color:rgba(6,182,212,0.35); transform:translateY(-2px); }
.pr-portfolio-img {
  width:100%; height:100px; background:#f1f5f9;
  display:flex; align-items:center; justify-content:center;
  font-size:11px; color:#94a3b8;
}
.pr-portfolio-body { padding:10px; }
.pr-portfolio-title { font-size:12px; font-weight:700; color:#0f172e; margin-bottom:2px; }
.pr-portfolio-city  { font-size:11px; color:#94a3b8; }
.pr-featured-badge  {
  font-size:9px; padding:2px 7px; border-radius:999px;
  background:rgba(245,158,11,0.1); color:#d97706;
  border:1px solid rgba(245,158,11,0.2); font-weight:700;
  float:right; margin-top:2px; letter-spacing:0.08em;
}

/* AVAIL TOGGLE */
.pr-avail-toggle-row { display:flex; align-items:center; justify-content:space-between; padding:4px 0; }
.pr-toggle { width:40px; height:22px; border-radius:999px; border:none; cursor:pointer; position:relative; transition:background .2s; flex-shrink:0; }
.pr-toggle::after { content:''; position:absolute; top:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:left .2s; }
.pr-toggle.on  { background:#06b6d4; }
.pr-toggle.off { background:#e2e8f0; }
.pr-toggle.on::after  { left:21px; }
.pr-toggle.off::after { left:3px; }

/* STATUS PILLS */
.pr-pill-verified   { background:rgba(16,185,129,0.1); color:#059669; border:1px solid rgba(16,185,129,0.25); border-radius:999px; padding:3px 10px; font-size:10px; font-weight:700; }
.pr-pill-unverified { background:rgba(239,68,68,0.08); color:#ef4444; border:1px solid rgba(239,68,68,0.2);  border-radius:999px; padding:3px 10px; font-size:10px; font-weight:700; }

/* MOBILE */
@media(max-width:1024px){
  .pr-grid { grid-template-columns:1fr; }
}
@media(max-width:768px){
  .pr-hero { padding:76px 16px 0; }
  .pr-content { padding:24px 16px 64px; }
  .pr-hero-name { font-size:20px; }
  .pr-field-grid, .pr-field-grid-3 { grid-template-columns:1fr; }
  .pr-stats { grid-template-columns:repeat(3,1fr); }
}
@media(max-width:480px){
  .pr-avatar { width:76px; height:76px; font-size:26px; }
  .pr-tabs { overflow-x:auto; }
}
`;

const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const DAY_LABELS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const HOURS = [8,9,10,11,12,13,14,15,16,17,18];

const normalize = (v) =>
  String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9 ]+/g, " ").trim();

const avatarInitials = (n) => (n?.[0] || "?").toUpperCase();

/* ─────────────────────────────────────────────
   PROFILE PAGE
   Props:
     profileUser  — the user whose profile to show (from route/state)
     currentUser  — the logged-in user (to decide owner vs visitor)
     onBack       — go back (navigate to explore)
     onHome       — logo click
     onNavigate   — same as Explore
     onLogout
───────────────────────────────────────────── */
export default function Profile({ profileUser: initialProfile, currentUser, onBack, onHome, onNavigate, onLogout }) {
  // If no profileUser supplied, fall back to currentUser (viewing own profile)
  const [profile, setProfile] = useState(initialProfile || currentUser || null);
  const [loading, setLoading] = useState(!profile);
  const [tab, setTab]         = useState("overview");

  // Edit states per section
  const [editingInfo,   setEditingInfo]   = useState(false);
  const [editingWorker, setEditingWorker] = useState(false);
  const [editingAvail,  setEditingAvail]  = useState(false);

  // Draft copies for editing
  const [draftInfo,   setDraftInfo]   = useState({});
  const [draftWorker, setDraftWorker] = useState({});
  const [draftAvail,  setDraftAvail]  = useState({});

  const [saving, setSaving] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Is current user the owner?
  const isOwner = currentUser && profile && (
    currentUser._id === profile._id || currentUser.id === profile._id
  );

  const userInitial = avatarInitials(currentUser?.firstName || currentUser?.name || "U");

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e) => { if (!profileRef.current?.contains(e.target)) setProfileOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Derive display values
  const fn      = profile?.firstName || "Utilisateur";
  const ln      = profile?.lastName  || "";
  const role    = profile?.role      || "client";
  const wp      = profile?.workerProfile || {};
  const cp      = profile?.clientProfile || {};
  const avatar  = typeof avatarUrl === "function" ? avatarUrl(profile?.avatar) : null;
  const profs   = wp.professions || [];
  const rating  = Number(wp.rating    || 0);
  const reviews = Number(wp.totalReviews || 0);
  const avail   = wp.isAvailable !== false;
  const schedule = wp.availabilitySchedule || {};
  const portfolio = wp.portfolio || [];

  /* ── Edit helpers ──────────────────────────────────── */
  const startEditInfo = () => {
    setDraftInfo({
      firstName: profile.firstName || "",
      lastName:  profile.lastName  || "",
      phone:     profile.phone     || "",
      gender:    profile.gender    || "",
      birthDate: profile.birthDate || "",
      address:   cp.address || "",
      city_client: cp.city  || "",
      bio_client:  cp.bio   || "",
    });
    setEditingInfo(true);
  };

  const startEditWorker = () => {
    setDraftWorker({
      city:       wp.city       || "",
      experience: wp.experience || "",
      bio:        wp.bio        || "",
      hourlyRate: wp.hourlyRate || 0,
      professions: [...profs],
      isAvailable: avail,
    });
    setEditingWorker(true);
  };

  const startEditAvail = () => {
    const copy = {};
    DAYS.forEach(d => { copy[d] = [...(schedule[d] || [])]; });
    setDraftAvail(copy);
    setEditingAvail(true);
  };

  const toggleHour = (day, hour) => {
    setDraftAvail(prev => {
      const arr = prev[day] || [];
      return { ...prev, [day]: arr.includes(hour) ? arr.filter(h => h !== hour) : [...arr, hour] };
    });
  };

  const saveInfo = async () => {
    setSaving(true);
    try {
      // Replace with your real API call:
      // await userApi.updateProfile({ firstName: draftInfo.firstName, ... });
      setProfile(prev => ({
        ...prev,
        firstName: draftInfo.firstName,
        lastName:  draftInfo.lastName,
        phone:     draftInfo.phone,
        gender:    draftInfo.gender,
        birthDate: draftInfo.birthDate,
        clientProfile: { ...prev.clientProfile, address: draftInfo.address, city: draftInfo.city_client, bio: draftInfo.bio_client },
      }));
      setEditingInfo(false);
    } finally { setSaving(false); }
  };

  const saveWorker = async () => {
    setSaving(true);
    try {
      setProfile(prev => ({
        ...prev,
        workerProfile: {
          ...prev.workerProfile,
          city: draftWorker.city,
          experience: draftWorker.experience,
          bio: draftWorker.bio,
          hourlyRate: draftWorker.hourlyRate,
          professions: draftWorker.professions,
          isAvailable: draftWorker.isAvailable,
        },
      }));
      setEditingWorker(false);
    } finally { setSaving(false); }
  };

  const saveAvail = async () => {
    setSaving(true);
    try {
      setProfile(prev => ({
        ...prev,
        workerProfile: { ...prev.workerProfile, availabilitySchedule: draftAvail },
      }));
      setEditingAvail(false);
    } finally { setSaving(false); }
  };

  const removeProfession = (p) => {
    setDraftWorker(prev => ({ ...prev, professions: prev.professions.filter(x => x !== p) }));
  };

  const addProfession = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      const val = e.target.value.trim();
      setDraftWorker(prev => ({ ...prev, professions: [...new Set([...prev.professions, val])] }));
      e.target.value = "";
    }
  };

  if (loading || !profile) {
    return (
      <>
        <style>{css}</style>
        <div className="pr-root" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
          <div style={{ color:"#94a3b8", fontSize:14 }}>Chargement du profil…</div>
        </div>
      </>
    );
  }

  /* ── TAB: OVERVIEW ─────────────────────────────────── */
  const TabOverview = () => (
    <div className="pr-grid pr-anim-1">
      {/* Left column */}
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

        {/* Personal Info Card */}
        <div className="pr-card">
          <div className="pr-card-title">
            <span className="pr-card-title-icon"><Mail size={12} />Informations personnelles</span>
            {isOwner && !editingInfo && (
              <button className="pr-edit-btn" onClick={startEditInfo}><Edit3 size={11} />Modifier</button>
            )}
          </div>

          {editingInfo ? (
            <>
              <div className="pr-field-grid" style={{ marginBottom:16 }}>
                <div className="pr-field">
                  <div className="pr-field-label">Prénom</div>
                  <input className="pr-input" value={draftInfo.firstName} onChange={e => setDraftInfo(p => ({...p, firstName: e.target.value}))} />
                </div>
                <div className="pr-field">
                  <div className="pr-field-label">Nom</div>
                  <input className="pr-input" value={draftInfo.lastName} onChange={e => setDraftInfo(p => ({...p, lastName: e.target.value}))} />
                </div>
                <div className="pr-field">
                  <div className="pr-field-label">Téléphone</div>
                  <input className="pr-input" value={draftInfo.phone} onChange={e => setDraftInfo(p => ({...p, phone: e.target.value}))} />
                </div>
                <div className="pr-field">
                  <div className="pr-field-label">Genre</div>
                  <select className="pr-select" value={draftInfo.gender} onChange={e => setDraftInfo(p => ({...p, gender: e.target.value}))}>
                    <option value="">Non renseigné</option>
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div className="pr-field">
                  <div className="pr-field-label">Date de naissance</div>
                  <input className="pr-input" type="date" value={draftInfo.birthDate} onChange={e => setDraftInfo(p => ({...p, birthDate: e.target.value}))} />
                </div>
              </div>
              {role === "client" && (
                <>
                  <div className="pr-field-grid" style={{ marginBottom:16 }}>
                    <div className="pr-field">
                      <div className="pr-field-label">Adresse</div>
                      <input className="pr-input" value={draftInfo.address} onChange={e => setDraftInfo(p => ({...p, address: e.target.value}))} />
                    </div>
                    <div className="pr-field">
                      <div className="pr-field-label">Ville</div>
                      <input className="pr-input" value={draftInfo.city_client} onChange={e => setDraftInfo(p => ({...p, city_client: e.target.value}))} />
                    </div>
                  </div>
                  <div className="pr-field">
                    <div className="pr-field-label">Bio</div>
                    <textarea className="pr-textarea" value={draftInfo.bio_client} onChange={e => setDraftInfo(p => ({...p, bio_client: e.target.value}))} placeholder="Parlez de vous…" />
                  </div>
                </>
              )}
              <div className="pr-btn-row">
                <button className="pr-cancel-btn" onClick={() => setEditingInfo(false)}><X size={11} />Annuler</button>
                <button className="pr-save-btn" onClick={saveInfo} disabled={saving}><Check size={11} />{saving ? "Enregistrement…" : "Enregistrer"}</button>
              </div>
            </>
          ) : (
            <div className="pr-field-grid">
              <div className="pr-field">
                <div className="pr-field-label">Email</div>
                <div className="pr-field-value">{profile.email}</div>
              </div>
              <div className="pr-field">
                <div className="pr-field-label">Téléphone</div>
                <div className={`pr-field-value ${profile.phone ? "" : "muted"}`}>{profile.phone || "Non renseigné"}</div>
              </div>
              <div className="pr-field">
                <div className="pr-field-label">Genre</div>
                <div className={`pr-field-value ${profile.gender ? "" : "muted"}`}>
                  {profile.gender === "male" ? "Homme" : profile.gender === "female" ? "Femme" : profile.gender === "other" ? "Autre" : "Non renseigné"}
                </div>
              </div>
              <div className="pr-field">
                <div className="pr-field-label">Date de naissance</div>
                <div className={`pr-field-value ${profile.birthDate ? "" : "muted"}`}>
                  {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" }) : "Non renseignée"}
                </div>
              </div>
              {role === "client" && (
                <>
                  <div className="pr-field">
                    <div className="pr-field-label">Ville</div>
                    <div className={`pr-field-value ${cp.city ? "" : "muted"}`}>{cp.city || "Non renseignée"}</div>
                  </div>
                  <div className="pr-field">
                    <div className="pr-field-label">Adresse</div>
                    <div className={`pr-field-value ${cp.address ? "" : "muted"}`}>{cp.address || "Non renseignée"}</div>
                  </div>
                  {cp.bio && (
                    <div className="pr-field" style={{ gridColumn:"1/-1" }}>
                      <div className="pr-field-label">Bio</div>
                      <div className="pr-field-value" style={{ fontWeight:400, lineHeight:1.7 }}>{cp.bio}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Worker profile card */}
        {role === "worker" && (
          <div className="pr-card">
            <div className="pr-card-title">
              <span className="pr-card-title-icon"><Briefcase size={12} />Profil prestataire</span>
              {isOwner && !editingWorker && (
                <button className="pr-edit-btn" onClick={startEditWorker}><Edit3 size={11} />Modifier</button>
              )}
            </div>

            {editingWorker ? (
              <>
                <div className="pr-field-grid" style={{ marginBottom:16 }}>
                  <div className="pr-field">
                    <div className="pr-field-label">Ville</div>
                    <input className="pr-input" value={draftWorker.city} onChange={e => setDraftWorker(p => ({...p, city: e.target.value}))} />
                  </div>
                  <div className="pr-field">
                    <div className="pr-field-label">Expérience</div>
                    <input className="pr-input" value={draftWorker.experience} onChange={e => setDraftWorker(p => ({...p, experience: e.target.value}))} placeholder="Ex: 5 ans" />
                  </div>
                  <div className="pr-field">
                    <div className="pr-field-label">Tarif horaire (TND/h)</div>
                    <input className="pr-input" type="number" min="0" value={draftWorker.hourlyRate} onChange={e => setDraftWorker(p => ({...p, hourlyRate: Number(e.target.value)}))} />
                  </div>
                </div>
                <div className="pr-field" style={{ marginBottom:16 }}>
                  <div className="pr-field-label">Bio</div>
                  <textarea className="pr-textarea" value={draftWorker.bio} onChange={e => setDraftWorker(p => ({...p, bio: e.target.value}))} placeholder="Décrivez votre expertise…" />
                </div>
                <div className="pr-field" style={{ marginBottom:16 }}>
                  <div className="pr-field-label">Métiers (Entrée pour ajouter)</div>
                  <div className="pr-tags" style={{ marginBottom:8 }}>
                    {draftWorker.professions.map(p => (
                      <span key={p} className="pr-tag-remove" onClick={() => removeProfession(p)}>{p} ×</span>
                    ))}
                  </div>
                  <input className="pr-input" placeholder="Ajouter un métier puis Entrée…" onKeyDown={addProfession} />
                </div>
                <div className="pr-avail-toggle-row" style={{ marginBottom:16 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:"#0f172e" }}>Disponible actuellement</span>
                  <button className={`pr-toggle ${draftWorker.isAvailable ? "on" : "off"}`} onClick={() => setDraftWorker(p => ({...p, isAvailable: !p.isAvailable}))} />
                </div>
                <div className="pr-btn-row">
                  <button className="pr-cancel-btn" onClick={() => setEditingWorker(false)}><X size={11} />Annuler</button>
                  <button className="pr-save-btn" onClick={saveWorker} disabled={saving}><Check size={11} />{saving ? "Enregistrement…" : "Enregistrer"}</button>
                </div>
              </>
            ) : (
              <>
                <div className="pr-field-grid" style={{ marginBottom:16 }}>
                  <div className="pr-field">
                    <div className="pr-field-label">Ville</div>
                    <div className={`pr-field-value ${wp.city ? "" : "muted"}`}>{wp.city || "Non renseignée"}</div>
                  </div>
                  <div className="pr-field">
                    <div className="pr-field-label">Expérience</div>
                    <div className={`pr-field-value ${wp.experience ? "" : "muted"}`}>{wp.experience || "Non renseignée"}</div>
                  </div>
                  <div className="pr-field">
                    <div className="pr-field-label">Tarif horaire</div>
                    <div className="pr-field-value">{wp.hourlyRate > 0 ? `${wp.hourlyRate} TND/h` : "Sur devis"}</div>
                  </div>
                  <div className="pr-field">
                    <div className="pr-field-label">Disponibilité</div>
                    <div style={{ marginTop:4 }}>
                      <span className={avail ? "pr-pill-verified" : "pr-pill-unverified"}>
                        {avail ? "Disponible" : "Indisponible"}
                      </span>
                    </div>
                  </div>
                </div>
                {wp.bio && (
                  <div className="pr-field" style={{ marginBottom:16 }}>
                    <div className="pr-field-label">Bio</div>
                    <div style={{ fontSize:13, color:"#334155", lineHeight:1.75 }}>{wp.bio}</div>
                  </div>
                )}
                {profs.length > 0 && (
                  <div className="pr-field">
                    <div className="pr-field-label">Métiers</div>
                    <div className="pr-tags" style={{ marginTop:4 }}>
                      {profs.map(p => <span key={p} className="pr-tag">{p}</span>)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right column — stats sidebar */}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* Stats */}
        {role === "worker" && (
          <div className="pr-card">
            <div className="pr-card-title"><span className="pr-card-title-icon"><Award size={12} />Statistiques</span></div>
            <div className="pr-stats">
              <div className="pr-stat">
                <div className="pr-stat-value" style={{ color:"#f59e0b", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                  <Star size={14} fill="#f59e0b" />{rating.toFixed(1)}
                </div>
                <div className="pr-stat-label">Note</div>
              </div>
              <div className="pr-stat">
                <div className="pr-stat-value">{reviews}</div>
                <div className="pr-stat-label">Avis</div>
              </div>
              <div className="pr-stat">
                <div className="pr-stat-value">{wp.hourlyRate > 0 ? wp.hourlyRate : "—"}</div>
                <div className="pr-stat-label">TND/h</div>
              </div>
            </div>
          </div>
        )}

        {/* Account status */}
        <div className="pr-card">
          <div className="pr-card-title"><span className="pr-card-title-icon"><ShieldCheck size={12} />Compte</span></div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>Email vérifié</span>
              <span className={profile.isVerified ? "pr-pill-verified" : "pr-pill-unverified"}>
                {profile.isVerified ? "✓ Vérifié" : "✗ Non vérifié"}
              </span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>Statut</span>
              <span className={profile.isActive ? "pr-pill-verified" : "pr-pill-unverified"}>
                {profile.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>Rôle</span>
              <span className={`pr-role-badge pr-role-${role}`}>{role}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>Membre depuis</span>
              <span style={{ fontSize:12, fontWeight:600, color:"#0f172e" }}>
                {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("fr-FR", { month:"short", year:"numeric" }) : "—"}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  /* ── TAB: AVAILABILITY & PORTFOLIO (workers only) ── */
  const TabSchedule = () => (
    <div className="pr-grid-full pr-anim-2">

      {/* Availability */}
      <div className="pr-card">
        <div className="pr-card-title">
          <span className="pr-card-title-icon"><Calendar size={12} />Disponibilités hebdomadaires</span>
          {isOwner && !editingAvail && (
            <button className="pr-edit-btn" onClick={startEditAvail}><Edit3 size={11} />Modifier</button>
          )}
        </div>

        <div style={{ marginBottom:8 }}>
          <div className="pr-avail-grid">
            {DAYS.map((d, i) => (
              <div key={d} style={{ textAlign:"center" }}>
                <div className="pr-avail-day-label">{DAY_LABELS[i]}</div>
                {HOURS.map(h => {
                  const active = editingAvail
                    ? (draftAvail[d] || []).includes(h)
                    : (schedule[d] || []).includes(h);
                  return (
                    <div
                      key={h}
                      className={`pr-avail-slot ${active ? "on" : ""}`}
                      onClick={() => editingAvail && toggleHour(d, h)}
                      style={{ cursor: editingAvail ? "pointer" : "default" }}
                    >
                      {h}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p style={{ fontSize:10, color:"#94a3b8", marginTop:10, letterSpacing:"0.06em" }}>
            Chiffres = heure (format 24h) · Cyan = disponible
            {editingAvail && " · Cliquez pour basculer"}
          </p>
        </div>

        {editingAvail && (
          <div className="pr-btn-row">
            <button className="pr-cancel-btn" onClick={() => setEditingAvail(false)}><X size={11} />Annuler</button>
            <button className="pr-save-btn" onClick={saveAvail} disabled={saving}><Check size={11} />{saving ? "Enregistrement…" : "Enregistrer"}</button>
          </div>
        )}
      </div>

      {/* Portfolio */}
      <div className="pr-card">
        <div className="pr-card-title">
          <span className="pr-card-title-icon"><Camera size={12} />Portfolio</span>
        </div>
        {portfolio.length > 0 ? (
          <div className="pr-portfolio-grid">
            {portfolio.map((p, i) => (
              <div key={i} className="pr-portfolio-card">
                <div className="pr-portfolio-img">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : "Pas d'image"
                  }
                </div>
                <div className="pr-portfolio-body">
                  {p.featured && <span className="pr-featured-badge">À la une</span>}
                  <div className="pr-portfolio-title">{p.title}</div>
                  <div className="pr-portfolio-city">{p.city}</div>
                  {p.description && <div style={{ fontSize:10, color:"#94a3b8", marginTop:4, lineHeight:1.5 }}>{p.description}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign:"center", padding:"32px 20px", color:"#94a3b8", fontSize:13 }}>
            Aucun projet dans le portfolio.
            {isOwner && <div style={{ marginTop:8, fontSize:12 }}>Ajoutez vos réalisations via les paramètres.</div>}
          </div>
        )}
      </div>
    </div>
  );

  /* ── RENDER ─────────────────────────────────────────── */
  const tabs = [
    { id:"overview",  label:"Aperçu" },
    ...(role === "worker" ? [{ id:"schedule", label:"Disponibilités & Portfolio" }] : []),
  ];

  return (
    <>
      <style>{css}</style>

      <div className="pr-root">

        {/* NAVBAR */}
        <nav className="pr-nav">
          <div className="pr-nav-inner">
            <div className="pr-logo-wrap" onClick={onHome}>
              <div className="pr-logo-box">S</div>
              <span className="pr-logo-text">servigo</span>
            </div>

            {/* Nav links */}
            <div style={{ display:"flex", gap:2, alignItems:"center", flexShrink:0 }}>
              {[
                { label:"Explorer", action: onBack },
                { label:"Profil",   action: () => onNavigate?.("profile") },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  style={{ background:"none", border:"1.5px solid transparent", cursor:"pointer", fontSize:12, fontWeight:600, letterSpacing:"0.06em", color:"#64748b", padding:"7px 14px", borderRadius:24, transition:"all .2s", whiteSpace:"nowrap" }}
                  onMouseEnter={e => { e.currentTarget.style.background="rgba(6,182,212,0.08)"; e.currentTarget.style.borderColor="rgba(6,182,212,0.2)"; e.currentTarget.style.color="#06b6d4"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.color="#64748b"; }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div style={{ flex:1 }} />

            {/* Right side */}
            <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0, position:"relative" }} ref={profileRef}>
              {currentUser ? (
                <>
                  <button
                    onClick={() => setProfileOpen(p => !p)}
                    style={{ width:36, height:36, borderRadius:"50%", border:"1.5px solid rgba(6,182,212,0.35)", background:"#0f172e", color:"#06b6d4", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"hidden" }}
                  >
                    {currentUser.avatar
                      ? <img src={typeof avatarUrl === "function" ? avatarUrl(currentUser.avatar) : currentUser.avatar} style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover" }} alt="" />
                      : userInitial
                    }
                  </button>
                  {profileOpen && (
                    <div style={{ position:"absolute", top:44, right:0, minWidth:190, background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:10, boxShadow:"0 14px 36px rgba(15,23,46,0.12)", padding:8, zIndex:1200, display:"grid", gap:4 }}>
                      <div style={{ padding:"8px 12px 10px", borderBottom:"1px solid #f1f5f9", marginBottom:4 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"#0f172e" }}>{currentUser.firstName || "Utilisateur"}</div>
                        <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{currentUser.email || ""}</div>
                      </div>
                      <button onClick={() => { setProfileOpen(false); onNavigate?.("profile"); }}       style={{ background:"#fff", border:"none", textAlign:"left", padding:"10px 12px", borderRadius:8, cursor:"pointer", fontSize:13, color:"#0f172e", fontWeight:600 }}>Mon Profil</button>
                      <button onClick={() => { setProfileOpen(false); onNavigate?.("reservations"); }} style={{ background:"#fff", border:"none", textAlign:"left", padding:"10px 12px", borderRadius:8, cursor:"pointer", fontSize:13, color:"#0f172e", fontWeight:600 }}>Mes Réservations</button>
                      <button onClick={() => { setProfileOpen(false); onLogout?.(); }}                 style={{ background:"#fff", border:"none", textAlign:"left", padding:"10px 12px", borderRadius:8, cursor:"pointer", fontSize:13, color:"#b91c1c", fontWeight:700 }}>Déconnexion</button>
                    </div>
                  )}
                </>
              ) : (
                <button className="pr-back-btn" onClick={onBack}><ChevronLeft size={13} />Retour</button>
              )}
            </div>
          </div>
        </nav>

        {/* HERO BANNER */}
        <section className="pr-hero">
          <div className="pr-hero-inner">
            <div className="pr-avatar-row pr-anim-1">
              <div className="pr-avatar-wrap">
                <div className="pr-avatar">
                  {avatar
                    ? <img src={avatar} alt={fn} />
                    : avatarInitials(fn)
                  }
                </div>
                {isOwner && (
                  <button className="pr-avatar-edit-btn" title="Changer la photo">
                    <Camera size={12} color="#fff" />
                  </button>
                )}
              </div>

              <div className="pr-hero-info">
                <div className="pr-hero-name">{fn} {ln}</div>
                <div className="pr-hero-meta">
                  <span className={`pr-role-badge pr-role-${role}`}>{role}</span>
                  {role === "worker" && wp.city && (
                    <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#64748b" }}>
                      <MapPin size={11} color="#475569" />{wp.city}
                    </span>
                  )}
                  {role === "worker" && (
                    <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:avail ? "#10b981" : "#d97706", fontWeight:600 }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background: avail ? "#10b981" : "#f59e0b" }} />
                      {avail ? "Disponible" : "Indisponible"}
                    </span>
                  )}
                  {role === "worker" && rating > 0 && (
                    <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#94a3b8" }}>
                      <Star size={11} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontWeight:700, color:"#fff" }}>{rating.toFixed(1)}</span>
                      <span>({reviews} avis)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs sit at bottom of hero */}
          <div className="pr-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`pr-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* CONTENT */}
        <div className="pr-content">
          {tab === "overview"  && <TabOverview />}
          {tab === "schedule"  && <TabSchedule />}
        </div>

      </div>
    </>
  );
}