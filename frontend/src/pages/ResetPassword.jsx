import { useState } from "react";
import { authApi } from "../api";

export default function ResetPassword({ token, onSuccess }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  const submit = async () => {
    setError(""); setSuccess("");
    if (!password || !confirm) return setError("Veuillez remplir tous les champs.");
    if (password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirm) return setError("Les mots de passe ne correspondent pas.");
    setLoading(true);
    try {
      const res = await authApi.resetPassword(token, password);
      setSuccess(res.message);
      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      setError(err.message || "Lien invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="anim">
      <div className="form-head">
        <h2 className="form-title">Réinitialiser le mot de passe.</h2>
        <p className="form-sub">Saisissez votre nouveau mot de passe ci-dessous.</p>
      </div>

      {error   && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success} Redirection vers la connexion…</div>}

      <div className="field">
        <label>Nouveau mot de passe</label>
        <input type="password" placeholder="Min. 8 caractères"
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="field">
        <label>Confirmer le mot de passe</label>
        <input type="password" placeholder="Répéter le mot de passe"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>

      <button className="submit-btn" onClick={submit} disabled={loading || !!success}>
        {loading ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
      </button>
    </div>
  );
}