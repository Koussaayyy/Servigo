import { useState, useEffect } from "react";
import { authApi, servicesApi } from "../api";
import { CITIES } from "../constants/data";

export default function GoogleCompleteSignup({ googleCredential, onSuccess }) {
  const [role, setRole]         = useState(null);
  const [phone, setPhone]       = useState("");
  const [city, setCity]         = useState("");
  const [experience, setExp]    = useState("");
  const [bio, setBio]           = useState("");
  const [selected, setSelected] = useState([]);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [step, setStep]         = useState(1); // 1 = pick role, 2 = fill details
  const [professions, setProfessions] = useState([]);

  useEffect(() => {
    servicesApi.getAll()
      .then(data => setProfessions(Array.isArray(data) ? data.map(s => s.name) : []))
      .catch(() => setProfessions(["Électricien","Plombier","Maçon","Vitrier","Menuisier","Peintre","Climatisation","Serrurier","Jardinier","Carreleur","Déménagement","Mécanicien"]));
  }, []);

  const toggle = (p) => setSelected((s) =>
    s.includes(p) ? s.filter((x) => x !== p) : [...s, p]
  );

  const submit = async () => {
    setError("");
    if (!phone) return setError("Veuillez saisir votre numéro de téléphone.");
    if (role === "worker" && selected.length === 0)
      return setError("Veuillez sélectionner au moins un métier.");
    setLoading(true);
    try {
      const res = await authApi.googleLogin(googleCredential, {
        role,
        phone,
        workerProfile: role === "worker" ? { professions: selected, city, experience, bio } : undefined,
      });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      onSuccess(res.user);
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Pick role ──────────────────────────────────
  if (step === 1) {
    return (
      <div className="anim">
        <div className="form-head">
          <h2 className="form-title">Une dernière étape.</h2>
          <p className="form-sub">Comment rejoignez-vous Servigo ?</p>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div className="type-picker">
          <button
            className={`type-card ${role === "client" ? "selected" : ""}`}
            onClick={() => setRole("client")}
          >
            <div className="type-icon">🙋</div>
            <span className="type-label">Client</span>
            <span className="type-desc">J'ai besoin d'un professionnel pour réaliser un travail.</span>
          </button>
          <button
            className={`type-card ${role === "worker" ? "selected" : ""}`}
            onClick={() => setRole("worker")}
          >
            <div className="type-icon">🧰</div>
            <span className="type-label">Prestataire</span>
            <span className="type-desc">Je suis un artisan qui propose ses services.</span>
          </button>
        </div>
        <button className="submit-btn" disabled={!role}
          onClick={() => role && setStep(2)}>
          Continuer →
        </button>
      </div>
    );
  }

  // ── Step 2: Fill details ───────────────────────────────
  return (
    <div className="anim">
      <button className="step-back" onClick={() => setStep(1)}>← Retour</button>
      <div className="form-head">
        <h2 className="form-title">Complétez votre profil.</h2>
        <p className="form-sub">Quelques détails supplémentaires.</p>
      </div>
      {error && <div className="error-msg">{error}</div>}

      <div className="field">
        <label>Numéro de téléphone</label>
        <div style={{ display:"flex",alignItems:"center",border:"1.5px solid #e2e8f0",borderRadius:9,background:"#f1f5f9",overflow:"hidden",transition:"border-color .18s" }}
          onFocusCapture={e=>e.currentTarget.style.borderColor="#06b6d4"}
          onBlurCapture={e=>e.currentTarget.style.borderColor="#e2e8f0"}>
          <span style={{ padding:"10px 12px",fontSize:13,color:"#64748b",fontWeight:600,borderRight:"1.5px solid #e2e8f0",whiteSpace:"nowrap",background:"#f1f5f9" }}>🇹🇳 +216</span>
          <input type="tel" placeholder="XX XXX XXX"
            value={phone} onChange={(e) => setPhone(e.target.value)}
            style={{ flex:1,border:"none",background:"transparent",padding:"10px 12px",fontSize:13,outline:"none" }} />
        </div>
      </div>

      {role === "worker" && (
        <>
          <div className="field-row">
            <div className="field">
              <label>Ville / Région</label>
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Sélectionner une ville…</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Années d'expérience</label>
              <select value={experience} onChange={(e) => setExp(e.target.value)}>
                <option value="">Sélectionner…</option>
                <option>Moins d'un an</option>
                <option>1–3 ans</option>
                <option>3–5 ans</option>
                <option>5–10 ans</option>
                <option>10+ ans</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Votre / Vos métier(s)</label>
            <div className="prof-grid">
              {professions.map((p) => (
                <button key={p} type="button"
                  className={`prof-chip ${selected.includes(p) ? "selected" : ""}`}
                  onClick={() => toggle(p)}>
                  {p}
                </button>
              ))}
            </div>
            <p className="field-note">Sélectionnez tout ce qui s'applique.</p>
          </div>
          <div className="field">
            <label>Courte biographie</label>
            <textarea placeholder="Parlez aux clients de votre expérience…"
              value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
        </>
      )}

      <button className="submit-btn" onClick={submit} disabled={loading}>
        {loading ? "Création du compte…" : "Finaliser l'inscription"}
      </button>
    </div>
  );
}