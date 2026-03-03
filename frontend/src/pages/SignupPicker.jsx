import { useState } from "react";
import { authApi } from "../api";
import { GoogleLogin } from "@react-oauth/google";

export default function SignupPicker({ onSelect, onGoogleSuccess, onGoogleComplete }) {
  const [chosen, setChosen] = useState(null);
  const [error, setError]   = useState("");

 const handleGoogle = async (credentialResponse) => {
    try {
      const res = await authApi.googleLogin(credentialResponse.credential);
      if (res.needsCompletion) {
        // New user — show completion form
        onGoogleComplete(credentialResponse.credential);
      } else {
        // Existing user — just log in
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        onGoogleSuccess(res.user);
      }
    } catch (err) {
      setError("Google signup failed. Try again.");
    }
  };

  return (
    <div className="anim">
      <div className="form-head">
        <h2 className="form-title">Create an account.</h2>
        <p className="form-sub">Who are you joining as?</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="type-picker">
        <button
          className={`type-card ${chosen === "client" ? "selected" : ""}`}
          onClick={() => setChosen("client")}
        >
          <div className="type-icon">🙋</div>
          <span className="type-label">Client</span>
          <span className="type-desc">I need a professional to get a job done.</span>
        </button>
        <button
          className={`type-card ${chosen === "worker" ? "selected" : ""}`}
          onClick={() => setChosen("worker")}
        >
          <div className="type-icon">🧰</div>
          <span className="type-label">Professional</span>
          <span className="type-desc">I'm a tradesperson offering my services.</span>
        </button>
      </div>

      <button className="submit-btn" disabled={!chosen}
        onClick={() => chosen && onSelect(chosen)}>
        Continue →
      </button>

      <div className="divider">or</div>

      <GoogleLogin
        onSuccess={handleGoogle}
        onError={() => setError("Google signup failed. Try again.")}
        width="100%"
        text="signup_with"
        shape="rectangular"
        theme="outline"
      />

      <p className="terms">
        By signing up you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>.
      </p>
    </div>
  );
}