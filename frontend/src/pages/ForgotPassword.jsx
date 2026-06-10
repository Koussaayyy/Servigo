import { useState } from "react";
import { authApi } from "../api";

export default function ForgotPassword({ onBack }) {
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(""); setSuccess("");
    if (!email) return setError("Veuillez saisir votre adresse e-mail.");
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      console.log("✅ Response:", res);
      setSuccess(res.message || "Lien de réinitialisation envoyé à votre adresse e-mail !");
    } catch (err) {
      console.log("❌ Error:", err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="anim">
      <button className="step-back" onClick={onBack}>← Retour</button>
      <div className="form-head">
        <h2 className="form-title">Mot de passe oublié ?</h2>
        <p className="form-sub">Saisissez votre e-mail et nous vous enverrons un lien de réinitialisation.</p>
      </div>

      {error   && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="field">
        <label>Adresse e-mail</label>
        <input type="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <button className="submit-btn" onClick={submit} disabled={loading}>
        {loading ? "Envoi en cours…" : "Envoyer le lien de réinitialisation"}
      </button>
    </div>
  );
}