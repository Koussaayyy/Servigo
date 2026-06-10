export default function SidePanel() {
  return (
    <div className="side">
      <div className="brand">
        <div className="brand-mark">S</div>
        <div className="brand-name">Servigo</div>
      </div>
      <div className="side-body">
        <h2 className="side-title">
          Votre <em>expert</em><br />
          est à portée<br />
          de main.
        </h2>
        <p className="side-desc">
          Connectez-vous avec des artisans locaux vérifiés —
          électriciens, plombiers, menuisiers et bien plus.
        </p>
      </div>
      <div className="side-pills">
        {["Professionnels vérifiés uniquement", "Tarifs transparents", "Notés et évalués", "Réservation instantanée"].map((text) => (
          <div className="side-pill" key={text}>
            <span className="pill-dot" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}