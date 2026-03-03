import { useState } from "react";
import { authApi } from "../api";

export default function ForgotPassword({ onBack }) {
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(""); setSuccess("");
    if (!email) return setError("Please enter your email.");
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      console.log("✅ Response:", res);
      setSuccess(res.message || "Reset link sent to your email!");
    } catch (err) {
      console.log("❌ Error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="anim">
      <button className="step-back" onClick={onBack}>← Back</button>
      <div className="form-head">
        <h2 className="form-title">Forgot password?</h2>
        <p className="form-sub">Enter your email and we'll send you a reset link.</p>
      </div>

      {error   && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="field">
        <label>Email Address</label>
        <input type="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <button className="submit-btn" onClick={submit} disabled={loading}>
        {loading ? "Sending…" : "Send Reset Link"}
      </button>
    </div>
  );
}