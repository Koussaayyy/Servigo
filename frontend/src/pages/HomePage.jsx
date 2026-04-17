import { useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  Wrench,
  Zap,
  Paintbrush,
  Hammer,
  Snowflake,
  ShieldCheck,
  Star,
  SlidersHorizontal,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { avatarUrl, workerApi } from "../api";

const CATEGORIES = [
  { key: "Plombier", icon: Wrench, aliases: ["plombier", "plumbing", "plumber"] },
  { key: "Electricien", icon: Zap, aliases: ["electricien", "electrician", "electricity"] },
  { key: "Peintre", icon: Paintbrush, aliases: ["peintre", "painter", "painting"] },
  { key: "Menuisier", icon: Hammer, aliases: ["menuisier", "carpenter", "woodwork"] },
  { key: "Climatisation", icon: Snowflake, aliases: ["climatisation", "hvac", "air condition"] },
  { key: "Serrurier", icon: ShieldCheck, aliases: ["serrurier", "locksmith"] },
];

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .trim();

const professionMatches = (workerProfessions = [], selectedCategory = "") => {
  if (!selectedCategory) return true;
  const selected = normalize(selectedCategory);
  const aliases = CATEGORIES.find((item) => item.key === selectedCategory)?.aliases || [];
  const normalizedWorkerProfessions = workerProfessions.map((profession) => normalize(profession));
  return normalizedWorkerProfessions.some((profession) => {
    if (profession.includes(selected)) return true;
    return aliases.some((alias) => profession.includes(normalize(alias)));
  });
};

const starString = (value) => {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
};

function WorkerCard({ worker, onReserve }) {
  const firstName = worker?.firstName || "Prestataire";
  const lastName = worker?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const professions = worker?.workerProfile?.professions || [];
  const city = worker?.workerProfile?.city || "Ville non précisée";
  const rate = Number(worker?.workerProfile?.hourlyRate || 0);
  const rating = Number(worker?.workerProfile?.rating || 0);
  const available = worker?.workerProfile?.isAvailable !== false;

  return (
    <article className="hp-card">
      <div className="hp-card-head">
        {avatarUrl(worker?.avatar) ? (
          <img src={avatarUrl(worker?.avatar)} alt={fullName} className="hp-card-avatar" />
        ) : (
          <div className="hp-card-avatar hp-card-avatar-fallback">{(firstName[0] || "?").toUpperCase()}</div>
        )}

        <div>
          <h3 className="hp-card-name">{fullName}</h3>
          <p className="hp-card-prof">{professions[0] || "Service à domicile"}</p>
          <p className="hp-card-city"><MapPin size={13} /> {city}</p>
        </div>
      </div>

      <div className="hp-card-badge-row">
        <span className={`hp-badge ${available ? "ok" : "off"}`}>
          {available ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
          {available ? "Disponible" : "Indisponible"}
        </span>
      </div>

      <div className="hp-card-meta">
        <div>
          <div className="hp-meta-label">Note</div>
          <div className="hp-stars"><Star size={13} /> {starString(rating)} <span>{rating.toFixed(1)}</span></div>
        </div>
        <div>
          <div className="hp-meta-label">Tarif horaire</div>
          <div className="hp-rate">{rate > 0 ? `${rate} TND/h` : "Tarif à discuter"}</div>
        </div>
      </div>

      <div className="hp-tags">
        {professions.slice(0, 3).map((profession) => (
          <span key={`${worker._id}-${profession}`}>{profession}</span>
        ))}
      </div>

      <button type="button" className="hp-reserve-btn" onClick={() => onReserve(worker)}>
        Réserver
      </button>
    </article>
  );
}

export default function HomePage({ onLogin, onSignup, onReserveWorker }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [profession, setProfession] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(200);

  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await workerApi.getMarketplaceWorkers({ profession, city });
        setWorkers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Impossible de charger les prestataires");
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [profession, city]);

  const stats = useMemo(() => {
    const totalWorkers = workers.length;
    const totalReviews = workers.reduce((sum, w) => sum + (w?.workerProfile?.totalReviews || 0), 0);
    const avgRating = totalWorkers > 0 
      ? (workers.reduce((sum, w) => sum + (w?.workerProfile?.rating || 0), 0) / totalWorkers).toFixed(1)
      : 0;
    return { totalWorkers, totalReviews, avgRating };
  }, [workers]);

  const cityOptions = useMemo(() => {
    const set = new Set();
    workers.forEach((worker) => {
      const workerCity = String(worker?.workerProfile?.city || "").trim();
      if (workerCity) set.add(workerCity);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [workers]);

  const visibleWorkers = useMemo(() => {
    const q = normalize(search);
    const result = workers.filter((worker) => {
      const professions = worker?.workerProfile?.professions || [];
      const cityValue = String(worker?.workerProfile?.city || "").trim();
      const rating = Number(worker?.workerProfile?.rating || 0);
      const hourlyRate = Number(worker?.workerProfile?.hourlyRate || 0);

      const haystack = normalize([
        worker?.firstName,
        worker?.lastName,
        cityValue,
        ...professions,
      ].join(" "));

      if (q && !haystack.includes(q)) return false;
      if (!professionMatches(professions, profession)) return false;
      if (minRating > 0 && rating < minRating) return false;
      if (hourlyRate > 0 && hourlyRate < priceMin) return false;
      if (hourlyRate > 0 && hourlyRate > priceMax) return false;
      return true;
    });
    return result;
  }, [workers, search, profession, minRating, priceMin, priceMax]);

  return (
    <div className="hp-root">
      <header className="hp-header">
        <div className="hp-header-top">
          <div className="hp-logo-section">
            <div className="hp-logo">servigo</div>
            <p className="hp-tagline">Trouvez les meilleurs prestataires qualifiés près de vous</p>
          </div>
          <div className="hp-auth-actions">
            <button type="button" onClick={onLogin} className="hp-auth-btn ghost">Se connecter</button>
            <button type="button" onClick={onSignup} className="hp-auth-btn solid">Créer un compte</button>
          </div>
        </div>

        <div className="hp-search-wrap">
          <div className="hp-search-input">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher: plombier, electricien, peinture..."
            />
          </div>

          <div className="hp-city-input">
            <MapPin size={16} />
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">Toutes les villes</option>
              {cityOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <section className="hp-categories">
        <div className="hp-section-head">
          <h2>Catégories de services</h2>
        </div>
        <div className="hp-category-grid">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const active = profession === category.key;
            return (
              <button
                key={category.key}
                type="button"
                className={`hp-category-item ${active ? "active" : ""}`}
                onClick={() => setProfession(active ? "" : category.key)}
              >
                <Icon size={18} />
                <span>{category.key}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="hp-stats">
        <div className="hp-stats-container">
          <div className="hp-stat">
            <div className="hp-stat-number">{stats.totalWorkers}+</div>
            <div className="hp-stat-label">Professionnels vérifiés</div>
          </div>
          <div className="hp-stat">
            <div className="hp-stat-number">{stats.totalReviews}+</div>
            <div className="hp-stat-label">Services évalués</div>
          </div>
          <div className="hp-stat">
            <div className="hp-stat-number">{stats.avgRating}★</div>
            <div className="hp-stat-label">Note moyenne</div>
          </div>
          <div className="hp-stat">
            <div className="hp-stat-number">24/7</div>
            <div className="hp-stat-label">Support client</div>
          </div>
        </div>
      </section>

      <section className="hp-how-it-works">
        <h2>Comment ça marche</h2>
        <div className="hp-steps">
          <div className="hp-step">
            <div className="hp-step-icon">🔍</div>
            <div className="hp-step-title">Recherchez</div>
            <div className="hp-step-desc">Trouvez le professionnel idéal dans votre ville</div>
          </div>
          <div className="hp-step">
            <div className="hp-step-icon">📅</div>
            <div className="hp-step-title">Réservez</div>
            <div className="hp-step-desc">Fixez une date et heure qui vous convient</div>
          </div>
          <div className="hp-step">
            <div className="hp-step-icon">💬</div>
            <div className="hp-step-title">Discutez</div>
            <div className="hp-step-desc">Communiquez directement avant le service</div>
          </div>
          <div className="hp-step">
            <div className="hp-step-icon">⭐</div>
            <div className="hp-step-title">Évaluez</div>
            <div className="hp-step-desc">Notez et partagez votre expérience</div>
          </div>
        </div>
      </section>

      <section className="hp-featured">
        <h2>Prestataires en vedette</h2>
        <div className="hp-featured-grid">
          {workers.slice(0, 6).map((worker) => (
            <WorkerCard key={worker._id} worker={worker} onReserve={onReserveWorker} />
          ))}
        </div>
      </section>

      <section className="hp-market">
        <aside className="hp-filters-panel">
          <div className="hp-filters-title"><SlidersHorizontal size={16} /> Filtres</div>

          <label>
            Ville
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">Toutes les villes</option>
              {cityOptions.map((item) => (
                <option key={`f-${item}`} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            Métier
            <select value={profession} onChange={(event) => setProfession(event.target.value)}>
              <option value="">Tous</option>
              {CATEGORIES.map((item) => (
                <option key={item.key} value={item.key}>{item.key}</option>
              ))}
            </select>
          </label>

          <label>
            Note minimale
            <select value={minRating} onChange={(event) => setMinRating(Number(event.target.value))}>
              <option value={0}>Toutes</option>
              <option value={3}>3+ étoiles</option>
              <option value={4}>4+ étoiles</option>
              <option value={5}>5 étoiles</option>
            </select>
          </label>

          <label>
            Prix (TND/h)
            <div className="hp-price-row">
              <input type="number" min={0} value={priceMin} onChange={(event) => setPriceMin(Number(event.target.value) || 0)} />
              <span>-</span>
              <input type="number" min={0} value={priceMax} onChange={(event) => setPriceMax(Number(event.target.value) || 0)} />
            </div>
          </label>
        </aside>

        <div className="hp-results">
          <div className="hp-results-head">
            <h2>Prestataires disponibles</h2>
            <span>{visibleWorkers.length} résultat(s)</span>
          </div>

          {loading && <p className="hp-state">Chargement...</p>}
          {!loading && error && <p className="hp-state error">{error}</p>}
          {!loading && !error && visibleWorkers.length === 0 && (
            <p className="hp-state">Aucun prestataire pour ces filtres.</p>
          )}

          <div className="hp-cards-grid">
            {visibleWorkers.map((worker) => (
              <WorkerCard key={worker._id} worker={worker} onReserve={onReserveWorker} />
            ))}
          </div>
        </div>
      </section>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.hp-root {
  min-height: 100vh;
  background:
    radial-gradient(circle at 10% 0%, rgba(6, 182, 212, 0.1), transparent 42%),
    #f4f7fb;
  color: #0f172e;
  font-family: 'Sora', sans-serif;
  padding: 22px 20px 60px;
}
.hp-header {
  max-width: 1280px;
  margin: 0 auto 22px;
  padding: 18px;
  border-radius: 18px;
  border: 1.5px solid rgba(6, 182, 212, 0.18);
  background: #fff;
}
.hp-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.hp-logo-section {
  display: grid;
  gap: 4px;
}
.hp-logo {
  text-transform: lowercase;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--orange);
}
.hp-tagline {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  line-height: 1.3;
}
.hp-auth-actions {
  display: flex;
  gap: 10px;
}
.hp-auth-btn {
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  font-family: 'Sora', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}
.hp-auth-btn.ghost {
  border: 1.5px solid rgba(6, 182, 212, 0.18);
  background: #fff;
  color: var(--ink);
}
.hp-auth-btn.solid {
  background: var(--orange);
  color: #fff;
}
.hp-search-wrap {
  display: grid;
  grid-template-columns: 1.6fr 0.8fr;
  gap: 10px;
}
.hp-search-input,
.hp-city-input {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1.5px solid rgba(6, 182, 212, 0.18);
  border-radius: 999px;
  padding: 0 14px;
  min-height: 48px;
}
.hp-search-input input,
.hp-city-input select {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-family: 'Sora', sans-serif;
  color: #0f172e;
  font-size: 14px;
}
.hp-categories,
.hp-market {
  max-width: 1280px;
  margin: 0 auto;
}
.hp-categories {
  margin-bottom: 16px;
}
.hp-stats {
  max-width: 1280px;
  margin: 28px auto;
  padding: 0 20px;
}
.hp-stats-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}
.hp-stat {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(15, 23, 46, 0.04));
  border: 1.5px solid rgba(6, 182, 212, 0.2);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  backdrop-filter: blur(8px);
  transition: transform .2s, box-shadow .2s;
}
.hp-stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.12);
}
.hp-stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--orange);
  margin-bottom: 6px;
}
.hp-stat-label {
  font-size: 13px;
  color: #64748b;
  letter-spacing: 0.5px;
}
.hp-how-it-works {
  max-width: 1280px;
  margin: 44px auto 40px;
  padding: 0 20px;
}
.hp-how-it-works h2 {
  font-size: 28px;
  margin: 0 0 32px;
  text-align: center;
  color: #0f172e;
}
.hp-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.hp-step {
  background: #fff;
  border: 1.5px solid rgba(6, 182, 212, 0.16);
  border-radius: 16px;
  padding: 28px 20px;
  text-align: center;
  transition: transform .2s, box-shadow .2s, border-color .2s;
}
.hp-step:hover {
  transform: translateY(-4px);
  border-color: rgba(6, 182, 212, 0.36);
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.12);
}
.hp-step-icon {
  font-size: 48px;
  margin-bottom: 14px;
  line-height: 1;
}
.hp-step-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172e;
  margin-bottom: 8px;
}
.hp-step-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
}
.hp-featured {
  max-width: 1280px;
  margin: 36px auto;
  padding: 0 20px;
  display: none;
}
.hp-featured h2 {
  font-size: 24px;
  margin: 0 0 18px;
}
.hp-featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 12px;
}
.hp-section-head h2,
.hp-results-head h2 {
  font-size: 24px;
  margin: 0 0 12px;
}
.hp-category-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}
.hp-category-item {
  border: 1.5px solid rgba(6, 182, 212, 0.16);
  background: #fff;
  border-radius: 14px;
  min-height: 86px;
  cursor: pointer;
  display: grid;
  place-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  padding: 12px;
  transition: transform .2s, border-color .2s, background .2s, box-shadow .2s;
  color: var(--ink);
}
.hp-category-item.active,
.hp-category-item:hover {
  transform: translateY(-2px);
  border-color: var(--orange);
  background: rgba(6, 182, 212, 0.08);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.1);
}
.hp-market {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}
.hp-filters-panel {
  border: 1.5px solid rgba(6, 182, 212, 0.16);
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  display: grid;
  gap: 14px;
  position: sticky;
  top: 14px;
  overflow: hidden;
  width: 320px;
  box-sizing: border-box;
}
.hp-filters-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172e;
}
.hp-filters-panel label {
  display: grid;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #64748b;
  line-height: 1;
}
.hp-filters-panel select,
.hp-filters-panel input {
  border: 1.5px solid rgba(6, 182, 212, 0.18);
  border-radius: 8px;
  min-height: 38px;
  padding: 0 10px;
  font-family: 'Sora', sans-serif;
  color: #0f172e;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
}
.hp-price-row {
  display: grid;
  grid-template-columns: 1fr 18px 1fr;
  align-items: center;
  gap: 6px;
}
.hp-price-row span {
  text-align: center;
  color: #64748b;
}
.hp-results {
  min-width: 0;
}
.hp-results-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 10px;
  flex-wrap: wrap;
}
.hp-results-head h2 {
  font-size: 24px;
  margin: 0;
}
.hp-results-head span {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.hp-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 14px;
}
.hp-card {
  border: 1.5px solid rgba(6, 182, 212, 0.16);
  background: #fff;
  border-radius: 16px;
  padding: 14px;
  display: grid;
  gap: 12px;
  transition: transform .2s, box-shadow .2s, border-color .2s;
}
.hp-card:hover {
  transform: translateY(-2px);
  border-color: rgba(6, 182, 212, 0.36);
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.1);
}
.hp-card-head {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: center;
}
.hp-card-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #dbe6f2;
}
.hp-card-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--orange), #0891b2);
  color: #fff;
  font-weight: 700;
}
.hp-card-name {
  margin: 0;
  font-size: 17px;
  color: #0f172e;
}
.hp-card-prof {
  margin: 2px 0;
  color: #475569;
  font-size: 12px;
}
.hp-card-city {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.hp-card-badge-row {
  margin-top: 2px;
}
.hp-badge {
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 5px 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.hp-badge.ok {
  color: #047857;
  border: 1px solid rgba(34, 197, 94, 0.25);
  background: rgba(34, 197, 94, 0.08);
}
.hp-badge.off {
  color: #b45309;
  border: 1px solid rgba(245, 158, 11, 0.25);
  background: rgba(245, 158, 11, 0.08);
}
.hp-card-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid #edf2f7;
}
.hp-meta-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: #64748b;
  margin-bottom: 4px;
}
.hp-stars,
.hp-rate {
  font-size: 13px;
  color: #0f172e;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.hp-stars span {
  color: #64748b;
  font-weight: 600;
}
.hp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.hp-tags span {
  border: 1px solid rgba(6, 182, 212, 0.18);
  color: #334155;
  background: #fff;
  border-radius: 999px;
  font-size: 11px;
  padding: 4px 8px;
}
.hp-reserve-btn {
  border: none;
  border-radius: 12px;
  min-height: 44px;
  background: var(--orange);
  color: #fff;
  font-family: 'Sora', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform .2s, box-shadow .2s, background .2s;
}
.hp-reserve-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
  background: #0891b2;
}
.hp-state {
  border: 1px dashed rgba(6, 182, 212, 0.2);
  border-radius: 10px;
  padding: 16px;
  color: #64748b;
  font-size: 13px;
  background: rgba(255,255,255,.75);
  margin-bottom: 12px;
}
.hp-state.error {
  color: #b91c1c;
  border-color: rgba(239, 68, 68, 0.45);
}
@media (max-width: 1220px) {
  .hp-market { grid-template-columns: 1fr; }
  .hp-filters-panel { position: static; }
  .hp-stats-container { grid-template-columns: repeat(2, 1fr); }
  .hp-steps { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 1200px) {
  .hp-category-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .hp-cards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hp-featured-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 900px) {
  .hp-search-wrap { grid-template-columns: 1fr; }
  .hp-steps { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .hp-root { padding: 14px 10px 30px; }
  .hp-header { padding: 14px; margin: 0 auto 18px; }
  .hp-header-top { flex-direction: column; align-items: flex-start; }
  .hp-auth-actions { width: 100%; }
  .hp-auth-btn { flex: 1; }
  .hp-category-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hp-cards-grid { grid-template-columns: 1fr; }
  .hp-featured-grid { grid-template-columns: 1fr; }
  .hp-card-meta { grid-template-columns: 1fr; }
  .hp-stats-container { grid-template-columns: 1fr; }
  .hp-steps { grid-template-columns: 1fr; }
  .hp-how-it-works h2 { font-size: 22px; }
  .hp-stat { padding: 18px; }
  .hp-stat-number { font-size: 28px; }
}
`;
