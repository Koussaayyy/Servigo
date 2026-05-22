import { useEffect, useRef, useState } from "react";
import {
  MapPin, Star, Briefcase, Edit3, Check, X, Trash2,
  ShieldCheck, Camera, Mail, Calendar, Award, Image, Bookmark, BookmarkCheck,
} from "lucide-react";
import { avatarUrl, clientApi, workerApi, portfolioApi } from "../api";
import { GOUVERNORATS, DELEGATIONS } from "../constants/tunisia";
import Navbar from "../components/Navbar";
import ReservationDialog from "../components/ReservationDialog";

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
  content:''; position:absolute; inset:0;
  background:
    radial-gradient(ellipse 60% 80% at 70% 50%, rgba(6,182,212,0.06), transparent),
    repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(6,182,212,0.02) 40px, rgba(6,182,212,0.02) 41px);
}
.pr-hero-inner { max-width:1280px; margin:0 auto; padding-bottom:0; position:relative; }
.pr-avatar-row { display:flex; align-items:center; gap:20px; padding-bottom:0; position:relative; }
.pr-avatar-wrap { position:relative; flex-shrink:0; }
.pr-avatar {
  width:130px; height:130px; border-radius:50%;
  border:3px solid rgba(6,182,212,0.4); background:#1e293b;
  display:flex; align-items:center; justify-content:center;
  font-size:36px; font-weight:800; color:#06b6d4; overflow:hidden;
}
.pr-avatar img { width:100%; height:100%; object-fit:cover; border-radius:50%; }
.pr-avatar-edit-btn {
  position:absolute; bottom:2px; right:2px;
  width:28px; height:28px; border-radius:50%;
  background:#06b6d4; border:2px solid #0f172e;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:background .2s;
}
.pr-avatar-edit-btn:hover { background:#0891b2; }
.pr-hero-info { flex:1; padding-bottom:20px; }
.pr-hero-name { font-size:26px; font-weight:800; letter-spacing:-0.5px; color:#fff; margin-bottom:6px; }
.pr-hero-meta { display:flex; flex-wrap:wrap; align-items:center; gap:12px; }
.pr-role-badge {
  display:inline-flex; align-items:center; gap:5px;
  border-radius:999px; padding:4px 12px; font-size:10px; font-weight:700;
  letter-spacing:0.12em; text-transform:uppercase;
}
.pr-role-worker { background:rgba(16,185,129,0.12); color:#10b981; border:1.5px solid rgba(16,185,129,0.25); }
.pr-role-client { background:rgba(6,182,212,0.12); color:#06b6d4; border:1.5px solid rgba(6,182,212,0.25); }
.pr-role-admin  { background:rgba(245,158,11,0.12); color:#f59e0b; border:1.5px solid rgba(245,158,11,0.25); }
.pr-tabs {
  display:flex; align-items:center; gap:0;
  border-bottom:1.5px solid rgba(255,255,255,0.08);
  margin-top:20px; max-width:1280px; margin-left:auto; margin-right:auto;
  position: relative; z-index: 2;
}
.pr-tabs-action {
  margin-left:auto; padding:0 16px 0 8px; display:flex; align-items:center;
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
.pr-avail-slot:hover { border-color:rgba(6,182,212,0.35); }
.pr-avail-toggle-row { display:flex; align-items:center; justify-content:space-between; padding:4px 0; }
.pr-toggle { width:40px; height:22px; border-radius:999px; border:none; cursor:pointer; position:relative; transition:background .2s; flex-shrink:0; }
.pr-toggle::after { content:''; position:absolute; top:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:left .2s; }
.pr-toggle.on  { background:#06b6d4; }
.pr-toggle.off { background:#e2e8f0; }
.pr-toggle.on::after  { left:21px; }
.pr-toggle.off::after { left:3px; }
.pr-pill-verified   { background:rgba(16,185,129,0.1); color:#059669; border:1px solid rgba(16,185,129,0.25); border-radius:999px; padding:3px 10px; font-size:10px; font-weight:700; }
.pr-pill-unverified { background:rgba(239,68,68,0.08); color:#ef4444; border:1px solid rgba(239,68,68,0.2); border-radius:999px; padding:3px 10px; font-size:10px; font-weight:700; }
.pr-pill-pending    { background:rgba(245,158,11,0.12); color:#b45309; border:1px solid rgba(245,158,11,0.3); border-radius:999px; padding:3px 10px; font-size:10px; font-weight:700; }

/* ── Portfolio ── */
.pr-pf-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:3px; }
.pr-pf-cell { aspect-ratio:1/1; overflow:hidden; cursor:pointer; position:relative; background:#e2e8f0; }
.pr-pf-cell img { width:100%; height:100%; object-fit:cover; transition:transform .35s ease; display:block; }
.pr-pf-cell:hover img { transform:scale(1.07); }
.pr-pf-overlay { position:absolute; inset:0; background:rgba(15,23,46,0); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px; transition:background .22s; padding:10px; }
.pr-pf-cell:hover .pr-pf-overlay { background:rgba(15,23,46,0.58); }
.pr-pf-ov-text { color:#fff; font-weight:700; opacity:0; transition:opacity .22s; text-align:center; text-shadow:0 1px 4px rgba(0,0,0,0.5); }
.pr-pf-cell:hover .pr-pf-ov-text { opacity:1; }
.pr-pf-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#94a3b8; background:#f1f5f9; }

/* ── Lightbox ── */
.pr-lb { position:fixed; inset:0; background:rgba(0,0,0,0.92); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px; }
.pr-lb-card { display:flex; background:#fff; border-radius:14px; overflow:hidden; max-width:920px; width:100%; height:min(560px,88vh); box-shadow:0 40px 100px rgba(0,0,0,0.5); }
.pr-lb-left { flex:0 0 56%; background:#111; display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative; }
.pr-lb-left img { width:100%; height:100%; object-fit:cover; display:block; }
.pr-lb-right { flex:1; overflow-y:auto; overflow-x:hidden; display:flex; flex-direction:column; min-width:0; max-width:100%; }
.pr-lb-right * { max-width:100%; word-break:break-word; overflow-wrap:break-word; }
.pr-lb-right::-webkit-scrollbar { width:4px; }
.pr-lb-right::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:9px; }

/* ── Star rating ── */
.pr-star { font-size:28px; cursor:pointer; line-height:1; transition:transform .1s; user-select:none; display:inline-block; }
.pr-star:hover { transform:scale(1.18); }

@media(max-width:1024px){ .pr-grid{ grid-template-columns:1fr; } }
@media(max-width:768px){ .pr-hero{ padding:76px 16px 0; } .pr-content{ padding:24px 16px 64px; } .pr-hero-name{ font-size:20px; } .pr-field-grid{ grid-template-columns:1fr; } .pr-stats{ grid-template-columns:repeat(3,1fr); } }
@media(max-width:680px){
  .pr-lb-card{ flex-direction:column; border-radius:10px; height:auto; max-height:96vh; }
  .pr-lb-left{ flex:0 0 240px; min-height:0; }
  .pr-lb-right{ flex:1; min-height:0; }
}
@media(max-width:480px){ .pr-avatar{ width:76px; height:76px; font-size:26px; border-radius:50%; } .pr-tabs{ overflow-x:auto; } .pr-pf-grid{ gap:2px; } }
`;

const DAYS = [
  { key:"monday",    label:"Lun" },
  { key:"tuesday",   label:"Mar" },
  { key:"wednesday", label:"Mer" },
  { key:"thursday",  label:"Jeu" },
  { key:"friday",    label:"Ven" },
  { key:"saturday",  label:"Sam" },
  { key:"sunday",    label:"Dim" },
];
const BOOKABLE_HOURS = [8,9,10,11,12,14,15,16,17];

const avatarInitials = (n) => (n?.[0] || "?").toUpperCase();
const fmtHour = (hour) => `${String(hour).padStart(2, "0")}:00`;

const StarRow = ({ value, hover, onHover, onLeave, onClick, size = 28 }) => (
  <div style={{ display:"flex", gap:2 }}>
    {[1,2,3,4,5].map((s) => (
      <span key={s} className="pr-star"
        style={{ fontSize:size, color: s <= (hover || value) ? "#f59e0b" : "#d1d5db" }}
        onMouseEnter={() => onHover(s)}
        onMouseLeave={onLeave}
        onClick={() => onClick(s)}
      >★</span>
    ))}
  </div>
);

const StarsDisplay = ({ rating, size = 13 }) => {
  const full = Math.round(rating);
  return (
    <span style={{ color:"#f59e0b", fontSize:size, letterSpacing:1 }}>
      {"★".repeat(full)}{"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
};

export default function Profile({ profileUser: initialProfile, currentUser, initialTab = "overview", onHome, onNavigate, onLogout, onUpdateUser }) {
  const [profile, setProfile] = useState(initialProfile || currentUser || null);
  const [loading]              = useState(!profile);
  const [tab, setTab]          = useState(initialTab || "overview");
  const [editingInfo,   setEditingInfo]   = useState(false);
  const [editingWorker, setEditingWorker] = useState(false);
  const [draftInfo,   setDraftInfo]   = useState({});
  const [draftWorker, setDraftWorker] = useState({});
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [draftGovernorate, setDraftGovernorate] = useState("");
  const [saveError, setSaveError]     = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  // Portfolio form
  const [pfOpen, setPfOpen]                   = useState(false);
  const [pfEditId, setPfEditId]               = useState(null);
  const [pfDraft, setPfDraft]                 = useState({ title:"", governorate:"", city:"", exactLocation:"", description:"" });
  const [pfExistingImages, setPfExistingImages] = useState([]); // server paths already saved
  const [pfNewFiles, setPfNewFiles]           = useState([]);   // { file, preview }
  const [pfSaving, setPfSaving]               = useState(false);
  // Lightbox image index
  const [lbImageIdx, setLbImageIdx]           = useState(0);
  const [pfMsg, setPfMsg]         = useState("");
  // Schedule
  const [scheduleEditing, setScheduleEditing] = useState(false);
  const [scheduleDraft, setScheduleDraft]     = useState({});
  const [scheduleSaving, setScheduleSaving]   = useState(false);
  const [scheduleMsg, setScheduleMsg]         = useState("");
  const avatarInputRef = useRef(null);
  const pfFileRef      = useRef(null);

  // ── Reserve & Save state ──────────────────────────────────
  const [reserveOpen, setReserveOpen] = useState(false);
  const [isSaved, setIsSaved]         = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // ── Portfolio state ───────────────────────────────────────
  const [portfolioOpenId, setPortfolioOpenId]         = useState(null);
  const [reviewRating, setReviewRating]               = useState(0);
  const [reviewHover, setReviewHover]                 = useState(0);
  const [reviewComment, setReviewComment]             = useState("");
  const [portfolioSubmitting, setPortfolioSubmitting] = useState(false);
  const [portfolioMsg, setPortfolioMsg]               = useState("");

  const isOwner = currentUser && profile && (
    currentUser._id === profile._id || currentUser.id === profile._id
  );

  const findGovernoratForCity = (city) => {
    if (!city) return "";
    for (const [gov, delegations] of Object.entries(DELEGATIONS)) {
      if (delegations.includes(city)) return gov;
    }
    return "";
  };

  const fn        = profile?.firstName || "Utilisateur";
  const ln        = profile?.lastName  || "";
  const role      = profile?.role      || "client";
  const wp        = profile?.workerProfile  || {};
  const cp        = profile?.clientProfile  || {};
  const workerVerificationStatus = profile?.workerVerification?.status || "not_submitted";
  const avatar    = typeof avatarUrl === "function" ? avatarUrl(profile?.avatar) : null;
  const profs     = wp.professions || [];
  const rating    = Number(wp.rating       || 0);
  const reviews   = Number(wp.totalReviews || 0);
  const avail     = wp.isAvailable !== false;
  const workerId = profile?._id ? String(profile._id) : "";
  const myUserId = String(currentUser?._id || currentUser?.id || "");

  const startEditInfo = () => {
    setSaveError("");
    setDraftInfo({
      firstName:   profile.firstName || "",
      lastName:    profile.lastName  || "",
      phone:       profile.phone     || "",
      gender:      profile.gender    || "",
      birthDate:   profile.birthDate ? String(profile.birthDate).slice(0, 10) : "",
      address:     cp.address || "",
      city_client: cp.city    || "",
      bio_client:  cp.bio     || "",
    });
    setEditingInfo(true);
  };

  const toggleSave = async () => {
    if (saveLoading) return;
    setSaveLoading(true);
    try {
      if (isSaved) {
        await clientApi.unsaveWorker(workerId);
        setIsSaved(false);
      } else {
        await clientApi.saveWorker(workerId);
        setIsSaved(true);
      }
    } catch {}
    setSaveLoading(false);
  };

  const startEditWorker = () => {
    setSaveError("");
    setDraftGovernorate(findGovernoratForCity(wp.city));
    setDraftWorker({
      city:        wp.city       || "",
      experience:  wp.experience || "",
      bio:         wp.bio        || "",
      hourlyRate:  wp.hourlyRate || 0,
      professions: [...profs],
      isAvailable: avail,
    });
    setEditingWorker(true);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const api = role === "worker" ? workerApi : clientApi;
      const data = await api.uploadAvatar(file);
      const updatedProfile = { ...profile, avatar: data.avatar };
      setProfile(updatedProfile);
      if (isOwner) onUpdateUser?.(updatedProfile);
    } catch (err) {
      alert(err.message || "Erreur lors du téléchargement de la photo");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const saveInfo = async () => {
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      let data;
      if (role === "worker") {
        data = await workerApi.updateProfile({
          firstName: draftInfo.firstName,
          lastName:  draftInfo.lastName,
          phone:     draftInfo.phone,
          gender:    draftInfo.gender,
          birthDate: draftInfo.birthDate,
        });
      } else {
        data = await clientApi.updateProfile({
          firstName:     draftInfo.firstName,
          lastName:      draftInfo.lastName,
          phone:         draftInfo.phone,
          gender:        draftInfo.gender,
          birthDate:     draftInfo.birthDate,
          clientProfile: {
            address: draftInfo.address,
            city:    draftInfo.city_client,
            bio:     draftInfo.bio_client,
          },
        });
      }
      const updated = { ...profile, ...data.user };
      setProfile(updated);
      if (isOwner) onUpdateUser?.(updated);
      setSaveSuccess("Informations enregistrées ✓");
      setEditingInfo(false);
    } catch (err) {
      setSaveError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const saveWorker = async () => {
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      const data = await workerApi.updateProfile({
        workerProfile: {
          city:        draftWorker.city,
          experience:  draftWorker.experience,
          bio:         draftWorker.bio,
          hourlyRate:  draftWorker.hourlyRate,
          professions: draftWorker.professions,
          isAvailable: draftWorker.isAvailable,
        },
      });
      const updated = { ...profile, ...data.user };
      setProfile(updated);
      if (isOwner) onUpdateUser?.(updated);
      setSaveSuccess("Profil prestataire enregistré ✓");
      setEditingWorker(false);
    } catch (err) {
      setSaveError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };


  // ── Portfolio review ──────────────────────────────────────
  const openLightbox = (itemId) => {
    const item = (wp.portfolio || []).find((p) => String(p._id) === String(itemId));
    if (!item) return;
    const myRev = (item.reviews || []).find((r) => String(r.clientId) === myUserId);
    setReviewRating(myRev?.rating || 0);
    setReviewComment(myRev?.comment || "");
    setReviewHover(0);
    setPortfolioMsg("");
    setLbImageIdx(0);
    setPortfolioOpenId(String(itemId));
  };

  const closeLightbox = () => {
    setPortfolioOpenId(null);
    setReviewRating(0);
    setReviewComment("");
    setReviewHover(0);
    setPortfolioMsg("");
  };

  const openPfForm = (item = null) => {
    setPfEditId(item ? String(item._id) : null);
    const gov = findGovernoratForCity(item?.city) || item?.governorate || "";
    setPfDraft({
      title:         item?.title         || "",
      governorate:   gov,
      city:          item?.city          || "",
      exactLocation: item?.exactLocation || "",
      description:   item?.description   || "",
    });
    const imgs = item?.images?.length
      ? item.images
      : item?.imageUrl ? [item.imageUrl] : [];
    setPfExistingImages(imgs);
    setPfNewFiles([]);
    setPfMsg("");
    setPfOpen(true);
  };

  const addPfFiles = (files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setPfNewFiles(prev => [...prev, { file, preview: ev.target.result }]);
      reader.readAsDataURL(file);
    });
  };

  const savePfItem = async () => {
    setPfSaving(true);
    setPfMsg("");
    try {
      const form = new FormData();
      form.append("title",         pfDraft.title);
      form.append("governorate",   pfDraft.governorate);
      form.append("city",          pfDraft.city);
      form.append("exactLocation", pfDraft.exactLocation);
      form.append("description",   pfDraft.description);
      pfExistingImages.forEach(p => form.append("existingImages", p));
      pfNewFiles.forEach(nf => form.append("images", nf.file));
      const data = pfEditId
        ? await workerApi.updatePortfolioItem(pfEditId, form)
        : await workerApi.addPortfolioItem(form);
      setProfile(prev => ({ ...prev, workerProfile: { ...prev.workerProfile, portfolio: data.portfolio } }));
      setPfOpen(false);
    } catch (err) {
      setPfMsg(err.message || "Erreur");
    } finally {
      setPfSaving(false);
    }
  };

  const deletePfItem = async (itemId) => {
    if (!window.confirm("Supprimer cette réalisation ?")) return;
    try {
      const data = await workerApi.deletePortfolioItem(itemId);
      setProfile(prev => ({ ...prev, workerProfile: { ...prev.workerProfile, portfolio: data.portfolio } }));
      if (portfolioOpenId === itemId) closeLightbox();
    } catch (err) {
      alert(err.message || "Erreur");
    }
  };

  const deletePfReview = async (itemId, reviewId) => {
    try {
      const data = await workerApi.deletePortfolioReview(itemId, reviewId);
      setProfile(prev => ({ ...prev, workerProfile: { ...prev.workerProfile, portfolio: data.portfolio } }));
    } catch (err) {
      alert(err.message || "Erreur");
    }
  };

  const submitPortfolioReview = async (itemId) => {
    if (!reviewRating) return;
    setPortfolioSubmitting(true);
    setPortfolioMsg("");
    try {
      const data = await portfolioApi.submitReview(workerId, itemId, { rating: reviewRating, comment: reviewComment });
      setProfile((prev) => ({
        ...prev,
        workerProfile: { ...prev.workerProfile, portfolio: data.portfolio },
      }));
      setPortfolioMsg("Avis envoyé !");
    } catch (err) {
      setPortfolioMsg(err.message || "Erreur lors de l'envoi");
    } finally {
      setPortfolioSubmitting(false);
    }
  };

  const startScheduleEdit = () => {
    const base = {};
    DAYS.forEach(d => { base[d.key] = [...(wp.availabilitySchedule?.[d.key] || [])]; });
    setScheduleDraft(base);
    setScheduleEditing(true);
    setScheduleMsg("");
  };

  const saveSchedule = async () => {
    setScheduleSaving(true);
    setScheduleMsg("");
    try {
      await workerApi.updateSchedule(scheduleDraft);
      setProfile(prev => ({ ...prev, workerProfile: { ...prev.workerProfile, availabilitySchedule: scheduleDraft } }));
      setScheduleEditing(false);
      setScheduleMsg("Planning enregistré ✓");
    } catch (err) {
      setScheduleMsg(err.message || "Erreur");
    } finally {
      setScheduleSaving(false);
    }
  };

  useEffect(() => {
    if (!profile?._id) return;
    const sessionKey = `profile_tab_${profile._id}`;
    const want = initialTab || "overview";
    if (!initialTab || initialTab === "overview") {
      const saved = sessionStorage.getItem(sessionKey);
      if (saved) { setTab(saved); return; }
    }
    if (tab !== want) setTab(want);
  }, [initialTab, profile?._id]);

  useEffect(() => {
    if (!currentUser || isOwner || role !== "worker") return;
    clientApi.getSavedWorkers().then((list) => {
      setIsSaved((list || []).some((w) => String(w._id) === workerId));
    }).catch(() => {});
  }, [workerId, isOwner, role]);


  if (loading || !profile) {
    return (
      <>
        <style>{css}</style>
        <div className="pr-root" style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh" }}>
          <div style={{ color:"#94a3b8",fontSize:14 }}>Chargement du profil…</div>
        </div>
      </>
    );
  }

  // ── Tab: Overview ─────────────────────────────────────────
  const TabOverview = () => (
    <div className="pr-grid pr-anim-1">
      <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
        <div className="pr-card">
          <div className="pr-card-title">
            <span className="pr-card-title-icon"><Mail size={12} />Informations personnelles</span>
            {isOwner && !editingInfo && (
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {saveSuccess && !editingWorker && <span style={{ fontSize:11, color:"#10b981", fontWeight:700 }}>{saveSuccess}</span>}
                <button className="pr-edit-btn" onClick={() => { setSaveSuccess(""); startEditInfo(); }}><Edit3 size={11} />Modifier</button>
              </div>
            )}
          </div>
          {editingInfo ? (
            <>
              <div className="pr-field-grid" style={{ marginBottom:16 }}>
                <div className="pr-field"><div className="pr-field-label">Prénom</div><input className="pr-input" value={draftInfo.firstName} onChange={e => setDraftInfo(p => ({...p, firstName: e.target.value}))} /></div>
                <div className="pr-field"><div className="pr-field-label">Nom</div><input className="pr-input" value={draftInfo.lastName} onChange={e => setDraftInfo(p => ({...p, lastName: e.target.value}))} /></div>
                <div className="pr-field"><div className="pr-field-label">Téléphone</div><input className="pr-input" value={draftInfo.phone} onChange={e => setDraftInfo(p => ({...p, phone: e.target.value}))} /></div>
                <div className="pr-field">
                  <div className="pr-field-label">Genre</div>
                  <select className="pr-select" value={draftInfo.gender} onChange={e => setDraftInfo(p => ({...p, gender: e.target.value}))}>
                    <option value="">Non renseigné</option>
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div className="pr-field"><div className="pr-field-label">Date de naissance</div><input className="pr-input" type="date" value={draftInfo.birthDate} onChange={e => setDraftInfo(p => ({...p, birthDate: e.target.value}))} /></div>
              </div>
              {role === "client" && (
                <>
                  <div className="pr-field-grid" style={{ marginBottom:16 }}>
                    <div className="pr-field"><div className="pr-field-label">Adresse</div><input className="pr-input" value={draftInfo.address} onChange={e => setDraftInfo(p => ({...p, address: e.target.value}))} /></div>
                    <div className="pr-field"><div className="pr-field-label">Ville</div><input className="pr-input" value={draftInfo.city_client} onChange={e => setDraftInfo(p => ({...p, city_client: e.target.value}))} /></div>
                  </div>
                  <div className="pr-field">
                    <div className="pr-field-label">Bio</div>
                    <textarea className="pr-textarea" value={draftInfo.bio_client} onChange={e => setDraftInfo(p => ({...p, bio_client: e.target.value}))} placeholder="Parlez de vous…" maxLength={300} />
                    <div style={{ fontSize:10,color:"#94a3b8",textAlign:"right",marginTop:3 }}>{(draftInfo.bio_client||"").length} / 300</div>
                  </div>
                </>
              )}
              {saveError && <div style={{ fontSize:12,color:"#ef4444",padding:"8px 12px",background:"#fff0f0",borderRadius:8,marginTop:8,border:"1px solid #fecaca" }}>{saveError}</div>}
              <div className="pr-btn-row">
                <button className="pr-cancel-btn" onClick={() => setEditingInfo(false)}><X size={11} />Annuler</button>
                <button className="pr-save-btn" onClick={saveInfo} disabled={saving}><Check size={11} />{saving ? "Enregistrement…" : "Enregistrer"}</button>
              </div>
            </>
          ) : (
            <div className="pr-field-grid">
              <div className="pr-field"><div className="pr-field-label">Email</div><div className="pr-field-value">{profile.email}</div></div>
              <div className="pr-field"><div className="pr-field-label">Téléphone</div><div className={`pr-field-value ${profile.phone ? "" : "muted"}`}>{profile.phone || "Non renseigné"}</div></div>
              <div className="pr-field">
                <div className="pr-field-label">Genre</div>
                <div className={`pr-field-value ${profile.gender ? "" : "muted"}`}>
                  {profile.gender === "male" ? "Homme" : profile.gender === "female" ? "Femme" : profile.gender === "other" ? "Autre" : "Non renseigné"}
                </div>
              </div>
              <div className="pr-field">
                <div className="pr-field-label">Date de naissance</div>
                <div className={`pr-field-value ${profile.birthDate ? "" : "muted"}`}>
                  {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString("fr-FR", { day:"numeric",month:"long",year:"numeric" }) : "Non renseignée"}
                </div>
              </div>
              {role === "client" && (
                <>
                  <div className="pr-field"><div className="pr-field-label">Ville</div><div className={`pr-field-value ${cp.city ? "" : "muted"}`}>{cp.city || "Non renseignée"}</div></div>
                  <div className="pr-field"><div className="pr-field-label">Adresse</div><div className={`pr-field-value ${cp.address ? "" : "muted"}`}>{cp.address || "Non renseignée"}</div></div>
                  {cp.bio && <div className="pr-field" style={{ gridColumn:"1/-1" }}><div className="pr-field-label">Bio</div><div className="pr-field-value" style={{ fontWeight:400,lineHeight:1.7 }}>{cp.bio}</div></div>}
                </>
              )}
            </div>
          )}
        </div>

        {role === "worker" && (
          <div className="pr-card">
            <div className="pr-card-title">
              <span className="pr-card-title-icon"><Briefcase size={12} />Profil prestataire</span>
              {isOwner && !editingWorker && (
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  {saveSuccess && !editingInfo && <span style={{ fontSize:11, color:"#10b981", fontWeight:700 }}>{saveSuccess}</span>}
                  <button className="pr-edit-btn" onClick={() => { setSaveSuccess(""); startEditWorker(); }}><Edit3 size={11} />Modifier</button>
                </div>
              )}
            </div>
            {editingWorker ? (
              <>
                <div className="pr-field-grid" style={{ marginBottom:16 }}>
                  <div className="pr-field">
                    <div className="pr-field-label">Gouvernorat</div>
                    <select className="pr-select" value={draftGovernorate}
                      onChange={e => { setDraftGovernorate(e.target.value); setDraftWorker(p => ({...p, city: ""})); }}>
                      <option value="">Sélectionnez un gouvernorat</option>
                      {GOUVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="pr-field">
                    <div className="pr-field-label">Délégation</div>
                    <select className="pr-select" value={draftWorker.city} disabled={!draftGovernorate}
                      onChange={e => setDraftWorker(p => ({...p, city: e.target.value}))}>
                      <option value="">{draftGovernorate ? "Sélectionnez une délégation" : "Choisissez d'abord un gouvernorat"}</option>
                      {(DELEGATIONS[draftGovernorate] || []).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="pr-field"><div className="pr-field-label">Expérience</div><input className="pr-input" value={draftWorker.experience} onChange={e => setDraftWorker(p => ({...p, experience: e.target.value}))} placeholder="Ex: 5 ans" /></div>
                  <div className="pr-field"><div className="pr-field-label">Tarif horaire (TND/h)</div><input className="pr-input" type="number" min="0" value={draftWorker.hourlyRate} onChange={e => setDraftWorker(p => ({...p, hourlyRate: Number(e.target.value)}))} /></div>
                </div>
                <div className="pr-field" style={{ marginBottom:16 }}>
                  <div className="pr-field-label">Bio</div>
                  <textarea className="pr-textarea" value={draftWorker.bio} onChange={e => setDraftWorker(p => ({...p, bio: e.target.value}))} placeholder="Décrivez votre expertise…" maxLength={500} />
                  <div style={{ fontSize:10,color:"#94a3b8",textAlign:"right",marginTop:3 }}>{(draftWorker.bio||"").length} / 500</div>
                </div>
                <div className="pr-field" style={{ marginBottom:16 }}>
                  <div className="pr-field-label">Métiers</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginTop:6 }}>
                    {["Électricien","Plombier","Maçon","Vitrier","Menuisier","Peintre","Climatisation","Serrurier","Jardinier","Carreleur","Déménagement","Mécanicien"].map(svc => {
                      const sel = draftWorker.professions.includes(svc);
                      return (
                        <button key={svc} type="button"
                          onClick={() => setDraftWorker(p => ({
                            ...p,
                            professions: sel ? p.professions.filter(x => x !== svc) : [...p.professions, svc]
                          }))}
                          style={{
                            padding:"9px 4px", borderRadius:8,
                            border: sel ? "1.5px solid #06b6d4" : "1.5px solid #e2e8f0",
                            background: sel ? "rgba(6,182,212,0.08)" : "#f8fafc",
                            color: sel ? "#0284c7" : "#64748b",
                            fontSize:11, fontWeight: sel ? 700 : 600, cursor:"pointer",
                            transition:"all .15s", fontFamily:"'Sora',sans-serif",
                          }}>
                          {svc}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize:10, color:"#94a3b8", marginTop:5 }}>
                    {draftWorker.professions.length} sélectionné{draftWorker.professions.length > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="pr-avail-toggle-row" style={{ marginBottom:16 }}>
                  <span style={{ fontSize:13,fontWeight:600,color:"#0f172e" }}>Disponible actuellement</span>
                  <button className={`pr-toggle ${draftWorker.isAvailable ? "on" : "off"}`} onClick={() => setDraftWorker(p => ({...p, isAvailable: !p.isAvailable}))} />
                </div>
                {saveError && <div style={{ fontSize:12,color:"#ef4444",padding:"8px 12px",background:"#fff0f0",borderRadius:8,marginBottom:12,border:"1px solid #fecaca" }}>{saveError}</div>}
                <div className="pr-btn-row">
                  <button className="pr-cancel-btn" onClick={() => setEditingWorker(false)}><X size={11} />Annuler</button>
                  <button className="pr-save-btn" onClick={saveWorker} disabled={saving}><Check size={11} />{saving ? "Enregistrement…" : "Enregistrer"}</button>
                </div>
              </>
            ) : (
              <>
                <div className="pr-field-grid" style={{ marginBottom:16 }}>
                  <div className="pr-field"><div className="pr-field-label">Ville</div><div className={`pr-field-value ${wp.city ? "" : "muted"}`}>{wp.city || "Non renseignée"}</div></div>
                  <div className="pr-field"><div className="pr-field-label">Expérience</div><div className={`pr-field-value ${wp.experience ? "" : "muted"}`}>{wp.experience || "Non renseignée"}</div></div>
                  <div className="pr-field"><div className="pr-field-label">Tarif horaire</div><div className="pr-field-value">{wp.hourlyRate > 0 ? `${wp.hourlyRate} TND/h` : "Sur devis"}</div></div>
                  <div className="pr-field"><div className="pr-field-label">Disponibilité</div><div style={{ marginTop:4 }}><span className={avail ? "pr-pill-verified" : "pr-pill-unverified"}>{avail ? "Disponible" : "Indisponible"}</span></div></div>
                </div>
                {wp.bio && <div className="pr-field" style={{ marginBottom:16 }}><div className="pr-field-label">Bio</div><div style={{ fontSize:13,color:"#334155",lineHeight:1.75 }}>{wp.bio}</div></div>}
                {profs.length > 0 && <div className="pr-field"><div className="pr-field-label">Métiers</div><div className="pr-tags" style={{ marginTop:4 }}>{profs.map(p => <span key={p} className="pr-tag">{p}</span>)}</div></div>}
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
        {role === "worker" && (
          <div className="pr-card">
            <div className="pr-card-title"><span className="pr-card-title-icon"><Award size={12} />Statistiques</span></div>
            <div className="pr-stats">
              <div className="pr-stat">
                <div className="pr-stat-value" style={{ color:"#f59e0b",display:"flex",alignItems:"center",justifyContent:"center",gap:4 }}><Star size={14} fill="#f59e0b" />{rating.toFixed(1)}</div>
                <div className="pr-stat-label">Note</div>
              </div>
              <div className="pr-stat"><div className="pr-stat-value">{reviews}</div><div className="pr-stat-label">Avis</div></div>
              <div className="pr-stat"><div className="pr-stat-value">{wp.hourlyRate > 0 ? wp.hourlyRate : "—"}</div><div className="pr-stat-label">TND/h</div></div>
            </div>
          </div>
        )}
        <div className="pr-card">
          <div className="pr-card-title"><span className="pr-card-title-icon"><ShieldCheck size={12} />Compte</span></div>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {[
              ["Email vérifié", profile.isVerified ? <span className="pr-pill-verified">✓ Vérifié</span> : <span className="pr-pill-unverified">✗ Non vérifié</span>],
              ...(role === "worker" ? [[
                "Validation artisan",
                workerVerificationStatus === "approved"
                  ? <span className="pr-pill-verified">✓ Approuvé</span>
                  : workerVerificationStatus === "pending"
                    ? <span className="pr-pill-pending">En attente</span>
                    : workerVerificationStatus === "rejected"
                      ? <span className="pr-pill-unverified">Refusé</span>
                      : <span className="pr-pill-pending">Non soumis</span>
              ]] : []),
              ["Statut",        profile.isActive  ? <span className="pr-pill-verified">Actif</span>    : <span className="pr-pill-unverified">Inactif</span>],
              ["Rôle",          <span className={`pr-role-badge pr-role-${role}`}>{role}</span>],
              ["Membre depuis", <span style={{ fontSize:12,fontWeight:600,color:"#0f172e" }}>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("fr-FR",{month:"short",year:"numeric"}) : "—"}</span>],
            ].map(([label, val]) => (
              <div key={label} style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:12,color:"#64748b",fontWeight:600 }}>{label}</span>
                {val}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Tab: Portfolio ────────────────────────────────────────
  const TabPortfolio = () => {
    const portfolio   = wp.portfolio || [];
    const openItem    = portfolioOpenId ? portfolio.find((p) => String(p._id) === portfolioOpenId) : null;
    const itemReviews = openItem?.reviews || [];
    const myReview    = itemReviews.find((r) => String(r.clientId) === myUserId);
    const avgRating   = itemReviews.length
      ? itemReviews.reduce((s, r) => s + r.rating, 0) / itemReviews.length : 0;
    const canReview = currentUser?.role === "client" && !isOwner;

    return (
      <>
        {isOwner && (
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
            <button className="pr-save-btn" onClick={() => openPfForm()} style={{ gap:7 }}>
              <span style={{ fontSize:16, lineHeight:1 }}>+</span> Ajouter une réalisation
            </button>
          </div>
        )}

        {portfolio.length === 0 && (
          <div className="pr-card pr-anim-1" style={{ textAlign:"center", padding:"48px 24px" }}>
            <Image size={40} color="#cbd5e1" style={{ marginBottom:14 }} />
            <div style={{ fontSize:14, color:"#94a3b8", fontWeight:500 }}>
              {isOwner ? "Aucune réalisation. Cliquez sur « Ajouter » pour commencer." : "Ce prestataire n'a pas encore ajouté de réalisations."}
            </div>
          </div>
        )}

        {/* Instagram grid */}
        {portfolio.length > 0 && (
          <div className="pr-pf-grid pr-anim-1">
            {portfolio.map((item) => {
              const imgs     = item.images?.length ? item.images : item.imageUrl ? [item.imageUrl] : [];
              const imgSrc   = imgs[0] ? avatarUrl(imgs[0]) : null;
              const itemRevs = item.reviews || [];
              const avg      = itemRevs.length ? itemRevs.reduce((s, r) => s + r.rating, 0) / itemRevs.length : 0;
              return (
                <div key={String(item._id)} className="pr-pf-cell" onClick={() => openLightbox(String(item._id))}>
                  {imgSrc
                    ? <img src={imgSrc} alt={item.title || "Réalisation"} />
                    : <div className="pr-pf-placeholder"><Image size={28} /></div>
                  }
                  {imgs.length > 1 && (
                    <div style={{ position:"absolute",top:6,right:6,background:"rgba(0,0,0,0.55)",borderRadius:20,padding:"2px 7px",fontSize:10,fontWeight:700,color:"#fff" }}>
                      1/{imgs.length}
                    </div>
                  )}
                  <div className="pr-pf-overlay">
                    {isOwner ? (
                      <div style={{ display:"flex", gap:8 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => openPfForm(item)} title="Modifier"
                          style={{ width:36,height:36,borderRadius:10,border:"1.5px solid rgba(255,255,255,0.25)",background:"rgba(255,255,255,0.15)",backdropFilter:"blur(6px)",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .18s" }}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.28)"}
                          onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.15)"}>
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => deletePfItem(String(item._id))} title="Supprimer"
                          style={{ width:36,height:36,borderRadius:10,border:"1.5px solid rgba(239,68,68,0.4)",background:"rgba(239,68,68,0.18)",backdropFilter:"blur(6px)",color:"#fca5a5",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .18s" }}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.38)"}
                          onMouseLeave={e=>e.currentTarget.style.background="rgba(239,68,68,0.18)"}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        {item.title && <div className="pr-pf-ov-text" style={{ fontSize:12,fontWeight:700 }}>{item.title}</div>}
                        {itemRevs.length > 0 && <div className="pr-pf-ov-text" style={{ fontSize:11 }}>★ {avg.toFixed(1)} · {itemRevs.length} avis</div>}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Lightbox */}
        {openItem && (() => {
          const lbImages = openItem.images?.length ? openItem.images : openItem.imageUrl ? [openItem.imageUrl] : [];
          const lbSrc    = lbImages[lbImageIdx] ? avatarUrl(lbImages[lbImageIdx]) : null;
          const lbTotal  = lbImages.length;
          const prevImg  = () => setLbImageIdx(i => (i - 1 + lbTotal) % lbTotal);
          const nextImg  = () => setLbImageIdx(i => (i + 1) % lbTotal);
          return (
          <div className="pr-lb" onClick={closeLightbox}>
            <div className="pr-lb-card" onClick={(e) => e.stopPropagation()}>
              {/* Left — image carousel */}
              <div className="pr-lb-left" style={{ position:"relative" }}>
                {lbSrc
                  ? <img src={lbSrc} alt={openItem.title || "Réalisation"} />
                  : <div style={{ display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%",color:"#475569" }}><Image size={52} /></div>
                }
                {lbTotal > 1 && (
                  <>
                    <button onClick={e => { e.stopPropagation(); prevImg(); }}
                      style={{ position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",width:34,height:34,borderRadius:"50%",background:"rgba(0,0,0,0.55)",border:"none",color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2 }}>‹</button>
                    <button onClick={e => { e.stopPropagation(); nextImg(); }}
                      style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",width:34,height:34,borderRadius:"50%",background:"rgba(0,0,0,0.55)",border:"none",color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2 }}>›</button>
                    <div style={{ position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5,zIndex:2 }}>
                      {lbImages.map((_, i) => (
                        <div key={i} onClick={e => { e.stopPropagation(); setLbImageIdx(i); }}
                          style={{ width:6,height:6,borderRadius:"50%",background:i===lbImageIdx?"#fff":"rgba(255,255,255,0.4)",cursor:"pointer",transition:"background .2s" }} />
                      ))}
                    </div>
                    <div style={{ position:"absolute",top:10,right:10,background:"rgba(0,0,0,0.55)",borderRadius:20,padding:"3px 9px",fontSize:11,fontWeight:700,color:"#fff",zIndex:2 }}>
                      {lbImageIdx+1}/{lbTotal}
                    </div>
                  </>
                )}
              </div>

              {/* Right — details + reviews */}
              <div className="pr-lb-right">
                {/* Header */}
                <div style={{ padding:"14px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexShrink:0 }}>
                  <div>
                    <div style={{ fontSize:15,fontWeight:700,color:"#0f172e",marginBottom:2 }}>{openItem.title || "Réalisation"}</div>
                    {(openItem.city || openItem.exactLocation) && (
                      <div style={{ fontSize:11,color:"#94a3b8",display:"flex",alignItems:"center",gap:4,marginTop:2 }}>
                        <MapPin size={11} color="#94a3b8" />
                        {[openItem.city, openItem.exactLocation].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                    {isOwner && (
                      <>
                        <button onClick={() => { closeLightbox(); openPfForm(openItem); }} title="Modifier"
                          style={{ width:32,height:32,borderRadius:8,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#475569",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .18s" }}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor="#06b6d4";e.currentTarget.style.color="#06b6d4";e.currentTarget.style.background="rgba(6,182,212,0.06)"}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color="#475569";e.currentTarget.style.background="#f8fafc"}}>
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => { closeLightbox(); deletePfItem(portfolioOpenId); }} title="Supprimer"
                          style={{ width:32,height:32,borderRadius:8,border:"1.5px solid #fecaca",background:"#fff0f0",color:"#ef4444",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .18s" }}
                          onMouseEnter={e=>{e.currentTarget.style.background="#fee2e2";e.currentTarget.style.borderColor="#fca5a5"}}
                          onMouseLeave={e=>{e.currentTarget.style.background="#fff0f0";e.currentTarget.style.borderColor="#fecaca"}}>
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                    <button onClick={closeLightbox} style={{ background:"#f1f5f9",border:"none",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#64748b",fontSize:18 }}>×</button>
                  </div>
                </div>

                {/* Description */}
                {openItem.description && (
                  <div style={{ padding:"12px 16px",borderBottom:"1px solid #f1f5f9",fontSize:13,color:"#334155",lineHeight:1.65,flexShrink:0 }}>
                    {openItem.description}
                  </div>
                )}

                {/* Average rating */}
                {itemReviews.length > 0 && (
                  <div style={{ padding:"12px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
                    <div style={{ fontSize:26,fontWeight:800,color:"#0f172e",lineHeight:1 }}>{avgRating.toFixed(1)}</div>
                    <div>
                      <StarsDisplay rating={avgRating} size={14} />
                      <div style={{ fontSize:11,color:"#94a3b8",marginTop:2 }}>{itemReviews.length} avis</div>
                    </div>
                  </div>
                )}

                {/* Reviews list */}
                <div style={{ flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:10 }}>
                  {itemReviews.length === 0 && (
                    <div style={{ fontSize:12,color:"#94a3b8",fontStyle:"italic",textAlign:"center",padding:"12px 0" }}>
                      Aucun avis pour le moment.{!isOwner && " Soyez le premier !"}
                    </div>
                  )}
                  {[...itemReviews].reverse().map((rev) => (
                    <div key={String(rev._id)} style={{ background:"#f8fafc",borderRadius:10,padding:"10px 12px",border:"1px solid #f1f5f9",position:"relative" }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
                        <div style={{ fontSize:12,fontWeight:700,color:"#0f172e" }}>
                          {rev.clientName || "Anonyme"}
                          {String(rev.clientId) === myUserId && <span style={{ marginLeft:6,fontSize:10,color:"#06b6d4",fontWeight:700 }}>· Vous</span>}
                        </div>
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <StarsDisplay rating={rev.rating} size={12} />
                          {isOwner && (
                            <button onClick={() => deletePfReview(portfolioOpenId, String(rev._id))}
                              style={{ background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:14,lineHeight:1,padding:"0 2px" }}
                              title="Supprimer cet avis">✕</button>
                          )}
                        </div>
                      </div>
                      {rev.comment && <div style={{ fontSize:12,color:"#64748b",lineHeight:1.5 }}>{rev.comment}</div>}
                    </div>
                  ))}
                </div>

                {/* Review form — clients only */}
                {canReview && (
                  <div style={{ padding:"14px 16px",borderTop:"1.5px solid #f1f5f9",flexShrink:0 }}>
                    <div style={{ fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:10 }}>
                      {myReview ? "Modifier votre avis" : "Laisser un avis"}
                    </div>
                    <StarRow value={reviewRating} hover={reviewHover} onHover={setReviewHover} onLeave={() => setReviewHover(0)} onClick={setReviewRating} />
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Votre commentaire (optionnel)…" maxLength={500} rows={2}
                      style={{ marginTop:10,width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 10px",fontSize:12,color:"#0f172e",outline:"none",resize:"vertical",fontFamily:"'Sora',sans-serif",boxSizing:"border-box",background:"#f8fafc" }} />
                    {portfolioMsg && (
                      <div style={{ fontSize:11,marginTop:5,color:portfolioMsg.includes("!") ? "#10b981" : "#ef4444",fontWeight:600 }}>{portfolioMsg}</div>
                    )}
                    <button onClick={() => submitPortfolioReview(portfolioOpenId)} disabled={!reviewRating || portfolioSubmitting}
                      style={{ marginTop:10,width:"100%",border:"none",borderRadius:8,padding:"10px 0",fontSize:12,fontWeight:700,cursor:reviewRating&&!portfolioSubmitting?"pointer":"not-allowed",background:reviewRating&&!portfolioSubmitting?"#06b6d4":"#e2e8f0",color:reviewRating&&!portfolioSubmitting?"#fff":"#94a3b8",fontFamily:"'Sora',sans-serif",transition:"all .2s" }}>
                      {portfolioSubmitting ? "Envoi…" : myReview ? "Mettre à jour" : "Envoyer l'avis"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })()}
      </>
    );
  };

  // ── Tab: Planning ─────────────────────────────────────────
  const TabPlanning = () => {
    const schedule = scheduleEditing ? scheduleDraft : (wp.availabilitySchedule || {});
    const hasAnySlot = DAYS.some(d => (schedule[d.key] || []).length > 0);

    const toggleSlot = (day, hour) => {
      if (!scheduleEditing) return;
      setScheduleDraft(prev => {
        const hours = prev[day] || [];
        const next = hours.includes(hour)
          ? hours.filter(h => h !== hour)
          : [...hours, hour].sort((a, b) => a - b);
        return { ...prev, [day]: next };
      });
    };

    const toggleDay = (day) => {
      if (!scheduleEditing) return;
      setScheduleDraft(prev => {
        const hours = prev[day] || [];
        const allOn = BOOKABLE_HOURS.every(h => hours.includes(h));
        return { ...prev, [day]: allOn ? [] : [...BOOKABLE_HOURS] };
      });
    };

    return (
      <div className="pr-grid-full pr-anim-2">
        <div className="pr-card">
          <div className="pr-card-title">
            <span className="pr-card-title-icon"><Calendar size={12} />Planning de disponibilité</span>
            {isOwner && !scheduleEditing && (
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {scheduleMsg && <span style={{ fontSize:11, color:"#10b981", fontWeight:700 }}>{scheduleMsg}</span>}
                <button className="pr-edit-btn" onClick={startScheduleEdit}><Edit3 size={11} />Modifier</button>
              </div>
            )}
          </div>

          {!hasAnySlot && !scheduleEditing && !isOwner && (
            <div style={{ color:"#94a3b8", fontSize:12, fontStyle:"italic", marginBottom:12 }}>
              Ce prestataire n'a pas encore défini son planning hebdomadaire.
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {DAYS.map(d => {
              const dayHours = schedule[d.key] || [];
              const allOn    = BOOKABLE_HOURS.every(h => dayHours.includes(h));
              const someOn   = dayHours.length > 0;
              return (
                <div key={d.key} style={{
                  display:"flex", alignItems:"center", gap:12, flexWrap:"wrap",
                  padding:"12px 14px", borderRadius:10,
                  background: someOn ? "rgba(6,182,212,0.04)" : "#f8fafc",
                  border: someOn ? "1.5px solid rgba(6,182,212,0.18)" : "1.5px solid #f1f5f9",
                  transition:"background .2s, border-color .2s",
                }}>
                  {/* Day label — click to toggle whole day in edit mode */}
                  <div
                    onClick={() => toggleDay(d.key)}
                    title={scheduleEditing ? (allOn ? "Tout désactiver" : "Tout activer") : ""}
                    style={{
                      width:38, flexShrink:0, fontSize:12, fontWeight:800,
                      color: someOn ? "#0f172e" : "#94a3b8",
                      cursor: scheduleEditing ? "pointer" : "default",
                      userSelect:"none",
                      textDecoration: scheduleEditing ? "underline dotted" : "none",
                      textUnderlineOffset:3,
                    }}>
                    {d.label}
                  </div>

                  {/* Hour chips */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, flex:1 }}>
                    {BOOKABLE_HOURS.map(h => {
                      const isOn = dayHours.includes(h);
                      return (
                        <button key={h} type="button"
                          onClick={() => toggleSlot(d.key, h)}
                          disabled={!scheduleEditing}
                          style={{
                            padding:"5px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                            border: isOn ? "1.5px solid rgba(6,182,212,0.5)" : "1.5px solid #e2e8f0",
                            background: isOn ? "rgba(6,182,212,0.12)" : "#fff",
                            color: isOn ? "#0284c7" : "#cbd5e1",
                            cursor: scheduleEditing ? "pointer" : "default",
                            transition:"all .15s",
                            fontFamily:"'Sora',sans-serif",
                            boxShadow: isOn ? "0 1px 4px rgba(6,182,212,0.15)" : "none",
                          }}>
                          {fmtHour(h)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right: slot count badge */}
                  <div style={{
                    flexShrink:0, fontSize:10, fontWeight:700,
                    color: someOn ? "#06b6d4" : "#94a3b8",
                    minWidth:32, textAlign:"right",
                  }}>
                    {someOn ? `${dayHours.length} h` : "Fermé"}
                  </div>
                </div>
              );
            })}
          </div>

          {scheduleEditing && (
            <>
              <div style={{ marginTop:14, fontSize:11, color:"#94a3b8", fontStyle:"italic" }}>
                Cliquez sur le nom du jour pour tout activer / désactiver · cliquez sur un créneau pour le basculer
              </div>
              {scheduleMsg && <div style={{ fontSize:12, color:"#ef4444", marginTop:8, fontWeight:600 }}>{scheduleMsg}</div>}
              <div className="pr-btn-row">
                <button className="pr-cancel-btn" onClick={() => { setScheduleEditing(false); setScheduleMsg(""); }}><X size={11} />Annuler</button>
                <button className="pr-save-btn" onClick={saveSchedule} disabled={scheduleSaving}><Check size={11} />{scheduleSaving ? "Enregistrement…" : "Enregistrer"}</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { id:"overview",  label:"Aperçu" },
    ...(role === "worker" ? [
      { id:"portfolio", label:"Portfolio" },
      { id:"planning",  label:"Planning" },
    ] : []),
  ];

  return (
    <>
      <style>{css}</style>
      <div className="pr-root">

        <Navbar
          user={currentUser}
          activePage="profile"
          onHome={onHome}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        <section className="pr-hero">
          <div className="pr-hero-inner">
            <div className="pr-avatar-row pr-anim-1">
              <div className="pr-avatar-wrap">
                <div className="pr-avatar">
                  {avatar ? <img src={avatar} alt={fn} /> : avatarInitials(fn)}
                </div>
                {isOwner && (
                  <>
                    <button className="pr-avatar-edit-btn" title="Changer la photo" disabled={avatarUploading}
                      onClick={() => avatarInputRef.current?.click()} style={{ opacity: avatarUploading ? 0.6 : 1 }}>
                      <Camera size={12} color="#fff" />
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatarChange} />
                  </>
                )}
              </div>
              <div className="pr-hero-info">
                <div className="pr-hero-name">{fn} {ln}</div>
                <div className="pr-hero-meta">
                  <span className={`pr-role-badge pr-role-${role}`}>{role}</span>
                  {role === "worker" && wp.city && (
                    <span style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#64748b" }}>
                      <MapPin size={11} color="#475569" />{wp.city}
                    </span>
                  )}
                  {role === "worker" && (
                    <span style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,color:avail?"#10b981":"#d97706",fontWeight:600 }}>
                      <div style={{ width:6,height:6,borderRadius:"50%",background:avail?"#10b981":"#f59e0b" }} />
                      {avail ? "Disponible" : "Indisponible"}
                    </span>
                  )}
                  {role === "worker" && rating > 0 && (
                    <span style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#94a3b8" }}>
                      <Star size={11} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontWeight:700,color:"#fff" }}>{rating.toFixed(1)}</span>
                      <span>({reviews} avis)</span>
                    </span>
                  )}
                </div>
                {!isOwner && role === "worker" && currentUser && (
                  <div style={{ display:"flex", gap:10, marginTop:14, flexWrap:"wrap" }}>
                    <button
                      onClick={() => setReserveOpen(true)}
                      disabled={!avail}
                      style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 22px",borderRadius:10,border:"none",background:avail?"#06b6d4":"#e2e8f0",color:avail?"#fff":"#94a3b8",fontSize:13,fontWeight:700,cursor:avail?"pointer":"not-allowed",fontFamily:"'Sora',sans-serif",transition:"background .18s" }}
                      onMouseEnter={e => { if (avail) e.currentTarget.style.background="#0891b2"; }}
                      onMouseLeave={e => { if (avail) e.currentTarget.style.background="#06b6d4"; }}
                    >
                      <Calendar size={15} /> Réserver
                    </button>
                    <button
                      onClick={toggleSave}
                      disabled={saveLoading}
                      style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 18px",borderRadius:10,border:`1.5px solid ${isSaved?"#06b6d4":"#e2e8f0"}`,background:isSaved?"rgba(6,182,212,0.08)":"#fff",color:isSaved?"#06b6d4":"#64748b",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .18s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor="#06b6d4"; e.currentTarget.style.color="#06b6d4"; }}
                      onMouseLeave={e => { if (!isSaved) { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.color="#64748b"; } }}
                    >
                      {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                      {isSaved ? "Sauvegardé" : "Sauvegarder"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="pr-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`pr-tab ${tab === t.id ? "active" : ""}`} onClick={() => {
                setTab(t.id);
                if (profile?._id) sessionStorage.setItem(`profile_tab_${profile._id}`, t.id);
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <div className="pr-content">
          {tab === "overview"   && TabOverview()}
          {tab === "portfolio"  && TabPortfolio()}
          {tab === "planning"   && TabPlanning()}
        </div>

      </div>

      {/* Portfolio add/edit form overlay */}
      {pfOpen && (
        <div className="pr-lb" onClick={() => setPfOpen(false)}>
          <div style={{ background:"#fff", borderRadius:14, padding:28, width:"100%", maxWidth:520, boxShadow:"0 40px 100px rgba(0,0,0,0.45)", maxHeight:"92vh", overflowY:"auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:16, fontWeight:800, color:"#0f172e", marginBottom:20 }}>
              {pfEditId ? "Modifier la réalisation" : "Ajouter une réalisation"}
            </div>

            {/* ── Multi-image uploader ── */}
            <div style={{ marginBottom:16 }}>
              <div className="pr-field-label" style={{ marginBottom:8 }}>
                Photos <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, color:"#94a3b8" }}>({pfExistingImages.length + pfNewFiles.length} / 10)</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8 }}>
                {/* Existing saved images */}
                {pfExistingImages.map((src, i) => (
                  <div key={`ex-${i}`} style={{ position:"relative", aspectRatio:"1", borderRadius:8, overflow:"hidden", background:"#e2e8f0" }}>
                    <img src={avatarUrl(src)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    <button onClick={() => setPfExistingImages(prev => prev.filter((_, j) => j !== i))}
                      style={{ position:"absolute", top:3, right:3, width:20, height:20, borderRadius:"50%", background:"rgba(239,68,68,0.9)", border:"none", color:"#fff", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>×</button>
                  </div>
                ))}
                {/* New file previews */}
                {pfNewFiles.map((nf, i) => (
                  <div key={`nf-${i}`} style={{ position:"relative", aspectRatio:"1", borderRadius:8, overflow:"hidden", background:"#e2e8f0" }}>
                    <img src={nf.preview} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    <button onClick={() => setPfNewFiles(prev => prev.filter((_, j) => j !== i))}
                      style={{ position:"absolute", top:3, right:3, width:20, height:20, borderRadius:"50%", background:"rgba(239,68,68,0.9)", border:"none", color:"#fff", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>×</button>
                  </div>
                ))}
                {/* Add button */}
                {(pfExistingImages.length + pfNewFiles.length) < 10 && (
                  <div onClick={() => pfFileRef.current?.click()}
                    style={{ aspectRatio:"1", borderRadius:8, border:"2px dashed #cbd5e1", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", background:"#f8fafc", gap:4, transition:"border-color .2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor="#06b6d4"}
                    onMouseLeave={e => e.currentTarget.style.borderColor="#cbd5e1"}>
                    <div style={{ fontSize:22, color:"#94a3b8", lineHeight:1 }}>+</div>
                    <div style={{ fontSize:9, color:"#94a3b8", fontWeight:700 }}>Ajouter</div>
                  </div>
                )}
              </div>
              <input ref={pfFileRef} type="file" accept="image/*" multiple style={{ display:"none" }}
                onChange={e => { addPfFiles(e.target.files); e.target.value = ""; }} />
            </div>

            {/* ── Titre ── */}
            <div className="pr-field" style={{ marginBottom:12 }}>
              <div className="pr-field-label">Titre</div>
              <input className="pr-input" value={pfDraft.title} maxLength={100} placeholder="Ex: Installation électrique complète"
                onChange={e => setPfDraft(p => ({...p, title: e.target.value}))} />
            </div>

            {/* ── Localisation ── */}
            <div className="pr-field-grid" style={{ marginBottom:12 }}>
              <div className="pr-field">
                <div className="pr-field-label">Gouvernorat</div>
                <select className="pr-select" value={pfDraft.governorate}
                  onChange={e => setPfDraft(p => ({...p, governorate: e.target.value, city:""}))}>
                  <option value="">Gouvernorat</option>
                  {GOUVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="pr-field">
                <div className="pr-field-label">Délégation</div>
                <select className="pr-select" value={pfDraft.city} disabled={!pfDraft.governorate}
                  onChange={e => setPfDraft(p => ({...p, city: e.target.value}))}>
                  <option value="">{pfDraft.governorate ? "Délégation" : "Choisir gouvernorat"}</option>
                  {(DELEGATIONS[pfDraft.governorate] || []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* ── Position exacte (optionnel) ── */}
            <div className="pr-field" style={{ marginBottom:12 }}>
              <div className="pr-field-label">Position exacte <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, color:"#94a3b8" }}>(optionnel)</span></div>
              <input className="pr-input" value={pfDraft.exactLocation} maxLength={120} placeholder="Ex: Rue Ibn Khaldoun, Bâtiment A"
                onChange={e => setPfDraft(p => ({...p, exactLocation: e.target.value}))} />
            </div>

            {/* ── Description ── */}
            <div className="pr-field" style={{ marginBottom:16 }}>
              <div className="pr-field-label">Description</div>
              <textarea className="pr-textarea" value={pfDraft.description} maxLength={500} rows={3}
                placeholder="Décrivez ce projet…"
                onChange={e => setPfDraft(p => ({...p, description: e.target.value}))} />
              <div style={{ fontSize:10, color:"#94a3b8", textAlign:"right", marginTop:3 }}>{(pfDraft.description||"").length} / 500</div>
            </div>

            {pfMsg && <div style={{ fontSize:12, color:"#ef4444", marginBottom:12, fontWeight:600 }}>{pfMsg}</div>}

            <div className="pr-btn-row">
              <button className="pr-cancel-btn" onClick={() => setPfOpen(false)}><X size={11} />Annuler</button>
              <button className="pr-save-btn" onClick={savePfItem} disabled={pfSaving}><Check size={11} />{pfSaving ? "Enregistrement…" : "Enregistrer"}</button>
            </div>
          </div>
        </div>
      )}

      {reserveOpen && (
        <ReservationDialog
          worker={profile}
          user={currentUser}
          onClose={() => setReserveOpen(false)}
          onSuccess={() => setReserveOpen(false)}
        />
      )}
    </>
  );
}
