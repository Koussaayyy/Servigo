import { useState } from "react";
import { authApi } from "../api";

export default function ClientSignup({ onBack, onSuccess }) {
  const [form, setForm]       = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [confirm, setConfirm] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError("");
    const { firstName, lastName, email, phone, password } = form;
    if (!firstName || !lastName || !email || !phone || !password || !confirm)
      return setError("Please fill in all fields.");
    if (password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (password !== confirm)
      return setError("Passwords do not match.");
    setLoading(true);
    try {
      const res = await authApi.register({ ...form, role: "client" });
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
        <h2 className="form-title">Client Account.</h2>
        <p className="form-sub">Find trusted professionals in minutes.</p>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div className="field-row">
        <div className="field">
          <label>First Name</label>
          <input name="firstName" type="text" placeholder="Jane"
            value={form.firstName} onChange={handle} />
        </div>
        <div className="field">
          <label>Last Name</label>
          <input name="lastName" type="text" placeholder="Doe"
            value={form.lastName} onChange={handle} />
        </div>
      </div>
      <div className="field">
        <label>Email Address</label>
        <input name="email" type="email" placeholder="you@example.com"
          value={form.email} onChange={handle} />
      </div>
      <div className="field">
        <label>Phone Number</label>
        <input name="phone" type="tel" placeholder="+216 XX XXX XXX"
          value={form.phone} onChange={handle} />
      </div>
      <div className="field">
        <label>Password</label>
        <input name="password" type="password" placeholder="Min. 8 characters"
          value={form.password} onChange={handle} />
      </div>
      <div className="field">
        <label>Confirm Password</label>
        <input type="password" placeholder="Repeat password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <button className="submit-btn" onClick={submit} disabled={loading}>
        {loading ? "Creating account…" : "Create Client Account"}
      </button>
      <p className="terms">
        By signing up you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>.
      </p>
    </div>
  );
}