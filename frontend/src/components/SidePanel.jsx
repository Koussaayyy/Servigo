export default function SidePanel() {
  return (
    <div className="side">
      <div className="brand">
        <div className="brand-mark">S</div>
        <div className="brand-name">Servigo</div>
      </div>
      <div className="side-body">
        <h2 className="side-title">
          Your <em>expert</em><br />
          is one tap<br />
          away.
        </h2>
        <p className="side-desc">
          Connect with verified local tradespeople —
          electricians, plumbers, carpenters and more.
        </p>
      </div>
      <div className="side-pills">
        {["Verified professionals only", "Transparent pricing", "Rated & reviewed", "Instant booking"].map((text) => (
          <div className="side-pill" key={text}>
            <span className="pill-dot" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}