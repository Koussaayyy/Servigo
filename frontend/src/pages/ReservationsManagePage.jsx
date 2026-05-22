import { useCallback, useEffect, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Star, MapPin, User } from "lucide-react";
import { reservationApi, avatarUrl } from "../api";
import Navbar from "../components/Navbar";

const fmtHour = (h) => `${String(h).padStart(2, "0")}:00`;
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return String(d).slice(0, 10);
  return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
};

const STATUS_LABELS = {
  pending:   { label: "En attente",  bg: "#fffbeb", color: "#b45309", border: "#fcd34d" },
  accepted:  { label: "Acceptée",    bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  rejected:  { label: "Refusée",     bg: "#fef2f2", color: "#b91c1c", border: "#fca5a5" },
  cancelled: { label: "Annulée",     bg: "#f8fafc", color: "#64748b", border: "#cbd5e1" },
  completed: { label: "Terminée",    bg: "#f0f9ff", color: "#0369a1", border: "#7dd3fc" },
};

const PAGE_SIZE = 6;

const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{background:#f8fafc;color:#0f172e;font-family:'Sora',sans-serif;-webkit-font-smoothing:antialiased}
input,textarea,select,button{font-family:'Sora',sans-serif}
.rm-root{min-height:100vh;background:#f8fafc}
.rm-content{max-width:860px;margin:0 auto;padding:86px 24px 60px}
@media(max-width:640px){.rm-content{padding:80px 14px 48px}}
.rm-tab{padding:9px 18px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid transparent;transition:all .15s;background:transparent;color:#64748b}
.rm-tab.active{background:#0f172e;color:#06b6d4;border-color:#0f172e}
.rm-tab:not(.active):hover{background:#f1f5f9;color:#0f172e}
.rm-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px;transition:all .2s}
.rm-card:hover{border-color:rgba(6,182,212,.3);box-shadow:0 4px 16px rgba(6,182,212,.08)}
.rm-btn{padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid;transition:all .15s;letter-spacing:.04em}
.rm-btn-danger{background:#fef2f2;color:#b91c1c;border-color:#fca5a5}
.rm-btn-danger:hover{background:#fee2e2}
.rm-btn-accept{background:#f0fdf4;color:#15803d;border-color:#86efac}
.rm-btn-accept:hover{background:#dcfce7}
.rm-btn-refuse{background:#fef2f2;color:#b91c1c;border-color:#fca5a5}
.rm-btn-refuse:hover{background:#fee2e2}
.rm-btn-done{background:#f0f9ff;color:#0369a1;border-color:#7dd3fc}
.rm-btn-done:hover{background:#e0f2fe}
.rm-input{width:100%;background:#f1f5f9;border:1.5px solid #e2e8f0;border-radius:8px;padding:9px 12px;font-family:'Sora',sans-serif;font-size:13px;color:#0f172e;outline:none}
.rm-input:focus{border-color:#06b6d4;background:#fff}
`;

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };
  return (
    <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,background:s.bg,color:s.color,border:`1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function Pagination({ page, total, onChange }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:20 }}>
      <button className="rm-btn" onClick={() => onChange(page - 1)} disabled={page === 0} style={{ border:"1.5px solid #e2e8f0",color:"#64748b",background:"#f8fafc",padding:"7px 12px",opacity:page===0?.4:1 }}>
        <ChevronLeft size={13} />
      </button>
      {Array.from({ length: pages }, (_, i) => (
        <button key={i} className="rm-btn" onClick={() => onChange(i)}
          style={{ border:`1.5px solid ${i===page?"#06b6d4":"#e2e8f0"}`,color:i===page?"#06b6d4":"#64748b",background:i===page?"rgba(6,182,212,.08)":"#f8fafc",padding:"7px 14px",minWidth:36 }}>
          {i + 1}
        </button>
      ))}
      <button className="rm-btn" onClick={() => onChange(page + 1)} disabled={page >= pages - 1} style={{ border:"1.5px solid #e2e8f0",color:"#64748b",background:"#f8fafc",padding:"7px 12px",opacity:page>=pages-1?.4:1 }}>
        <ChevronRight size={13} />
      </button>
    </div>
  );
}

function ReservCard({ r, role, onCancel, onStatus, onReview, actionLoading }) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [rvLoading, setRvLoading] = useState(false);

  const other = role === "sent" ? r.worker : r.client;
  const isObj = (v) => v && typeof v === "object";
  const person = isObj(other) ? other : {};
  const av = avatarUrl(person.avatar);

  const isActive    = ["pending","accepted"].includes(r.status);
  const isCompleted = r.status === "completed";
  const hasReview   = !!r.clientReview?.rating;

  const submitRv = async () => {
    const n = Number(rating);
    if (!n || n < 1 || n > 5) return;
    setRvLoading(true);
    try { await onReview(r._id, n, comment); setReviewOpen(false); }
    finally { setRvLoading(false); }
  };

  return (
    <div className="rm-card">
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap" }}>
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          {av
            ? <img src={av} alt="" style={{ width:40,height:40,borderRadius:9,objectFit:"cover",border:"2px solid #e2e8f0" }} />
            : <div style={{ width:40,height:40,borderRadius:9,background:"#0f172e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#06b6d4" }}>{(person.firstName?.[0]||<User size={14}/>)}</div>
          }
          <div>
            <div style={{ fontSize:14,fontWeight:700,color:"#0f172e" }}>{person.firstName||"—"} {person.lastName||""}</div>
            <div style={{ fontSize:11,color:"#64748b",marginTop:2,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
              <span style={{ display:"flex",alignItems:"center",gap:4 }}><Calendar size={10}/>{fmtDate(r.bookingDate)} à {fmtHour(r.bookingHour)}</span>
              {r.serviceType && <span style={{ background:"#f1f5f9",borderRadius:999,padding:"2px 8px" }}>{r.serviceType}</span>}
            </div>
            {r.address && (
              <div style={{ fontSize:11,color:"#94a3b8",marginTop:3,display:"flex",alignItems:"center",gap:4 }}>
                <MapPin size={10}/>{r.address}
              </div>
            )}
          </div>
        </div>
        <StatusBadge status={r.status} />
      </div>

      {/* Actions */}
      <div style={{ marginTop:12,display:"flex",flexWrap:"wrap",gap:8,alignItems:"center" }}>
        {role === "sent" && isActive && (
          <button className="rm-btn rm-btn-danger" onClick={() => onCancel(r)} disabled={actionLoading}>
            <XCircle size={11} style={{ marginRight:4 }} />Annuler
          </button>
        )}
        {role === "received" && r.status === "pending" && (
          <>
            <button className="rm-btn rm-btn-accept" onClick={() => onStatus(r._id,"accepted")} disabled={actionLoading}>
              <CheckCircle size={11} style={{ marginRight:4 }} />Accepter
            </button>
            <button className="rm-btn rm-btn-refuse" onClick={() => onStatus(r._id,"rejected")} disabled={actionLoading}>
              <XCircle size={11} style={{ marginRight:4 }} />Refuser
            </button>
          </>
        )}
        {role === "received" && r.status === "accepted" && (
          <button className="rm-btn rm-btn-done" onClick={() => onStatus(r._id,"completed")} disabled={actionLoading}>
            <CheckCircle size={11} style={{ marginRight:4 }} />Marquer terminé
          </button>
        )}
        {role === "sent" && isCompleted && !hasReview && (
          <button className="rm-btn" style={{ border:"1.5px solid #e2e8f0",color:"#64748b",background:"#f8fafc" }} onClick={() => setReviewOpen((p) => !p)}>
            <Star size={11} style={{ marginRight:4 }} />{reviewOpen ? "Fermer" : "Laisser un avis"}
          </button>
        )}
        {role === "sent" && isCompleted && hasReview && (
          <div style={{ fontSize:11,color:"#64748b",display:"flex",alignItems:"center",gap:4 }}>
            <Star size={11} color="#f59e0b" fill="#f59e0b" />
            {"★".repeat(r.clientReview.rating)}{"☆".repeat(5 - r.clientReview.rating)}
            {r.clientReview.comment && <span style={{ marginLeft:4 }}>· {r.clientReview.comment}</span>}
          </div>
        )}
      </div>

      {reviewOpen && !hasReview && (
        <div style={{ marginTop:12,borderTop:"1px solid #f1f5f9",paddingTop:12,display:"flex",flexDirection:"column",gap:8 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#64748b" }}>
            Note :
            {[1,2,3,4,5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(String(n))}
                style={{ border:"none",background:"none",cursor:"pointer",padding:0,fontSize:18,color:Number(rating)>=n?"#f59e0b":"#e2e8f0",transition:"color .1s" }}>★</button>
            ))}
          </div>
          <textarea className="rm-input" rows={2} placeholder="Votre commentaire (optionnel)" value={comment} onChange={(e) => setComment(e.target.value)} style={{ minHeight:60,resize:"vertical",fontSize:12 }} />
          <button className="rm-btn" disabled={!rating || rvLoading} onClick={submitRv}
            style={{ alignSelf:"flex-start",border:"none",background:rating?"#06b6d4":"#e2e8f0",color:rating?"#fff":"#94a3b8",padding:"8px 20px" }}>
            {rvLoading ? "Envoi…" : "Envoyer l'avis"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReservationsManagePage({ user, onHome, onNavigate, onLogout }) {
  const isWorker = user?.role === "worker";
  const isClient = user?.role === "client";

  // For clients and workers-as-bookers
  const [sentActive, setSentActive]   = useState([]);
  const [sentHistory, setSentHistory] = useState([]);
  // For workers receiving
  const [recvActive, setRecvActive]   = useState([]);
  const [recvHistory, setRecvHistory] = useState([]);

  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]   = useState("");
  const [message, setMessage] = useState("");

  // Tabs: for clients → "active" | "history"
  //       for workers → "sent-active" | "sent-history" | "recv-active" | "recv-history"
  const [mainTab, setMainTab] = useState(isWorker ? "recv" : "sent"); // "sent" | "recv"
  const [subTab, setSubTab]   = useState("active"); // "active" | "history"

  const [sentActivePage, setSentActivePage]   = useState(0);
  const [sentHistPage, setSentHistPage]       = useState(0);
  const [recvActivePage, setRecvActivePage]   = useState(0);
  const [recvHistPage, setRecvHistPage]       = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const tasks = [];
      // Both clients and workers can book
      tasks.push(
        reservationApi.getClientReservations().then(setSentActive).catch(() => setSentActive([])),
        reservationApi.getClientHistory().then(setSentHistory).catch(() => setSentHistory([])),
      );
      if (isWorker) {
        tasks.push(
          reservationApi.getWorkerReservations().then((data) => {
            const active  = Array.isArray(data) ? data.filter((r) => ["pending","accepted"].includes(r.status)) : [];
            const history = Array.isArray(data) ? data.filter((r) => !["pending","accepted"].includes(r.status)) : [];
            setRecvActive(active);
            setRecvHistory(history);
          }).catch(() => { setRecvActive([]); setRecvHistory([]); })
        );
      }
      await Promise.all(tasks);
    } catch (err) { setError(err.message || "Erreur de chargement"); }
    finally { setLoading(false); }
  }, [isWorker]);

  useEffect(() => { loadData(); }, [loadData]);

  const flash = (msg) => { setMessage(msg); setTimeout(() => setMessage(""), 3000); };

  const handleCancel = async (r) => {
    if (!window.confirm(r.status === "accepted" ? "Réservation déjà confirmée. Annuler quand même ?" : "Confirmer l'annulation ?")) return;
    setActionLoading(true); setError("");
    try {
      await reservationApi.cancelAsClient(r._id, { reason: "Cancelled by user", ...(r.status === "accepted" ? { confirmation: "CLIENT_CONFIRMED" } : {}) });
      flash("Réservation annulée");
      await loadData();
    } catch (err) { setError(err.message || "Annulation impossible"); }
    finally { setActionLoading(false); }
  };

  const handleStatus = async (id, status) => {
    setActionLoading(true); setError("");
    try {
      await reservationApi.setWorkerStatus(id, status);
      flash(`Réservation ${STATUS_LABELS[status]?.label || status}`);
      await loadData();
    } catch (err) { setError(err.message || "Mise à jour impossible"); }
    finally { setActionLoading(false); }
  };

  const handleReview = async (id, rating, comment) => {
    setError("");
    try {
      await reservationApi.submitClientReview(id, { rating, comment });
      flash("Avis envoyé");
      await loadData();
    } catch (err) { setError(err.message || "Envoi de l'avis impossible"); throw err; }
  };

  // Current list to display
  let currentList = [];
  let currentPage = 0;
  let setCurrentPage = () => {};
  if (mainTab === "sent") {
    if (subTab === "active")   { currentList = sentActive;  currentPage = sentActivePage; setCurrentPage = setSentActivePage; }
    else                        { currentList = sentHistory; currentPage = sentHistPage;   setCurrentPage = setSentHistPage; }
  } else {
    if (subTab === "active")   { currentList = recvActive;  currentPage = recvActivePage; setCurrentPage = setRecvActivePage; }
    else                        { currentList = recvHistory; currentPage = recvHistPage;   setCurrentPage = setRecvHistPage; }
  }
  const paged = currentList.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const switchMain = (t) => { setMainTab(t); setSubTab("active"); };
  const switchSub  = (t) => { setSubTab(t); };

  return (
    <>
      <style>{css}</style>
      <div className="rm-root">
        <Navbar user={user} activePage="reservations" onHome={onHome} onNavigate={onNavigate} onLogout={onLogout} />

        <div style={{ background:"#0f172e",paddingTop:80,paddingBottom:32 }}>
          <div style={{ maxWidth:860,margin:"0 auto",padding:"0 24px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
              <Calendar size={20} color="#06b6d4" />
              <h1 style={{ fontSize:26,fontWeight:800,color:"#fff" }}>Réservations</h1>
            </div>
            <p style={{ color:"#94a3b8",fontSize:13 }}>
              {isWorker ? "Gérez vos réservations envoyées et les demandes reçues." : "Suivez et gérez vos réservations."}
            </p>
          </div>
        </div>

        <div className="rm-content">
          {error   && <div style={{ marginBottom:12,background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:9,padding:"10px 14px",color:"#b91c1c",fontSize:13 }}>{error}</div>}
          {message && <div style={{ marginBottom:12,background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:9,padding:"10px 14px",color:"#15803d",fontSize:13 }}>{message}</div>}

          {/* Main tabs (workers only) */}
          {isWorker && (
            <div style={{ display:"flex",gap:8,marginBottom:16 }}>
              <button className={`rm-tab${mainTab==="sent"?" active":""}`} onClick={() => switchMain("sent")}>
                Réservations envoyées {sentActive.length+sentHistory.length > 0 && <span style={{ marginLeft:5,fontSize:10,background:"rgba(6,182,212,.15)",color:"#06b6d4",borderRadius:999,padding:"1px 6px" }}>{sentActive.length+sentHistory.length}</span>}
              </button>
              <button className={`rm-tab${mainTab==="recv"?" active":""}`} onClick={() => switchMain("recv")}>
                Demandes reçues {recvActive.length+recvHistory.length > 0 && <span style={{ marginLeft:5,fontSize:10,background:"rgba(6,182,212,.15)",color:"#06b6d4",borderRadius:999,padding:"1px 6px" }}>{recvActive.length+recvHistory.length}</span>}
              </button>
            </div>
          )}

          {/* Sub tabs */}
          <div style={{ display:"flex",gap:8,marginBottom:20,borderBottom:"1.5px solid #e2e8f0",paddingBottom:12 }}>
            <button className={`rm-tab${subTab==="active"?" active":""}`} onClick={() => switchSub("active")}>
              {mainTab === "recv" ? "En cours" : "Actives"}
              {(mainTab==="sent" ? sentActive : recvActive).length > 0 && (
                <span style={{ marginLeft:5,fontSize:10,background:"rgba(245,158,11,.2)",color:"#b45309",borderRadius:999,padding:"1px 6px" }}>
                  {(mainTab==="sent" ? sentActive : recvActive).length}
                </span>
              )}
            </button>
            <button className={`rm-tab${subTab==="history"?" active":""}`} onClick={() => switchSub("history")}>
              Historique
              {(mainTab==="sent" ? sentHistory : recvHistory).length > 0 && (
                <span style={{ marginLeft:5,fontSize:10,background:"#f1f5f9",color:"#64748b",borderRadius:999,padding:"1px 6px" }}>
                  {(mainTab==="sent" ? sentHistory : recvHistory).length}
                </span>
              )}
            </button>
          </div>

          {loading ? (
            <div style={{ display:"grid",gap:12 }}>
              {[1,2,3].map((i) => (
                <div key={i} style={{ background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,padding:16,height:90,animation:"pulse 1.5s ease infinite" }} />
              ))}
            </div>
          ) : paged.length === 0 ? (
            <div style={{ textAlign:"center",padding:"48px 0",color:"#94a3b8" }}>
              <Calendar size={36} style={{ margin:"0 auto 12px",opacity:.3 }} />
              <div style={{ fontSize:14,fontWeight:600 }}>Aucune réservation</div>
              <div style={{ fontSize:12,marginTop:4 }}>
                {subTab === "active" ? "Vous n'avez pas de réservation active pour le moment." : "Votre historique est vide."}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display:"grid",gap:12 }}>
                {paged.map((r) => (
                  <ReservCard
                    key={r._id} r={r}
                    role={mainTab === "sent" ? "sent" : "received"}
                    onCancel={handleCancel}
                    onStatus={handleStatus}
                    onReview={handleReview}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
              <Pagination page={currentPage} total={currentList.length} onChange={setCurrentPage} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
