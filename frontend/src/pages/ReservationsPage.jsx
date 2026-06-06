import { useCallback, useEffect, useState } from "react";
import { reservationApi, clientApi, avatarUrl } from "../api";
import { Bookmark, BookmarkCheck, Star, AlertTriangle, CheckCircle, Calendar, MapPin, Phone, Wrench, Clock, Eye, Check, X, ChevronRight } from "lucide-react";
import Navbar from "../components/Navbar";

const fmtHour = (hour) => `${String(hour).padStart(2, "0")}:00`;
const fmtDate = (dateValue) => {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return String(dateValue).slice(0, 10);
  return d.toLocaleDateString();
};

// Format service code: client sees first 2 digits, worker sees last 2 digits
const getClientCodeDisplay = (code) => code ? `${code.slice(0, 2)}**` : "-";
const getWorkerCodeDisplay = (code) => code ? `**${code.slice(2, 4)}` : "-";

const pageCss = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
body { background:#f8fafc; color:#0f172e; font-family:'Sora',sans-serif; -webkit-font-smoothing:antialiased; }
input,textarea,select,button { font-family:'Sora',sans-serif; }
.rv-root { min-height:100vh; background:#f8fafc; }
.rv-content { max-width:900px; margin:0 auto; padding:84px 28px 64px; }
@media(max-width:768px){ .rv-content{ padding:80px 16px 48px; } }

.rv-tabs { display:flex; gap:6px; margin-bottom:22px; border-bottom:1.5px solid #e2e8f0; padding-bottom:0; }
.rv-tab {
  position:relative; padding:10px 18px 11px; border:none; background:none; cursor:pointer;
  font-family:'Sora',sans-serif; font-size:13px; font-weight:600; color:#64748b;
  border-bottom:2.5px solid transparent; margin-bottom:-1.5px; transition:color .18s;
  display:flex; align-items:center; gap:7px; white-space:nowrap;
}
.rv-tab:hover { color:#0f172e; }
.rv-tab.active { color:#06b6d4; border-bottom-color:#06b6d4; }
.rv-tab-badge {
  display:inline-flex; align-items:center; justify-content:center;
  min-width:18px; height:18px; border-radius:999px; padding:0 5px;
  font-size:10px; font-weight:800;
  background:#e2e8f0; color:#64748b;
}
.rv-tab.active .rv-tab-badge { background:rgba(6,182,212,0.15); color:#06b6d4; }
.rv-tab-badge.urgent { background:#fef3c7; color:#b45309; }
@media(max-width:600px){ .rv-tab{ padding:9px 12px 10px; font-size:12px; } }

@keyframes rvFadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}

.rv-card {
  background:#fff; border:1.5px solid #e2e8f0; border-radius:14px;
  padding:18px 20px; transition:box-shadow .2s, border-color .2s;
  position:relative; overflow:hidden;
}
.rv-card:hover { border-color:rgba(6,182,212,0.3); box-shadow:0 6px 24px rgba(6,182,212,0.08); }
.rv-card::before { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; border-radius:4px 0 0 4px; }
.rv-card.pending::before   { background:#f59e0b; }
.rv-card.accepted::before  { background:#10b981; }
.rv-card.rejected::before  { background:#ef4444; }
.rv-card.cancelled::before { background:#94a3b8; }
.rv-card.completed::before { background:#06b6d4; }

.rv-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; }
.rv-badge.pending   { background:#fffbeb; color:#b45309; border:1.5px solid #fde68a; }
.rv-badge.accepted  { background:#f0fdf4; color:#15803d; border:1.5px solid #bbf7d0; }
.rv-badge.rejected  { background:#fef2f2; color:#b91c1c; border:1.5px solid #fecaca; }
.rv-badge.cancelled { background:#f8fafc; color:#64748b; border:1.5px solid #e2e8f0; }
.rv-badge.completed { background:#f0f9ff; color:#0369a1; border:1.5px solid #bae6fd; }

.rv-timer { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; background:#fff7ed; color:#c2410c; border:1.5px solid #fed7aa; }

.rv-btn-details { display:flex; align-items:center; gap:6px; padding:9px 18px; border-radius:9px; border:1.5px solid #e2e8f0; background:#f8fafc; color:#0f172e; font-size:12px; font-weight:700; cursor:pointer; transition:all .18s; white-space:nowrap; }
.rv-btn-details:hover { border-color:#06b6d4; color:#06b6d4; background:rgba(6,182,212,0.05); }

.rv-modal-overlay { position:fixed; inset:0; background:rgba(15,23,46,.72); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(4px); }
.rv-modal { width:100%; max-width:580px; max-height:92vh; background:#fff; border-radius:20px; box-shadow:0 32px 80px rgba(0,0,0,.24); display:flex; flex-direction:column; overflow:hidden; animation:rvFadeIn .2s ease both; }
.rv-modal-header { background:linear-gradient(135deg,#0f172e,#1e293b); padding:20px 22px; display:flex; align-items:center; gap:14px; flex-shrink:0; position:relative; }
.rv-modal-body { flex:1; overflow-y:auto; padding:20px 22px; display:flex; flex-direction:column; gap:16px; }
.rv-modal-footer { padding:16px 22px; border-top:1.5px solid #f1f5f9; display:flex; gap:10px; justify-content:flex-end; flex-shrink:0; }
.rv-info-row { display:flex; align-items:flex-start; gap:10px; font-size:13px; color:#334155; }
.rv-info-icon { width:28px; height:28px; border-radius:8px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
.rv-section-title { font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:10px; }
.rv-notes-box { background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:10px; padding:12px 14px; font-size:13px; color:#334155; line-height:1.6; }
.rv-action-btn { padding:11px 24px; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .18s; display:flex; align-items:center; gap:7px; }
.rv-action-btn.accept  { background:#10b981; color:#fff; }
.rv-action-btn.accept:hover  { background:#059669; }
.rv-action-btn.reject  { background:#fef2f2; color:#ef4444; border:1.5px solid #fecaca; }
.rv-action-btn.reject:hover  { background:#fee2e2; }
.rv-action-btn.complete { background:#06b6d4; color:#fff; }
.rv-action-btn.complete:hover { background:#0891b2; }
.rv-action-btn:disabled { opacity:.5; cursor:not-allowed; }
`;

export default function ReservationsPage({ user, onHome, onNavigate, onLogout }) {
  const isClient = user?.role === "client";
  const isWorker = user?.role === "worker";

  const [tab, setTab] = useState(isWorker ? "recues" : "encours");
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]     = useState("");
  const [message, setMessage] = useState("");
  const [clientReservations, setClientReservations] = useState([]);
  const [clientHistory, setClientHistory]           = useState([]);
  const [workerReservations, setWorkerReservations] = useState([]);
  const [selectedWorkerReservation, setSelectedWorkerReservation] = useState(null);
  const [reviewDialog, setReviewDialog]   = useState(null); // { reservationId, workerName }
  const [signalDialog, setSignalDialog]   = useState(null); // { reservationId, workerName }
  const [dialogDone, setDialogDone]       = useState(null); // { type: "review"|"signal", message }
  const [reviewRating, setReviewRating]   = useState(0);
  const [reviewHover, setReviewHover]     = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [signalReason, setSignalReason]   = useState("mauvais_travail");
  const [signalMessage, setSignalMessage] = useState("");
  const [dialogLoading, setDialogLoading] = useState(false);
  const [savedIds, setSavedIds]           = useState(new Set());
  const [serviceCodeInput, setServiceCodeInput] = useState("");
  const [serviceCodeError, setServiceCodeError] = useState("");

  useEffect(() => {
    clientApi.getSavedWorkers().then((list) => {
      setSavedIds(new Set((list || []).map((w) => String(w._id || w))));
    }).catch(() => {});
  }, []);

  const handleToggleSave = async (workerId, currently) => {
    const id = String(workerId);
    setSavedIds((prev) => { const n = new Set(prev); currently ? n.delete(id) : n.add(id); return n; });
    try {
      currently ? await clientApi.unsaveWorker(id) : await clientApi.saveWorker(id);
    } catch {
      setSavedIds((prev) => { const n = new Set(prev); currently ? n.add(id) : n.delete(id); return n; });
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [reservationsData, historyData] = await Promise.all([
        reservationApi.getClientReservations(),
        reservationApi.getClientHistory(),
      ]);
      const sortedReservations = Array.isArray(reservationsData)
        ? [...reservationsData].sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
        : [];
      setClientReservations(sortedReservations);
      const sortedHistory = Array.isArray(historyData)
        ? [...historyData].sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
        : [];
      setClientHistory(sortedHistory);
      if (isWorker) {
        const workerData = await reservationApi.getWorkerReservations();
        const sortedWorkerReservations = Array.isArray(workerData)
          ? [...workerData].sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
          : [];
        setWorkerReservations(sortedWorkerReservations);
      }
    } catch (err) { setError(err.message || "Failed to load reservations."); }
    finally { setLoading(false); }
  }, [isWorker]);

  useEffect(() => { loadData(); }, [loadData]);

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

  const openReviewDialog = (r) => {
    setReviewRating(0); setReviewComment(""); setReviewHover(0);
    setReviewDialog({ reservationId: r._id, workerName: `${r.worker?.firstName||""} ${r.worker?.lastName||""}`.trim() });
  };

  const openSignalDialog = (r) => {
    setSignalReason("mauvais_travail"); setSignalMessage("");
    setSignalDialog({ reservationId: r._id, workerName: `${r.worker?.firstName||""} ${r.worker?.lastName||""}`.trim() });
  };

  const submitReview = async () => {
    if (!reviewRating || !reviewDialog) return;
    setDialogLoading(true);
    try {
      await reservationApi.submitClientReview(reviewDialog.reservationId, { rating: reviewRating, comment: "" });
      setReviewDialog(null);
      setDialogDone({ type:"review", message:"Votre avis a bien été envoyé !" });
      await loadData();
    } catch (err) { setError(err.message || "Erreur"); }
    finally { setDialogLoading(false); }
  };

  const submitSignal = async () => {
    if (!signalDialog) return;
    setDialogLoading(true);
    try {
      await reservationApi.submitClientSignal(signalDialog.reservationId, { reason: signalReason, message: signalMessage.trim() });
      setSignalDialog(null);
      setDialogDone({ type:"signal", message:"Signalement envoyé à l'administration." });
      await loadData();
    } catch (err) { setError(err.message || "Erreur"); }
    finally { setDialogLoading(false); }
  };

  const startService = async (reservationId) => {
    const workerDigits = selectedWorkerReservation?.serviceCode?.slice(2, 4) || "";
    const fullCode = serviceCodeInput + workerDigits;
    if (serviceCodeInput.length !== 2) {
      setServiceCodeError("Entrez les 2 chiffres du client");
      return;
    }
    setActionLoading(true);
    setServiceCodeError("");
    try {
      await reservationApi.startService(reservationId, fullCode);
      setServiceCodeInput("");
      setMessage("Service démarré avec succès!");
      await loadData();
      setSelectedWorkerReservation(null);
    } catch (err) {
      setServiceCodeError(err.message || "Code invalide");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <style>{pageCss}</style>
      <div className="rv-root">
        <Navbar user={user} activePage="reservations" onHome={onHome} onNavigate={onNavigate} onLogout={onLogout} />

        <div className="rv-content">
          <h1 style={{ fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:700,color:"#0f172e",marginBottom:6 }}>Réservations</h1>
          <p style={{ color:"#64748b",fontSize:13,marginBottom:20 }}>
            {isWorker ? "Gérez vos demandes reçues et vos réservations effectuées." : "Vos réservations en cours et votre historique."}
          </p>

          {error   && <div style={{ marginBottom:14,color:"#c0392b",fontSize:13,background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:8,padding:"10px 14px" }}>{error}</div>}
          {message && <div style={{ marginBottom:14,color:"#15803d",fontSize:13,background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:8,padding:"10px 14px" }}>{message}</div>}

          {/* ── Tab bar ── */}
          {!loading && (
            <div className="rv-tabs">
              {isWorker ? (
                <>
                  <button className={`rv-tab ${tab === "recues" ? "active" : ""}`} onClick={() => setTab("recues")}>
                    Reçues
                    <span className={`rv-tab-badge ${workerReservations.filter(r => r.status === "pending").length > 0 ? "urgent" : ""}`}>
                      {workerReservations.length}
                    </span>
                  </button>
                  <button className={`rv-tab ${tab === "envoyees" ? "active" : ""}`} onClick={() => setTab("envoyees")}>
                    Envoyées
                    <span className="rv-tab-badge">{clientReservations.length}</span>
                  </button>
                  <button className={`rv-tab ${tab === "historique" ? "active" : ""}`} onClick={() => setTab("historique")}>
                    Historique
                    <span className="rv-tab-badge">{clientHistory.length}</span>
                  </button>
                </>
              ) : (
                <>
                  <button className={`rv-tab ${tab === "encours" ? "active" : ""}`} onClick={() => setTab("encours")}>
                    En cours
                    <span className="rv-tab-badge">{clientReservations.length}</span>
                  </button>
                  <button className={`rv-tab ${tab === "historique" ? "active" : ""}`} onClick={() => setTab("historique")}>
                    Historique
                    <span className="rv-tab-badge">{clientHistory.length}</span>
                  </button>
                </>
              )}
            </div>
          )}

          {loading && <p style={{ color:"#64748b",fontSize:13,padding:"32px 0",textAlign:"center" }}>Chargement...</p>}

          {/* ── Tab: Reçues (worker only) ── */}
          {!loading && tab === "recues" && isWorker && (
            <div style={{ display:"grid",gap:10 }}>
              {workerReservations.length === 0
                ? <EmptyState label="Aucune demande reçue pour le moment." />
                : workerReservations.map((r) => (
                    <ReservationRow key={r._id} reservation={r}
                      rightAction={
                        <button className="rv-btn-details"
                          onClick={() => setSelectedWorkerReservation(r)}
                          disabled={actionLoading}>
                          <Eye size={13}/> Détails
                        </button>
                      }
                    />
                  ))
              }
            </div>
          )}

          {/* ── Tab: Envoyées (worker) / En cours (client) ── */}
          {!loading && (tab === "envoyees" || tab === "encours") && (
            <div style={{ display:"grid",gap:10 }}>
              {clientReservations.length === 0
                ? <EmptyState label="Aucune réservation active." />
                : clientReservations.map((r) => (
                    <ReservationRow key={r._id} reservation={r}
                      isSaved={savedIds.has(String(r.worker?._id || ""))}
                      onToggleSave={handleToggleSave}
                      rightAction={r.status === "pending"
                        ? <button className="rv-btn-details" style={{ color:"#ef4444",borderColor:"#fecaca" }}
                            onClick={() => cancelReservation(r)} disabled={actionLoading}>
                            <X size={13}/> Annuler
                          </button>
                        : null}
                    />
                  ))
              }
            </div>
          )}

          {/* ── Tab: Historique ── */}
          {!loading && tab === "historique" && (
            <div style={{ display:"grid",gap:10 }}>
              {clientHistory.length === 0
                ? <EmptyState label="Aucun historique." />
                : clientHistory.map((r) => {
                    const hasReview   = !!r?.clientReview?.rating;
                    const hasSignal   = !!r?.clientSignal?.reported;
                    const isCompleted = r?.status === "completed";
                    return (
                      <ReservationRow key={r._id} reservation={r}
                        isSaved={savedIds.has(String(r.worker?._id || ""))}
                        onToggleSave={handleToggleSave}
                        rightAction={isCompleted ? (
                          <div style={{ display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end",minWidth:130 }}>
                            {hasReview
                              ? <span style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color:"#10b981",background:"rgba(16,185,129,0.08)",border:"1.5px solid rgba(16,185,129,0.2)",borderRadius:8,padding:"7px 12px",whiteSpace:"nowrap" }}>
                                  <Star size={12} fill="#10b981" color="#10b981"/> Avis envoyé
                                </span>
                              : <button onClick={() => openReviewDialog(r)}
                                  style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color:"#0f172e",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 12px",cursor:"pointer",whiteSpace:"nowrap",transition:"all .18s",fontFamily:"'Sora',sans-serif" }}
                                  onMouseEnter={e=>{e.currentTarget.style.borderColor="#06b6d4";e.currentTarget.style.color="#06b6d4";}}
                                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color="#0f172e";}}>
                                  <Star size={12}/> Laisser un avis
                                </button>
                            }
                            {hasSignal
                              ? <span style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color:"#f59e0b",background:"rgba(245,158,11,0.08)",border:"1.5px solid rgba(245,158,11,0.2)",borderRadius:8,padding:"7px 12px",whiteSpace:"nowrap" }}>
                                  <AlertTriangle size={12}/> Signalé
                                </span>
                              : <button onClick={() => openSignalDialog(r)}
                                  style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color:"#ef4444",background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:8,padding:"7px 12px",cursor:"pointer",whiteSpace:"nowrap",transition:"all .18s",fontFamily:"'Sora',sans-serif" }}
                                  onMouseEnter={e=>{e.currentTarget.style.background="#fee2e2";}}
                                  onMouseLeave={e=>{e.currentTarget.style.background="#fef2f2";}}>
                                  <AlertTriangle size={12}/> Signaler
                                </button>
                            }
                          </div>
                        ) : null}
                      >
                        {isCompleted && hasReview && (
                          <div style={{ marginTop:6,fontSize:12,color:"#64748b" }}>
                            {"★".repeat(Number(r.clientReview.rating))}{"☆".repeat(Math.max(0,5-Number(r.clientReview.rating)))}
                            {r.clientReview.comment ? ` · ${r.clientReview.comment}` : ""}
                          </div>
                        )}
                      </ReservationRow>
                    );
                  })
              }
            </div>
          )}

          {isWorker && selectedWorkerReservation && (
            <WorkerReservationDetailsModal
              reservation={selectedWorkerReservation}
              actionLoading={actionLoading}
              serviceCodeInput={serviceCodeInput}
              setServiceCodeInput={setServiceCodeInput}
              serviceCodeError={serviceCodeError}
              setServiceCodeError={setServiceCodeError}
              startService={startService}
              onClose={() => {
                setSelectedWorkerReservation(null);
                setServiceCodeInput("");
                setServiceCodeError("");
              }}
              onAccept={async () => {
                await setWorkerStatus(selectedWorkerReservation._id, "accepted");
                setSelectedWorkerReservation(null);
              }}
              onReject={async () => {
                await setWorkerStatus(selectedWorkerReservation._id, "rejected");
                setSelectedWorkerReservation(null);
              }}
              onComplete={async () => {
                await setWorkerStatus(selectedWorkerReservation._id, "completed");
                setSelectedWorkerReservation(null);
              }}
            />
          )}
        </div>
      </div>

      {/* ── Review Dialog ──────────────────────────────────── */}
      {reviewDialog && (
        <div style={{ position:"fixed",inset:0,background:"rgba(15,23,46,.65)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
          onClick={() => !dialogLoading && setReviewDialog(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#fff",borderRadius:18,width:"100%",maxWidth:400,padding:28,boxShadow:"0 32px 80px rgba(0,0,0,.22)",fontFamily:"'Sora',sans-serif" }}>
            <div style={{ fontSize:16,fontWeight:800,color:"#0f172e",marginBottom:4 }}>Laisser un avis</div>
            <div style={{ fontSize:12,color:"#64748b",marginBottom:20 }}>Pour {reviewDialog.workerName}</div>
            <div style={{ display:"flex",justifyContent:"center",gap:8,marginBottom:20 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setReviewRating(s)} onMouseEnter={() => setReviewHover(s)} onMouseLeave={() => setReviewHover(0)}
                  style={{ background:"none",border:"none",cursor:"pointer",fontSize:36,color:(reviewHover||reviewRating)>=s?"#f59e0b":"#e2e8f0",transition:"color .15s",lineHeight:1 }}>★</button>
              ))}
            </div>
            {reviewRating > 0 && (
              <div style={{ textAlign:"center",fontSize:13,color:"#64748b",marginBottom:8 }}>
                {["","Mauvais","Moyen","Bien","Très bien","Excellent"][reviewRating]}
              </div>
            )}
            <div style={{ display:"flex",gap:10,marginTop:16 }}>
              <button onClick={() => setReviewDialog(null)} disabled={dialogLoading}
                style={{ flex:1,padding:"11px 0",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Sora',sans-serif" }}>
                Annuler
              </button>
              <button onClick={submitReview} disabled={!reviewRating||dialogLoading}
                style={{ flex:2,padding:"11px 0",borderRadius:10,border:"none",background:reviewRating?"#06b6d4":"#e2e8f0",color:reviewRating?"#fff":"#94a3b8",fontSize:13,fontWeight:700,cursor:reviewRating?"pointer":"not-allowed",fontFamily:"'Sora',sans-serif",transition:"background .18s" }}>
                {dialogLoading ? "Envoi…" : "Envoyer l'avis"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Signal Dialog ──────────────────────────────────── */}
      {signalDialog && (
        <div style={{ position:"fixed",inset:0,background:"rgba(15,23,46,.65)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
          onClick={() => !dialogLoading && setSignalDialog(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#fff",borderRadius:18,width:"100%",maxWidth:400,padding:28,boxShadow:"0 32px 80px rgba(0,0,0,.22)",fontFamily:"'Sora',sans-serif" }}>
            <div style={{ fontSize:16,fontWeight:800,color:"#0f172e",marginBottom:4 }}>Signaler le prestataire</div>
            <div style={{ fontSize:12,color:"#64748b",marginBottom:20 }}>À propos de {signalDialog.workerName}</div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:8 }}>Motif</label>
              {[
                { value:"mauvais_travail", label:"Mauvais travail effectué" },
                { value:"comportement",    label:"Comportement inapproprié" },
                { value:"non_venu",        label:"Prestataire non venu" },
                { value:"autre",           label:"Autre" },
              ].map(opt => (
                <label key={opt.value} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8,cursor:"pointer",fontSize:13,color:"#0f172e" }}>
                  <input type="radio" value={opt.value} checked={signalReason===opt.value} onChange={()=>setSignalReason(opt.value)} style={{ accentColor:"#ef4444" }} />
                  {opt.label}
                </label>
              ))}
            </div>
            <textarea value={signalMessage} onChange={e=>setSignalMessage(e.target.value)}
              placeholder="Détails supplémentaires (optionnel)…" maxLength={500} rows={3}
              style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:9,padding:"10px 12px",fontSize:13,fontFamily:"'Sora',sans-serif",outline:"none",resize:"none",boxSizing:"border-box",color:"#0f172e" }} />
            <div style={{ display:"flex",gap:10,marginTop:16 }}>
              <button onClick={() => setSignalDialog(null)} disabled={dialogLoading}
                style={{ flex:1,padding:"11px 0",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Sora',sans-serif" }}>
                Annuler
              </button>
              <button onClick={submitSignal} disabled={dialogLoading}
                style={{ flex:2,padding:"11px 0",borderRadius:10,border:"none",background:"#ef4444",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"background .18s" }}>
                {dialogLoading ? "Envoi…" : "Envoyer le signalement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Message ────────────────────────────────── */}
      {dialogDone && (
        <div style={{ position:"fixed",inset:0,background:"rgba(15,23,46,.65)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
          onClick={() => setDialogDone(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#fff",borderRadius:18,width:"100%",maxWidth:360,padding:36,boxShadow:"0 32px 80px rgba(0,0,0,.22)",textAlign:"center",fontFamily:"'Sora',sans-serif" }}>
            <div style={{ width:68,height:68,borderRadius:"50%",background:dialogDone.type==="review"?"rgba(16,185,129,.1)":"rgba(245,158,11,.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px" }}>
              <CheckCircle size={36} color={dialogDone.type==="review"?"#10b981":"#f59e0b"} />
            </div>
            <div style={{ fontSize:18,fontWeight:800,color:"#0f172e",marginBottom:8 }}>
              {dialogDone.type==="review" ? "Avis envoyé !" : "Signalement envoyé !"}
            </div>
            <div style={{ fontSize:13,color:"#64748b",lineHeight:1.6,marginBottom:24 }}>{dialogDone.message}</div>
            <button onClick={() => setDialogDone(null)}
              style={{ background:dialogDone.type==="review"?"#10b981":"#f59e0b",color:"#fff",border:"none",borderRadius:10,padding:"12px 32px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Sora',sans-serif" }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function EmptyState({ label }) {
  return (
    <div style={{ textAlign:"center",padding:"48px 24px",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,color:"#94a3b8",fontSize:13 }}>
      {label}
    </div>
  );
}

function ReservationRow({ reservation, rightAction, children, isSaved, onToggleSave }) {
  const worker   = reservation.worker;
  const client   = reservation.client;
  const isObj    = (v) => v && typeof v === "object" && !Array.isArray(v);
  const person   = isObj(worker) ? worker : isObj(client) ? client : {};
  const workerId = isObj(worker) ? String(worker._id || "") : "";
  const isWorkerCard = isObj(worker); // True if this is showing the worker, false if showing client
  const initials = ((person.firstName?.[0]||"") + (person.lastName?.[0]||"")).toUpperCase() || "?";
  const status   = reservation.status || "pending";

  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    if (status !== "pending" || !reservation.autoExpireAt) return;
    const calc = () => {
      const diff = new Date(reservation.autoExpireAt) - Date.now();
      if (diff <= 0) { setCountdown("Expirée"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${h}h ${m}m`);
    };
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [status, reservation.autoExpireAt]);

  return (
    <div className={`rv-card ${status}`}>
      <div style={{ display:"flex",alignItems:"flex-start",gap:14 }}>
        {/* Avatar */}
        {avatarUrl(person.avatar)
          ? <img src={avatarUrl(person.avatar)} alt="" style={{ width:44,height:44,borderRadius:12,objectFit:"cover",flexShrink:0,border:"1.5px solid #e2e8f0" }}/>
          : <div style={{ width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#0f172e,#1e293b)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"#06b6d4",flexShrink:0 }}>
              {initials}
            </div>
        }

        {/* Info */}
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap" }}>
            <span style={{ fontSize:14,fontWeight:700,color:"#0f172e" }}>{person.firstName||"Utilisateur"} {person.lastName||""}</span>
            {onToggleSave && workerId && (
              <button onClick={() => onToggleSave(workerId, isSaved)}
                style={{ background:isSaved?"rgba(6,182,212,0.1)":"transparent",border:`1.5px solid ${isSaved?"rgba(6,182,212,0.35)":"#e2e8f0"}`,borderRadius:6,width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .18s",flexShrink:0 }}>
                {isSaved ? <BookmarkCheck size={10} color="#06b6d4" /> : <Bookmark size={10} color="#94a3b8" />}
              </button>
            )}
          </div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:12,fontSize:12,color:"#64748b",marginBottom:10 }}>
            <span style={{ display:"flex",alignItems:"center",gap:4 }}><Calendar size={11} color="#94a3b8"/>{fmtDate(reservation.bookingDate)} · {fmtHour(reservation.bookingHour)} – {fmtHour(reservation.bookingHour + (reservation.duration || 2))}</span>
            {reservation.serviceType && <span style={{ display:"flex",alignItems:"center",gap:4 }}><Wrench size={11} color="#94a3b8"/>{reservation.serviceType}</span>}
            {reservation.address && <span style={{ display:"flex",alignItems:"center",gap:4 }}><MapPin size={11} color="#94a3b8"/>{reservation.address}</span>}
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
            <span className={`rv-badge ${status}`}>{
              {pending:"En attente",accepted:"Acceptée",rejected:"Refusée",cancelled:"Annulée",completed:"Terminée"}[status]||status
            }</span>
            {status === "pending" && countdown && (
              <span className="rv-timer"><Clock size={10}/>{countdown} avant annulation</span>
            )}
            {reservation.serviceCode && (
              <span style={{ display:"flex",flexDirection:"column",gap:2,fontSize:11,fontWeight:700,color:"#06b6d4",background:"rgba(6,182,212,0.08)",border:"1.5px solid rgba(6,182,212,0.2)",borderRadius:6,padding:"5px 10px" }}>
                <span>Code : {isWorkerCard ? getWorkerCodeDisplay(reservation.serviceCode) : getClientCodeDisplay(reservation.serviceCode)}</span>
                <span style={{ fontSize:10,fontWeight:500,color:"#64748b" }}>
                  {isWorkerCard
                    ? "Demandez les 2 premiers chiffres au client pour compléter le code."
                    : "Communiquez ces 2 chiffres au prestataire le jour du service."}
                </span>
              </span>
            )}
          </div>
          {children}
        </div>

        {/* Right action */}
        {rightAction && <div style={{ flexShrink:0,alignSelf:"center" }}>{rightAction}</div>}
      </div>
    </div>
  );
}

const mediaUrl = (path) => {
  if (!path) return "";
  if (String(path).startsWith("http")) return path;
  return `http://localhost:5000${path}`;
};

function WorkerReservationDetailsModal({ reservation, actionLoading, onClose, onAccept, onReject, onComplete, serviceCodeInput, setServiceCodeInput, serviceCodeError, setServiceCodeError, startService }) {
  const isPending  = reservation?.status === "pending";
  const isAccepted = reservation?.status === "accepted";
  const media      = Array.isArray(reservation?.mediaAttachments) ? reservation.mediaAttachments : [];
  const client     = reservation?.client || {};
  const initials   = ((client.firstName?.[0]||"") + (client.lastName?.[0]||"")).toUpperCase() || "?";
  const statusLabel = { pending:"En attente", accepted:"Acceptée", rejected:"Refusée", cancelled:"Annulée", completed:"Terminée" };

  return (
    <div className="rv-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rv-modal">

        {/* Header */}
        <div className="rv-modal-header">
          {avatarUrl(client.avatar)
            ? <img src={avatarUrl(client.avatar)} alt="" style={{ width:46,height:46,borderRadius:12,objectFit:"cover",flexShrink:0,border:"1.5px solid rgba(255,255,255,0.15)" }}/>
            : <div style={{ width:46,height:46,borderRadius:12,background:"rgba(6,182,212,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#06b6d4",flexShrink:0 }}>
                {initials}
              </div>
          }
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16,fontWeight:700,color:"#fff" }}>{client.firstName||""} {client.lastName||""}</div>
            <div style={{ fontSize:11,color:"#94a3b8",marginTop:2 }}>Demande de réservation</div>
          </div>
          <span className={`rv-badge ${reservation?.status}`} style={{ flexShrink:0 }}>
            {statusLabel[reservation?.status]||reservation?.status}
          </span>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#94a3b8",marginLeft:8,flexShrink:0 }}>
            <X size={14}/>
          </button>
        </div>

        {/* Body */}
        <div className="rv-modal-body">

          {/* Info rows */}
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            <div className="rv-info-row">
              <div className="rv-info-icon"><Calendar size={13} color="#06b6d4"/></div>
              <div><span style={{ fontWeight:600 }}>Date : </span>{fmtDate(reservation?.bookingDate)} · {fmtHour(reservation?.bookingHour)} – {fmtHour((reservation?.bookingHour || 0) + (reservation?.duration || 2))}</div>
            </div>
            {reservation?.serviceType && (
              <div className="rv-info-row">
                <div className="rv-info-icon"><Wrench size={13} color="#8b5cf6"/></div>
                <div><span style={{ fontWeight:600 }}>Service : </span>{reservation.serviceType}</div>
              </div>
            )}
            {reservation?.address && (
              <div className="rv-info-row">
                <div className="rv-info-icon"><MapPin size={13} color="#10b981"/></div>
                <div><span style={{ fontWeight:600 }}>Adresse : </span>{reservation.address}</div>
              </div>
            )}
            {client.phone && (
              <div className="rv-info-row">
                <div className="rv-info-icon"><Phone size={13} color="#f59e0b"/></div>
                <div><span style={{ fontWeight:600 }}>Téléphone : </span>{client.phone}</div>
              </div>
            )}
          </div>

          {/* Service Code - Show only for accepted reservations */}
          {isAccepted && (
            <div>
              <div className="rv-section-title">Code de service</div>
              <div style={{ background:"rgba(6,182,212,0.05)",border:"1.5px solid rgba(6,182,212,0.2)",borderRadius:10,padding:14 }}>
                <div style={{ fontSize:12,color:"#64748b",marginBottom:10,lineHeight:1.6 }}>
                  Demandez les 2 premiers chiffres au client et saisissez-les ci-dessous.
                </div>
                {!reservation?.serviceStartedAt ? (
                  <>
                    <div style={{ display:"flex",gap:6,marginBottom:10,alignItems:"center" }}>
                      <input
                        type="text"
                        maxLength="2"
                        value={serviceCodeInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (val.length <= 2) setServiceCodeInput(val);
                          setServiceCodeError("");
                        }}
                        placeholder="??"
                        style={{ flex:1,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"10px 12px",fontSize:22,fontWeight:700,textAlign:"center",letterSpacing:"4px",fontFamily:"monospace",outline:"none" }}
                      />
                      <span style={{ fontSize:18,fontWeight:700,color:"#cbd5e1" }}>+</span>
                      <div style={{ flex:1,background:"#f0f9ff",border:"1.5px solid rgba(6,182,212,0.3)",borderRadius:8,padding:"10px 12px",fontSize:22,fontWeight:700,textAlign:"center",letterSpacing:"4px",fontFamily:"monospace",color:"#06b6d4" }}>
                        {reservation.serviceCode?.slice(2, 4)}
                      </div>
                    </div>
                    <div style={{ fontSize:11,color:"#94a3b8",textAlign:"center",marginBottom:10 }}>
                      <span style={{ color:"#64748b",fontWeight:600 }}>Chiffres du client</span> + <span style={{ color:"#06b6d4",fontWeight:600 }}>Vos chiffres (pré-remplis)</span>
                    </div>
                    {serviceCodeError && (
                      <div style={{ fontSize:12,color:"#ef4444",marginBottom:10,fontWeight:600 }}>⚠ {serviceCodeError}</div>
                    )}
                    <button
                      onClick={() => startService(reservation._id)}
                      disabled={actionLoading || serviceCodeInput.length !== 2}
                      style={{ width:"100%",background:serviceCodeInput.length === 2 ? "#06b6d4" : "#cbd5e1",color:"#fff",border:"none",borderRadius:8,padding:"11px 16px",fontSize:12,fontWeight:700,cursor:serviceCodeInput.length === 2 ? "pointer" : "not-allowed",transition:"all .2s" }}
                    >
                      ▶ Démarrer le service
                    </button>
                  </>
                ) : (
                  <div style={{ display:"flex",alignItems:"center",gap:10,background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:8,padding:12 }}>
                    <CheckCircle size={16} color="#15803d" />
                    <div>
                      <div style={{ fontSize:12,fontWeight:700,color:"#15803d" }}>Service démarré</div>
                      <div style={{ fontSize:11,color:"#64748b",marginTop:2 }}>À {fmtHour(new Date(reservation.serviceStartedAt).getHours())}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="rv-section-title">Notes du client</div>
            <div className="rv-notes-box">
              {reservation?.notes?.trim() || <span style={{ color:"#94a3b8",fontStyle:"italic" }}>Aucune note fournie.</span>}
            </div>
          </div>

          {/* Media */}
          <div>
            <div className="rv-section-title">Photos / Vidéos</div>
            {media.length === 0 ? (
              <div style={{ fontSize:12,color:"#94a3b8",fontStyle:"italic" }}>Aucun média joint.</div>
            ) : (
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8 }}>
                {media.map((item, idx) => {
                  const url = mediaUrl(item?.url);
                  const isVideo = String(item?.mimeType||"").startsWith("video/");
                  return (
                    <a key={`${url}-${idx}`} href={url} target="_blank" rel="noreferrer"
                      style={{ border:"1.5px solid #e2e8f0",borderRadius:10,overflow:"hidden",textDecoration:"none",background:"#f8fafc",display:"block",transition:"border-color .18s" }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor="#06b6d4"}
                      onMouseLeave={e=>e.currentTarget.style.borderColor="#e2e8f0"}>
                      {isVideo
                        ? <video src={url} style={{ width:"100%",height:90,objectFit:"cover",display:"block",background:"#000" }} />
                        : <img src={url} alt="" style={{ width:"100%",height:90,objectFit:"cover",display:"block" }} />
                      }
                      <div style={{ padding:"5px 8px",fontSize:10,color:"#64748b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                        {item?.originalName||(isVideo?`Vidéo ${idx+1}`:`Photo ${idx+1}`)}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="rv-modal-footer">
          {isPending && (
            <>
              <button className="rv-action-btn reject" onClick={onReject} disabled={actionLoading}>
                <X size={14}/> Refuser
              </button>
              <button className="rv-action-btn accept" onClick={onAccept} disabled={actionLoading}>
                <Check size={14}/> Accepter
              </button>
            </>
          )}
          {isAccepted && (
            <button className="rv-action-btn complete" onClick={onComplete} disabled={actionLoading}>
              <CheckCircle size={14}/> Marquer terminée
            </button>
          )}
          {!isPending && !isAccepted && (
            <button onClick={onClose} style={{ padding:"11px 24px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:13,fontWeight:600,cursor:"pointer" }}>
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width:"100%", background:"#e2e8f0", border:"1.5px solid transparent",
  borderRadius:8, padding:"10px 12px", fontFamily:"'Sora',sans-serif",
  fontSize:13, color:"#0f172e", outline:"none",
};
