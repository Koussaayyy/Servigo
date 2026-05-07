import { useState, useRef } from "react";
import {
  Zap, Droplets, HardHat, AppWindow, Axe, Palette,
  Snowflake, Lock, Sprout, LayoutGrid, PackageOpen, Cog,
  CheckCircle, XCircle,
} from "lucide-react";
import "./Onboarding.css";

const SERVICES = [
  { label: "Électricien",   Icon: Zap },
  { label: "Plombier",      Icon: Droplets },
  { label: "Maçon",         Icon: HardHat },
  { label: "Vitrier",       Icon: AppWindow },
  { label: "Menuisier",     Icon: Axe },
  { label: "Peintre",       Icon: Palette },
  { label: "Climatisation", Icon: Snowflake },
  { label: "Serrurier",     Icon: Lock },
  { label: "Jardinier",     Icon: Sprout },
  { label: "Carreleur",     Icon: LayoutGrid },
  { label: "Déménagement",  Icon: PackageOpen },
  { label: "Mécanicien",    Icon: Cog },
];

const GOVERNORATES = [
  "Tunis","Ariana","Ben Arous","Manouba","Nabeul","Zaghouan",
  "Bizerte","Béja","Jendouba","Le Kef","Siliana","Sousse",
  "Monastir","Mahdia","Sfax","Kairouan","Kasserine","Sidi Bouzid",
  "Gabès","Medenine","Tataouine","Gafsa","Tozeur","Kébili",
];

function AlertOverlay({ type, message, onClose }) {
  const ok = type === "success";
  return (
    <div className="ob-alert-backdrop">
      <div className="ob-alert-card ob-alert-anim">
        <div className={`ob-alert-icon-wrap ${ok ? "success" : "error"}`}>
          {ok
            ? <CheckCircle size={40} color="#10b981" />
            : <XCircle    size={40} color="#ef4444" />}
        </div>
        <h3 className="ob-alert-title">
          {ok ? "Compte créé !" : "Création du compte échouée"}
        </h3>
        <p className="ob-alert-sub">
          {ok
            ? "Votre profil est prêt. Bienvenue sur Servigo !"
            : message || "Une erreur s'est produite. Veuillez vérifier vos informations et réessayer."}
        </p>
        <button className={`ob-alert-btn ${ok ? "success" : "error"}`} onClick={onClose}>
          {ok ? "Commencer →" : "Réessayer"}
        </button>
      </div>
    </div>
  );
}

