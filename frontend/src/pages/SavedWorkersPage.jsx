import { useEffect, useState } from "react";
import { Bookmark, BookmarkX, MapPin, Star, Calendar, Trash2 } from "lucide-react";
import { avatarUrl, clientApi } from "../api";
import Navbar from "../components/Navbar";
import ReservationDialog from "../components/ReservationDialog";

const avatarInitials = (n) => (n?.[0] || "?").toUpperCase();

const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
body { background:#f8fafc; font-family:'Sora',sans-serif; }
button, input, select, textarea { font-family:'Sora',sans-serif; }
.sw-root { min-height:100vh; background:#f8fafc; padding-top:80px; }
.sw-inner { max-width:1100px; margin:0 auto; padding:32px 24px; }
.sw-header { margin-bottom:28px; }
.sw-title { font-size:22px; font-weight:800; color:#0f172e; display:flex; align-items:center; gap:10px; }
.sw-subtitle { font-size:13px; color:#64748b; margin-top:6px; }
.sw-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
.sw-card {
  background:#fff; border:1.5px solid #e2e8f0; border-radius:14px;
  padding:18px; transition:all .2s; position:relative;
}
.sw-card:hover { border-color:rgba(6,182,212,0.4); box-shadow:0 8px 28px rgba(6,182,212,0.1); transform:translateY(-2px); }
.sw-remove-btn {
  position:absolute; top:12px; right:12px;
  background:rgba(239,68,68,0.07); border:1.5px solid rgba(239,68,68,0.15);
  border-radius:7px; width:28px; height:28px;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:all .18s;
}
.sw-remove-btn:hover { background:rgba(239,68,68,0.14); border-color:rgba(239,68,68,0.3); }
.sw-empty { text-align:center; padding:80px 24px; }
.sw-empty-icon { width:72px; height:72px; border-radius:50%; background:#f1f5f9; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; }
`;

export default function SavedWorkersPage({ user, onHome, onNavigate, onLogout }) {
  const [workers, setWorkers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [reserving, setReserving]   = useState(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    clientApi.getSavedWorkers()
      .then((list) => setWorkers(list || []))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  }, [user]);

  const handleRemove = async (workerId) => {
    setWorkers((prev) => prev.filter((w) => String(w._id || w.id) !== String(workerId)));
    try {
      await clientApi.unsaveWorker(workerId);
    } catch {
      clientApi.getSavedWorkers().then((list) => setWorkers(list || [])).catch(() => {});
    }
  };

  return (
    <>
      <style>{css}</style>
      <Navbar
        user={user}
        activePage="saved"
        onHome={onHome}
        onNavigate={onNavigate}
        onLogout={onLogout}
        savedCount={workers.length}
      />

      <div className="sw-root">
        <div className="sw-inner">
          <div className="sw-header">
            <div className="sw-title">
              <Bookmark size={20} color="#06b6d4" fill="rgba(6,182,212,0.15)" />
              Prestataires sauvegardés
            </div>
            <div className="sw-subtitle">
              {loading ? "Chargement…" : workers.length === 0 ? "Aucun prestataire sauvegardé" : `${workers.length} prestataire${workers.length > 1 ? "s" : ""} sauvegardé${workers.length > 1 ? "s" : ""}`}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"#94a3b8", fontSize:13 }}>Chargement…</div>
          ) : workers.length === 0 ? (
            <div className="sw-empty">
              <div className="sw-empty-icon">
                <BookmarkX size={32} color="#cbd5e1" />
              </div>
              <div style={{ fontSize:16, fontWeight:700, color:"#0f172e", marginBottom:8 }}>Aucun prestataire sauvegardé</div>
              <div style={{ fontSize:13, color:"#64748b", marginBottom:24 }}>Explorez la marketplace et sauvegardez vos prestataires préférés.</div>
              <button
                onClick={() => onNavigate?.("explore")}
                style={{ background:"#0f172e", color:"#06b6d4", border:"none", borderRadius:10, padding:"11px 28px", fontSize:13, fontWeight:700, cursor:"pointer" }}
              >
                Explorer les prestataires
              </button>
            </div>
          ) : (
            <div className="sw-grid">
              {workers.map((w) => {
                const wId     = String(w._id || w.id || "");
                const wName   = `${w.firstName || ""} ${w.lastName || ""}`.trim();
                const wAvatar = avatarUrl(w.avatar);
                const profs   = w.workerProfile?.professions || [];
                const city    = w.workerProfile?.city || "";
                const rating  = Number(w.workerProfile?.rating || 0);
                const reviews = Number(w.workerProfile?.totalReviews || 0);
                const avail   = w.workerProfile?.isAvailable !== false;

                return (
                  <div key={wId} className="sw-card">
                    <button className="sw-remove-btn" title="Retirer" onClick={() => handleRemove(wId)}>
                      <Trash2 size={12} color="#ef4444" />
                    </button>

                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12, paddingRight:36 }}>
                      {wAvatar ? (
                        <img src={wAvatar} alt={wName} style={{ width:46, height:46, borderRadius:10, objectFit:"cover", border:"2px solid #e2e8f0", flexShrink:0 }} />
                      ) : (
                        <div style={{ width:46, height:46, borderRadius:10, background:"#0f172e", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:700, color:"#06b6d4", flexShrink:0 }}>
                          {avatarInitials(wName)}
                        </div>
                      )}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:"#0f172e", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{wName}</div>
                        <div style={{ fontSize:11, color:"#06b6d4", fontWeight:600, marginTop:2 }}>{profs[0] || "Service"}</div>
                      </div>
                    </div>

                    <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:14, fontSize:11, color:"#64748b" }}>
                      {city && (
                        <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <MapPin size={10} color="#94a3b8" /> {city}
                        </span>
                      )}
                      {rating > 0 && (
                        <span style={{ display:"flex", alignItems:"center", gap:4, color:"#f59e0b", fontWeight:700 }}>
                          <Star size={10} fill="#f59e0b" color="#f59e0b" /> {rating.toFixed(1)} <span style={{ color:"#94a3b8", fontWeight:400 }}>({reviews})</span>
                        </span>
                      )}
                      <span style={{ display:"flex", alignItems:"center", gap:4, color: avail ? "#059669" : "#d97706", fontWeight:600 }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background: avail ? "#10b981" : "#f59e0b" }} />
                        {avail ? "Disponible" : "Indisponible"}
                      </span>
                    </div>

                    <div style={{ display:"flex", gap:8 }}>
                      <button
                        onClick={() => onNavigate?.("profile", { profileUser: w })}
                        style={{ flex:1, background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"8px 0", fontSize:12, fontWeight:600, color:"#0f172e", cursor:"pointer" }}
                      >
                        Voir le profil
                      </button>
                      <button
                        onClick={() => setReserving(w)}
                        disabled={!avail}
                        style={{ flex:1, background: avail ? "#06b6d4" : "#e2e8f0", border:"none", borderRadius:8, padding:"8px 0", fontSize:12, fontWeight:700, color: avail ? "#fff" : "#94a3b8", cursor: avail ? "pointer" : "not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}
                      >
                        <Calendar size={12} /> Réserver
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {reserving && (
        <ReservationDialog
          worker={reserving}
          user={user}
          onClose={() => setReserving(null)}
          onSuccess={() => setReserving(null)}
        />
      )}
    </>
  );
}
