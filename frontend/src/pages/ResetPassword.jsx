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
    if (!password || !confirm) return setError("Please fill in all fields.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const res = await authApi.resetPassword(token, password);
      setSuccess(res.message);
      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      setError(err.message || "Invalid or expired link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="anim">
      <div className="form-head">
        <h2 className="form-title">Reset password.</h2>
        <p className="form-sub">Enter your new password below.</p>
      </div>

      {error   && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success} Redirecting to login…</div>}

      <div className="field">
        <label>New Password</label>
        <input type="password" placeholder="Min. 8 characters"
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="field">
        <label>Confirm Password</label>
        <input type="password" placeholder="Repeat password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>

      <button className="submit-btn" onClick={submit} disabled={loading || !!success}>
        {loading ? "Resetting…" : "Reset Password"}
      </button>
    </div>
  );
}