export default function Onboarding({ user, onComplete }) {
  const fileRef  = useRef();
  const isWorker = user?.role === "worker";

  const STEPS = isWorker
    ? ["Identité", "Localisation", "Services", "Profil"]
    : ["Identité", "Localisation", "Profil"];
  const TOTAL = STEPS.length;

  const [step,       setStep]       = useState(0);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [preview,    setPreview]    = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [alert,      setAlert]      = useState(null);   // null | "success" | "error"
  const [alertMsg,   setAlertMsg]   = useState("");
  const [savedUser,  setSavedUser]  = useState(null);

  const [form, setForm] = useState({
    gender: "", birthDate: "", governorate: "",
    city: "", address: "", services: [], bio: "",
  });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleService = (svc) =>
    setForm((f) => ({
      ...f,
      services: f.services.includes(svc)
        ? f.services.filter((s) => s !== svc)
        : [...f.services, svc],
    }));

  const pickAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    if (step === 0) {
      if (!form.gender)          return "Veuillez sélectionner votre genre.";
      if (!form.birthDate)       return "Veuillez entrer votre date de naissance.";
    }
    if (step === 1) {
      if (!form.governorate)     return "Veuillez sélectionner votre gouvernorat.";
      if (!form.city.trim())     return "Veuillez entrer votre ville / délégation.";
    }
    if (isWorker && step === 2) {
      if (!form.services.length) return "Veuillez sélectionner au moins un service.";
    }
    if (step === TOTAL - 1) {
      if (!form.bio.trim())      return "Veuillez renseigner votre bio.";
    }
    return null;
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => Math.min(s + 1, TOTAL - 1));
  };

  const prev = () => { setError(""); setStep((s) => Math.max(s - 1, 0)); };

  const finish = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const data  = new FormData();
      data.append("gender",      form.gender);
      data.append("birthDate",   form.birthDate);
      data.append("governorate", form.governorate);
      data.append("city",        form.city);
      if (form.address)         data.append("address",  form.address);
      data.append("bio",         form.bio);
      if (form.services.length) data.append("services", JSON.stringify(form.services));
      if (avatarFile)           data.append("avatar",   avatarFile);

      const res  = await fetch("http://localhost:5000/api/onboarding/complete", {
        method:  "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body:    data,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Erreur serveur");

      localStorage.setItem("user", JSON.stringify(json.user));
      setSavedUser(json.user);
      setAlert("success");
    } catch (err) {
      setAlertMsg(err.message || "");
      setAlert("error");
    } finally {
      setLoading(false);
    }
  };

  const isLast = step === TOTAL - 1;

  return (
    <>
      <div className="ob-wrap">
        <div className="ob-card anim">

          {/* Logo */}
          <div className="ob-logo">
            <div className="ob-logo-box">S</div>
            <span className="ob-logo-name">SERVIGO</span>
          </div>

          {/* Progress */}
          <div className="ob-progress">
            {STEPS.map((label, i) => (
              <div key={i} className="ob-progress-item">
                <div className={`ob-dot ${i < step ? "done" : i === step ? "active" : ""}`}>
                  {i < step ? "✓" : i + 1}
                </div>
                {i < TOTAL - 1 && <div className={`ob-line ${i < step ? "done" : ""}`} />}
              </div>
            ))}
          </div>
          <div className="ob-step-label">Étape {step + 1} sur {TOTAL} — {STEPS[step]}</div>

          {error && <div className="error-msg">{error}</div>}

          {/* ── STEP 0 — Identité ── */}
          {step === 0 && (
            <>
              <div className="form-head">
                <h2 className="form-title">Parlez-nous de vous.</h2>
                <p className="form-sub">
                  Aidez les {isWorker ? "clients" : "prestataires"} à mieux vous connaître.
                </p>
              </div>
              <div className="field">
                <label>Genre <span className="ob-required">*</span></label>
                <div className="ob-gender-group">
                  {[["male","Homme"],["female","Femme"],["other","Autre"]].map(([val, lbl]) => (
                    <button key={val}
                      className={`ob-gender-btn ${form.gender === val ? "selected" : ""}`}
                      onClick={() => setForm({ ...form, gender: val })}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Date de naissance <span className="ob-required">*</span></label>
                <input name="birthDate" type="date" value={form.birthDate} onChange={handle} />
              </div>
            </>
          )}

          {/* ── STEP 1 — Localisation ── */}
          {step === 1 && (
            <>
              <div className="form-head">
                <h2 className="form-title">Où êtes-vous basé ?</h2>
                <p className="form-sub">
                  Permet de vous connecter avec des {isWorker ? "clients" : "prestataires"} proches de chez vous.
                </p>
              </div>
              <div className="field">
                <label>Gouvernorat <span className="ob-required">*</span></label>
                <select name="governorate" value={form.governorate} onChange={handle}>
                  <option value="">Sélectionnez votre gouvernorat</option>
                  {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Ville / Délégation <span className="ob-required">*</span></label>
                <input name="city" type="text" placeholder="Ex : La Marsa, Sfax-Ville…" value={form.city} onChange={handle} />
              </div>
              <div className="field">
                <label>Adresse <span className="ob-optional">(optionnel)</span></label>
                <input name="address" type="text" placeholder="Rue, quartier…" value={form.address} onChange={handle} />
              </div>
            </>
          )}

          {/* ── STEP 2 — Services (workers only) ── */}
          {isWorker && step === 2 && (
            <>
              <div className="form-head">
                <h2 className="form-title">Quels services proposez-vous ?</h2>
                <p className="form-sub">Sélectionnez tout ce qui s'applique. Modifiable à tout moment.</p>
              </div>
              <div className="ob-services-grid">
                {SERVICES.map(({ label, Icon }) => {
                  const selected = form.services.includes(label);
                  return (
                    <button key={label}
                      className={`ob-svc-btn ${selected ? "selected" : ""}`}
                      onClick={() => toggleService(label)}>
                      <Icon size={20} className="ob-svc-icon" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="ob-svc-count">
                {form.services.length > 0
                  ? `${form.services.length} service${form.services.length > 1 ? "s" : ""} sélectionné${form.services.length > 1 ? "s" : ""}`
                  : "Aucun service sélectionné"}
              </div>
            </>
          )}

          {/* ── LAST STEP — Photo + bio ── */}
          {step === TOTAL - 1 && (
            <>
              <div className="form-head">
                <h2 className="form-title">Complétez votre profil.</h2>
                <p className="form-sub">
                  Une photo et une bio augmentent vos chances d'obtenir des {isWorker ? "réservations" : "correspondances"}.
                </p>
              </div>
              <div className="ob-avatar-area">
                <div className="ob-avatar-circle" onClick={() => fileRef.current.click()}>
                  {preview
                    ? <img src={preview} alt="avatar" className="ob-avatar-img" />
                    : <span className="ob-avatar-placeholder">Ajouter une photo</span>}
                </div>
                <input ref={fileRef} type="file" accept="image/*"
                  style={{ display: "none" }} onChange={pickAvatar} />
                <span className="ob-avatar-hint">JPG ou PNG · max 5 Mo <span className="ob-optional">(optionnel)</span></span>
              </div>
              <div className="field">
                <label>Bio <span className="ob-required">*</span></label>
                <textarea name="bio" rows={4} maxLength={150}
                  placeholder={isWorker
                    ? "Décrivez votre expertise, vos années d'expérience et pourquoi choisir vos services…"
                    : "Parlez de vous et de vos besoins…"}
                  value={form.bio} onChange={handle} />
                <div className="ob-char-count">{form.bio.length} / 150</div>
              </div>
            </>
          )}

          {/* ── Nav buttons (no skip) ── */}
          <div className="ob-btn-row">
            {step > 0 && (
              <button className="ob-back-btn" onClick={prev}>← Retour</button>
            )}
            <button
              className="ob-next-btn"
              onClick={isLast ? finish : next}
              disabled={loading}
            >
              {loading ? "Enregistrement…" : isLast ? "Terminer →" : "Suivant →"}
            </button>
          </div>

        </div>
      </div>

      {/* ── Sweet-alert overlay ── */}
      {alert && (
        <AlertOverlay
          type={alert}
          message={alertMsg}
          onClose={() => {
            if (alert === "success") {
              onComplete(savedUser);
            } else {
              setAlert(null);
              setAlertMsg("");
            }
          }}
        />
      )}
    </>
  );
}
