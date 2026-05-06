import { useState, useEffect } from "react";
import { MapPin, Star, Bookmark, BookmarkX } from "lucide-react";
import { clientApi, avatarUrl } from "../api";
import Navbar from "../components/Navbar";

const avatarInitials = (n) => (n?.[0] || "?").toUpperCase();

const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{background:#f8fafc;color:#0f172e;font-family:'Sora',sans-serif;-webkit-font-smoothing:antialiased}
.sw-root{min-height:100vh;padding-top:64px;background:#f8fafc;font-family:'Sora',sans-serif}
.sw-hero{
  background:#0f172e;
  border-bottom:1.5px solid rgba(6,182,212,0.15);
  padding:36px 28px 28px;
  position:relative;overflow:hidden;
}
.sw-hero::before{
  content:'';position:absolute;inset:0;pointer-events:none;
  background:
    radial-gradient(ellipse 60% 80% at 80% 50%,rgba(6,182,212,0.07),transparent),
    repeating-linear-gradient(45deg,transparent,transparent 40px,rgba(6,182,212,0.02) 40px,rgba(6,182,212,0.02) 41px);
}
.sw-hero-inner{max-width:1280px;margin:0 auto;position:relative}
.sw-hero-title{font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;margin-bottom:6px}
.sw-hero-sub{font-size:13px;color:#64748b;display:flex;align-items:center;gap:8px}
.sw-hero-pill{
  display:inline-flex;align-items:center;gap:5px;
  background:rgba(6,182,212,0.12);border:1.5px solid rgba(6,182,212,0.25);
  border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700;color:#06b6d4;
}
.sw-content{max-width:1280px;margin:0 auto;padding:28px}
.sw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px}
.sw-card{
  background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;
  padding:20px;transition:all .22s;cursor:pointer;display:flex;flex-direction:column;gap:0;
}
.sw-card:hover{border-color:rgba(6,182,212,0.4);transform:translateY(-3px);box-shadow:0 12px 36px rgba(6,182,212,0.09)}
.sw-card-head{display:flex;align-items:center;gap:13px;margin-bottom:14px}
.sw-avatar{width:52px;height:52px;border-radius:12px;border:2px solid #e2e8f0;object-fit:cover;flex-shrink:0}
.sw-avatar-init{width:52px;height:52px;border-radius:12px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:700;color:#64748b;flex-shrink:0}
.sw-name{font-size:14px;font-weight:700;color:#0f172e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}
.sw-prof{font-size:11px;font-weight:600;color:#06b6d4;margin-top:2px;letter-spacing:.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}
.sw-card-meta{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.sw-tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px;min-height:24px}
.sw-tag{background:#f8fafc;border:1px solid #e2e8f0;border-radius:999px;font-size:11px;padding:3px 9px;color:#334155;font-weight:600;white-space:nowrap}
.sw-card-foot{
  display:flex;align-items:center;justify-content:space-between;
  padding-top:14px;border-top:1px solid #f1f5f9;margin-top:auto;gap:8px;
}
.sw-foot-rating{display:flex;align-items:center;gap:4px;font-size:12px;color:#64748b;flex:1;min-width:0}
.sw-foot-actions{display:flex;gap:7px;flex-shrink:0}
.sw-unsave-btn{
  background:rgba(239,68,68,0.06);border:1.5px solid rgba(239,68,68,0.2);
  border-radius:8px;padding:7px 12px;cursor:pointer;
  display:flex;align-items:center;gap:5px;
  font-size:11px;font-weight:700;color:#ef4444;
  font-family:'Sora',sans-serif;transition:all .2s;white-space:nowrap;
}
.sw-unsave-btn:hover{background:rgba(239,68,68,0.12);border-color:rgba(239,68,68,0.4)}
.sw-reserve-btn{
  background:#06b6d4;border:none;border-radius:8px;
  padding:7px 14px;font-size:11px;font-weight:700;color:#fff;
  cursor:pointer;font-family:'Sora',sans-serif;transition:background .2s;
  letter-spacing:.04em;white-space:nowrap;
}
.sw-reserve-btn:hover{background:#0891b2}
.sw-empty{text-align:center;padding:80px 20px}
.sw-empty-icon{width:68px;height:68px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin:0 auto 18px}
.sw-empty-title{font-size:19px;font-weight:800;color:#0f172e;margin-bottom:8px}
.sw-empty-sub{font-size:13px;color:#94a3b8;line-height:1.7}
.sw-explore-btn{
  display:inline-flex;align-items:center;gap:7px;margin-top:22px;
  background:#0f172e;color:#06b6d4;border:none;border-radius:8px;
  padding:10px 22px;font-size:12px;font-weight:700;cursor:pointer;
  font-family:'Sora',sans-serif;letter-spacing:.08em;text-transform:uppercase;
  transition:background .2s;
}
.sw-explore-btn:hover{background:#1e293b}
.sw-skeleton{background:#f1f5f9;border-radius:8px;animation:sw-pulse 1.4s ease infinite}
@keyframes sw-pulse{0%,100%{opacity:1}50%{opacity:.45}}
@media(max-width:768px){
  .sw-hero{padding:24px 16px 20px}
  .sw-hero-title{font-size:20px}
  .sw-content{padding:20px 16px}
  .sw-grid{grid-template-columns:1fr}
}
`;

export default function SavedWorkers({ user, onHome, onNavigate, onLogout, onReserveWorker }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientApi.getSavedWorkers()
      .then(list => setWorkers(list || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUnsave = async (e, workerId) => {
    e.stopPropagation();
    setWorkers(prev => prev.filter(w => String(w._id) !== String(workerId)));
    try {
      await clientApi.unsaveWorker(workerId);
    } catch {
      clientApi.getSavedWorkers().then(list => setWorkers(list || [])).catch(() => {});
    }
  };

  const handleReserve = (e, worker) => {
    e.stopPropagation();
    if (onReserveWorker) onReserveWorker(worker);
    else onNavigate?.("reservations");
  };

  return (
    <>
      <style>{css}</style>
      <div className="sw-root">
        <Navbar
          user={user}
          activePage="saved"
          onHome={onHome}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        {/* Hero header */}
        <div style={{ background:"#0f172e", borderBottom:"1.5px solid rgba(6,182,212,0.15)", padding:"36px 28px 28px", position:"relative", overflow:"hidden" }}>
          <div style={{ content:"", position:"absolute", inset:0, pointerEvents:"none",
            background:"radial-gradient(ellipse 60% 80% at 80% 50%,rgba(6,182,212,0.07),transparent)" }} />
          <div style={{ maxWidth:1280, margin:"0 auto", position:"relative" }}>
            <div style={{ fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.5px", marginBottom:8 }}>
              Prestataires sauvegardés
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {!loading && (
                <span style={{ background:"rgba(6,182,212,0.12)", border:"1.5px solid rgba(6,182,212,0.25)", borderRadius:999, padding:"3px 12px", fontSize:11, fontWeight:700, color:"#06b6d4" }}>
                  {workers.length} prestataire{workers.length !== 1 ? "s" : ""}
                </span>
              )}
              <span style={{ fontSize:13, color:"#475569" }}>
                Gérez vos prestataires favoris
              </span>
            </div>
          </div>
        </div>

        <div className="sw-content">
          {loading ? (
            <div className="sw-grid">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:14, padding:20 }}>
                  <div style={{ display:"flex", gap:13, marginBottom:14 }}>
                    <div className="sw-skeleton" style={{ width:52, height:52, borderRadius:12, flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div className="sw-skeleton" style={{ height:14, borderRadius:4, marginBottom:7, width:"70%" }} />
                      <div className="sw-skeleton" style={{ height:11, borderRadius:4, width:"45%" }} />
                    </div>
                  </div>
                  <div className="sw-skeleton" style={{ height:11, borderRadius:4, marginBottom:8 }} />
                  <div style={{ display:"flex", gap:5, marginBottom:14 }}>
                    <div className="sw-skeleton" style={{ height:22, width:60, borderRadius:999 }} />
                    <div className="sw-skeleton" style={{ height:22, width:70, borderRadius:999 }} />
                  </div>
                  <div className="sw-skeleton" style={{ height:32, borderRadius:8 }} />
                </div>
              ))}
            </div>
          ) : workers.length === 0 ? (
            <div className="sw-empty">
              <div className="sw-empty-icon">
                <Bookmark size={30} color="#94a3b8" />
              </div>
              <div className="sw-empty-title">Aucun prestataire sauvegardé</div>
              <div className="sw-empty-sub">
                Explorez les prestataires et cliquez sur<br />
                "Sauvegarder" pour les retrouver ici.
              </div>
              <button className="sw-explore-btn" onClick={() => onNavigate?.("explore")}>
                Explorer les prestataires
              </button>
            </div>
          ) : (
            <div className="sw-grid">
              {workers.map(w => {
                const fn      = w.firstName || "Pro";
                const ln      = w.lastName  || "";
                const wp      = w.workerProfile || {};
                const profs   = wp.professions || [];
                const city    = wp.city || "";
                const rating  = Number(wp.rating || 0);
                const reviews = Number(wp.totalReviews || 0);
                const avail   = wp.isAvailable !== false;
                const ava     = avatarUrl(w.avatar);
                const fullName = `${fn} ${ln}`.trim();

                return (
                  <div
                    key={w._id}
                    className="sw-card"
                    onClick={() => onNavigate?.("profile", { profileUser: w })}
                  >
                    {/* Head: avatar + name + profession */}
                    <div className="sw-card-head">
                      {ava
                        ? <img src={ava} alt={fn} className="sw-avatar" />
                        : <div className="sw-avatar-init">{avatarInitials(fn)}</div>
                      }
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="sw-name" title={fullName}>{fullName}</div>
                        <div className="sw-prof">{profs[0] || "Service"}</div>
                      </div>
                    </div>

                    {/* Meta: city + availability */}
                    <div className="sw-card-meta">
                      {city && (
                        <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#64748b" }}>
                          <MapPin size={10} color="#94a3b8" />
                          {city}
                        </span>
                      )}
                      <span style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:4 }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:avail?"#10b981":"#f59e0b" }} />
                        <span style={{ fontSize:11, fontWeight:600, color:avail?"#059669":"#d97706" }}>
                          {avail ? "Disponible" : "Indisponible"}
                        </span>
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="sw-tags">
                      {profs.slice(0, 3).map(p => <span key={p} className="sw-tag">{p}</span>)}
                      {profs.length > 3 && <span className="sw-tag">+{profs.length - 3}</span>}
                    </div>

                    {/* Footer: rating + actions */}
                    <div className="sw-card-foot">
                      <div className="sw-foot-rating">
                        {rating > 0 ? (
                          <>
                            <Star size={11} color="#f59e0b" fill="#f59e0b" />
                            <span style={{ fontWeight:700, color:"#0f172e" }}>{rating.toFixed(1)}</span>
                            <span style={{ color:"#94a3b8" }}>({reviews})</span>
                          </>
                        ) : (
                          <span style={{ color:"#cbd5e1", fontSize:11 }}>Pas encore noté</span>
                        )}
                      </div>
                      <div className="sw-foot-actions">
                        <button className="sw-unsave-btn" onClick={e => handleUnsave(e, w._id)}>
                          <BookmarkX size={12} /> Retirer
                        </button>
                        <button className="sw-reserve-btn" onClick={e => handleReserve(e, w)}>
                          Réserver
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
