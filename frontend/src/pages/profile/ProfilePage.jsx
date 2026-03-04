// src/pages/profile/ProfilePage.jsx
import { useState, useRef, useEffect } from "react";
import {
  Camera, Upload, Trash2, Save, Tag, ListChecks,
  CalendarDays, MessageSquare, KeyRound, ShieldCheck,
  TriangleAlert, Mail, Plus, X, Eye, Check,
  Loader2, IdCard, MapPin, Building2,
} from "lucide-react";
import { clientApi, workerApi, avatarUrl } from "../../api";

function Card({ children, danger }) {
  return (
    <div style={{
      background: danger ? "rgba(192,57,43,0.02)" : "#fff",
      border: `1.5px solid ${danger ? "rgba(192,57,43,0.2)" : "#f0e6da"}`,
      borderRadius: 12, padding: 28, marginBottom: 18,
      boxShadow: "0 2px 16px rgba(232,98,10,0.05)",
    }}>{children}</div>
  );
}

function CardTitle({ icon: Icon, children, danger }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, letterSpacing: ".2em",
      textTransform: "uppercase", color: danger ? "#c0392b" : "#9a7c68",
      marginBottom: 20, display: "flex", alignItems: "center", gap: 8,
    }}>
      <Icon size={14} color={danger ? "#c0392b" : "#e8620a"} />
      {children}
      <div style={{ flex: 1, height: 1, background: "#f0e6da" }} />
    </div>
  );
}

