import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Zap, Waves, HardHat, AppWindow, Axe, Palette, Snowflake, Lock, Sprout, LayoutGrid, PackageOpen, Cog } from "lucide-react";
import { reservationApi, workerApi } from "../api";
import { PROFESSIONS } from "../constants/data";
import Navbar from "../components/Navbar";

const fmtHour = (hour) => `${String(hour).padStart(2, "0")}:00`;
const fmtDate = (dateValue) => {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return String(dateValue).slice(0, 10);
  return d.toLocaleDateString();
};
const normalizeProfession = (value) =>
  String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const stripAccents = (s) => {
  const lower = String(s || "").toLowerCase();
  const nfd = lower.normalize("NFD");
  return nfd.replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "");
};

const PROFESSION_ICONS = {
  "electricien": Zap,
  "plombier": Waves,
  "macon": HardHat,
  "vitrier": AppWindow,
  "menuisier": Axe,
  "peintre": Palette,
  "climatisation": Snowflake,
  "serrurier": Lock,
  "jardinier": Sprout,
  "carreleur": LayoutGrid,
  "demenagement": PackageOpen,
  "mecanicien": Cog,
};
const getProfessionIcon = (p) => PROFESSION_ICONS[stripAccents(p)] || Cog;

const next30Days = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
};

