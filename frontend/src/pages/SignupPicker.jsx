import { useState } from "react";
import GoogleIcon from "../components/GoogleIcon";

export default function SignupPicker({ onSelect }) {
  const [chosen, setChosen] = useState(null);

  return (
    <div className="anim">
      <div className="form-head">
        <h2 className="form-title">Create an account.</h2>
        <p className="form-sub">Who are you joining as?</p>
      </div>

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
      <button className="social-btn"><GoogleIcon /> Continue with Google</button>
      <p className="terms">
        By signing up you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>.
      </p>
    </div>
  );
}