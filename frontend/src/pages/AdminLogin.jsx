// AdminLogin.jsx - Separate admin login page
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { adminAuthApi } from "../api";

export default function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error("Email et mot de passe requis");
      }

      const res = await adminAuthApi.login(email, password);

      if (res.success) {
        localStorage.setItem("adminToken", res.token);
        localStorage.setItem("admin", JSON.stringify(res.admin));
        onSuccess?.(res.admin);
      }
    } catch (err) {
      setError(err.message || "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "40%",
          background: "linear-gradient(135deg, #0f172e 0%, #1a2b4a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          color: "#fff",
          textAlign: "center",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            background: "rgba(6, 182, 212, 0.1)",
            border: "2px solid rgba(6, 182, 212, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 800,
            color: "#06b6d4",
          }}
        >
          S
        </div>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
            Admin Access
          </h1>
          <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8 }}>
            Connexion sécurisée réservée aux administrateurs de Servigo
          </p>
        </div>
      </div>

      {/* Form Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 380 }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172e", marginBottom: 8 }}>
              Bienvenue Admin
            </h2>
            <p style={{ fontSize: 14, color: "#64748b" }}>
              Entrez vos identifiants pour accéder au tableau de bord
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            {/* Email */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#0f172e",
                  marginBottom: 8,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Email
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "12px 14px",
                  transition: "all 0.2s",
                }}
              >
                <Mail size={18} color="#94a3b8" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 14,
                    color: "#0f172e",
                    fontFamily: "Sora, sans-serif",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#0f172e",
                  marginBottom: 8,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Mot de passe
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "12px 14px",
                  transition: "all 0.2s",
                }}
              >
                <Lock size={18} color="#94a3b8" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 14,
                    color: "#0f172e",
                    fontFamily: "Sora, sans-serif",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "rgba(220, 38, 38, 0.1)",
                  border: "1.5px solid rgba(220, 38, 38, 0.3)",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 13,
                  color: "#b91c1c",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#0f172e",
                color: "#06b6d4",
                border: "none",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginTop: 8,
                transition: "all 0.2s",
                fontFamily: "Sora, sans-serif",
              }}
            >
              {loading ? "Connexion..." : "Connexion Admin"}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: "1.5px solid #e2e8f0",
              textAlign: "center",
              fontSize: 12,
              color: "#94a3b8",
            }}
          >
            Accès administrateur sécurisé • Servigo 2026
          </div>
        </div>
      </div>
    </div>
  );
}
