export default function Dashboard({ user, onLogout }) {
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