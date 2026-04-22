import {
  Camera, Upload, Trash2, Save, Tag, ListChecks,
  CalendarDays, MessageSquare, KeyRound, ShieldCheck,
  TriangleAlert, Mail, Plus, X, Eye, Check,
  Loader2, IdCard, MapPin, Building2,
  CheckCircle, XCircle, UserRound, Wrench, Settings, Star, TrendingUp, Calendar,
} from "lucide-react";

export default function Dashboard({ user, onLogout }) {
  const isWorker = user?.role === "worker";
  const professions = user?.workerProfile?.professions || [];
  const rating = user?.workerProfile?.rating || 0;
  const totalReviews = user?.workerProfile?.totalReviews || 0;
  const hourlyRate = user?.workerProfile?.hourlyRate || 0;
  const isAvailable = user?.workerProfile?.isAvailable !== false;
  const city = user?.workerProfile?.city || "Non spécifiée";

  return (
    <div className="anim" style={{ padding: "40px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 48 }}>
            {isWorker ? <Wrench size={48} color="#06b6d4" /> : <UserRound size={48} color="#06b6d4" />}
          </div>
          <div>
            <h2 className="form-title" style={{ margin: 0, marginBottom: 4 }}>Bienvenue, {user.firstName}!</h2>
            <p className="form-sub" style={{ margin: 0, color: "#64748b" }}>
              {isWorker ? "Tableau de bord prestataire" : "Tableau de bord client"}
            </p>
          </div>
        </div>
      </div>

      {isWorker && (
        <>
          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
            <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Star size={18} color="#06b6d4" />
                <span style={{ fontSize: 11, textTransform: "uppercase", color: "#64748b", fontWeight: 700, letterSpacing: ".1em" }}>Note</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#0f172e", marginBottom: 4 }}>{rating.toFixed(1)}★</div>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>({totalReviews} avis)</p>
            </div>

            <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <TrendingUp size={18} color="#06b6d4" />
                <span style={{ fontSize: 11, textTransform: "uppercase", color: "#64748b", fontWeight: 700, letterSpacing: ".1em" }}>Tarif horaire</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#0f172e", marginBottom: 4 }}>{hourlyRate > 0 ? `${hourlyRate} TND` : "À discuter"}</div>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>par heure</p>
            </div>

            <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <CheckCircle size={18} color={isAvailable ? "#22c55e" : "#ef4444"} />
                <span style={{ fontSize: 11, textTransform: "uppercase", color: "#64748b", fontWeight: 700, letterSpacing: ".1em" }}>Statut</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: isAvailable ? "#22c55e" : "#ef4444", marginBottom: 4 }}>{isAvailable ? "Disponible" : "Indisponible"}</div>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>status actuel</p>
            </div>

            <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <MapPin size={18} color="#06b6d4" />
                <span style={{ fontSize: 11, textTransform: "uppercase", color: "#64748b", fontWeight: 700, letterSpacing: ".1em" }}>Localisation</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172e", marginBottom: 4 }}>{city}</div>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>zone de service</p>
            </div>
          </div>

          {/* Professions */}
          <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Wrench size={18} color="#06b6d4" />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172e", margin: 0, textTransform: "uppercase", letterSpacing: ".1em" }}>Métiers enregistrés</h3>
            </div>
            {professions.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {professions.map((profession) => (
                  <span key={profession} style={{ padding: "10px 14px", borderRadius: 100, background: "rgba(6, 182, 212, 0.08)", color: "#0f172e", border: "1.5px solid rgba(6, 182, 212, 0.2)", fontSize: 13, fontWeight: 600 }}>
                    {profession}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Aucun métier enregistré pour le moment. Mettez à jour votre profil.</p>
            )}
          </div>

          {/* Quick Info */}
          <div style={{ background: "rgba(6, 182, 212, 0.04)", border: "1.5px solid rgba(6, 182, 212, 0.1)", borderRadius: 12, padding: 20, marginBottom: 32 }}>
            <p style={{ fontSize: 13, color: "#0f172e", margin: 0, lineHeight: 1.6 }}>
              📝 Complétez votre profil pour augmenter vos chances d'être réservé. Ajoutez une photo professionnelle, décrivez votre expérience, et fixez votre tarif horaire.
            </p>
          </div>
        </>
      )}

      {!isWorker && (
        <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <p style={{ fontSize: 14, color: "#0f172e", margin: 0, lineHeight: 1.8 }}>
            Bienvenue sur Servigo! Vous pouvez maintenant:
          </p>
          <ul style={{ fontSize: 13, color: "#64748b", margin: "12px 0 0", paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Parcourir et réserver des prestataires</li>
            <li>Gérer vos réservations</li>
            <li>Consulter vos avis et évaluations</li>
          </ul>
        </div>
      )}

      <button
        className="submit-btn"
        onClick={onLogout}
        style={{ maxWidth: 200, margin: "0 auto", display: "block" }}
      >
        Déconnexion
      </button>
    </div>
  );
}