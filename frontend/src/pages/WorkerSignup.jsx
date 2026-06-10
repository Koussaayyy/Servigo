import { useState } from "react";
import { authApi } from "../api";

export default function WorkerSignup({ onBack, onSuccess }) {
  const [form, setForm]       = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [confirm, setConfirm] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError("");
    const { firstName, lastName, email, phone, password } = form;
    if (!firstName || !lastName || !email || !phone || !password || !confirm)
      return setError("Veuillez remplir tous les champs.");
    if (password.length < 8)
      return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirm)
      return setError("Les mots de passe ne correspondent pas.");
    setLoading(true);
    try {
      const res = await authApi.register({ ...form, role: "worker" });
      // Don't store token yet - email verification required first
      onSuccess(res.user);
    } catch (err) {
      setError(err.message || "Échec de l'inscription. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="anim">
      <button className="step-back" onClick={onBack}>← Retour</button>
      <div className="form-head">
        <h2 className="form-title">Compte prestataire.</h2>
        <p className="form-sub">Mettez en valeur vos compétences et connectez-vous avec des clients.</p>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div className="field-row">
        <div className="field">
          <label>Prénom</label>
          <input name="firstName" type="text" placeholder="Ahmed"
            value={form.firstName} onChange={handle} />
        </div>
        <div className="field">
          <label>Nom</label>
          <input name="lastName" type="text" placeholder="Bensalem"
            value={form.lastName} onChange={handle} />
        </div>
      </div>
      <div className="field">
        <label>Adresse e-mail</label>
        <input name="email" type="email" placeholder="pro@example.com"
          value={form.email} onChange={handle} />
      </div>
      <div className="field">
        <label>Numéro de téléphone</label>
        <div style={{ display:"flex",alignItems:"center",border:"1.5px solid #e2e8f0",borderRadius:9,background:"#f1f5f9",overflow:"hidden",transition:"border-color .18s" }}
          onFocusCapture={e=>e.currentTarget.style.borderColor="#06b6d4"}
          onBlurCapture={e=>e.currentTarget.style.borderColor="#e2e8f0"}>
          <span style={{ padding:"10px 12px",fontSize:13,color:"#64748b",fontWeight:600,borderRight:"1.5px solid #e2e8f0",whiteSpace:"nowrap",background:"#f1f5f9" }}>🇹🇳 +216</span>
          <input name="phone" type="tel" placeholder="XX XXX XXX"
            value={form.phone} onChange={handle}
            style={{ flex:1,border:"none",background:"transparent",padding:"10px 12px",fontSize:13,outline:"none" }} />
        </div>
      </div>
      <div className="field">
        <label>Mot de passe</label>
        <input name="password" type="password" placeholder="Min. 8 caractères"
          value={form.password} onChange={handle} />
      </div>
      <div className="field">
        <label>Confirmer le mot de passe</label>
        <input type="password" placeholder="Répéter le mot de passe"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <button className="submit-btn" onClick={submit} disabled={loading}>
        {loading ? "Création du compte…" : "Créer un compte prestataire"}
      </button>
      <p className="terms">
        En vous inscrivant, vous acceptez nos <a href="#">Conditions d'utilisation</a> &amp; notre <a href="#">Politique de confidentialité</a>.
      </p>
    </div>
  );
}