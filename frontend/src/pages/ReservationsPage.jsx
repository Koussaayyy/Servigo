import { useCallback, useEffect, useState } from "react";
import { reservationApi } from "../api";
import Navbar from "../components/Navbar";

const fmtHour = (hour) => `${String(hour).padStart(2, "0")}:00`;
const fmtDate = (dateValue) => {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return String(dateValue).slice(0, 10);
  return d.toLocaleDateString();
};

const STATUS_LABELS = {
  pending:   { label: "En attente",  bg: "#fffbeb", color: "#b45309", border: "#fcd34d" },
  accepted:  { label: "Acceptée",    bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  rejected:  { label: "Refusée",     bg: "#fef2f2", color: "#b91c1c", border: "#fca5a5" },
  cancelled: { label: "Annulée",     bg: "#f8fafc", color: "#64748b", border: "#cbd5e1" },
  completed: { label: "Terminée",    bg: "#f0f9ff", color: "#0369a1", border: "#7dd3fc" },
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

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };
  return (
    <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,background:s.bg,color:s.color,border:`1px solid ${s.border}`,display:"inline-block" }}>
      {s.label}
    </span>
  );
}

export default function ReservationsPage({ user, onHome, onNavigate, onLogout }) {
  const isClient = user?.role === "client";
  const isWorker = user?.role === "worker";

  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]     = useState("");
  const [message, setMessage] = useState("");
  const [clientReservations, setClientReservations] = useState([]);
  const [clientHistory, setClientHistory]           = useState([]);
  const [workerReservations, setWorkerReservations] = useState([]);
  const [reviewForms, setReviewForms]     = useState({});
  const [reviewLoadingId, setReviewLoadingId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      if (isClient) {
        const [reservationsData, historyData] = await Promise.all([
          reservationApi.getClientReservations(),
          reservationApi.getClientHistory(),
        ]);
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
        <Navbar user={user} activePage="reservations" onHome={onHome} onNavigate={onNavigate} onLogout={onLogout} />

        <div className="rv-content">
          <h1 style={{ fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:700,color:"#0f172e",marginBottom:6 }}>Réservations</h1>
          <p style={{ color:"#64748b",fontSize:13,marginBottom:18 }}>
            {isClient ? "Vos réservations en cours et votre historique." : "Gérez les demandes de réservation reçues."}
          </p>

          {loading && <p style={{ color:"#64748b",fontSize:13 }}>Chargement...</p>}
          {error   && <div style={{ marginBottom:10,color:"#c0392b",fontSize:13 }}>{error}</div>}
          {message && <div style={{ marginBottom:10,color:"#0f172e",fontSize:13 }}>{message}</div>}

          {!loading && isClient && (
            <>
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
    <div style={{ border:"1px solid #e2e8f0",borderRadius:10,padding:12,display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
      <div style={{ flex:1,minWidth:250 }}>
        <div style={{ fontSize:14,color:"#0f172e",fontWeight:600 }}>{person.firstName||"Utilisateur"} {person.lastName||""}</div>
        <div style={{ fontSize:12,color:"#64748b",marginTop:4 }}>{fmtDate(reservation.bookingDate)} à {fmtHour(reservation.bookingHour)} · {reservation.serviceType||"Service"}</div>
        {reservation.address && <div style={{ fontSize:12,color:"#64748b",marginTop:3 }}>{reservation.address}</div>}
        <div style={{ marginTop:8,display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:11,color:"#64748b" }}>Statut:</span>
          <StatusBadge status={reservation.status} />
        </div>
        {children}
      </div>
      <div style={{ display:"flex",gap:8,alignItems:"flex-start" }}>
        {rightAction}
      </div>
    </div>
  );
}

const inputStyle = {
  width:"100%", background:"#e2e8f0", border:"1.5px solid transparent",
  borderRadius:8, padding:"10px 12px", fontFamily:"'Sora',sans-serif",
  fontSize:13, color:"#0f172e", outline:"none",
};
