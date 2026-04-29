import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { adminAuthApi } from "../api";

export default function AdminLoginModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ email: "admin@gmail.com", password: "admin" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      return setError("Please fill in all fields.");
    }
    setLoading(true);
    try {
      const res = await adminAuthApi.login(form.email, form.password);
      localStorage.setItem("adminToken", res.token);
      localStorage.setItem("admin", JSON.stringify(res.admin));
      onSuccess(res.admin);
      onClose();
    } catch (err) {
      setError(err.message || "Admin login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,46,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: 16, display: "grid", gridTemplateColumns: "1fr 1fr", maxWidth: 900, width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative", boxShadow: "0 30px 80px rgba(15,23,46,0.35)", overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ background: "linear-gradient(145deg, #0f172e 0%, #10203c 58%, #12436e 100%)", padding: 50, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-start", color: "#fff", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, right: -20, width: 200, height: 200, background: "rgba(34,211,238,0.12)", borderRadius: "50%", zIndex: 0 }} />
          <div style={{ position: "absolute", bottom: -30, left: -50, width: 250, height: 250, background: "rgba(6,182,212,0.14)", borderRadius: "50%", zIndex: 0 }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2, marginBottom: 30 }}>Rejoignez Servigo</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { text: "Artisans vérifiés en Tunisie" },
                { text: "Réservation rapide et sécurisée" },
                { text: "Tarifs transparents et honnêtes" },
              ].map((item, index) => (
                <div key={index} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#22d3ee", marginTop: -2 }}>✓</div>
                  <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 1, width: "100%", textAlign: "center" }}>
            <div style={{ width: 60, height: 60, border: "2px solid #22d3ee", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 28, color: "#22d3ee", margin: "0 auto", marginBottom: 16, background: "rgba(15,23,46,0.35)" }}>S</div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(226,232,240,0.9)" }}>Servigo</div>
          </div>
        </div>

        {/* Form Area */}
        <div style={{ padding: 48, overflowY: "auto", display: "flex", flexDirection: "column", justifyContent: "flex-start", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", fontSize: 28, cursor: "pointer", color: "#94a3b8", zIndex: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={24} />
          </button>

          <div style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172e", marginBottom: 8 }}>Welcome back.</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Sign in to your account to continue.</p>

            {error && (
              <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: "#dc2626" }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0f172e", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "Sora, sans-serif", outline: "none", transition: "all 0.2s", boxSizing: "border-box" }} onFocus={(e) => { e.target.style.borderColor = "#06b6d4"; e.target.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.1)"; }} onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0f172e", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" style={{ width: "100%", padding: "12px 16px", paddingRight: 40, border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "Sora, sans-serif", outline: "none", transition: "all 0.2s", boxSizing: "border-box" }} onFocus={(e) => { e.target.style.borderColor = "#06b6d4"; e.target.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.1)"; }} onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="button" onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "12px 24px", background: loading ? "#cbd5e1" : "#06b6d4", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.3s", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
