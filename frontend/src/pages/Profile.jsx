import { useEffect, useRef, useState } from "react";
import {
  MapPin, Star, Briefcase, Edit3, Check, X,
  ShieldCheck, Camera, Mail, Calendar, Award,
  Bookmark, Plus, Trash2, CheckCircle, XCircle,
} from "lucide-react";
import { avatarUrl, workerApi, clientApi } from "../api";
import Navbar from "../components/Navbar";

/* ─── constants ─────────────────────────────────────────────────────────── */
const DAYS      = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const DAYS_FULL  = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const HOURS      = [8,9,10,11,12,13,14,15,16,17,18];
const avatarInitials = (n) => (n?.[0] || "?").toUpperCase();

const toRanges = (hours) => {
  if (!hours || hours.length === 0) return null;
  const sorted = [...hours].sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0], end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) { end = sorted[i]; }
    else { ranges.push([start, end]); start = end = sorted[i]; }
  }
  ranges.push([start, end]);
  return ranges.map(([s, e]) => `${s}h – ${e + 1}h`).join("  ·  ");
};

/* ─── char counter ──────────────────────────────────────────────────────── */
function CharCount({ value, max }) {
  const len = (value || "").length;
  const pct = len / max;
  const color = pct >= 1 ? "#ef4444" : pct >= 0.85 ? "#f59e0b" : "#cbd5e1";
  return (
    <span style={{ display:"block", textAlign:"right", fontSize:10, fontWeight:600, color, marginTop:3 }}>
      {len}/{max}
    </span>
  );
}

