import { useState } from "react";
import { authApi } from "../api";
import { GoogleLogin } from "@react-oauth/google";
import { UserRound, Wrench } from "lucide-react";

export default function SignupPicker({ onSelect, onGoogleSuccess, onGoogleComplete }) {
  const [chosen, setChosen] = useState(null);
  const [error, setError]   = useState("");

  const handleGoogle = async (credentialResponse) => {
    try {
      const res = await authApi.googleLogin(credentialResponse.credential);
      if (res.needsCompletion) {
        onGoogleComplete(credentialResponse.credential);
      } else {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        onGoogleSuccess(res.user);
      }
    } catch (err) {
      setError("Échec de l'inscription avec Google. Réessayez.");
    }
  };

  return (
    <div className="anim">
      <div className="form-head">
        <h2 className="form-title">Créer un compte.</h2>
        <p className="form-sub">En tant que qui vous inscrivez-vous ?</p>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div className="type-picker">
        <button
          className={`type-card ${chosen === "client" ? "selected" : ""}`}
          onClick={() => setChosen("client")}
        >
          <div className="type-icon">
            <UserRound size={28} strokeWidth={1.5} />
          </div>
          <span className="type-label">Client</span>
          <span className="type-desc">J'ai besoin d'un professionnel pour réaliser un travail.</span>
        </button>
        <button
          className={`type-card ${chosen === "worker" ? "selected" : ""}`}
          onClick={() => setChosen("worker")}
        >
          <div className="type-icon">
            <Wrench size={28} strokeWidth={1.5} />
          </div>
          <span className="type-label">Prestataire</span>
          <span className="type-desc">Je suis un artisan qui propose ses services.</span>
        </button>
      </div>
      <button className="submit-btn" disabled={!chosen}
        onClick={() => chosen && onSelect(chosen)}>
        Continuer →
      </button>
      <div className="divider">ou</div>
      <GoogleLogin
        onSuccess={handleGoogle}
        onError={() => setError("Échec de l'inscription avec Google. Réessayez.")}
        width="100%"
        text="signup_with"
        shape="rectangular"
        theme="outline"
      />
      <p className="terms">
        En vous inscrivant, vous acceptez nos <a href="#">Conditions d'utilisation</a> &amp; notre <a href="#">Politique de confidentialité</a>.
      </p>
    </div>
  );
}