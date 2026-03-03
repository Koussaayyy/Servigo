import { useState } from "react";
import { authApi } from "../api";
import { PROFESSIONS, CITIES } from "../constants/data";

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

  const toggle = (p) => setSelected((s) =>
    s.includes(p) ? s.filter((x) => x !== p) : [...s, p]
  );

  const submit = async () => {
    setError("");
    if (!phone) return setError("Please enter your phone number.");
    if (role === "worker" && selected.length === 0)
      return setError("Please select at least one profession.");
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
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Pick role ──────────────────────────────────
  if (step === 1) {
    return (
      <div className="anim">
        <div className="form-head">
          <h2 className="form-title">One more step.</h2>
          <p className="form-sub">How are you joining Servigo?</p>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div className="type-picker">
          <button
            className={`type-card ${role === "client" ? "selected" : ""}`}
            onClick={() => setRole("client")}
          >
            <div className="type-icon">🙋</div>
            <span className="type-label">Client</span>
            <span className="type-desc">I need a professional to get a job done.</span>
          </button>
          <button
            className={`type-card ${role === "worker" ? "selected" : ""}`}
            onClick={() => setRole("worker")}
          >
            <div className="type-icon">🧰</div>
            <span className="type-label">Professional</span>
            <span className="type-desc">I'm a tradesperson offering my services.</span>
          </button>
        </div>
        <button className="submit-btn" disabled={!role}
          onClick={() => role && setStep(2)}>
          Continue →
        </button>
      </div>
    );
  }

  // ── Step 2: Fill details ───────────────────────────────
  return (
    <div className="anim">
      <button className="step-back" onClick={() => setStep(1)}>← Back</button>
      <div className="form-head">
        <h2 className="form-title">Complete your profile.</h2>
        <p className="form-sub">Just a few more details.</p>
      </div>
      {error && <div className="error-msg">{error}</div>}

      <div className="field">
        <label>Phone Number</label>
        <input type="tel" placeholder="+213 6XX XXX XXX"
          value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      {role === "worker" && (
        <>
          <div className="field-row">
            <div className="field">
              <label>City / Region</label>
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Select city…</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Years of Experience</label>
              <select value={experience} onChange={(e) => setExp(e.target.value)}>
                <option value="">Select…</option>
                <option>Less than 1 year</option>
                <option>1–3 years</option>
                <option>3–5 years</option>
                <option>5–10 years</option>
                <option>10+ years</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Your Profession(s)</label>
            <div className="prof-grid">
              {PROFESSIONS.map((p) => (
                <button key={p} type="button"
                  className={`prof-chip ${selected.includes(p) ? "selected" : ""}`}
                  onClick={() => toggle(p)}>
                  {p}
                </button>
              ))}
            </div>
            <p className="field-note">Select all that apply.</p>
          </div>
          <div className="field">
            <label>Short Bio</label>
            <textarea placeholder="Tell clients about your experience…"
              value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
        </>
      )}

      <button className="submit-btn" onClick={submit} disabled={loading}>
        {loading ? "Creating account…" : "Complete Signup"}
      </button>
    </div>
  );
}