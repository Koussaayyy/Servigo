import { useState } from "react";
import { authApi } from "../api";
import { GoogleLogin } from "@react-oauth/google";
import ForgotPassword from "./ForgotPassword";

export default function LoginForm({ onSuccess }) {
  const [form, setForm]             = useState({ email: "", password: "" });
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError("");
    if (!form.email || !form.password) return setError("Veuillez remplir tous les champs.");
    setLoading(true);
    try {
      const res = await authApi.login(form.email, form.password);
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      onSuccess(res.user);
    } catch (err) {
      setError(err.message || "Échec de la connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    try {
      const res = await authApi.googleLogin(credentialResponse.credential);
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      onSuccess(res.user);
    } catch (err) {
      setError("Échec de la connexion avec Google. Réessayez.");
    }
  };

  if (showForgot) {
    return <ForgotPassword onBack={() => setShowForgot(false)} />;
  }

  return (
    <div className="anim">
      <div className="form-head">
        <h2 className="form-title">Bon retour.</h2>
        <p className="form-sub">Connectez-vous à votre compte pour continuer.</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="field">
        <label>Adresse e-mail</label>
        <input name="email" type="email" placeholder="you@example.com"
          value={form.email} onChange={handle} />
      </div>
      <div className="field">
        <label>Mot de passe</label>
        <input name="password" type="password" placeholder="••••••••"
          value={form.password} onChange={handle} />
      </div>

      <div className="forgot">
        <a href="#" onClick={(e) => { e.preventDefault(); setShowForgot(true); }}>
          Mot de passe oublié ?
        </a>
      </div>

      <button className="submit-btn" onClick={submit} disabled={loading}>
        {loading ? "Connexion en cours…" : "Se connecter"}
      </button>

      <div className="divider">ou</div>

      <GoogleLogin
        onSuccess={handleGoogle}
        onError={() => setError("Google login failed. Try again.")}
        width="100%"
        text="continue_with"
        shape="rectangular"
        theme="outline"
      />
    </div>
  );
}