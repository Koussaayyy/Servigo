import { useEffect, useMemo, useState } from "react";
import {
  MapPin, Star, Briefcase, Edit3, Check, X,
  ShieldCheck, Camera, Mail, Calendar, Award,
} from "lucide-react";
import { avatarUrl, reservationApi } from "../api";
import Navbar from "../components/Navbar";

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
.pr-avatar-row { display:flex; align-items:flex-end; gap:20px; padding-bottom:0; position:relative; }
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
.pr-role-badge {
  display:inline-flex; align-items:center; gap:5px;
  border-radius:999px; padding:4px 12px; font-size:10px; font-weight:700;
  letter-spacing:0.12em; text-transform:uppercase;
}
.pr-role-worker { background:rgba(16,185,129,0.12); color:#10b981; border:1.5px solid rgba(16,185,129,0.25); }
.pr-role-client { background:rgba(6,182,212,0.12); color:#06b6d4; border:1.5px solid rgba(6,182,212,0.25); }
.pr-role-admin  { background:rgba(245,158,11,0.12); color:#f59e0b; border:1.5px solid rgba(245,158,11,0.25); }
.pr-tabs {
  display:flex; gap:0; border-bottom:1.5px solid rgba(255,255,255,0.08);
  margin-top:20px; max-width:1280px; margin-left:auto; margin-right:auto;
  position: relative; z-index: 2;
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
@media(max-width:1024px){ .pr-grid{ grid-template-columns:1fr; } }
@media(max-width:768px){ .pr-hero{ padding:76px 16px 0; } .pr-content{ padding:24px 16px 64px; } .pr-hero-name{ font-size:20px; } .pr-field-grid{ grid-template-columns:1fr; } .pr-stats{ grid-template-columns:repeat(3,1fr); } }
@media(max-width:480px){ .pr-avatar{ width:76px; height:76px; font-size:26px; } .pr-tabs{ overflow-x:auto; } }
`;

const avatarInitials = (n) => (n?.[0] || "?").toUpperCase();
const fmtHour = (hour) => `${String(hour).padStart(2, "0")}:00`;
const fmtDate = (dateValue) => {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return String(dateValue).slice(0, 10);
  return d.toLocaleDateString("fr-FR");
};
const next30Days = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
};

export default function Profile({ profileUser: initialProfile, currentUser, initialTab = "overview", onBack, onHome, onNavigate, onLogout }) {
  const [profile, setProfile] = useState(initialProfile || currentUser || null);
  const [loading, setLoading] = useState(!profile);
  const [tab, setTab]         = useState(initialTab || "overview");
  const [editingInfo,   setEditingInfo]   = useState(false);
  const [editingWorker, setEditingWorker] = useState(false);
  const [draftInfo,   setDraftInfo]   = useState({});
  const [draftWorker, setDraftWorker] = useState({});
  const [saving, setSaving] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [datePage, setDatePage] = useState(0);
  const [monthAvailability, setMonthAvailability] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookingForm, setBookingForm] = useState({ bookingDate: "", bookingHour: "", address: "", notes: "" });

  const isOwner = currentUser && profile && (
    currentUser._id === profile._id || currentUser.id === profile._id
  );

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
  const workerId = profile?._id ? String(profile._id) : "";

  const datePages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < monthAvailability.length; i += 7) pages.push(monthAvailability.slice(i, i + 7));
    return pages;
  }, [monthAvailability]);

  const visibleDates = datePages[datePage] || [];

  const startEditInfo = () => {
    setDraftInfo({
      firstName: profile.firstName || "", lastName:  profile.lastName  || "",
      phone:     profile.phone     || "", gender:    profile.gender    || "",
      birthDate: profile.birthDate || "", address:   cp.address || "",
      city_client: cp.city || "",         bio_client: cp.bio   || "",
    });
    setEditingInfo(true);
  };

  const startEditWorker = () => {
    setDraftWorker({
      city: wp.city || "", experience: wp.experience || "",
      bio:  wp.bio  || "", hourlyRate: wp.hourlyRate || 0,
      professions: [...profs], isAvailable: avail,
    });
    setEditingWorker(true);
  };

  const saveInfo = async () => {
    setSaving(true);
    try {
      setProfile(prev => ({
        ...prev,
        firstName: draftInfo.firstName, lastName: draftInfo.lastName,
        phone: draftInfo.phone, gender: draftInfo.gender, birthDate: draftInfo.birthDate,
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
          city: draftWorker.city, experience: draftWorker.experience,
          bio: draftWorker.bio, hourlyRate: draftWorker.hourlyRate,
          professions: draftWorker.professions, isAvailable: draftWorker.isAvailable,
        },
      }));
      setEditingWorker(false);
    } finally { setSaving(false); }
  };

  const removeProfession = (p) => setDraftWorker(prev => ({ ...prev, professions: prev.professions.filter(x => x !== p) }));
  const addProfession = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      const val = e.target.value.trim();
      setDraftWorker(prev => ({ ...prev, professions: [...new Set([...prev.professions, val])] }));
      e.target.value = "";
    }
  };

  useEffect(() => {
    const want = initialTab || "overview";
    if (tab !== want) setTab(want);
  }, [initialTab, profile?._id]);

  useEffect(() => {
    if (!canReserve) return;
    if (selectedService) return;
    setSelectedService(profs[0] || "");
  }, [canReserve, profs, selectedService]);

  useEffect(() => {
    setDatePage(0);
    setBookingForm((prev) => ({ ...prev, bookingDate: "", bookingHour: "" }));
    setSlots([]);
  }, [selectedService]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!canReserve || tab !== "schedule" || !workerId || !selectedService) {
        setMonthAvailability([]);
        setSlots([]);
        setBookingForm((prev) => ({ ...prev, bookingDate: "", bookingHour: "" }));
        return;
      }

      setSlotsLoading(true);
      setBookingError("");
      try {
        let days = [];
        try {
          const data = await reservationApi.getWorkerMonthAvailability(workerId, selectedService);
          const raw = Array.isArray(data?.days) ? data.days : [];
          days = raw.map((day) => {
            if (Array.isArray(day?.slots)) return { date: day.date, slots: day.slots };
            const hours = Array.isArray(day?.availableHours) ? day.availableHours : [];
            return {
              date: day.date,
              slots: [8, 9, 10, 11, 12, 14, 15, 16, 17].map((h) => ({ hour: h, status: hours.includes(h) ? "available" : "accepted" })),
            };
          });
        } catch {
          const dates = next30Days();
          days = await Promise.all(
            dates.map(async (date) => {
              try {
                const d = await reservationApi.getWorkerAvailableSlots(workerId, date, selectedService);
                return { date, slots: Array.isArray(d?.slots) ? d.slots : [] };
              } catch {
                return { date, slots: [] };
              }
            })
          );
        }

        setMonthAvailability(days);
        const first = days.find((d) => Array.isArray(d.slots) && d.slots.some((s) => s.status === "available"));
        const nextDate = first?.date || days[0]?.date || "";
        const nextSlots = days.find((d) => d.date === nextDate)?.slots || [];
        setSlots(nextSlots);
        if (nextDate) {
          const idx = days.findIndex((d) => d.date === nextDate);
          setDatePage(Math.max(0, Math.floor(idx / 7)));
        }
        setBookingForm((prev) => ({ ...prev, bookingDate: nextDate, bookingHour: "" }));
      } catch (err) {
        setMonthAvailability([]);
        setSlots([]);
        setBookingError(err.message || "Impossible de charger la disponibilité");
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchAvailability();
  }, [canReserve, tab, workerId, selectedService]);

  useEffect(() => {
    if (!bookingForm.bookingDate) {
      setSlots([]);
      return;
    }
    const day = monthAvailability.find((d) => d.date === bookingForm.bookingDate);
    const daySlots = Array.isArray(day?.slots) ? day.slots : [];
    setSlots(daySlots);
    const valid = daySlots.find((s) => s.status === "available" && String(s.hour) === String(bookingForm.bookingHour));
    if (!valid) {
      setBookingForm((prev) => ({ ...prev, bookingHour: "" }));
    }
  }, [bookingForm.bookingDate, bookingForm.bookingHour, monthAvailability]);

  const updateBookingForm = (key) => (e) => setBookingForm((prev) => ({ ...prev, [key]: e.target.value }));

  const createReservation = async () => {
    setBookingError("");
    setBookingMessage("");
    if (!canReserve) return setBookingError("Réservation disponible uniquement pour les clients.");
    if (!selectedService || !workerId || !bookingForm.bookingDate || bookingForm.bookingHour === "") {
      return setBookingError("Sélectionnez service, date et heure.");
    }

    setActionLoading(true);
    try {
      await reservationApi.create({
        workerId,
        bookingDate: bookingForm.bookingDate,
        bookingHour: Number(bookingForm.bookingHour),
        serviceType: selectedService,
        address: bookingForm.address,
        notes: bookingForm.notes,
      });

      setBookingMessage("Réservation créée ✅");
      setBookingForm((prev) => ({ ...prev, bookingHour: "", notes: "" }));

      try {
        const upd = await reservationApi.getWorkerAvailableSlots(workerId, bookingForm.bookingDate, selectedService);
        const ns = Array.isArray(upd?.slots) ? upd.slots : [];
        setMonthAvailability((prev) => prev.map((d) => (d.date === bookingForm.bookingDate ? { ...d, slots: ns } : d)));
        setSlots(ns);
      } catch {
      }
    } catch (err) {
      setBookingError(err.message || "Réservation impossible");
    } finally {
      setActionLoading(false);
    }
  };

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

  const TabOverview = () => (
    <div className="pr-grid pr-anim-1">
      <div style={{ display:"flex",flexDirection:"column",gap:20 }}>

        {/* Personal info */}
        <div className="pr-card">
          <div className="pr-card-title">
            <span className="pr-card-title-icon"><Mail size={12} />Informations personnelles</span>
            {isOwner && !editingInfo && <button className="pr-edit-btn" onClick={startEditInfo}><Edit3 size={11} />Modifier</button>}
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
                  <div className="pr-field"><div className="pr-field-label">Bio</div><textarea className="pr-textarea" value={draftInfo.bio_client} onChange={e => setDraftInfo(p => ({...p, bio_client: e.target.value}))} placeholder="Parlez de vous…" /></div>
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
                  <div className="pr-field"><div className="pr-field-label">Ville</div><input className="pr-input" value={draftWorker.city} onChange={e => setDraftWorker(p => ({...p, city: e.target.value}))} /></div>
                  <div className="pr-field"><div className="pr-field-label">Expérience</div><input className="pr-input" value={draftWorker.experience} onChange={e => setDraftWorker(p => ({...p, experience: e.target.value}))} placeholder="Ex: 5 ans" /></div>
                  <div className="pr-field"><div className="pr-field-label">Tarif horaire (TND/h)</div><input className="pr-input" type="number" min="0" value={draftWorker.hourlyRate} onChange={e => setDraftWorker(p => ({...p, hourlyRate: Number(e.target.value)}))} /></div>
                </div>
                <div className="pr-field" style={{ marginBottom:16 }}><div className="pr-field-label">Bio</div><textarea className="pr-textarea" value={draftWorker.bio} onChange={e => setDraftWorker(p => ({...p, bio: e.target.value}))} placeholder="Décrivez votre expertise…" /></div>
                <div className="pr-field" style={{ marginBottom:16 }}>
                  <div className="pr-field-label">Métiers (Entrée pour ajouter)</div>
                  <div className="pr-tags" style={{ marginBottom:8 }}>{draftWorker.professions.map(p => <span key={p} className="pr-tag-remove" onClick={() => removeProfession(p)}>{p} ×</span>)}</div>
                  <input className="pr-input" placeholder="Ajouter un métier puis Entrée…" onKeyDown={addProfession} />
                </div>
                <div className="pr-avail-toggle-row" style={{ marginBottom:16 }}>
                  <span style={{ fontSize:13,fontWeight:600,color:"#0f172e" }}>Disponible actuellement</span>
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

      {/* Right column */}
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

  const TabSchedule = () => (
    <div className="pr-grid-full pr-anim-2">
      <div className="pr-card">
        <div className="pr-card-title">
          <span className="pr-card-title-icon"><Calendar size={12} />Nouvelle réservation</span>
        </div>

        {!canReserve ? (
          <div style={{ color:"#64748b", fontSize:13, padding:4 }}>
            Cette section est visible lors de la consultation d'un profil prestataire en tant que client.
          </div>
        ) : (
          <div style={{ display:"grid", gap:12 }}>
            {bookingError && <div style={{ color:"#c0392b", fontSize:13 }}>{bookingError}</div>}
            {bookingMessage && <div style={{ color:"#0f172e", fontSize:13 }}>{bookingMessage}</div>}

            <div style={{ marginBottom:4 }}>
              <div style={{ fontSize:12, color:"#64748b", marginBottom:8 }}>1. Prestataire sélectionné</div>
              <div style={{ borderRadius:12, border:"1.5px solid #06b6d4", background:"rgba(232,98,10,0.08)", padding:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, marginBottom:4 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"#0f172e" }}>{fn} {ln}</div>
                  <span style={{ fontSize:11, color:"#06b6d4", border:"1px solid rgba(6,182,212,0.25)", borderRadius:100, padding:"3px 8px", fontWeight:700 }}>Sélectionné</span>
                </div>
                <div style={{ fontSize:12, color:"#64748b", marginBottom:8 }}>{wp.city || "Ville non précisée"}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {profs.slice(0, 3).map((service) => (
                    <span key={service} style={{ fontSize:11, padding:"4px 8px", borderRadius:100, background:"#e2e8f0", color:"#0f172e" }}>
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:12 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:6, fontSize:12, color:"#64748b" }}>
                2. Choisissez la date (30 prochains jours)
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <button type="button" onClick={() => setDatePage((p) => Math.max(0, p - 1))} disabled={datePage === 0} className="pr-edit-btn">← Semaine précédente</button>
                  <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>Semaine {datePage + 1}/{Math.max(1, datePages.length)}</span>
                  <button type="button" onClick={() => setDatePage((p) => Math.min(Math.max(0, datePages.length - 1), p + 1))} disabled={datePage >= datePages.length - 1} className="pr-edit-btn">Semaine suivante →</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4, minmax(0,1fr))", gap:8 }}>
                  {visibleDates.map((day) => {
                    const daySlots = Array.isArray(day.slots) ? day.slots : [];
                    const free = daySlots.filter((s) => s.status === "available").length;
                    const active = bookingForm.bookingDate === day.date;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => setBookingForm((prev) => ({ ...prev, bookingDate: day.date, bookingHour: "" }))}
                        disabled={slotsLoading || free === 0}
                        style={{
                          padding:"9px 8px",
                          borderRadius:8,
                          border:active ? "1.5px solid #06b6d4" : "1.5px solid #e2e8f0",
                          background:active ? "rgba(6,182,212,0.1)" : "#fff",
                          color:active ? "#06b6d4" : "#64748b",
                          opacity:free === 0 ? 0.45 : 1,
                          cursor:(slotsLoading || free === 0) ? "not-allowed" : "pointer",
                          fontSize:12,
                          textAlign:"left",
                        }}
                      >
                        <div style={{ fontWeight:700, fontSize:12 }}>{fmtDate(day.date)}</div>
                        <div style={{ fontSize:11 }}>{free} h libre(s)</div>
                      </button>
                    );
                  })}
                  {!slotsLoading && visibleDates.length === 0 && (
                    <div style={{ gridColumn:"1 / -1", fontSize:12, color:"#64748b", paddingTop:8 }}>Aucune disponibilité trouvée ce mois</div>
                  )}
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:6, fontSize:12, color:"#64748b" }}>
                3. Choisissez l'heure libre
                <div style={{ display:"flex", gap:12, fontSize:11, color:"#64748b", marginBottom:4, flexWrap:"wrap" }}>
                  {[["#ecfdf5", "#10b981", "Libre"], ["#fffbeb", "#f59e0b", "En attente"], ["#fee2e2", "#ef4444", "Réservé"], ["#f1f5f9", "#94a3b8", "Passé"]].map(([bg, border, label]) => (
                    <div key={label} style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <div style={{ width:16, height:16, borderRadius:4, background:bg, border:`1px solid ${border}` }} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3, minmax(0,1fr))", gap:8 }}>
                  {slots.map((slot) => {
                    const active = String(bookingForm.bookingHour) === String(slot.hour);
                    const availSlot = slot.status === "available";
                    const pending = slot.status === "pending";
                    const taken = slot.status === "accepted" || slot.status === "completed";
                    const past = slot.status === "passed";
                    let bg = "#fff";
                    let bc = "#e2e8f0";
                    let tc = "#0f172e";
                    let op = 1;
                    let cur = "pointer";

                    if (availSlot && active) { bg = "#10b981"; bc = "#10b981"; tc = "#fff"; }
                    else if (availSlot) { bg = "#ecfdf5"; bc = "#10b981"; tc = "#059669"; }
                    else if (pending && active) { bg = "#f59e0b"; bc = "#f59e0b"; tc = "#fff"; }
                    else if (pending) { bg = "#fffbeb"; bc = "#f59e0b"; tc = "#b45309"; }
                    else if (taken) { bg = "#fee2e2"; bc = "#ef4444"; tc = "#991b1b"; cur = "not-allowed"; op = 0.7; }
                    else if (past) { bg = "#f1f5f9"; bc = "#94a3b8"; tc = "#64748b"; cur = "not-allowed"; op = 0.75; }

                    return (
                      <button
                        key={slot.hour}
                        type="button"
                        onClick={() => availSlot && setBookingForm((prev) => ({ ...prev, bookingHour: String(slot.hour) }))}
                        disabled={!availSlot || !bookingForm.bookingDate || slotsLoading}
                        style={{
                          padding:"10px 8px",
                          borderRadius:8,
                          border:`1.5px solid ${bc}`,
                          background:bg,
                          color:tc,
                          cursor:(!bookingForm.bookingDate || slotsLoading) ? "not-allowed" : cur,
                          opacity:(!bookingForm.bookingDate || slotsLoading) ? 0.6 : op,
                          fontWeight:600,
                          fontSize:13,
                          transition:"all .2s",
                        }}
                      >
                        {fmtHour(slot.hour)}
                      </button>
                    );
                  })}
                </div>
                {slots.length === 0 && <div style={{ color:"#94a3b8", fontSize:12 }}>Aucune disponibilité trouvée</div>}
              </div>
            </div>

            <label style={{ display:"flex", flexDirection:"column", gap:6, fontSize:12, color:"#64748b" }}>
              Adresse
              <input
                value={bookingForm.address}
                onChange={updateBookingForm("address")}
                style={{ width:"100%", background:"#e2e8f0", border:"1.5px solid transparent", borderRadius:8, padding:"10px 12px", fontSize:13, color:"#0f172e", outline:"none" }}
                placeholder="Adresse d'intervention"
              />
            </label>
            <label style={{ display:"flex", flexDirection:"column", gap:6, fontSize:12, color:"#64748b" }}>
              Notes
              <textarea
                value={bookingForm.notes}
                onChange={updateBookingForm("notes")}
                style={{ width:"100%", background:"#e2e8f0", border:"1.5px solid transparent", borderRadius:8, padding:"10px 12px", fontSize:13, color:"#0f172e", outline:"none", minHeight:74, resize:"vertical" }}
                placeholder="Détails utiles"
              />
            </label>

            <button className="pr-save-btn" disabled={actionLoading || slotsLoading} onClick={createReservation} style={{ marginTop:8, maxWidth:260, justifyContent:"center", padding:"11px 14px" }}>
              {actionLoading ? "Envoi..." : "Réserver ce créneau"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const tabs = [
    { id:"overview", label:"Aperçu" },
    ...(role === "worker" ? [{ id:"schedule", label:"Réservation" }] : []),
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
              </div>
            </div>
          </div>
          <div className="pr-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`pr-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <div className="pr-content">
          {tab === "overview" && <TabOverview />}
          {tab === "schedule" && <TabSchedule />}
        </div>

      </div>
    </>
  );
}