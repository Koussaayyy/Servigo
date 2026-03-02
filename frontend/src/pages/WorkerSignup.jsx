import { useState } from "react";
import { authApi } from "../api";
import { PROFESSIONS, CITIES } from "../constants/data";

export default function WorkerSignup({ onBack, onSuccess }) {
  const [form, setForm]         = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [city, setCity]         = useState("");
  const [experience, setExp]    = useState("");
  const [bio, setBio]           = useState("");
  const [selected, setSelected] = useState([]);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const toggle = (p) => setSelected((s) => s.includes(p) ? s.filter((x) => x !== p) : [...s, p]);

  const submit = async () => {
    setError("");
    const { firstName, lastName, email, phone, password } = form;
    if (!firstName || !lastName || !email || !phone || !password)
      return setError("Please fill in all fields.");
    if (selected.length === 0)
      return setError("Please select at least one profession.");
    if (password.length < 8)
      return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      const res = await authApi.register({
        ...form,
        role: "worker",
        workerProfile: { professions: selected, city, experience, bio },
      }); // ✅ replaced registerUser
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      onSuccess(res.user);
    } catch (err) {
      setError(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  


  return (
    <div className="anim">
      <button className="step-back" onClick={onBack}>← Back</button>
      <div className="form-head">
        <h2 className="form-title">Professional Account.</h2>
        <p className="form-sub">Showcase your skills and connect with clients.</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="field-row">
        <div className="field">
          <label>First Name</label>
          <input name="firstName" type="text" placeholder="Ahmed"
            value={form.firstName} onChange={handle} />
        </div>
        <div className="field">
          <label>Last Name</label>
          <input name="lastName" type="text" placeholder="Bensalem"
            value={form.lastName} onChange={handle} />
        </div>
      </div>
      <div className="field">
        <label>Email Address</label>
        <input name="email" type="email" placeholder="pro@example.com"
          value={form.email} onChange={handle} />
      </div>
      <div className="field">
        <label>Phone Number</label>
        <input name="phone" type="tel" placeholder="+213 6XX XXX XXX"
          value={form.phone} onChange={handle} />
      </div>
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
      <div className="field">
        <label>Password</label>
        <input name="password" type="password" placeholder="Min. 8 characters"
          value={form.password} onChange={handle} />
      </div>

      <button className="submit-btn" onClick={submit} disabled={loading}>
        {loading ? "Creating account…" : "Create Professional Account"}
      </button>
      <p className="terms">
        By signing up you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>.
      </p>
    </div>
  );
}