function Field({ label, children, span2 }) {
  return (
    <div style={{ gridColumn: span2 ? "span 2" : undefined, display: "flex", flexDirection: "column", gap: 7 }}>
      <label style={{ fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "#9a7c68", fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputBase = {
  width: "100%", padding: "11px 14px", background: "#f0e6da",
  border: "1.5px solid transparent", borderRadius: 8,
  fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#1a1008", outline: "none",
  transition: "border-color .2s, background .2s, box-shadow .2s",
};

function Input({ style, ...props }) {
  const [f, setF] = useState(false);
  return (
    <input {...props}
      style={{ ...inputBase, ...(f ? { borderColor: "#e8620a", background: "#fff", boxShadow: "0 0 0 3px rgba(232,98,10,0.1)" } : {}), ...style }}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
    />
  );
}

function Textarea(props) {
  const [f, setF] = useState(false);
  return (
    <textarea {...props}
      style={{ ...inputBase, resize: "vertical", minHeight: 80, ...(f ? { borderColor: "#e8620a", background: "#fff", boxShadow: "0 0 0 3px rgba(232,98,10,0.1)" } : {}) }}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
    />
  );
}

function SelectField({ children, ...props }) {
  const [f, setF] = useState(false);
  return (
    <select {...props}
      style={{ ...inputBase, appearance: "none", cursor: "pointer", ...(f ? { borderColor: "#e8620a", background: "#fff", boxShadow: "0 0 0 3px rgba(232,98,10,0.1)" } : {}) }}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
    >{children}</select>
  );
}

function Btn({ variant = "primary", loading = false, children, style, ...props }) {
  const base = { padding: "11px 22px", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 7, transition: "all .2s", opacity: loading ? 0.7 : 1, border: "none" };
  const variants = {
    primary:   { background: "#e8620a", color: "#fff", boxShadow: "0 4px 16px rgba(232,98,10,0.3)" },
    secondary: { background: "transparent", color: "#9a7c68", border: "1.5px solid #f0e6da" },
    danger:    { background: "transparent", color: "#c0392b", border: "1.5px solid rgba(192,57,43,0.2)" },
    sm:        { background: "#e8620a", color: "#fff", padding: "8px 14px", fontSize: 11 },
  };
  return (
    <button disabled={loading} style={{ ...base, ...variants[variant], ...style }} {...props}>
      {loading && <Loader2 size={14} className="spin" />}
      {children}
    </button>
  );
}

function FormActions({ children }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid #f0e6da" }}>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 42, height: 23, borderRadius: 100, background: on ? "#e8620a" : "#f0e6da", border: `1.5px solid ${on ? "#e8620a" : "rgba(232,98,10,0.15)"}`, position: "relative", cursor: "pointer", transition: "all .3s", flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, left: 2, transform: on ? "translateX(19px)" : "translateX(0)", transition: "transform .3s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #f0e6da" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1008" }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: "#9a7c68", marginTop: 2 }}>{desc}</div>}
      </div>
      <Toggle on={value} onChange={onChange} />
    </div>
  );
}

function TagBox({ tags, onChange }) {
  const [val, setVal] = useState("");
  const [f, setF]     = useState(false);
  const add = () => {
    const v = val.trim();
    if (!v || tags.includes(v)) return;
    onChange([...tags, v]);
    setVal("");
  };
  return (
    <div>
      <div onClick={() => document.getElementById("tag-inp")?.focus()}
        style={{ background: f ? "#fff" : "#f0e6da", border: `1.5px solid ${f ? "#e8620a" : "transparent"}`, boxShadow: f ? "0 0 0 3px rgba(232,98,10,0.1)" : "none", borderRadius: 8, padding: "10px 12px", minHeight: 56, cursor: "text", transition: "all .2s" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: tags.length ? 8 : 0 }}>
          {tags.map(t => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px 4px 12px", borderRadius: 100, background: "#fff", color: "#e8620a", fontSize: 12, fontWeight: 500, border: "1.5px solid rgba(232,98,10,0.3)" }}>
              {t}
              <button type="button" onClick={e => { e.stopPropagation(); onChange(tags.filter(x => x !== t)); }}
                style={{ width: 16, height: 16, borderRadius: "50%", border: "none", background: "rgba(232,98,10,0.12)", color: "#e8620a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
        <input id="tag-inp" value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          onFocus={() => setF(true)} onBlur={() => setF(false)}
          placeholder="Ajouter une compétence..."
          style={{ border: "none", background: "transparent", outline: "none", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#1a1008", width: "100%", minWidth: 160 }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <Btn variant="sm" onClick={add}><Plus size={13} /> Ajouter</Btn>
      </div>
    </div>
  );
}

function Toast({ show, message, isError }) {
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, padding: "13px 24px", background: isError ? "#c0392b" : "#1a1008", color: isError ? "#fff" : "#e8620a", border: `1.5px solid ${isError ? "rgba(192,57,43,0.4)" : "rgba(232,98,10,0.4)"}`, borderRadius: 100, fontSize: 13, fontWeight: 600, opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(10px)", transition: "all .3s", zIndex: 9999, pointerEvents: "none", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
      {isError ? <TriangleAlert size={16} /> : <Check size={16} />}
      {message}
    </div>
  );
}

function PhotoModal({ onClose, onSave, loading }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile]       = useState(null);
  const inputRef = useRef();

  const pick = (f) => {
    if (!f?.type.startsWith("image/")) return;
    setFile(f);
    const r = new FileReader();
    r.onload = e => setPreview(e.target.result);
    r.readAsDataURL(f);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,16,8,0.75)", backdropFilter: "blur(4px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: "min(420px,90vw)", border: "1.5px solid #f0e6da", boxShadow: "0 8px 48px rgba(0,0,0,0.25)" }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: "#1a1008", marginBottom: 6 }}>Photo de profil</div>
        <div style={{ fontSize: 13, color: "#9a7c68", marginBottom: 24 }}>Choisissez une photo claire et professionnelle.</div>

        {preview ? (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", border: "3px solid #e8620a", margin: "0 auto 12px" }}>
              <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <button onClick={() => { setPreview(null); setFile(null); }}
              style={{ background: "none", border: "none", color: "#9a7c68", fontSize: 12, cursor: "pointer" }}>
              Choisir une autre photo
            </button>
          </div>
        ) : (
          <div onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
            style={{ border: "2px dashed rgba(232,98,10,0.3)", borderRadius: 12, padding: "32px 20px", textAlign: "center", cursor: "pointer", background: "#fff8f2", marginBottom: 16 }}>
            <Camera size={36} color="#e8620a" style={{ display: "block", margin: "0 auto 10px" }} />
            <p style={{ fontSize: 13, color: "#9a7c68" }}>Glissez votre photo ici ou <span style={{ color: "#e8620a", fontWeight: 600 }}>parcourir</span></p>
            <p style={{ fontSize: 11, color: "#9a7c68", marginTop: 6 }}>JPG, PNG, WEBP — max 5 Mo</p>
          </div>
        )}

        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={e => pick(e.target.files[0])} />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
          <Btn onClick={() => file && onSave(file)} loading={loading}
            style={{ opacity: file ? 1 : 0.4, pointerEvents: file ? "auto" : "none" }}>
            <Check size={14} /> Enregistrer
          </Btn>
        </div>
      </div>
    </div>
  );
}

function SectionInformations({ user, isWorker, onSaved, onToast }) {
  const api = isWorker ? workerApi : clientApi;
  const [saving,      setSaving]     = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [showModal,   setShowModal]  = useState(false);
  const [locLoading,  setLocLoading] = useState(false); // ── NEW

  const [form, setForm] = useState({
    firstName:  user.firstName || "",
    lastName:   user.lastName  || "",
    phone:      user.phone     || "",
    bio:        isWorker ? (user.workerProfile?.bio  || "") : (user.clientProfile?.bio  || ""),
    city:       isWorker ? (user.workerProfile?.city || "") : (user.clientProfile?.city || ""),
    address:    user.clientProfile?.address   || "",
    experience: user.workerProfile?.experience || "",
    hourlyRate: user.workerProfile?.hourlyRate || "",
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // ── NEW: detect GPS location ───────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) return onToast("Géolocalisation non supportée", true);
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const city    = data.address?.city || data.address?.town || data.address?.village || data.address?.state || "";
          const address = data.address?.road
            ? `${data.address.road}${data.address.house_number ? " " + data.address.house_number : ""}`
            : data.display_name || "";
          setForm(f => ({ ...f, city, address }));
          onToast("Position détectée ✓");
        } catch {
          onToast("Impossible de détecter la position", true);
        } finally {
          setLocLoading(false);
        }
      },
      () => { onToast("Permission de localisation refusée", true); setLocLoading(false); }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { firstName: form.firstName, lastName: form.lastName, phone: form.phone };
      if (isWorker) {
        payload.workerProfile = {
          ...user.workerProfile,
          bio:        form.bio,
          city:       form.city,
          experience: form.experience,
          hourlyRate: Number(form.hourlyRate) || 0,
        };
      } else {
        payload.clientProfile = {
          ...user.clientProfile,
          bio:     form.bio,
          city:    form.city,
          address: form.address,
        };
      }
      const res = await api.updateProfile(payload);
      onSaved(res.user);
      onToast("Modifications enregistrées ✓");
    } catch (err) {
      onToast(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSave = async (file) => {
    setPhotoSaving(true);
    try {
      const res = await api.uploadAvatar(file);
      onSaved(res.user);
      onToast("Photo mise à jour ✓");
      setShowModal(false);
    } catch (err) {
      onToast(err.message, true);
    } finally {
      setPhotoSaving(false);
    }
  };

  const handlePhotoDelete = async () => {
    setPhotoSaving(true);
    try {
      const res = await api.deleteAvatar();
      onSaved(res.user);
      onToast("Photo supprimée");
    } catch (err) {
      onToast(err.message, true);
    } finally {
      setPhotoSaving(false);
    }
  };

  const currentAvatarUrl = avatarUrl(user.avatar);
  const initials = (user.firstName?.[0] || "") + (user.lastName?.[0] || "");

  return (
    <>
      {showModal && <PhotoModal onClose={() => setShowModal(false)} onSave={handlePhotoSave} loading={photoSaving} />}

      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 400, color: "#1a1008", marginBottom: 5 }}>Informations personnelles</h1>
      <p style={{ fontSize: 13, color: "#9a7c68", marginBottom: 28 }}>Gérez vos informations de profil visibles par les autres utilisateurs.</p>

      {/* Photo */}
      <Card>
        <CardTitle icon={Camera}>Photo de profil</CardTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div onClick={() => setShowModal(true)}
            style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#e8620a,#c44800)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: "1.8rem", fontWeight: 700, color: "#fff", border: "2.5px solid rgba(232,98,10,0.3)", overflow: "hidden", cursor: "pointer", flexShrink: 0 }}>
            {currentAvatarUrl
              ? <img src={currentAvatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials
            }
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1008", marginBottom: 4 }}>Photo visible sur votre profil public</div>
            <div style={{ fontSize: 12, color: "#9a7c68", marginBottom: 12 }}>JPG, PNG ou WEBP · max 5 Mo</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="sm" onClick={() => setShowModal(true)} loading={photoSaving}>
                <Upload size={13} /> Changer
              </Btn>
              {user.avatar && (
                <Btn variant="secondary" style={{ padding: "8px 14px", fontSize: 11 }} onClick={handlePhotoDelete} loading={photoSaving}>
                  <Trash2 size={13} />
                </Btn>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Identité */}
      <Card>
        <CardTitle icon={IdCard}>Identité</CardTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Prénom"><Input value={form.firstName} onChange={set("firstName")} /></Field>
          <Field label="Nom"><Input value={form.lastName} onChange={set("lastName")} /></Field>
          <Field label="Email">
            <Input value={user.email} disabled
              style={{ opacity: 0.6, cursor: "not-allowed", background: "#f0e6da" }} />
          </Field>
          <Field label="Téléphone"><Input type="tel" value={form.phone} onChange={set("phone")} /></Field>
          <Field label="Bio / Présentation" span2>
            <Textarea value={form.bio} onChange={set("bio")} placeholder="Présentez-vous..." />
          </Field>
        </div>
      </Card>

      {/* Localisation */}
      <Card>
        <CardTitle icon={MapPin}>Localisation</CardTitle>

        {/* ── GPS detect button ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: "#9a7c68", margin: 0 }}>
            Renseignez votre ville manuellement ou utilisez la détection automatique.
          </p>
          <button
            type="button"
            onClick={detectLocation}
            disabled={locLoading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8,
              border: "1.5px solid rgba(232,98,10,0.3)",
              background: "rgba(232,98,10,0.06)", color: "#e8620a",
              fontSize: 12, fontWeight: 600,
              cursor: locLoading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans',sans-serif",
              opacity: locLoading ? 0.6 : 1,
              transition: "all .2s", whiteSpace: "nowrap", flexShrink: 0, marginLeft: 16,
            }}
          >
            {locLoading
              ? <><Loader2 size={13} className="spin" /> Détection...</>
              : <><MapPin size={13} /> Détecter ma position</>
            }
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Ville"><Input value={form.city} onChange={set("city")} /></Field>
          {!isWorker && (
            <Field label="Adresse"><Input value={form.address} onChange={set("address")} /></Field>
          )}
          {isWorker && (
            <>
              <Field label="Expérience">
                <SelectField value={form.experience} onChange={set("experience")}>
                  <option value="">Sélectionner</option>
                  <option>Moins d'1 an</option>
                  <option>1-3 ans</option>
                  <option>3-6 ans</option>
                  <option>6-10 ans</option>
                  <option>+10 ans</option>
                </SelectField>
              </Field>
              <Field label="Tarif horaire (TND)">
                <div style={{ position: "relative" }}>
                  <Input type="number" value={form.hourlyRate} onChange={set("hourlyRate")} style={{ paddingRight: 52 }} />
                  <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 600, color: "#9a7c68", pointerEvents: "none" }}>TND</span>
                </div>
              </Field>
            </>
          )}
        </div>
      </Card>

      <FormActions>
        <Btn variant="secondary" onClick={() => window.location.reload()}>Annuler</Btn>
        <Btn onClick={handleSave} loading={saving}><Save size={14} /> Enregistrer</Btn>
      </FormActions>
    </>
  );
}

function SectionCompetences({ user, onSaved, onToast }) {
  const [saving,      setSaving]      = useState(false);
  const [professions, setProfessions] = useState(user.workerProfile?.professions || []);
  const [services,    setServices]    = useState(
    user.workerProfile?.services?.length ? user.workerProfile.services : ["", "", ""]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await workerApi.updateProfile({
        workerProfile: {
          ...user.workerProfile,
          professions,
          services: services.filter(Boolean),
        },
      });
      onSaved(res.user);
      onToast("Compétences enregistrées ✓");
    } catch (err) {
      onToast(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 400, color: "#1a1008", marginBottom: 5 }}>Compétences & Services</h1>
      <p style={{ fontSize: 13, color: "#9a7c68", marginBottom: 28 }}>Définissez vos domaines d'expertise et les services que vous proposez.</p>

      <Card>
        <CardTitle icon={Tag}>Compétences / Métiers</CardTitle>
        <p style={{ fontSize: 12, color: "#9a7c68", marginBottom: 14 }}>
          Tapez une compétence et appuyez sur{" "}
          <kbd style={{ background: "#f0e6da", border: "1px solid rgba(232,98,10,0.2)", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>Entrée</kbd>
        </p>
        <TagBox tags={professions} onChange={setProfessions} />
      </Card>

      <Card>
        <CardTitle icon={ListChecks}>Services proposés</CardTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {services.map((s, i) => (
            <Field key={i} label={`Service ${i + 1}`}>
              <Input value={s} onChange={e => { const a = [...services]; a[i] = e.target.value; setServices(a); }} placeholder="Décrire un service..." />
            </Field>
          ))}
          <button onClick={() => setServices([...services, ""])}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "1.5px dashed rgba(232,98,10,0.3)", borderRadius: 8, padding: "10px 16px", color: "#e8620a", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            <Plus size={14} /> Ajouter un service
          </button>
        </div>
      </Card>

      <FormActions>
        <Btn variant="secondary">Annuler</Btn>
        <Btn onClick={handleSave} loading={saving}><Save size={14} /> Enregistrer</Btn>
      </FormActions>
    </>
  );
}

function SectionDisponibilite({ user, onSaved, onToast }) {
  const [loading,   setLoading]   = useState(false);
  const [available, setAvailable] = useState(user.workerProfile?.isAvailable ?? true);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await workerApi.toggleAvailability();
      setAvailable(res.isAvailable);
      onSaved({ ...user, workerProfile: { ...user.workerProfile, isAvailable: res.isAvailable } });
      onToast(res.message);
    } catch (err) {
      onToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 400, color: "#1a1008", marginBottom: 5 }}>Disponibilités</h1>
      <p style={{ fontSize: 13, color: "#9a7c68", marginBottom: 28 }}>Contrôlez votre visibilité auprès des clients.</p>

      <Card>
        <CardTitle icon={CalendarDays}>Statut de disponibilité</CardTitle>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1008", marginBottom: 4 }}>
              {available ? "✅ Disponible pour des missions" : "🔴 Indisponible en ce moment"}
            </div>
            <div style={{ fontSize: 13, color: "#9a7c68" }}>
              {available
                ? "Les clients peuvent vous contacter."
                : "Votre profil reste visible mais sans nouvelles demandes."}
            </div>
          </div>
          <Toggle on={available} onChange={handleToggle} />
        </div>
        {loading && <div style={{ fontSize: 12, color: "#9a7c68" }}>Mise à jour...</div>}
      </Card>
    </>
  );
}

function SectionAvis({ user }) {
  const rating       = user.workerProfile?.rating       || 0;
  const totalReviews = user.workerProfile?.totalReviews || 0;

  return (
    <>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 400, color: "#1a1008", marginBottom: 5 }}>Avis & Évaluations</h1>
      <p style={{ fontSize: 13, color: "#9a7c68", marginBottom: 28 }}>Les retours de vos clients.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { value: rating.toFixed(1), label: "Note moyenne", stars: true },
          { value: totalReviews,      label: "Avis reçus" },
          { value: "—",              label: "Missions complétées" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1.5px solid #f0e6da", borderRadius: 12, padding: 20, textAlign: "center", boxShadow: "0 2px 12px rgba(232,98,10,0.04)" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "2rem", color: "#e8620a" }}>{s.value}</div>
            {s.stars && <div style={{ color: "#e8620a", marginBottom: 2 }}>★★★★★</div>}
            <div style={{ fontSize: 11, color: "#9a7c68" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardTitle icon={MessageSquare}>Avis clients</CardTitle>
        <p style={{ fontSize: 13, color: "#9a7c68", textAlign: "center", padding: "20px 0" }}>
          {totalReviews === 0 ? "Aucun avis pour l'instant. Complétez vos premières missions !" : "Les avis détaillés seront affichés ici."}
        </p>
      </Card>
    </>
  );
}

function SectionSecurite({ user, isWorker, onToast }) {
  const api = isWorker ? workerApi : clientApi;
  const [saving, setSaving] = useState(false);
  const [form,   setForm]   = useState({ current: "", next: "", confirm: "" });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.current || !form.next || !form.confirm)
      return onToast("Veuillez remplir tous les champs", true);
    if (form.next !== form.confirm)
      return onToast("Les mots de passe ne correspondent pas", true);
    if (form.next.length < 8)
      return onToast("Le mot de passe doit avoir au moins 8 caractères", true);

    setSaving(true);
    try {
      await api.changePassword(form.current, form.next);
      setForm({ current: "", next: "", confirm: "" });
      onToast("Mot de passe mis à jour ✓");
    } catch (err) {
      onToast(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 400, color: "#1a1008", marginBottom: 5 }}>Sécurité du compte</h1>
      <p style={{ fontSize: 13, color: "#9a7c68", marginBottom: 28 }}>Protégez votre compte avec un mot de passe fort.</p>

      <Card>
        <CardTitle icon={KeyRound}>Changer le mot de passe</CardTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Mot de passe actuel"><Input type="password" value={form.current}  onChange={set("current")}  placeholder="••••••••" /></Field>
          <Field label="Nouveau mot de passe"><Input type="password" value={form.next}    onChange={set("next")}    placeholder="••••••••" /></Field>
          <Field label="Confirmer">            <Input type="password" value={form.confirm} onChange={set("confirm")} placeholder="••••••••" /></Field>
        </div>
        <FormActions>
          <Btn onClick={handleSave} loading={saving}><Save size={14} /> Mettre à jour</Btn>
        </FormActions>
      </Card>

      <Card danger>
        <CardTitle icon={TriangleAlert} danger>Zone de danger</CardTitle>
        <p style={{ fontSize: 13, color: "#9a7c68", marginBottom: 16 }}>Ces actions sont irréversibles.</p>
        <Btn variant="danger"><Trash2 size={13} /> Supprimer mon compte</Btn>
      </Card>
    </>
  );
}

function SectionNotifications({ onToast }) {
  const [notifs, setNotifs] = useState({ devis: true, missions: true, avis: true, newsletter: false });
  const toggle = k => setNotifs(n => ({ ...n, [k]: !n[k] }));

  return (
    <>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 400, color: "#1a1008", marginBottom: 5 }}>Préférences de notifications</h1>
      <p style={{ fontSize: 13, color: "#9a7c68", marginBottom: 28 }}>Choisissez comment vous souhaitez être notifié par email.</p>

      <Card>
        <CardTitle icon={Mail}>Email</CardTitle>
        <ToggleRow label="Nouvelles demandes de devis"  desc="Soyez averti dès qu'un client vous contacte"  value={notifs.devis}      onChange={() => toggle("devis")} />
        <ToggleRow label="Confirmation de missions"     desc="Recevez un email à chaque mission confirmée"   value={notifs.missions}   onChange={() => toggle("missions")} />
        <ToggleRow label="Nouveaux avis reçus"          desc="Soyez notifié quand un client laisse un avis"  value={notifs.avis}       onChange={() => toggle("avis")} />
        <ToggleRow label="Newsletter & actualités"      desc="Offres, conseils et nouveautés ServicePro"     value={notifs.newsletter} onChange={() => toggle("newsletter")} />
      </Card>

      <FormActions>
        <Btn onClick={() => onToast("Préférences enregistrées ✓")}><Save size={14} /> Enregistrer</Btn>
      </FormActions>
    </>
  );
}

export default function ProfilePage({ user: initialUser, subPage = "profile", onSave }) {
  const [user,  setUser]  = useState(initialUser);
  const [toast, setToast] = useState({ show: false, message: "", isError: false });

  useEffect(() => { setUser(initialUser); }, [initialUser]);

  const isWorker = user?.role === "worker";

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const handleSaved = (updatedUser) => {
  setUser(updatedUser);
  const merged = { ...JSON.parse(localStorage.getItem("user") || "{}"), ...updatedUser };
  localStorage.setItem("user", JSON.stringify(merged));
  onSave?.(merged);
};

  const shared = { user, isWorker, onSaved: handleSaved, onToast: showToast };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Toast show={toast.show} message={toast.message} isError={toast.isError} />
      {subPage === "profile"       && <SectionInformations  {...shared} />}
      {subPage === "competences"   && isWorker && <SectionCompetences   {...shared} />}
      {subPage === "disponibilite" && isWorker && <SectionDisponibilite {...shared} />}
      {subPage === "avis"          && isWorker && <SectionAvis          {...shared} />}
      {subPage === "securite"      && <SectionSecurite      {...shared} />}
      {subPage === "notifications" && <SectionNotifications {...shared} />}
      {!isWorker && ["competences", "disponibilite", "avis"].includes(subPage) && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9a7c68", fontSize: 14 }}>
          Cette section est réservée aux prestataires.
        </div>
      )}
    </div>
  );
}