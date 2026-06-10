import { useState } from "react";
import { Mail, ArrowRight, Clock } from "lucide-react";
import { authApi } from "../api";

export default function EmailVerification({ email, onSuccess, onResendCode }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!code || code.length !== 6) {
      setError("Le code doit comporter 6 chiffres");
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.verifyEmail(email, code);
      setSuccess("✓ Adresse e-mail vérifiée avec succès !");
      setTimeout(() => onSuccess(result), 1500);
    } catch (err) {
      setError(err.message || "Code de vérification invalide");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setCode("");

    try {
      await onResendCode?.(email);
      setSuccess("Code envoyé à votre adresse e-mail !");
      setResendCountdown(30);
      const interval = setInterval(() => {
        setResendCountdown((p) => {
          if (p <= 1) {
            clearInterval(interval);
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    } catch (err) {
      setError("Échec du renvoi du code");
    }
  };

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(val);
    setError("");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "20px" }}>
      <div style={{ maxWidth: 480, width: "100%", background: "#fff", borderRadius: 16, padding: 40, boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, background: "rgba(6,182,212,0.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
            <Mail size={30} color="#06b6d4" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172e", marginBottom: 8 }}>Vérifiez votre adresse e-mail</h2>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
            Nous avons envoyé un code à 6 chiffres à<br /><strong>{email}</strong>
          </p>
        </div>

        {/* Code Input */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>
            Code de vérification
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength="6"
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            style={{
              width: "100%",
              fontSize: 28,
              fontWeight: 700,
              textAlign: "center",
              padding: 16,
              border: `2px solid ${error ? "#ef4444" : code ? "#06b6d4" : "#e2e8f0"}`,
              borderRadius: 8,
              outline: "none",
              transition: "border-color 0.2s",
              background: error ? "rgba(239,68,68,0.04)" : "#f8fafc",
              letterSpacing: "8px",
            }}
          />
          {error && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>⚠ {error}</p>}
          {success && <p style={{ fontSize: 12, color: "#10b981", marginTop: 8 }}>✓ {success}</p>}
        </div>

        {/* Time info */}
        <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 8, padding: 12, marginBottom: 24, display: "flex", gap: 10, alignItems: "center", fontSize: 12, color: "#92400e" }}>
          <Clock size={16} />
          <span>Ce code expire dans <strong>30 minutes</strong></span>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || code.length !== 6}
          style={{
            width: "100%",
            padding: 12,
            background: code.length === 6 && !loading ? "#06b6d4" : "#cbd5e1",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            cursor: code.length === 6 && !loading ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            letterSpacing: "0.06em",
          }}
        >
          {loading ? "Vérification…" : <>Vérifier <ArrowRight size={14} /></>}
        </button>

        {/* Resend Code */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Vous n'avez pas reçu le code ?</p>
          <button
            onClick={handleResend}
            disabled={resendCountdown > 0 || loading}
            style={{
              background: "none",
              border: "none",
              color: resendCountdown > 0 ? "#94a3b8" : "#06b6d4",
              cursor: resendCountdown > 0 ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "underline",
              transition: "color 0.2s",
            }}
          >
            {resendCountdown > 0 ? `Renvoyer dans ${resendCountdown}s` : "Renvoyer le code"}
          </button>
        </div>
      </div>
    </div>
  );
}