/* ─── css ────────────────────────────────────────────────────────────────── */
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
.pr-root {
  min-height:100vh;
  background:
    radial-gradient(ellipse 55% 45% at 10% 10%, rgba(6,182,212,0.05), transparent),
    radial-gradient(ellipse 50% 50% at 90% 90%, rgba(6,182,212,0.03), transparent),
    repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(6,182,212,0.012) 60px, rgba(6,182,212,0.012) 61px),
    #f8fafc;
}
.pr-hero {
  padding:88px 28px 0; background:#0f172e;
  border-bottom:1.5px solid rgba(6,182,212,0.15);
  position:relative; overflow:hidden;
}
.pr-hero::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(ellipse 60% 80% at 70% 50%, rgba(6,182,212,0.06), transparent),
    repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(6,182,212,0.02) 40px, rgba(6,182,212,0.02) 41px);
}
.pr-hero-inner { max-width:1280px; margin:0 auto; padding-bottom:0; position:relative; }
.pr-avatar-row { display:flex; align-items:flex-end; gap:20px; position:relative; }
.pr-avatar-wrap { position:relative; flex-shrink:0; }
.pr-avatar {
  width:100px; height:100px; border-radius:16px;
  border:3px solid rgba(6,182,212,0.4); background:#1e293b;
  display:flex; align-items:center; justify-content:center;
  font-size:36px; font-weight:800; color:#06b6d4; overflow:hidden;
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
.pr-hero-actions { display:flex; gap:10px; margin-top:14px; flex-wrap:wrap; }
.pr-role-badge {
  display:inline-flex; align-items:center; gap:5px;
  border-radius:999px; padding:4px 12px; font-size:10px; font-weight:700;
  letter-spacing:0.12em; text-transform:uppercase;
}
.pr-role-worker { background:rgba(16,185,129,0.12); color:#10b981; border:1.5px solid rgba(16,185,129,0.25); }
.pr-role-client { background:rgba(6,182,212,0.12); color:#06b6d4; border:1.5px solid rgba(6,182,212,0.25); }
.pr-role-admin  { background:rgba(245,158,11,0.12); color:#f59e0b; border:1.5px solid rgba(245,158,11,0.25); }
.pr-action-btn {
  display:inline-flex; align-items:center; gap:7px;
  border:none; border-radius:8px; padding:9px 18px;
  font-size:12px; font-weight:700; cursor:pointer;
  letter-spacing:0.06em; transition:all .2s;
}
.pr-action-btn.primary { background:#06b6d4; color:#fff; }
.pr-action-btn.primary:hover { background:#0891b2; }
.pr-action-btn.secondary { background:rgba(255,255,255,0.08); color:#fff; border:1.5px solid rgba(255,255,255,0.15); }
.pr-action-btn.secondary:hover { background:rgba(255,255,255,0.14); }
.pr-action-btn.save { background:rgba(6,182,212,0.12); color:#06b6d4; border:1.5px solid rgba(6,182,212,0.25); }
.pr-action-btn.save.saved { background:rgba(6,182,212,0.22); }
.pr-tabs {
  display:flex; gap:0; border-bottom:1.5px solid rgba(255,255,255,0.08);
  margin-top:20px; max-width:1280px; margin-left:auto; margin-right:auto;
  position:relative;
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
.pr-content { max-width:1280px; margin:0 auto; padding:32px 28px 80px; }
.pr-grid { display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:20px; align-items:start; }
.pr-grid-full { display:grid; grid-template-columns:1fr; gap:20px; }
.pr-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; padding:22px; }
.pr-card-title {
  font-size:9px; font-weight:700; color:#94a3b8;
  letter-spacing:0.2em; text-transform:uppercase;
  margin-bottom:18px; display:flex; align-items:center; justify-content:space-between;
}
.pr-card-title-icon { display:flex; align-items:center; gap:8px; }
.pr-field { margin-bottom:16px; }
.pr-field:last-child { margin-bottom:0; }
.pr-field-label { font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:5px; }
.pr-field-value { font-size:14px; color:#0f172e; font-weight:500; }
.pr-field-value.muted { color:#94a3b8; font-weight:400; font-style:italic; }
.pr-field-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
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
  outline:none; appearance:none; -webkit-appearance:none; cursor:pointer; transition:border-color .2s;
}
.pr-select:focus { border-color:#06b6d4; background:#fff; }
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
.pr-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:16px; }
.pr-stat { background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:8px; padding:12px; text-align:center; }
.pr-stat-value { font-size:20px; font-weight:800; color:#0f172e; }
.pr-stat-label { font-size:9px; font-weight:700; color:#94a3b8; letter-spacing:0.15em; text-transform:uppercase; margin-top:2px; }
.pr-tags { display:flex; flex-wrap:wrap; gap:6px; }
.pr-tag { border:1px solid rgba(6,182,212,0.2); color:#334155; background:#f8fafc; border-radius:999px; font-size:11px; padding:4px 10px; font-weight:600; }
.pr-tag-remove { background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); color:#ef4444; border-radius:999px; font-size:11px; padding:4px 10px; font-weight:600; cursor:pointer; }
.pr-avail-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
.pr-avail-day-label { font-size:9px; font-weight:700; color:#94a3b8; letter-spacing:0.1em; text-transform:uppercase; text-align:center; margin-bottom:4px; }
.pr-avail-slot { aspect-ratio:1; border-radius:4px; border:1.5px solid #e2e8f0; background:#f8fafc; display:flex; align-items:center; justify-content:center; font-size:8px; color:#94a3b8; cursor:pointer; transition:all .15s; font-weight:600; }
.pr-avail-slot.on { background:rgba(6,182,212,0.1); border-color:rgba(6,182,212,0.35); color:#06b6d4; }
.pr-avail-slot.editing:hover { border-color:rgba(6,182,212,0.5); background:rgba(6,182,212,0.05); }
.pr-portfolio-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; }
.pr-portfolio-card { border:1.5px solid #e2e8f0; border-radius:10px; overflow:hidden; transition:border-color .2s, transform .2s; }
.pr-portfolio-card:hover { border-color:rgba(6,182,212,0.35); transform:translateY(-2px); }
.pr-portfolio-img { width:100%; height:100px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; font-size:11px; color:#94a3b8; }
.pr-portfolio-body { padding:10px; }
.pr-portfolio-title { font-size:12px; font-weight:700; color:#0f172e; margin-bottom:2px; }
.pr-portfolio-city  { font-size:11px; color:#94a3b8; }
.pr-avail-toggle-row { display:flex; align-items:center; justify-content:space-between; padding:4px 0; }
.pr-toggle { width:40px; height:22px; border-radius:999px; border:none; cursor:pointer; position:relative; transition:background .2s; flex-shrink:0; }
.pr-toggle::after { content:''; position:absolute; top:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:left .2s; }
.pr-toggle.on  { background:#06b6d4; }
.pr-toggle.off { background:#e2e8f0; }
.pr-toggle.on::after  { left:21px; }
.pr-toggle.off::after { left:3px; }
.pr-pill-verified   { background:rgba(16,185,129,0.1); color:#059669; border:1px solid rgba(16,185,129,0.25); border-radius:999px; padding:3px 10px; font-size:10px; font-weight:700; }
.pr-pill-unverified { background:rgba(239,68,68,0.08); color:#ef4444; border:1px solid rgba(239,68,68,0.2); border-radius:999px; padding:3px 10px; font-size:10px; font-weight:700; }
/* ── Availability redesign ── */
.pr-avail-day-row { display:flex; align-items:center; gap:14px; padding:10px 0; border-bottom:1px solid #f1f5f9; }
.pr-avail-day-row:last-child { border-bottom:none; }
.pr-avail-day-name { font-size:12px; font-weight:700; color:#0f172e; width:80px; flex-shrink:0; }
.pr-avail-range { font-size:13px; color:#06b6d4; font-weight:600; }
.pr-avail-off { font-size:12px; color:#cbd5e1; font-weight:500; font-style:italic; }
.pr-avail-hours { display:flex; flex-wrap:wrap; gap:5px; flex:1; }
.pr-avail-hour-btn { border:1.5px solid #e2e8f0; background:#f8fafc; color:#64748b; border-radius:6px; padding:5px 8px; font-size:11px; font-weight:600; cursor:pointer; transition:all .15s; font-family:'Sora',sans-serif; }
.pr-avail-hour-btn:hover { border-color:rgba(6,182,212,0.4); color:#06b6d4; background:rgba(6,182,212,0.05); }
.pr-avail-hour-btn.on { background:rgba(6,182,212,0.12); border-color:rgba(6,182,212,0.4); color:#06b6d4; }
/* ── Portfolio enlarged ── */
.pr-portfolio-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:14px; }
.pr-portfolio-img { width:100%; height:140px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; font-size:12px; color:#94a3b8; overflow:hidden; }
.pr-portfolio-img img { width:100%; height:100%; object-fit:cover; }
/* ── Portfolio management ── */
.pr-portfolio-add-form {
  border:1.5px dashed rgba(6,182,212,0.3); border-radius:10px;
  padding:18px; background:rgba(6,182,212,0.02); margin-bottom:16px;
}
.pr-portfolio-action-btn {
  width:26px; height:26px; border-radius:6px;
  border:1.5px solid #e2e8f0; background:#fff;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:all .15s; color:#64748b;
}
.pr-portfolio-action-btn:hover { border-color:rgba(6,182,212,0.4); color:#06b6d4; background:rgba(6,182,212,0.05); }
.pr-portfolio-action-btn.danger:hover { border-color:rgba(239,68,68,0.35); color:#ef4444; background:rgba(239,68,68,0.05); }
.pr-img-preview { width:100%; max-height:160px; object-fit:cover; border-radius:8px; border:1.5px solid #e2e8f0; margin-bottom:8px; display:block; }
@media(max-width:1024px){ .pr-grid{ grid-template-columns:1fr; } }
@media(max-width:768px){ .pr-hero{ padding:76px 16px 0; } .pr-content{ padding:24px 16px 64px; } .pr-hero-name{ font-size:20px; } .pr-field-grid{ grid-template-columns:1fr; } .pr-stats{ grid-template-columns:repeat(3,1fr); } .pr-avail-day-name{ width:60px; } }
@media(max-width:480px){ .pr-avatar{ width:76px; height:76px; font-size:26px; } .pr-tabs{ overflow-x:auto; } }
`;

/* ═══════════════════════════════════════════════════════════════════════════
   TAB COMPONENTS — defined OUTSIDE Profile to prevent remount on every render
   (This was the bug: defining them inside caused re-creation on each keystroke)
═══════════════════════════════════════════════════════════════════════════ */

function TabOverview({
  profile, role, wp, cp, profs, rating, reviews, avail,
  isOwner,
  editingInfo, draftInfo, setDraftInfo, startEditInfo, saveInfo, saving, setEditingInfo,
  editingWorker, draftWorker, setDraftWorker, startEditWorker, saveWorker, setEditingWorker,
  removeProfession, addProfession,
}) {
  return (
    <div className="pr-grid pr-anim-1">
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

        {/* Personal info */}
        <div className="pr-card">
          <div className="pr-card-title">
            <span className="pr-card-title-icon"><Mail size={12} />Informations personnelles</span>
            {isOwner && !editingInfo && <button className="pr-edit-btn" onClick={startEditInfo}><Edit3 size={11} />Modifier</button>}
          </div>
          {editingInfo ? (
            <>
              <div className="pr-field-grid" style={{ marginBottom:16 }}>
                <div className="pr-field">
                  <div className="pr-field-label">Prénom</div>
                  <input className="pr-input" maxLength={30} value={draftInfo.firstName} onChange={e => setDraftInfo(p => ({...p, firstName: e.target.value}))} />
                  <CharCount value={draftInfo.firstName} max={30} />
                </div>
                <div className="pr-field">
                  <div className="pr-field-label">Nom</div>
                  <input className="pr-input" maxLength={30} value={draftInfo.lastName} onChange={e => setDraftInfo(p => ({...p, lastName: e.target.value}))} />
                  <CharCount value={draftInfo.lastName} max={30} />
                </div>
                <div className="pr-field">
                  <div className="pr-field-label">Téléphone</div>
                  <input className="pr-input" maxLength={15} value={draftInfo.phone} onChange={e => setDraftInfo(p => ({...p, phone: e.target.value}))} />
                  <CharCount value={draftInfo.phone} max={15} />
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
                      <input className="pr-input" maxLength={100} value={draftInfo.address} onChange={e => setDraftInfo(p => ({...p, address: e.target.value}))} />
                      <CharCount value={draftInfo.address} max={100} />
                    </div>
                    <div className="pr-field">
                      <div className="pr-field-label">Ville</div>
                      <input className="pr-input" maxLength={50} value={draftInfo.city_client} onChange={e => setDraftInfo(p => ({...p, city_client: e.target.value}))} />
                      <CharCount value={draftInfo.city_client} max={50} />
                    </div>
                  </div>
                  <div className="pr-field">
                    <div className="pr-field-label">Bio</div>
                    <textarea className="pr-textarea" maxLength={300} value={draftInfo.bio_client} onChange={e => setDraftInfo(p => ({...p, bio_client: e.target.value}))} placeholder="Parlez de vous…" />
                    <CharCount value={draftInfo.bio_client} max={300} />
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
              <div className="pr-field"><div className="pr-field-label">Email</div><div className="pr-field-value">{profile.email}</div></div>
              <div className="pr-field"><div className="pr-field-label">Téléphone</div><div className={`pr-field-value ${profile.phone?"":"muted"}`}>{profile.phone||"Non renseigné"}</div></div>
              <div className="pr-field">
                <div className="pr-field-label">Genre</div>
                <div className={`pr-field-value ${profile.gender?"":"muted"}`}>
                  {profile.gender==="male"?"Homme":profile.gender==="female"?"Femme":profile.gender==="other"?"Autre":"Non renseigné"}
                </div>
              </div>
              <div className="pr-field">
                <div className="pr-field-label">Date de naissance</div>
                <div className={`pr-field-value ${profile.birthDate?"":"muted"}`}>
                  {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}) : "Non renseignée"}
                </div>
              </div>
              {role === "client" && <>
                <div className="pr-field"><div className="pr-field-label">Ville</div><div className={`pr-field-value ${cp.city?"":"muted"}`}>{cp.city||"Non renseignée"}</div></div>
                <div className="pr-field"><div className="pr-field-label">Adresse</div><div className={`pr-field-value ${cp.address?"":"muted"}`}>{cp.address||"Non renseignée"}</div></div>
                {cp.bio && <div className="pr-field" style={{gridColumn:"1/-1"}}><div className="pr-field-label">Bio</div><div className="pr-field-value" style={{fontWeight:400,lineHeight:1.7}}>{cp.bio}</div></div>}
              </>}
            </div>
          )}
        </div>

        {/* Worker profile */}
        {role === "worker" && (
          <div className="pr-card">
            <div className="pr-card-title">
              <span className="pr-card-title-icon"><Briefcase size={12} />Profil prestataire</span>
              {isOwner && !editingWorker && <button className="pr-edit-btn" onClick={startEditWorker}><Edit3 size={11} />Modifier</button>}
            </div>
            {editingWorker ? (
              <>
                <div className="pr-field-grid" style={{ marginBottom:16 }}>
                  <div className="pr-field">
                    <div className="pr-field-label">Ville</div>
                    <input className="pr-input" maxLength={50} value={draftWorker.city} onChange={e => setDraftWorker(p => ({...p, city:e.target.value}))} />
                    <CharCount value={draftWorker.city} max={50} />
                  </div>
                  <div className="pr-field">
                    <div className="pr-field-label">Expérience</div>
                    <input className="pr-input" maxLength={80} value={draftWorker.experience} onChange={e => setDraftWorker(p => ({...p, experience:e.target.value}))} placeholder="Ex: 5 ans" />
                    <CharCount value={draftWorker.experience} max={80} />
                  </div>
                  <div className="pr-field"><div className="pr-field-label">Tarif horaire (TND/h)</div><input className="pr-input" type="number" min="0" value={draftWorker.hourlyRate} onChange={e => setDraftWorker(p => ({...p, hourlyRate:Number(e.target.value)}))} /></div>
                </div>
                <div className="pr-field" style={{ marginBottom:16 }}>
                  <div className="pr-field-label">Bio</div>
                  <textarea className="pr-textarea" maxLength={300} value={draftWorker.bio} onChange={e => setDraftWorker(p => ({...p, bio:e.target.value}))} placeholder="Décrivez votre expertise…" />
                  <CharCount value={draftWorker.bio} max={300} />
                </div>
                <div className="pr-field" style={{ marginBottom:16 }}>
                  <div className="pr-field-label">Métiers (Entrée pour ajouter)</div>
                  <div className="pr-tags" style={{ marginBottom:8 }}>{draftWorker.professions.map(p => <span key={p} className="pr-tag-remove" onClick={() => removeProfession(p)}>{p} ×</span>)}</div>
                  <input className="pr-input" placeholder="Ajouter un métier puis Entrée…" onKeyDown={addProfession} />
                </div>
                <div className="pr-avail-toggle-row" style={{ marginBottom:16 }}>
                  <span style={{ fontSize:13,fontWeight:600,color:"#0f172e" }}>Disponible actuellement</span>
                  <button className={`pr-toggle ${draftWorker.isAvailable?"on":"off"}`} onClick={() => setDraftWorker(p => ({...p,isAvailable:!p.isAvailable}))} />
                </div>
                <div className="pr-btn-row">
                  <button className="pr-cancel-btn" onClick={() => setEditingWorker(false)}><X size={11} />Annuler</button>
                  <button className="pr-save-btn" onClick={saveWorker} disabled={saving}><Check size={11} />{saving?"Enregistrement…":"Enregistrer"}</button>
                </div>
              </>
            ) : (
              <>
                <div className="pr-field-grid" style={{ marginBottom:16 }}>
                  <div className="pr-field"><div className="pr-field-label">Ville</div><div className={`pr-field-value ${wp.city?"":"muted"}`}>{wp.city||"Non renseignée"}</div></div>
                  <div className="pr-field"><div className="pr-field-label">Expérience</div><div className={`pr-field-value ${wp.experience?"":"muted"}`}>{wp.experience||"Non renseignée"}</div></div>
                  <div className="pr-field"><div className="pr-field-label">Tarif horaire</div><div className="pr-field-value">{wp.hourlyRate>0?`${wp.hourlyRate} TND/h`:"Sur devis"}</div></div>
                  <div className="pr-field"><div className="pr-field-label">Disponibilité</div><div style={{marginTop:4}}><span className={avail?"pr-pill-verified":"pr-pill-unverified"}>{avail?"Disponible":"Indisponible"}</span></div></div>
                </div>
                {wp.bio && <div className="pr-field" style={{marginBottom:16}}><div className="pr-field-label">Bio</div><div style={{fontSize:13,color:"#334155",lineHeight:1.75}}>{wp.bio}</div></div>}
                {profs.length > 0 && <div className="pr-field"><div className="pr-field-label">Métiers</div><div className="pr-tags" style={{marginTop:4}}>{profs.map(p => <span key={p} className="pr-tag">{p}</span>)}</div></div>}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right column */}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {role === "worker" && (
          <div className="pr-card">
            <div className="pr-card-title"><span className="pr-card-title-icon"><Award size={12} />Statistiques</span></div>
            <div className="pr-stats">
              <div className="pr-stat">
                <div className="pr-stat-value" style={{color:"#f59e0b",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><Star size={14} fill="#f59e0b"/>{rating.toFixed(1)}</div>
                <div className="pr-stat-label">Note</div>
              </div>
              <div className="pr-stat"><div className="pr-stat-value">{reviews}</div><div className="pr-stat-label">Avis</div></div>
              <div className="pr-stat"><div className="pr-stat-value">{wp.hourlyRate>0?wp.hourlyRate:"—"}</div><div className="pr-stat-label">TND/h</div></div>
            </div>
          </div>
        )}
        <div className="pr-card">
          <div className="pr-card-title"><span className="pr-card-title-icon"><ShieldCheck size={12} />Compte</span></div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              ["Email vérifié", profile.isVerified
                ? <span className="pr-pill-verified" style={{display:"inline-flex",alignItems:"center",gap:4}}><CheckCircle size={11} />Vérifié</span>
                : <span className="pr-pill-unverified" style={{display:"inline-flex",alignItems:"center",gap:4}}><XCircle size={11} />Non vérifié</span>],
              ["Statut",        profile.isActive   ? <span className="pr-pill-verified">Actif</span>    : <span className="pr-pill-unverified">Inactif</span>],
              ["Rôle",          <span className={`pr-role-badge pr-role-${profile.role||"client"}`}>{profile.role||"client"}</span>],
              ["Membre depuis", <span style={{fontSize:12,fontWeight:600,color:"#0f172e"}}>{profile.createdAt?new Date(profile.createdAt).toLocaleDateString("fr-FR",{month:"short",year:"numeric"}):"—"}</span>],
            ].map(([label, val]) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>{label}</span>
                {val}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabSchedule({ schedule, portfolio, isOwner, showPortfolio = true, editingAvail, draftAvail, startEditAvail, toggleHour, saveAvail, setEditingAvail, saving }) {
  return (
    <div className="pr-grid-full pr-anim-2">

      {/* Portfolio — shown first, only when showPortfolio is true */}
      {showPortfolio && <div className="pr-card">
        <div className="pr-card-title"><span className="pr-card-title-icon"><Camera size={12} />Portfolio</span></div>
        {portfolio.length > 0 ? (
          <div className="pr-portfolio-grid">
            {portfolio.map((p, i) => (
              <div key={i} className="pr-portfolio-card">
                <div className="pr-portfolio-img">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.title} />
                    : <span>Pas d'image</span>}
                </div>
                <div className="pr-portfolio-body">
                  <div className="pr-portfolio-title">{p.title}</div>
                  {p.city && <div className="pr-portfolio-city">{p.city}</div>}
                  {p.description && <div style={{fontSize:11,color:"#64748b",marginTop:5,lineHeight:1.6}}>{p.description}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign:"center", padding:"40px 20px", color:"#94a3b8", fontSize:13 }}>
            Aucun projet dans le portfolio.
            {isOwner && <div style={{marginTop:8,fontSize:12}}>Ajoutez vos réalisations via les paramètres.</div>}
          </div>
        )}
      </div>}

      {/* Availability */}
      <div className="pr-card">
        <div className="pr-card-title">
          <span className="pr-card-title-icon"><Calendar size={12} />Disponibilités hebdomadaires</span>
          {isOwner && !editingAvail && <button className="pr-edit-btn" onClick={startEditAvail}><Edit3 size={11} />Modifier</button>}
        </div>

        {editingAvail ? (
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {DAYS.map((d, i) => (
              <div key={d} className="pr-avail-day-row">
                <span className="pr-avail-day-name">{DAYS_FULL[i]}</span>
                <div className="pr-avail-hours">
                  {HOURS.map(h => {
                    const active = (draftAvail[d] || []).includes(h);
                    return (
                      <button
                        key={h}
                        className={`pr-avail-hour-btn ${active ? "on" : ""}`}
                        onClick={() => toggleHour(d, h)}
                      >
                        {h}h
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="pr-btn-row" style={{ marginTop:12 }}>
              <button className="pr-cancel-btn" onClick={() => setEditingAvail(false)}><X size={11} />Annuler</button>
              <button className="pr-save-btn" onClick={saveAvail} disabled={saving}><Check size={11} />{saving ? "Enregistrement…" : "Enregistrer"}</button>
            </div>
          </div>
        ) : (
          <div>
            {DAYS.map((d, i) => {
              const ranges = toRanges(schedule[d]);
              return (
                <div key={d} className="pr-avail-day-row">
                  <span className="pr-avail-day-name">{DAYS_FULL[i]}</span>
                  {ranges
                    ? <span className="pr-avail-range">{ranges}</span>
                    : <span className="pr-avail-off">Indisponible</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TabPortfolio({ portfolio, isOwner, onSave }) {
  const [adding,     setAdding]     = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [form,       setForm]       = useState({ title:"", city:"", description:"", imageUrl:"", imageFile:null });
  const [preview,    setPreview]    = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const fileRef = useRef(null);

  const resetForm = () => {
    setForm({ title:"", city:"", description:"", imageUrl:"", imageFile:null });
    setPreview(null);
    setAdding(false);
    setEditingIdx(null);
  };

  const startAdd = () => {
    setForm({ title:"", city:"", description:"", imageUrl:"", imageFile:null });
    setPreview(null);
    setEditingIdx(null);
    setAdding(true);
  };

  const startEdit = (idx) => {
    const item = portfolio[idx];
    setForm({ title:item.title||"", city:item.city||"", description:item.description||"", imageUrl:item.imageUrl||"", imageFile:null });
    setPreview(item.imageUrl ? avatarUrl(item.imageUrl) : null);
    setAdding(false);
    setEditingIdx(idx);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(p => ({ ...p, imageFile:file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      let imageUrl = form.imageUrl;
      if (form.imageFile) {
        setUploading(true);
        const res = await workerApi.uploadPortfolioImage(form.imageFile);
        imageUrl = res.imageUrl;
        setUploading(false);
      }
      const item = { title:form.title.trim(), city:form.city.trim(), description:form.description.trim(), imageUrl };
      const updated = editingIdx !== null
        ? portfolio.map((p, i) => i === editingIdx ? item : p)
        : [...portfolio, item];
      await onSave(updated);
      resetForm();
    } catch { setUploading(false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (idx) => {
    await onSave(portfolio.filter((_, i) => i !== idx));
  };

  const showForm = adding || editingIdx !== null;

  return (
    <div className="pr-grid-full pr-anim-2">
      <div className="pr-card">
        <div className="pr-card-title">
          <span className="pr-card-title-icon"><Camera size={12} />Portfolio</span>
          {isOwner && !showForm && (
            <button className="pr-edit-btn" onClick={startAdd}><Plus size={11} />Ajouter</button>
          )}
        </div>

        {showForm && (
          <div className="pr-portfolio-add-form">
            <div className="pr-field-grid" style={{ marginBottom:12 }}>
              <div className="pr-field">
                <div className="pr-field-label">Titre *</div>
                <input className="pr-input" maxLength={60} value={form.title} onChange={e => setForm(p => ({...p, title:e.target.value}))} placeholder="Ex: Rénovation cuisine" />
                <CharCount value={form.title} max={60} />
              </div>
              <div className="pr-field">
                <div className="pr-field-label">Ville</div>
                <input className="pr-input" maxLength={50} value={form.city} onChange={e => setForm(p => ({...p, city:e.target.value}))} placeholder="Ex: Tunis" />
                <CharCount value={form.city} max={50} />
              </div>
            </div>
            <div className="pr-field" style={{ marginBottom:12 }}>
              <div className="pr-field-label">Description</div>
              <textarea className="pr-textarea" maxLength={300} value={form.description} onChange={e => setForm(p => ({...p, description:e.target.value}))} placeholder="Décrivez votre réalisation…" style={{ minHeight:60 }} />
              <CharCount value={form.description} max={300} />
            </div>
            <div className="pr-field" style={{ marginBottom:16 }}>
              <div className="pr-field-label">Image</div>
              {preview && <img src={preview} alt="preview" className="pr-img-preview" />}
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile} />
              <button className="pr-edit-btn" onClick={() => fileRef.current?.click()}>
                <Camera size={11} />{preview ? "Changer l'image" : "Ajouter une image"}
              </button>
            </div>
            <div className="pr-btn-row">
              <button className="pr-cancel-btn" onClick={resetForm}><X size={11} />Annuler</button>
              <button className="pr-save-btn" onClick={handleSave} disabled={saving || uploading || !form.title.trim()}>
                <Check size={11} />
                {uploading ? "Upload…" : saving ? "Enregistrement…" : editingIdx !== null ? "Modifier" : "Ajouter"}
              </button>
            </div>
          </div>
        )}

        {portfolio.length === 0 && !showForm ? (
          <div style={{ textAlign:"center", padding:"40px 20px", color:"#94a3b8", fontSize:13 }}>
            Aucun projet dans le portfolio.
            {isOwner && <div style={{ marginTop:8, fontSize:12 }}>Cliquez sur "Ajouter" pour créer votre première réalisation.</div>}
          </div>
        ) : (
          <div className="pr-portfolio-grid">
            {portfolio.map((p, i) => (
              <div key={i} className="pr-portfolio-card" style={{ position:"relative" }}>
                {isOwner && (
                  <div style={{ position:"absolute", top:8, right:8, display:"flex", gap:5, zIndex:1 }}>
                    <button className="pr-portfolio-action-btn" onClick={() => startEdit(i)} title="Modifier"><Edit3 size={11} /></button>
                    <button className="pr-portfolio-action-btn danger" onClick={() => handleDelete(i)} title="Supprimer"><Trash2 size={11} /></button>
                  </div>
                )}
                <div className="pr-portfolio-img">
                  {p.imageUrl
                    ? <img src={avatarUrl(p.imageUrl)} alt={p.title} />
                    : <span>Pas d'image</span>}
                </div>
                <div className="pr-portfolio-body">
                  <div className="pr-portfolio-title">{p.title}</div>
                  {p.city && <div className="pr-portfolio-city">{p.city}</div>}
                  {p.description && <div style={{ fontSize:11, color:"#64748b", marginTop:5, lineHeight:1.6 }}>{p.description}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PROFILE COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function Profile({ profileUser: initialProfile, currentUser, onHome, onNavigate, onLogout, onProfileUpdate, initialTab, onReserveWorker }) {
  const [profile, setProfile] = useState(initialProfile || currentUser || null);
  const [loading] = useState(!profile);
  const [tab, setTab]         = useState(initialTab || "overview");
  const [saved, setSaved]     = useState(false);

  const [editingInfo,   setEditingInfo]   = useState(false);
  const [editingWorker, setEditingWorker] = useState(false);
  const [editingAvail,  setEditingAvail]  = useState(false);
  const [draftInfo,     setDraftInfo]     = useState({});
  const [draftWorker,   setDraftWorker]   = useState({});
  const [draftAvail,    setDraftAvail]    = useState({});
  const [saving,        setSaving]        = useState(false);

  const isOwner = currentUser && profile && (
    currentUser._id === profile._id || currentUser.id === profile._id
  );

  const canSave = !isOwner && profile?.role === "worker" && !!currentUser;

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!canSave) return;
    clientApi.getSavedWorkers().then(workers => {
      setSaved(workers.some(w => String(w._id) === String(profile._id)));
    }).catch(() => {});
  }, [profile?._id, canSave]);

  const handleToggleSave = async () => {
    const next = !saved;
    setSaved(next);
    try {
      if (next) await clientApi.saveWorker(profile._id);
      else await clientApi.unsaveWorker(profile._id);
    } catch {
      setSaved(!next);
    }
  };

  const fn        = profile?.firstName || "Utilisateur";
  const ln        = profile?.lastName  || "";
  const role      = profile?.role      || "client";
  const wp        = profile?.workerProfile  || {};
  const cp        = profile?.clientProfile  || {};
  const avatar    = typeof avatarUrl === "function" ? avatarUrl(profile?.avatar) : null;
  const profs     = wp.professions || [];
  const rating    = Number(wp.rating       || 0);
  const reviews   = Number(wp.totalReviews || 0);
  const avail     = wp.isAvailable !== false;
  const canReserve = role === "worker" && currentUser?.role === "client" && !isOwner;
  const workerId   = profile?._id ? String(profile._id) : "";
  const schedule   = wp.availabilitySchedule || {};
  const portfolio  = wp.portfolio            || [];

  const startEditInfo = () => {
    setDraftInfo({
      firstName: profile.firstName || "", lastName:  profile.lastName  || "",
      phone:     profile.phone     || "", gender:    profile.gender    || "",
      birthDate: profile.birthDate || "", address:   cp.address        || "",
      city_client: cp.city || "",         bio_client: cp.bio           || "",
    });
    setEditingInfo(true);
  };

  const startEditWorker = () => {
    setDraftWorker({
      city: wp.city || "", experience: wp.experience || "",
      bio:  wp.bio  || "", hourlyRate: wp.hourlyRate  || 0,
      professions: [...profs], isAvailable: avail,
    });
    setEditingWorker(true);
  };

  const saveInfo = async () => {
    setSaving(true);
    try {
      const payload = {
        firstName: draftInfo.firstName, lastName: draftInfo.lastName,
        phone: draftInfo.phone, gender: draftInfo.gender, birthDate: draftInfo.birthDate,
      };
      let res;
      if (role === "client") {
        payload.clientProfile = { address: draftInfo.address, city: draftInfo.city_client, bio: draftInfo.bio_client };
        res = await clientApi.updateProfile(payload);
      } else {
        res = await workerApi.updateProfile(payload);
      }
      setProfile(res.user);
      onProfileUpdate?.(res.user);
      setEditingInfo(false);
    } finally { setSaving(false); }
  };

  const saveWorker = async () => {
    setSaving(true);
    try {
      const res = await workerApi.updateProfile({
        workerProfile: {
          city: draftWorker.city, experience: draftWorker.experience,
          bio: draftWorker.bio, hourlyRate: draftWorker.hourlyRate,
          professions: draftWorker.professions, isAvailable: draftWorker.isAvailable,
        },
      });
      setProfile(res.user);
      onProfileUpdate?.(res.user);
      setEditingWorker(false);
    } finally { setSaving(false); }
  };

  const saveAvail = async () => {
    setSaving(true);
    try {
      const res = await workerApi.updateProfile({
        workerProfile: { availabilitySchedule: draftAvail },
      });
      setProfile(res.user);
      onProfileUpdate?.(res.user);
      setEditingAvail(false);
    } finally { setSaving(false); }
  };

  const savePortfolio = async (updatedPortfolio) => {
    const res = await workerApi.updateProfile({ workerProfile: { portfolio: updatedPortfolio } });
    setProfile(res.user);
    onProfileUpdate?.(res.user);
  };

  const startEditAvail = () => {
    setDraftAvail(schedule);
    setEditingAvail(true);
  };

  const toggleHour = (day, hour) => {
    setDraftAvail(prev => {
      const hours = prev[day] || [];
      return { ...prev, [day]: hours.includes(hour) ? hours.filter(h => h !== hour) : [...hours, hour] };
    });
  };

  const removeProfession = (p) => setDraftWorker(prev => ({ ...prev, professions: prev.professions.filter(x => x !== p) }));
  const addProfession = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      const val = e.target.value.trim();
      setDraftWorker(prev => ({ ...prev, professions: [...new Set([...prev.professions, val])] }));
      e.target.value = "";
    }
  };

  const tabs = [
    { id:"overview", label:"Aperçu" },
    ...(role === "worker" && isOwner
      ? [{ id:"schedule", label:"Disponibilités" }, { id:"portfolio", label:"Portfolio" }]
      : role === "worker"
        ? [{ id:"schedule", label:"Disponibilités & Portfolio" }]
        : []
    ),
  ];

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

  return (
    <>
      <style>{css}</style>
      <div className="pr-root">

        <Navbar
          user={currentUser}
          activePage={tab === "portfolio" && isOwner ? "portfolio" : "profile"}
          onHome={onHome}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        {/* HERO */}
        <section className="pr-hero">
          <div className="pr-hero-inner">
            <div className="pr-avatar-row pr-anim-1">
              <div className="pr-avatar-wrap">
                <div className="pr-avatar">
                  {avatar ? <img src={avatar} alt={fn} /> : avatarInitials(fn)}
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
                    <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:avail?"#10b981":"#d97706", fontWeight:600 }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:avail?"#10b981":"#f59e0b" }} />
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

                {/* Action buttons */}
                <div className="pr-hero-actions">
                  {/* Visitor viewing a worker profile */}
                  {!isOwner && role === "worker" && (
                    <>
                      <button
                        className="pr-action-btn primary"
                        onClick={() => onReserveWorker ? onReserveWorker(profile) : onNavigate?.("reservations")}
                      >
                        <Calendar size={14} />
                        Réserver
                      </button>
                      {canSave && (
                        <button
                          className={`pr-action-btn save ${saved ? "saved" : ""}`}
                          onClick={handleToggleSave}
                        >
                          <Bookmark size={14} fill={saved ? "#06b6d4" : "none"} />
                          {saved ? "Sauvegardé" : "Sauvegarder"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
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
          {tab === "overview" && (
            <TabOverview
              profile={profile}
              role={role} wp={wp} cp={cp} profs={profs}
              rating={rating} reviews={reviews} avail={avail}
              isOwner={isOwner}
              editingInfo={editingInfo} draftInfo={draftInfo}
              setDraftInfo={setDraftInfo} startEditInfo={startEditInfo}
              saveInfo={saveInfo} saving={saving}
              setEditingInfo={setEditingInfo}
              editingWorker={editingWorker} draftWorker={draftWorker}
              setDraftWorker={setDraftWorker} startEditWorker={startEditWorker}
              saveWorker={saveWorker} setEditingWorker={setEditingWorker}
              removeProfession={removeProfession} addProfession={addProfession}
            />
          )}
          {tab === "schedule" && (
            <TabSchedule
              schedule={schedule} portfolio={portfolio}
              isOwner={isOwner} showPortfolio={!isOwner}
              editingAvail={editingAvail} draftAvail={draftAvail}
              startEditAvail={startEditAvail} toggleHour={toggleHour}
              saveAvail={saveAvail} setEditingAvail={setEditingAvail}
              saving={saving}
            />
          )}
          {tab === "portfolio" && (
            <TabPortfolio
              portfolio={portfolio}
              isOwner={isOwner}
              onSave={savePortfolio}
            />
          )}
        </div>

      </div>
    </>
  );
}