const pageCss = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
body { background:#f8fafc; color:#0f172e; font-family:'Sora',sans-serif; -webkit-font-smoothing:antialiased; }
input,textarea,select,button { font-family:'Sora',sans-serif; }
.rv-root { min-height:100vh; background:#f8fafc; }
.rv-content { max-width:980px; margin:0 auto; padding:84px 28px 64px; }
@media(max-width:768px){ .rv-content{ padding:80px 16px 48px; } }
`;

export default function ReservationsPage({
  user,
  preselectedWorkerId = "",
  preselectedProfession = "",
  onPrefillApplied,
  onHome,
  onNavigate,
  onLogout,
}) {
  const isClient = user?.role === "client";
  const isWorker = user?.role === "worker";
  const [prefillDone, setPrefillDone] = useState(false);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [slotsLoading, setSlotsLoading]   = useState(false);
  const [error, setError]     = useState("");
  const [message, setMessage] = useState("");
  const [workers, setWorkers]                       = useState([]);
  const [clientReservations, setClientReservations] = useState([]);
  const [clientHistory, setClientHistory]           = useState([]);
  const [workerReservations, setWorkerReservations] = useState([]);
  const [slots, setSlots]                         = useState([]);
  const [monthAvailability, setMonthAvailability] = useState([]);
  const [selectedService, setSelectedService]     = useState("");
  const [datePage, setDatePage]                   = useState(0);
  const [reviewForms, setReviewForms]             = useState({});
  const [reviewLoadingId, setReviewLoadingId]     = useState("");
  const [form, setForm] = useState({ workerId:"", bookingDate:"", bookingHour:"", serviceType:"", address:"", notes:"" });

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      if (isClient) {
        const [workersData, reservationsData, historyData] = await Promise.all([
          workerApi.getAllWorkers(),
          reservationApi.getClientReservations(),
          reservationApi.getClientHistory(),
        ]);
        setWorkers(Array.isArray(workersData) ? workersData : []);
        setClientReservations(Array.isArray(reservationsData) ? reservationsData : []);
        setClientHistory(Array.isArray(historyData) ? historyData : []);
      }
      if (isWorker) {
        const data = await reservationApi.getWorkerReservations();
        setWorkerReservations(Array.isArray(data) ? data : []);
      }
    } catch (err) { setError(err.message || "Failed to load reservations."); }
    finally { setLoading(false); }
  }, [isClient, isWorker]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!isClient || prefillDone) return;
    const consume = () => { setPrefillDone(true); onPrefillApplied?.(); };
    if (!preselectedWorkerId && !preselectedProfession) { consume(); return; }
    const worker = workers.find((w) => String(w?._id) === String(preselectedWorkerId));
    if (worker) {
      const prof = preselectedProfession || worker.workerProfile?.professions?.[0] || "";
      if (prof) setSelectedService(prof);
      setForm((p) => ({ ...p, serviceType: prof || p.serviceType, workerId: String(worker._id), bookingHour: "" }));
      consume(); return;
    }
    if (!loading && preselectedProfession) { setSelectedService(preselectedProfession); setForm((p) => ({ ...p, serviceType: preselectedProfession, bookingHour: "" })); consume(); return; }
    if (!loading && preselectedWorkerId && !preselectedProfession) consume();
  }, [isClient, prefillDone, preselectedWorkerId, preselectedProfession, workers, loading, onPrefillApplied]);

  const datePages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < monthAvailability.length; i += 7) pages.push(monthAvailability.slice(i, i + 7));
    return pages;
  }, [monthAvailability]);

  const visibleDates = datePages[datePage] || [];

  const professions = useMemo(() => {
    const vals = new Set();
    PROFESSIONS.forEach((p) => { const n = String(p || "").trim(); if (n) vals.add(n); });
    workers.forEach((w) => { (w.workerProfile?.professions || []).forEach((p) => { const n = String(p || "").trim(); if (n) vals.add(n); }); });
    return Array.from(vals).sort((a, b) => a.localeCompare(b));
  }, [workers]);

  const filteredWorkers = useMemo(() => {
    if (!selectedService) return [];
    const target = normalizeProfession(selectedService);
    return workers.filter((w) => (w.workerProfile?.professions || []).map((p) => normalizeProfession(p)).includes(target));
  }, [workers, selectedService]);

  useEffect(() => {
    setForm((prev) => {
      const valid = filteredWorkers.some((w) => String(w._id) === String(prev.workerId));
      if (valid) return prev;
      if (filteredWorkers.length > 0) return { ...prev, serviceType: selectedService, workerId: String(filteredWorkers[0]._id), bookingHour: "" };
      return { ...prev, serviceType: selectedService, workerId: "", bookingHour: "" };
    });
    setSlots([]);
  }, [selectedService, filteredWorkers]);

  useEffect(() => { setForm((p) => ({ ...p, bookingHour: "" })); }, [form.workerId]);
  useEffect(() => { setDatePage(0); }, [form.workerId, selectedService]);

  useEffect(() => {
    const fetch = async () => {
      if (!isClient || !form.workerId || !selectedService) { setMonthAvailability([]); setSlots([]); setForm((p) => ({ ...p, bookingDate:"", bookingHour:"" })); return; }
      setSlotsLoading(true);
      try {
        let days = [];
        try {
          const data = await reservationApi.getWorkerMonthAvailability(form.workerId, selectedService);
          const raw = Array.isArray(data?.days) ? data.days : [];
          days = raw.map((day) => {
            if (Array.isArray(day?.slots)) return { date: day.date, slots: day.slots };
            const hours = Array.isArray(day?.availableHours) ? day.availableHours : [];
            return { date: day.date, slots: [8,9,10,11,12,14,15,16,17].map((h) => ({ hour: h, status: hours.includes(h) ? "available" : "accepted" })) };
          });
        } catch {
          const dates = next30Days();
          days = await Promise.all(dates.map(async (date) => {
            try { const d = await reservationApi.getWorkerAvailableSlots(form.workerId, date, selectedService); return { date, slots: Array.isArray(d?.slots) ? d.slots : [] }; }
            catch { return { date, slots: [] }; }
          }));
        }
        setMonthAvailability(days);
        const first = days.find((d) => Array.isArray(d.slots) && d.slots.some((s) => s.status === "available"));
        const nextDate = first?.date || days[0]?.date || "";
        setSlots(days.find((d) => d.date === nextDate)?.slots || []);
        if (nextDate) setDatePage(Math.max(0, Math.floor(days.findIndex((d) => d.date === nextDate) / 7)));
        setForm((p) => ({ ...p, bookingDate: nextDate, bookingHour: "" }));
      } catch (err) { setMonthAvailability([]); setSlots([]); setError(err.message || "Impossible de charger la disponibilité"); }
      finally { setSlotsLoading(false); }
    };
    fetch();
  }, [isClient, form.workerId, selectedService]);

  useEffect(() => {
    if (!form.bookingDate) { setSlots([]); return; }
    const day = monthAvailability.find((d) => d.date === form.bookingDate);
    const daySlots = Array.isArray(day?.slots) ? day.slots : [];
    setSlots(daySlots);
    const valid = daySlots.find((s) => s.status === "available" && String(s.hour) === String(form.bookingHour));
    setForm((p) => (valid ? p : { ...p, bookingHour: "" }));
  }, [form.bookingDate, monthAvailability]);

  const updateForm = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const createReservation = async () => {
    setError(""); setMessage("");
    if (!selectedService || !form.workerId || !form.bookingDate || form.bookingHour === "") return setError("Select service, worker, date and hour first.");
    setActionLoading(true);
    try {
      await reservationApi.create({ workerId: form.workerId, bookingDate: form.bookingDate, bookingHour: Number(form.bookingHour), serviceType: selectedService, address: form.address, notes: form.notes });
      setMessage("Réservation créée avec succès");
      setForm((p) => ({ ...p, bookingHour: "", notes: "" }));
      try {
        const upd = await reservationApi.getWorkerAvailableSlots(form.workerId, form.bookingDate, selectedService);
        const ns = Array.isArray(upd?.slots) ? upd.slots : [];
        setMonthAvailability((p) => p.map((d) => d.date === form.bookingDate ? { ...d, slots: ns } : d));
        setSlots(ns);
      } catch { }
      await loadData();
    } catch (err) { setError(err.message || "Reservation failed."); }
    finally { setActionLoading(false); }
  };

  const cancelReservation = async (r) => {
    setActionLoading(true); setError(""); setMessage("");
    try {
      const accepted = r?.status === "accepted";
      if (!window.confirm(accepted ? "Cette réservation est déjà confirmée. Confirmer l'annulation ?" : "Confirmer l'annulation ?")) { setActionLoading(false); return; }
      await reservationApi.cancelAsClient(r._id, { reason: "Cancelled by client", ...(accepted ? { confirmation: "CLIENT_CONFIRMED" } : {}) });
      setMessage("Reservation cancelled"); await loadData();
    } catch (err) { setError(err.message || "Cancel failed"); }
    finally { setActionLoading(false); }
  };

  const setWorkerStatus = async (id, status) => {
    setActionLoading(true); setError(""); setMessage("");
    try { await reservationApi.setWorkerStatus(id, status); setMessage(`Reservation ${status}`); await loadData(); }
    catch (err) { setError(err.message || "Update failed"); }
    finally { setActionLoading(false); }
  };

  const updateReviewForm = (id, key, value) => setReviewForms((p) => ({ ...p, [id]: { rating: key === "rating" ? value : (p[id]?.rating || ""), comment: key === "comment" ? value : (p[id]?.comment || ""), open: true } }));
  const toggleReviewForm = (id) => setReviewForms((p) => { const c = p[id] || { rating:"", comment:"", open:false }; return { ...p, [id]: { ...c, open: !c.open } }; });

  const submitReview = async (id) => {
    const cur = reviewForms[id] || {};
    const rating = Number(cur.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) { setError("Choisissez une note entre 1 et 5."); return; }
    setReviewLoadingId(id); setError(""); setMessage("");
    try {
      await reservationApi.submitClientReview(id, { rating, comment: String(cur.comment || "").trim() });
      setMessage("Avis envoyé avec succès");
      setReviewForms((p) => ({ ...p, [id]: { rating:"", comment:"", open:false } }));
      await loadData();
    } catch (err) { setError(err.message || "Envoi de l'avis impossible"); }
    finally { setReviewLoadingId(""); }
  };

  return (
    <>
      <style>{pageCss}</style>
      <div className="rv-root">

        <Navbar
          user={user}
          activePage="reservations"
          onHome={onHome}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        <div className="rv-content">
          <h1 style={{ fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:700,color:"#0f172e",marginBottom:6 }}>Réservations</h1>
          <p style={{ color:"#64748b",fontSize:13,marginBottom:18 }}>
            {isClient ? "Recherchez un prestataire puis réservez un créneau." : "Gérez les demandes de réservation reçues."}
          </p>

          {loading && <p style={{ color:"#64748b",fontSize:13 }}>Chargement...</p>}
          {error   && <div style={{ marginBottom:10,color:"#c0392b",fontSize:13 }}>{error}</div>}
          {message && <div style={{ marginBottom:10,color:"#0f172e",fontSize:13 }}>{message}</div>}

          {!loading && isClient && (
            <>
              {/* New reservation */}
              <section style={{ background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,padding:18,marginBottom:16 }}>
                <h3 style={{ marginTop:0,marginBottom:12,fontSize:16,color:"#0f172e" }}>Nouvelle réservation</h3>

                {/* 1. Service */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12,color:"#64748b",marginBottom:8 }}>1. Choisissez le service</div>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(120px, 1fr))",gap:10 }}>
                    {professions.map((p) => {
                      const Icon = getProfessionIcon(p);
                      const active = selectedService === p;
                      return (
                        <button key={p} type="button"
                          onClick={() => { setSelectedService(p); setForm((prev) => ({ ...prev, serviceType:p, workerId:"", bookingHour:"" })); }}
                          style={{ padding:"14px 10px",borderRadius:12,border:active?"1.5px solid #06b6d4":"1.5px solid #e2e8f0",background:active?"rgba(6,182,212,0.10)":"#f8fafc",color:active?"#06b6d4":"#0f172e",fontSize:12,fontWeight:600,textAlign:"center",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8,transition:"all .15s",boxShadow:active?"0 0 0 3px rgba(6,182,212,0.12)":"none" }}
                        >
                          <Icon size={22} strokeWidth={1.8} color={active?"#06b6d4":"#64748b"} />
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Worker */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12,color:"#64748b",marginBottom:8 }}>2. Choisissez le prestataire</div>
                  {!selectedService ? <div style={{ fontSize:12,color:"#64748b" }}>Commencez par sélectionner un service.</div>
                  : filteredWorkers.length === 0 ? <div style={{ fontSize:12,color:"#64748b" }}>Aucun prestataire trouvé pour ce service.</div>
                  : (
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:12 }}>
                      {filteredWorkers.map((w) => {
                        const active = String(form.workerId) === String(w._id);
                        return (
                          <button key={w._id} type="button" onClick={() => setForm((p) => ({ ...p, workerId: w._id, bookingHour:"" }))}
                            style={{ borderRadius:12,border:active?"1.5px solid #06b6d4":"1.5px solid #e2e8f0",background:active?"rgba(232,98,10,0.08)":"#fff",padding:14,textAlign:"left",cursor:"pointer",boxShadow:active?"0 0 0 3px rgba(232,98,10,0.12)":"none" }}
                          >
                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:4 }}>
                              <div style={{ fontSize:15,fontWeight:700,color:"#0f172e" }}>{w.firstName} {w.lastName}</div>
                              {active && <span style={{ fontSize:11,color:"#06b6d4",border:"1px solid rgba(6,182,212,0.25)",borderRadius:100,padding:"3px 8px",fontWeight:700 }}>Sélectionné</span>}
                            </div>
                            <div style={{ fontSize:12,color:"#64748b",marginBottom:8 }}>{w.workerProfile?.city || "Ville non précisée"}</div>
                            <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                              {(w.workerProfile?.professions || []).slice(0,3).map((p) => <span key={p} style={{ fontSize:11,padding:"4px 8px",borderRadius:100,background:"#e2e8f0",color:"#0f172e" }}>{p}</span>)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ display:"grid",gridTemplateColumns:"1fr",gap:12 }}>
                  {/* 3. Date */}
                  <div style={{ display:"flex",flexDirection:"column",gap:6,fontSize:12,color:"#64748b" }}>
                    3. Choisissez la date (30 prochains jours)
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
                      <button type="button" className="mode-tab" onClick={() => setDatePage((p) => Math.max(0,p-1))} disabled={datePage===0} style={{ marginRight:8, display:"flex", alignItems:"center", gap:4 }}><ChevronLeft size={13}/>Semaine précédente</button>
                      <span style={{ fontSize:12,color:"#64748b",fontWeight:600 }}>Semaine {datePage+1}/{Math.max(1,datePages.length)}</span>
                      <button type="button" className="mode-tab" onClick={() => setDatePage((p) => Math.min(Math.max(0,datePages.length-1),p+1))} disabled={datePage>=datePages.length-1} style={{ marginLeft:8, display:"flex", alignItems:"center", gap:4 }}>Semaine suivante<ChevronRight size={13}/></button>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(4, minmax(0,1fr))",gap:8 }}>
                      {visibleDates.map((day) => {
                        const daySlots = Array.isArray(day.slots) ? day.slots : [];
                        const free = daySlots.filter((s) => s.status === "available").length;
                        const active = form.bookingDate === day.date;
                        return (
                          <button key={day.date} type="button" onClick={() => setForm((p) => ({ ...p, bookingDate:day.date, bookingHour:"" }))} disabled={slotsLoading||free===0}
                            style={{ padding:"9px 8px",borderRadius:8,border:active?"1.5px solid #06b6d4":"1.5px solid #e2e8f0",background:active?"rgba(6,182,212,0.1)":"#fff",color:active?"#06b6d4":"#64748b",opacity:free===0?0.45:1,cursor:(slotsLoading||free===0)?"not-allowed":"pointer",fontFamily:"'Sora',sans-serif",fontSize:12,textAlign:"left" }}
                          >
                            <div style={{ fontWeight:700,fontSize:12 }}>{fmtDate(day.date)}</div>
                            <div style={{ fontSize:11 }}>{free} h libre(s)</div>
                          </button>
                        );
                      })}
                      {!slotsLoading && visibleDates.length === 0 && (
                        <div style={{ gridColumn:"1 / -1",fontSize:12,color:"#64748b",paddingTop:8 }}>
                          {!form.workerId ? "Choisissez un prestataire" : "Aucune disponibilité trouvée ce mois"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Hour */}
                  <div style={{ display:"flex",flexDirection:"column",gap:6,fontSize:12,color:"#64748b" }}>
                    4. Choisissez l'heure libre
                    <div style={{ display:"flex",gap:12,fontSize:11,color:"#64748b",marginBottom:4,flexWrap:"wrap" }}>
                      {[["#ecfdf5","#10b981","Libre"],["#fffbeb","#f59e0b","En attente"],["#fee2e2","#ef4444","Réservé"],["#f1f5f9","#94a3b8","Passé"]].map(([bg,border,label]) => (
                        <div key={label} style={{ display:"flex",gap:6,alignItems:"center" }}><div style={{ width:16,height:16,borderRadius:4,background:bg,border:`1px solid ${border}` }} /><span>{label}</span></div>
                      ))}
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(6, minmax(0,1fr))",gap:8 }}>
                      {slots.map((slot) => {
                        const active = String(form.bookingHour) === String(slot.hour);
                        const avail  = slot.status === "available";
                        const pend   = slot.status === "pending";
                        const taken  = slot.status === "accepted" || slot.status === "completed";
                        const past   = slot.status === "passed";
                        let bg="#fff",bc="#e2e8f0",tc="#0f172e",op=1,cur="pointer";
                        if      (avail&&active)  { bg="#10b981"; bc="#10b981"; tc="#fff"; }
                        else if (avail&&!active) { bg="#ecfdf5"; bc="#10b981"; tc="#059669"; }
                        else if (pend&&active)   { bg="#f59e0b"; bc="#f59e0b"; tc="#fff"; }
                        else if (pend&&!active)  { bg="#fffbeb"; bc="#f59e0b"; tc="#b45309"; }
                        else if (taken)          { bg="#fee2e2"; bc="#ef4444"; tc="#991b1b"; cur="not-allowed"; op=0.7; }
                        else if (past)           { bg="#f1f5f9"; bc="#94a3b8"; tc="#64748b"; cur="not-allowed"; op=0.75; }
                        return (
                          <button key={slot.hour} type="button" onClick={() => avail && setForm((p) => ({ ...p, bookingHour: String(slot.hour) }))} disabled={!avail||!form.bookingDate||slotsLoading}
                            style={{ padding:"10px 8px",borderRadius:8,border:`1.5px solid ${bc}`,background:bg,color:tc,cursor:(!form.bookingDate||slotsLoading)?"not-allowed":cur,opacity:(!form.bookingDate||slotsLoading)?0.6:op,fontFamily:"'Sora',sans-serif",fontWeight:600,fontSize:13,transition:"all .2s" }}
                          >{fmtHour(slot.hour)}</button>
                        );
                      })}
                    </div>
                    {slots.length === 0 && <div style={{ color:"#94a3b8",fontSize:12 }}>{!form.workerId ? "Choisissez un prestataire" : "Aucune disponibilité trouvée ce mois"}</div>}
                  </div>

                  <label style={{ display:"flex",flexDirection:"column",gap:6,fontSize:12,color:"#64748b",gridColumn:"span 2" }}>
                    Adresse<input value={form.address} onChange={updateForm("address")} style={inputStyle} placeholder="Adresse d'intervention" />
                  </label>
                  <label style={{ display:"flex",flexDirection:"column",gap:6,fontSize:12,color:"#64748b",gridColumn:"span 2" }}>
                    Notes<textarea value={form.notes} onChange={updateForm("notes")} style={{ ...inputStyle,minHeight:74,resize:"vertical" }} placeholder="Détails utiles" />
                  </label>
                </div>

                <button className="submit-btn" disabled={actionLoading} onClick={createReservation} style={{ marginTop:12,maxWidth:260 }}>
                  {actionLoading ? "Envoi..." : "Réserver ce créneau"}
                </button>
              </section>

              {/* Active reservations */}
              <section style={{ background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,padding:18,marginBottom:16 }}>
                <h3 style={{ marginTop:0,marginBottom:12,fontSize:16,color:"#0f172e" }}>Mes réservations</h3>
                {clientReservations.length === 0
                  ? <p style={{ margin:0,color:"#64748b",fontSize:13 }}>Aucune réservation active.</p>
                  : <div style={{ display:"grid",gap:10 }}>
                      {clientReservations.map((r) => (
                        <ReservationRow key={r._id} reservation={r}
                          rightAction={["pending","accepted"].includes(r.status)
                            ? <button className="mode-tab" onClick={() => cancelReservation(r)} disabled={actionLoading}>Annuler</button>
                            : null}
                        />
                      ))}
                    </div>
                }
              </section>

              {/* History */}
              <section style={{ background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,padding:18 }}>
                <h3 style={{ marginTop:0,marginBottom:12,fontSize:16,color:"#0f172e" }}>Historique</h3>
                {clientHistory.length === 0
                  ? <p style={{ margin:0,color:"#64748b",fontSize:13 }}>Aucun historique.</p>
                  : <div style={{ display:"grid",gap:10 }}>
                      {clientHistory.map((r) => {
                        const hasReview   = !!r?.clientReview?.rating;
                        const isCompleted = r?.status === "completed";
                        const fs          = reviewForms[r._id] || { rating:"",comment:"",open:false };
                        return (
                          <ReservationRow key={r._id} reservation={r}
                            rightAction={isCompleted
                              ? hasReview
                                ? <span style={{ fontSize:11,color:"#2e7d32",fontWeight:700 }}>Avis envoyé</span>
                                : <button className="mode-tab" onClick={() => toggleReviewForm(r._id)} disabled={reviewLoadingId===r._id}>{fs.open?"Fermer":"Laisser un avis"}</button>
                              : null}
                          >
                            {isCompleted && hasReview && (
                              <div style={{ marginTop:8,fontSize:12,color:"#64748b" }}>
                                Note: {"★".repeat(Number(r.clientReview.rating))}{"☆".repeat(Math.max(0,5-Number(r.clientReview.rating)))}
                                {r.clientReview.comment ? ` · ${r.clientReview.comment}` : ""}
                              </div>
                            )}
                            {isCompleted && !hasReview && fs.open && (
                              <div style={{ marginTop:10,borderTop:"1px solid #e2e8f0",paddingTop:10,display:"grid",gap:8 }}>
                                <div style={{ display:"flex",gap:8,alignItems:"center",fontSize:12,color:"#64748b" }}>
                                  Note
                                  <select value={fs.rating} onChange={(e) => updateReviewForm(r._id,"rating",e.target.value)} style={{ ...inputStyle,width:96,padding:"8px 10px",fontSize:12 }}>
                                    <option value="">--</option>
                                    {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
                                  </select>
                                </div>
                                <textarea value={fs.comment} onChange={(e) => updateReviewForm(r._id,"comment",e.target.value)} placeholder="Votre retour (optionnel)" style={{ ...inputStyle,minHeight:64,resize:"vertical",fontSize:12 }} />
                                <button className="submit-btn" onClick={() => submitReview(r._id)} disabled={reviewLoadingId===r._id} style={{ maxWidth:220 }}>
                                  {reviewLoadingId===r._id ? "Envoi..." : "Envoyer l'avis"}
                                </button>
                              </div>
                            )}
                          </ReservationRow>
                        );
                      })}
                    </div>
                }
              </section>
            </>
          )}

          {!loading && isWorker && (
            <section style={{ background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,padding:18 }}>
              <h3 style={{ marginTop:0,marginBottom:12,fontSize:16,color:"#0f172e" }}>Demandes reçues</h3>
              {workerReservations.length === 0
                ? <p style={{ margin:0,color:"#64748b",fontSize:13 }}>Aucune demande pour le moment.</p>
                : <div style={{ display:"grid",gap:10 }}>
                    {workerReservations.map((r) => (
                      <ReservationRow key={r._id} reservation={r}
                        rightAction={r.status==="pending"
                          ? <div style={{ display:"flex",gap:8 }}>
                              <button className="mode-tab" onClick={() => setWorkerStatus(r._id,"accepted")} disabled={actionLoading}>Accepter</button>
                              <button className="mode-tab" onClick={() => setWorkerStatus(r._id,"rejected")} disabled={actionLoading}>Refuser</button>
                            </div>
                          : r.status==="accepted"
                            ? <button className="mode-tab" onClick={() => setWorkerStatus(r._id,"completed")} disabled={actionLoading}>Terminer</button>
                            : null}
                      />
                    ))}
                  </div>
              }
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function ReservationRow({ reservation, rightAction, children }) {
  const worker = reservation.worker;
  const client = reservation.client;
  const isObj  = (v) => v && typeof v === "object" && !Array.isArray(v);
  const person = isObj(worker) ? worker : isObj(client) ? client : {};
  return (
    <div style={{ border:"1px solid #e2e8f0",borderRadius:10,padding:12,display:"flex",justifyContent:"space-between",gap:10,alignItems:"center" }}>
      <div>
        <div style={{ fontSize:14,color:"#0f172e",fontWeight:600 }}>{person.firstName||"Utilisateur"} {person.lastName||""}</div>
        <div style={{ fontSize:12,color:"#64748b" }}>{fmtDate(reservation.bookingDate)} à {fmtHour(reservation.bookingHour)} · {reservation.serviceType||"Service"}</div>
        {reservation.address && <div style={{ fontSize:12,color:"#64748b" }}>{reservation.address}</div>}
        <div style={{ fontSize:11,marginTop:3,color:"#64748b",textTransform:"uppercase",letterSpacing:".08em" }}>Statut: {reservation.status}</div>
        {children}
      </div>
      {rightAction}
    </div>
  );
}

const inputStyle = {
  width:"100%", background:"#e2e8f0", border:"1.5px solid transparent",
  borderRadius:8, padding:"10px 12px", fontFamily:"'Sora',sans-serif",
  fontSize:13, color:"#0f172e", outline:"none",
};
