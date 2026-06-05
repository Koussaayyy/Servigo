import { useCallback, useEffect, useState } from "react";
import { reservationApi, workerApi, avatarUrl } from "../api";
import Navbar from "../components/Navbar";
import {
  Star, Clock, Calendar, ChevronRight, Check, X,
  Zap, FolderOpen, Tag, CheckCircle, User, Users,
  Wrench, MapPin, RefreshCw, AlertCircle, Smile,
  ClipboardList, Banknote, Link2, Image,
} from "lucide-react";

const fmtHour = (h) => `${String(h).padStart(2,"0")}:00`;
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"short" });
};
const isToday = (dateVal) => {
  if (!dateVal) return false;
  const d = new Date(dateVal), t = new Date();
  return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate();
};
const avatarInitials = (n) => ((n||"")[0]||"?").toUpperCase();

const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{background:#f8fafc;color:#0f172e;font-family:'Sora',sans-serif;-webkit-font-smoothing:antialiased}
input,button,select,textarea{font-family:'Sora',sans-serif}
.wd-root{min-height:100vh;background:#f8fafc}
.wd-body{max-width:1100px;margin:0 auto;padding:84px 28px 64px}
@media(max-width:768px){.wd-body{padding:80px 14px 48px}}

@keyframes wdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.wd-a1{animation:wdUp .3s ease both}
.wd-a2{animation:wdUp .3s .06s ease both}
.wd-a3{animation:wdUp .3s .12s ease both}
.wd-a4{animation:wdUp .3s .18s ease both}

.wd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
@media(max-width:700px){.wd-stats{grid-template-columns:repeat(2,1fr)}}
.wd-stat{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:18px 20px;display:flex;flex-direction:column;gap:5px}
.wd-stat-icon{font-size:22px;margin-bottom:2px}
.wd-stat-value{font-size:28px;font-weight:800;color:#0f172e;line-height:1}
.wd-stat-label{font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:.07em;text-transform:uppercase}

.wd-grid{display:grid;grid-template-columns:1fr 320px;gap:18px;align-items:start}
@media(max-width:900px){.wd-grid{grid-template-columns:1fr}}

.wd-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden}
.wd-card-head{padding:13px 18px;border-bottom:1.5px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
.wd-card-title{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:800;color:#0f172e;letter-spacing:.08em;text-transform:uppercase}
.wd-card-body{padding:12px 14px;display:flex;flex-direction:column;gap:8px}

.wd-row{display:flex;align-items:center;gap:11px;padding:11px 13px;border:1.5px solid #f1f5f9;border-radius:11px;transition:border-color .15s}
.wd-row:hover{border-color:#e2e8f0}
.wd-av{width:36px;height:36px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#64748b;flex-shrink:0}
.wd-info{flex:1;min-width:0}
.wd-name{font-size:13px;font-weight:700;color:#0f172e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px}
.wd-meta{font-size:10px;color:#94a3b8;display:flex;align-items:center;gap:7px;flex-wrap:wrap}

.wd-accept{display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;border:none;background:#0f172e;color:#fff;font-size:11px;font-weight:700;cursor:pointer;transition:opacity .15s;white-space:nowrap}
.wd-accept:hover{opacity:.85}
.wd-reject{display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;border:1.5px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:11px;font-weight:700;cursor:pointer;transition:background .15s;white-space:nowrap}
.wd-reject:hover{background:#f1f5f9}
.wd-accept:disabled,.wd-reject:disabled{opacity:.4;cursor:not-allowed}

.wd-link{display:flex;align-items:center;gap:10px;padding:11px 13px;border:1.5px solid #f1f5f9;border-radius:11px;cursor:pointer;transition:border-color .15s;background:#fff;width:100%;text-align:left}
.wd-link:hover{border-color:#e2e8f0}
.wd-link-icon{width:32px;height:32px;border-radius:9px;background:#f8fafc;border:1.5px solid #f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.wd-link-text{flex:1}
.wd-link-label{font-size:12px;font-weight:700;color:#0f172e;display:block;margin-bottom:1px}
.wd-link-sub{font-size:10px;color:#94a3b8}

.wd-pill{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:10px;font-weight:700;white-space:nowrap}
.wd-empty{text-align:center;padding:28px 16px;color:#94a3b8;font-size:12px;font-weight:500}
.wd-see-btn{display:inline-flex;align-items:center;gap:4px;padding:5px 11px;border-radius:7px;border:1.5px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:10px;font-weight:700;cursor:pointer;transition:border-color .15s;white-space:nowrap}
.wd-see-btn:hover{border-color:#0f172e;color:#0f172e}
.wd-refresh-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:11px;font-weight:600;cursor:pointer;transition:border-color .15s}
.wd-refresh-btn:hover{border-color:#0f172e;color:#0f172e}
`;

export default function WorkerDashboard({ user, onHome, onNavigate, onLogout }) {
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [reservations,  setReservations]  = useState([]);
  const [profile,       setProfile]       = useState(null);
  const [error,         setError]         = useState("");
  const [msg,           setMsg]           = useState("");

  const wp      = profile?.workerProfile || user?.workerProfile || {};
  const rating  = wp.rating       || 0;
  const reviews = wp.totalReviews || 0;

  const load = useCallback(async () => {
    setLoading(true); setError(""); setMsg("");
    try {
      const [profileData, resData] = await Promise.all([
        workerApi.getProfile(),
        reservationApi.getWorkerReservations(),
      ]);
      setProfile(profileData);
      setReservations(Array.isArray(resData) ? resData : []);
    } catch (e) { setError(e.message || "Erreur de chargement"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id, status) => {
    setActionLoading(id + status); setMsg(""); setError("");
    try {
      await reservationApi.setWorkerStatus(id, status);
      setMsg(status === "accepted" ? "Réservation acceptée ✓" : "Réservation refusée");
      await load();
    } catch (e) { setError(e.message || "Erreur"); }
    finally { setActionLoading(null); }
  };

  const pending       = reservations.filter(r => r.status === "pending");
  const todayRes      = reservations.filter(r => r.status === "accepted" && isToday(r.bookingDate));
  const recentClients = [...reservations]
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter((r,i,arr) => arr.findIndex(x => String(x.client?._id||x.client) === String(r.client?._id||r.client)) === i)
    .slice(0, 4);

  const statusLabel = { pending:"En attente", accepted:"Acceptée", rejected:"Refusée", cancelled:"Annulée", completed:"Terminée" };

  return (
    <>
      <style>{css}</style>
      <div className="wd-root">
        <Navbar user={user} activePage="dashboard" onHome={onHome} onNavigate={onNavigate} onLogout={onLogout} />

        <div className="wd-body">

          {/* Header */}
          <div className="wd-a1" style={{ marginBottom:22 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10 }}>
              <div>
                <h1 style={{ fontSize:24,fontWeight:800,color:"#0f172e",marginBottom:3 }}>
                  <Smile size={22} strokeWidth={1.8} style={{ marginRight:8, verticalAlign:"middle", color:"#06b6d4" }}/>
                  Bonjour, {user?.firstName || "Prestataire"}
                </h1>
                <p style={{ fontSize:13,color:"#64748b" }}>Voici un aperçu de votre activité</p>
              </div>
              <button className="wd-refresh-btn" onClick={load}>
                <RefreshCw size={12}/> Actualiser
              </button>
            </div>
            {error && <div style={{ marginTop:12,fontSize:12,color:"#c0392b",background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:8,padding:"10px 14px" }}>{error}</div>}
            {msg   && <div style={{ marginTop:12,fontSize:12,color:"#0f172e",background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:8,padding:"10px 14px" }}>{msg}</div>}
          </div>

          {/* Stats */}
          <div className="wd-stats wd-a2">
            <div className="wd-stat">
              <div className="wd-stat-icon"><AlertCircle size={20} color="#64748b" strokeWidth={1.8}/></div>
              <div className="wd-stat-value">{loading ? "—" : pending.length}</div>
              <div className="wd-stat-label">En attente</div>
            </div>
            <div className="wd-stat">
              <div className="wd-stat-icon"><Calendar size={20} color="#64748b" strokeWidth={1.8}/></div>
              <div className="wd-stat-value">{loading ? "—" : todayRes.length}</div>
              <div className="wd-stat-label">Aujourd'hui</div>
            </div>
            <div className="wd-stat">
              <div className="wd-stat-icon"><Star size={20} color="#64748b" strokeWidth={1.8}/></div>
              <div className="wd-stat-value">{loading ? "—" : rating > 0 ? rating.toFixed(1) : "—"}</div>
              <div className="wd-stat-label">{reviews > 0 ? `${reviews} avis` : "Aucun avis"}</div>
            </div>
            <div className="wd-stat">
              <div className="wd-stat-icon"><ClipboardList size={20} color="#64748b" strokeWidth={1.8}/></div>
              <div className="wd-stat-value">{loading ? "—" : reservations.length}</div>
              <div className="wd-stat-label">Réservations actives</div>
            </div>
          </div>

          {/* Grid */}
          <div className="wd-grid">

            {/* Left */}
            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>

              {/* Actions requises */}
              <div className="wd-card wd-a3">
                <div className="wd-card-head">
                  <div className="wd-card-title">
                    <Zap size={12} color="#0f172e"/> Actions requises
                    {!loading && pending.length > 0 && (
                      <span style={{ background:"#0f172e",color:"#fff",borderRadius:999,fontSize:9,fontWeight:800,padding:"2px 7px",marginLeft:2 }}>
                        {pending.length}
                      </span>
                    )}
                  </div>
                  <button className="wd-see-btn" onClick={() => onNavigate("reservations")}>
                    Tout voir <ChevronRight size={10}/>
                  </button>
                </div>
                <div className="wd-card-body">
                  {loading ? (
                    <div className="wd-empty">Chargement…</div>
                  ) : pending.length === 0 ? (
                    <div className="wd-empty">Aucune demande en attente <CheckCircle size={13} style={{ verticalAlign:"middle",marginLeft:4 }} color="#94a3b8"/></div>
                  ) : pending.map(r => {
                    const c = r.client || {};
                    const ini = ((c.firstName?.[0]||"")+(c.lastName?.[0]||"")).toUpperCase()||"?";
                    return (
                      <div key={r._id} className="wd-row">
                        <div className="wd-av">{ini}</div>
                        <div className="wd-info">
                          <div className="wd-name">{c.firstName||"Client"} {c.lastName||""}</div>
                          <div className="wd-meta">
                            <span style={{ display:"flex",alignItems:"center",gap:3 }}>
                              <Calendar size={9}/>{fmtDate(r.bookingDate)} · {fmtHour(r.bookingHour)}–{fmtHour(r.bookingHour+2)}
                            </span>
                            {r.serviceType && <span style={{ display:"flex",alignItems:"center",gap:3 }}><Wrench size={9}/>{r.serviceType}</span>}
                            {r.address && <span style={{ display:"flex",alignItems:"center",gap:3 }}><MapPin size={9}/>{r.address.split(",")[0]}</span>}
                          </div>
                        </div>
                        <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                          <button className="wd-reject" disabled={!!actionLoading} onClick={() => handleStatus(r._id,"rejected")}>
                            <X size={10}/> Refuser
                          </button>
                          <button className="wd-accept" disabled={!!actionLoading} onClick={() => handleStatus(r._id,"accepted")}>
                            <Check size={10}/> Accepter
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Planning du jour */}
              <div className="wd-card wd-a3">
                <div className="wd-card-head">
                  <div className="wd-card-title"><Calendar size={12} color="#0f172e"/> Planning du jour</div>
                  <button className="wd-see-btn" onClick={() => onNavigate("profile", { profileTab:"planning" })}>
                    Mon planning <ChevronRight size={10}/>
                  </button>
                </div>
                <div className="wd-card-body">
                  {loading ? (
                    <div className="wd-empty">Chargement…</div>
                  ) : todayRes.length === 0 ? (
                    <div className="wd-empty">Aucune intervention prévue aujourd'hui <Clock size={13} style={{ verticalAlign:"middle",marginLeft:4 }} color="#94a3b8"/></div>
                  ) : todayRes.map(r => {
                    const c = r.client || {};
                    const ini = ((c.firstName?.[0]||"")+(c.lastName?.[0]||"")).toUpperCase()||"?";
                    return (
                      <div key={r._id} className="wd-row">
                        <div className="wd-av">{ini}</div>
                        <div className="wd-info">
                          <div className="wd-name">{c.firstName||"Client"} {c.lastName||""}</div>
                          <div className="wd-meta">
                            <span style={{ display:"flex",alignItems:"center",gap:3 }}><Clock size={9}/>{fmtHour(r.bookingHour)} – {fmtHour(r.bookingHour+2)}</span>
                            {r.serviceType && <span style={{ display:"flex",alignItems:"center",gap:3 }}><Wrench size={9}/>{r.serviceType}</span>}
                            {c.phone && <span>{c.phone}</span>}
                          </div>
                        </div>
                        <span className="wd-pill" style={{ background:"#f0fdf4",color:"#15803d",border:"1.5px solid #bbf7d0" }}>
                          <Check size={9}/> Confirmé
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Derniers clients */}
              <div className="wd-card wd-a4">
                <div className="wd-card-head">
                  <div className="wd-card-title"><Users size={12} color="#0f172e"/> Derniers clients</div>
                  <button className="wd-see-btn" onClick={() => onNavigate("reservations")}>
                    Tout voir <ChevronRight size={10}/>
                  </button>
                </div>
                <div className="wd-card-body">
                  {loading ? (
                    <div className="wd-empty">Chargement…</div>
                  ) : recentClients.length === 0 ? (
                    <div className="wd-empty">Aucun client récent</div>
                  ) : recentClients.map(r => {
                    const c = r.client || {};
                    const ini = ((c.firstName?.[0]||"")+(c.lastName?.[0]||"")).toUpperCase()||"?";
                    return (
                      <div key={r._id} className="wd-row">
                        <div className="wd-av">{ini}</div>
                        <div className="wd-info">
                          <div className="wd-name">{c.firstName||"Client"} {c.lastName||""}</div>
                          <div className="wd-meta">
                            <span style={{ display:"flex",alignItems:"center",gap:3 }}><Calendar size={9}/>{fmtDate(r.bookingDate)} · {fmtHour(r.bookingHour)}–{fmtHour(r.bookingHour+2)}</span>
                            {r.serviceType && <span style={{ display:"flex",alignItems:"center",gap:3 }}><Wrench size={9}/>{r.serviceType}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize:10,fontWeight:700,color:"#64748b",flexShrink:0 }}>
                          {statusLabel[r.status]||r.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right */}
            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>

              {/* Profile card */}
              <div className="wd-card wd-a2">
                <div style={{ padding:18 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
                    <div style={{ width:50,height:50,borderRadius:13,overflow:"hidden",background:"#f1f5f9",border:"1.5px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      {user?.avatar
                        ? <img src={avatarUrl(user.avatar)} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                        : <span style={{ fontSize:18,fontWeight:800,color:"#0f172e" }}>{avatarInitials(user?.firstName||"W")}</span>
                      }
                    </div>
                    <div>
                      <div style={{ fontSize:14,fontWeight:800,color:"#0f172e",marginBottom:2 }}>{user?.firstName} {user?.lastName}</div>
                      <div style={{ fontSize:11,color:"#94a3b8",marginBottom:4 }}>
                        {wp.professions?.slice(0,2).join(", ") || "Prestataire"}
                      </div>
                      <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                        <span style={{ width:6,height:6,borderRadius:"50%",background: wp.isAvailable?"#10b981":"#94a3b8" }}/>
                        <span style={{ fontSize:10,fontWeight:600,color:"#64748b" }}>
                          {wp.isAvailable ? "Disponible" : "Indisponible"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {rating > 0 && (
                    <div style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 12px",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,marginBottom:10 }}>
                      <Star size={14} color="#64748b" strokeWidth={1.8}/>
                      <span style={{ fontSize:15,fontWeight:800,color:"#0f172e" }}>{rating.toFixed(1)}</span>
                      <span style={{ fontSize:11,color:"#94a3b8",marginLeft:2 }}>{reviews} avis</span>
                    </div>
                  )}

                  {(wp.city || wp.hourlyRate > 0) && (
                    <div style={{ display:"flex",flexDirection:"column",gap:6,padding:"10px 12px",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,marginBottom:10 }}>
                      {wp.city && <div style={{ fontSize:11,color:"#64748b",display:"flex",alignItems:"center",gap:6 }}><MapPin size={11}/>{wp.city}</div>}
                      {wp.hourlyRate > 0 && <div style={{ fontSize:11,color:"#64748b",display:"flex",alignItems:"center",gap:6 }}><Banknote size={11}/><strong style={{ color:"#0f172e" }}>{wp.hourlyRate} TND/h</strong></div>}
                    </div>
                  )}

                  <button className="wd-link" onClick={() => onNavigate("profile")}>
                    <div className="wd-link-icon"><User size={14} color="#64748b"/></div>
                    <div className="wd-link-text">
                      <span className="wd-link-label">Mon profil</span>
                      <span className="wd-link-sub">Modifier mes informations</span>
                    </div>
                    <ChevronRight size={12} color="#cbd5e1"/>
                  </button>
                </div>
              </div>

              {/* Quick links */}
              <div className="wd-card wd-a3">
                <div className="wd-card-head">
                  <div className="wd-card-title"><Link2 size={12} color="#0f172e"/> Accès rapide</div>
                </div>
                <div className="wd-card-body">
                  {[
                    { icon:Tag,           label:"Mes services",  sub:"Gérer prix et offres",    tab:"services"       },
                    { icon:Calendar,      label:"Mon planning",  sub:"Gérer disponibilités",    tab:"planning"       },
                    { icon:Image,         label:"Portfolio",     sub:"Mes réalisations",        tab:"portfolio"      },
                    { icon:ClipboardList, label:"Réservations",  sub:"Voir toutes les demandes",page:"reservations"  },
                  ].map(({ icon:Icon, label, sub, tab, page }) => (
                    <button key={label} className="wd-link"
                      onClick={() => tab ? onNavigate("profile",{profileTab:tab}) : onNavigate(page)}>
                      <div className="wd-link-icon"><Icon size={14} color="#64748b" strokeWidth={1.8}/></div>
                      <div className="wd-link-text">
                        <span className="wd-link-label">{label}</span>
                        <span className="wd-link-sub">{sub}</span>
                      </div>
                      <ChevronRight size={12} color="#cbd5e1"/>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
