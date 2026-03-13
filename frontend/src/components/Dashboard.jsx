export default function Dashboard({ user, onLogout }) {
  const professions = user?.workerProfile?.professions || [];

  return (
    <div className="anim" style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>
        {user.role === "client" ? "🙋" : user.role === "worker" ? "🧰" : "⚙️"}
      </div>
      <h2 className="form-title">Welcome, {user.firstName}!</h2>
      <p className="form-sub" style={{ marginBottom: 8 }}>
        You are logged in as <strong>{user.role}</strong>
      </p>
      <p className="form-sub" style={{ marginBottom: 32 }}>{user.email}</p>

      {user.role === "worker" && (
        <div style={{ maxWidth: 640, margin: "0 auto 28px", textAlign: "left", background: "#fff", border: "1.5px solid #f0e6da", borderRadius: 12, padding: 18, boxShadow: "0 2px 12px rgba(232,98,10,0.04)" }}>
          <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "#9a7c68", marginBottom: 10, fontWeight: 700 }}>
            Votre métier enregistré
          </div>
          {professions.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {professions.map((profession) => (
                <span key={profession} style={{ padding: "7px 12px", borderRadius: 100, background: "rgba(232,98,10,0.08)", color: "#1a1008", border: "1px solid rgba(232,98,10,0.2)", fontSize: 13, fontWeight: 600 }}>
                  {profession}
                </span>
              ))}
            </div>
          ) : (
            <p className="form-sub" style={{ marginBottom: 0 }}>Aucun métier enregistré pour le moment.</p>
          )}
        </div>
      )}

      <button
        className="submit-btn"
        onClick={onLogout}
        style={{ maxWidth: 200, margin: "0 auto" }}
      >
        Logout
      </button>
    </div>
  );
}