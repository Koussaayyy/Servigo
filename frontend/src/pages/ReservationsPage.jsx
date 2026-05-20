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

const pageCss = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
body { background:#f8fafc; color:#0f172e; font-family:'Sora',sans-serif; -webkit-font-smoothing:antialiased; }
input,textarea,select,button { font-family:'Sora',sans-serif; }
.rv-root { min-height:100vh; background:#f8fafc; }
.rv-content { max-width:980px; margin:0 auto; padding:84px 28px 64px; }
@media(max-width:768px){ .rv-content{ padding:80px 16px 48px; } }
`;

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
  const [selectedWorkerReservation, setSelectedWorkerReservation] = useState(null);
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
                        rightAction={
                          <button
                            className="mode-tab"
                            onClick={() => setSelectedWorkerReservation(r)}
                            disabled={actionLoading}
                          >
                            Voir détails
                          </button>
                        }
                      />
                    ))}
                  </div>
              }
            </section>
          )}

          {isWorker && selectedWorkerReservation && (
            <WorkerReservationDetailsModal
              reservation={selectedWorkerReservation}
              actionLoading={actionLoading}
              onClose={() => setSelectedWorkerReservation(null)}
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

const mediaUrl = (path) => {
  if (!path) return "";
  if (String(path).startsWith("http")) return path;
  return `http://localhost:5000${path}`;
};

function WorkerReservationDetailsModal({ reservation, actionLoading, onClose, onAccept, onReject, onComplete }) {
  const isPending = reservation?.status === "pending";
  const isAccepted = reservation?.status === "accepted";
  const media = Array.isArray(reservation?.mediaAttachments) ? reservation.mediaAttachments : [];

  return (
    <div
      style={{ position:"fixed",inset:0,background:"rgba(15,23,46,.7)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width:"100%",maxWidth:760,maxHeight:"90vh",overflowY:"auto",background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:18 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <h3 style={{ margin:0,fontSize:18,color:"#0f172e" }}>Détails de la réservation</h3>
          <button className="mode-tab" onClick={onClose}>Fermer</button>
        </div>

        <div style={{ display:"grid",gap:6,fontSize:13,color:"#334155",marginBottom:14 }}>
          <div><strong>Client:</strong> {reservation?.client?.firstName || ""} {reservation?.client?.lastName || ""}</div>
          <div><strong>Date:</strong> {fmtDate(reservation?.bookingDate)} à {fmtHour(reservation?.bookingHour)}</div>
          <div><strong>Service:</strong> {reservation?.serviceType || "Service"}</div>
          <div><strong>Adresse:</strong> {reservation?.address || "-"}</div>
          {reservation?.client?.phone && <div><strong>Téléphone:</strong> {reservation.client.phone}</div>}
          <div><strong>Statut:</strong> {reservation?.status}</div>
        </div>

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12,fontWeight:700,color:"#64748b",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6 }}>Notes du client</div>
          <div style={{ background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:10,fontSize:13,color:"#334155",minHeight:48 }}>
            {reservation?.notes?.trim() ? reservation.notes : "Aucune note fournie."}
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12,fontWeight:700,color:"#64748b",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6 }}>Photos / Vidéos</div>
          {media.length === 0 ? (
            <div style={{ fontSize:12,color:"#94a3b8" }}>Aucun média joint.</div>
          ) : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8 }}>
              {media.map((item, idx) => {
                const url = mediaUrl(item?.url);
                const isVideo = String(item?.mimeType || "").startsWith("video/");
                return (
                  <a
                    key={`${url}-${idx}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ border:"1px solid #e2e8f0",borderRadius:8,padding:6,textDecoration:"none",color:"#0f172e",background:"#f8fafc" }}
                  >
                    {isVideo ? (
                      <video src={url} controls style={{ width:"100%",height:96,objectFit:"cover",borderRadius:6,background:"#000" }} />
                    ) : (
                      <img src={url} alt={item?.originalName || `media-${idx + 1}`} style={{ width:"100%",height:96,objectFit:"cover",borderRadius:6 }} />
                    )}
                    <div style={{ fontSize:10,color:"#64748b",marginTop:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                      {item?.originalName || (isVideo ? `Vidéo ${idx + 1}` : `Photo ${idx + 1}`)}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
          {isPending && (
            <>
              <button className="mode-tab" onClick={onAccept} disabled={actionLoading}>Accepter</button>
              <button className="mode-tab" onClick={onReject} disabled={actionLoading}>Refuser</button>
            </>
          )}
          {isAccepted && (
            <button className="mode-tab" onClick={onComplete} disabled={actionLoading}>Marquer terminé</button>
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
