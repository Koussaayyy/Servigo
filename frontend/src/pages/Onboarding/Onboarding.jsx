import { useState, useRef } from "react";
import "./Onboarding.css";

const WORKER_SERVICES = [
  "Plumber", "Electrician", "Carpenter", "Painter",
  "AC Repair", "Gardener", "Mechanic", "Photographer", "Cleaner",
  "Mason", "Welder", "Tiler",
];

const GOVERNORATES = [
  "Tunis","Ariana","Ben Arous","Manouba","Nabeul","Zaghouan",
  "Bizerte","Béja","Jendouba","Le Kef","Siliana","Sousse",
  "Monastir","Mahdia","Sfax","Kairouan","Kasserine","Sidi Bouzid",
  "Gabès","Medenine","Tataouine","Gafsa","Tozeur","Kébili",
];

export default function Onboarding({ user, onComplete }) {
  const fileRef  = useRef();
  const isWorker = user?.role === "worker";

  const STEPS = isWorker
    ? ["Personal", "Location", "Services", "Profile"]
    : ["Personal", "Location", "Profile"];
  const TOTAL = STEPS.length;

  const [step,       setStep]       = useState(0);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [preview,    setPreview]    = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

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

  const next = () => {
    setError("");
    if (step === 0) {
      if (!form.gender)    return setError("Please select your gender.");
      if (!form.birthDate) return setError("Please enter your date of birth.");
    }
    setStep((s) => Math.min(s + 1, TOTAL - 1));
  };

  const prev = () => { setError(""); setStep((s) => Math.max(s - 1, 0)); };

  // Skip from step 1+ — moves to next step, on last step calls finish to save
  const skip = () => {
    setError("");
    if (step < TOTAL - 1) {
      setStep((s) => s + 1);
    } else {
      finish(); // always save even when skipping last step
    }
  };

  const finish = async () => {
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const data  = new FormData();
      if (form.gender)          data.append("gender",      form.gender);
      if (form.birthDate)       data.append("birthDate",   form.birthDate);
      if (form.governorate)     data.append("governorate", form.governorate);
      if (form.city)            data.append("city",        form.city);
      if (form.address)         data.append("address",     form.address);
      if (form.bio)             data.append("bio",         form.bio);
      if (form.services.length) data.append("services",    JSON.stringify(form.services));
      if (avatarFile)           data.append("avatar",      avatarFile);

      const res = await fetch("http://localhost:5000/api/onboarding/complete", {
        method:  "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body:    data,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error");

      localStorage.setItem("user", JSON.stringify(json.user));
      onComplete(json.user);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const isLast = step === TOTAL - 1;

  return (
    <div className="ob-wrap">
      <div className="ob-card anim">

        {/* ── Logo ── */}
        <div className="ob-logo">
          <div className="ob-logo-box">S</div>
          <span className="ob-logo-name">SERVIGO</span>
        </div>

        {/* ── Progress bar ── */}
        <div className="ob-progress">
          {STEPS.map((_, i) => (
            <div key={i} className="ob-progress-item">
              <div className={`ob-dot ${i < step ? "done" : i === step ? "active" : ""}`}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < TOTAL - 1 && <div className={`ob-line ${i < step ? "done" : ""}`} />}
            </div>
          ))}
        </div>

        <div className="ob-step-label">Step {step + 1} of {TOTAL}</div>

        {/* ── STEP 0 — Personal (required) ── */}
        {step === 0 && (
          <>
            <div className="form-head">
              <h2 className="form-title">Tell us about yourself.</h2>
              <p className="form-sub">Help {isWorker ? "clients" : "professionals"} know who they're working with.</p>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <div className="field">
              <label>Gender <span className="ob-required">*</span></label>
              <div className="ob-gender-group">
                {["male", "female", "other"].map((g) => (
                  <button key={g}
                    className={`ob-gender-btn ${form.gender === g ? "selected" : ""}`}
                    onClick={() => setForm({ ...form, gender: g })}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Date of Birth <span className="ob-required">*</span></label>
              <input name="birthDate" type="date" value={form.birthDate} onChange={handle} />
            </div>
          </>
        )}

        {/* ── STEP 1 — Location ── */}
        {step === 1 && (
          <>
            <div className="form-head">
              <h2 className="form-title">Where are you based?</h2>
              <p className="form-sub">Helps match you with nearby {isWorker ? "clients" : "professionals"}.</p>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <div className="field">
              <label>Gouvernorat</label>
              <select name="governorate" value={form.governorate} onChange={handle}>
                <option value="">Select gouvernorat</option>
                {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="field">
              <label>City / Delegation</label>
              <input name="city" type="text" placeholder="e.g. La Marsa" value={form.city} onChange={handle} />
            </div>
            <div className="field">
              <label>Address <span className="ob-optional">(optional)</span></label>
              <input name="address" type="text" placeholder="Street, neighbourhood…" value={form.address} onChange={handle} />
            </div>
          </>
        )}

        {/* ── STEP 2 — Services (workers only) ── */}
        {isWorker && step === 2 && (
          <>
            <div className="form-head">
              <h2 className="form-title">What services do you offer?</h2>
              <p className="form-sub">Select all that apply. You can update these anytime.</p>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <div className="ob-services-grid">
              {WORKER_SERVICES.map((svc) => (
                <button key={svc}
                  className={`ob-svc-btn ${form.services.includes(svc) ? "selected" : ""}`}
                  onClick={() => toggleService(svc)}>
                  {svc}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── LAST STEP — Photo + bio ── */}
        {step === TOTAL - 1 && (
          <>
            <div className="form-head">
              <h2 className="form-title">Complete your profile.</h2>
              <p className="form-sub">A photo and bio help you get more {isWorker ? "bookings" : "matches"}.</p>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <div className="ob-avatar-area">
              <div className="ob-avatar-circle" onClick={() => fileRef.current.click()}>
                {preview
                  ? <img src={preview} alt="avatar" className="ob-avatar-img" />
                  : <span className="ob-avatar-placeholder">Add photo</span>}
              </div>
              <input ref={fileRef} type="file" accept="image/*"
                style={{ display: "none" }} onChange={pickAvatar} />
              <span className="ob-avatar-hint">JPG or PNG · max 5 MB</span>
            </div>
            <div className="field">
              <label>Bio <span className="ob-optional">(optional)</span></label>
              <textarea name="bio" rows={4} maxLength={150}
                placeholder="Describe yourself, your experience, and why people should choose you…"
                value={form.bio} onChange={handle} />
              <div className="ob-char-count">{form.bio.length} / 150</div>
            </div>
          </>
        )}

        {/* ── Nav buttons ── */}
        <div className="ob-btn-row">
          {step > 0 && (
            <button className="ob-back-btn" onClick={prev}>← Back</button>
          )}
          {step > 0 && (
            <button className="ob-skip-btn" onClick={skip}>
              {isLast ? "Skip" : "Skip →"}
            </button>
          )}
          <button className="ob-next-btn" onClick={isLast ? finish : next} disabled={loading}>
            {loading ? "Saving…" : isLast ? "Finish Setup" : "Next →"}
          </button>
        </div>

      </div>
    </div>
  );
}