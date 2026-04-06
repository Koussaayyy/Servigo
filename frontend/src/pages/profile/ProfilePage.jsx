// src/pages/profile/ProfilePage.jsx
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Camera, Upload, Trash2, Save, Tag, ListChecks,
  CalendarDays, MessageSquare, KeyRound, ShieldCheck,
  TriangleAlert, Mail, Plus, X, Eye, Check,
  Loader2, IdCard, MapPin, Building2,
  CheckCircle, XCircle,
} from "lucide-react";
import { clientApi, workerApi, avatarUrl, reservationApi } from "../../api";

function Card({ children, danger }) {
  return (
    <div style={{
      background: danger ? "rgba(192,57,43,0.02)" : "#fff",
      border: `1.5px solid ${danger ? "rgba(192,57,43,0.2)" : "#e2e8f0"}`,
      borderRadius: 12, padding: 28, marginBottom: 18,
      boxShadow: "0 2px 16px rgba(6, 182, 212, 0.05)",
    }}>{children}</div>
  );
}

function CardTitle({ icon: Icon, children, danger }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, letterSpacing: ".2em",
      textTransform: "uppercase", color: danger ? "#c0392b" : "#64748b",
      marginBottom: 20, display: "flex", alignItems: "center", gap: 8,
    }}>
      <Icon size={14} color={danger ? "#c0392b" : "#06b6d4"} />
      {children}
      <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
    </div>
  );
}

function Field({ label, children, span2 }) {
  return (
    <div style={{ gridColumn: span2 ? "span 2" : undefined, display: "flex", flexDirection: "column", gap: 7 }}>
      <label style={{ fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "#64748b", fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputBase = {
  width: "100%", padding: "11px 14px", background: "#e2e8f0",
  border: "1.5px solid transparent", borderRadius: 8,
  fontFamily: "'Sora', sans-serif", fontSize: 14, color: "#0f172e", outline: "none",
  transition: "border-color .2s, background .2s, box-shadow .2s",
};

function Input({ style, ...props }) {
  const [f, setF] = useState(false);
  return (
    <input {...props}
      style={{ ...inputBase, ...(f ? { borderColor: "#06b6d4", background: "#fff", boxShadow: "0 0 0 3px rgba(6, 182, 212, 0.1)" } : {}), ...style }}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
    />
  );
}

function Textarea(props) {
  const [f, setF] = useState(false);
  return (
    <textarea {...props}
      style={{ ...inputBase, resize: "vertical", minHeight: 80, ...(f ? { borderColor: "#06b6d4", background: "#fff", boxShadow: "0 0 0 3px rgba(6, 182, 212, 0.1)" } : {}) }}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
    />
  );
}

function SelectField({ children, ...props }) {
  const [f, setF] = useState(false);
  return (
    <select {...props}
      style={{ ...inputBase, appearance: "none", cursor: "pointer", ...(f ? { borderColor: "#06b6d4", background: "#fff", boxShadow: "0 0 0 3px rgba(6, 182, 212, 0.1)" } : {}) }}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
    >{children}</select>
  );
}

function Btn({ variant = "primary", loading = false, children, style, ...props }) {
  const base = { padding: "11px 22px", borderRadius: 8, fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 7, transition: "all .2s", opacity: loading ? 0.7 : 1, border: "none" };
  const variants = {
    primary:   { background: "#06b6d4", color: "#fff", boxShadow: "0 4px 16px rgba(6, 182, 212, 0.2)" },
    secondary: { background: "transparent", color: "#64748b", border: "1.5px solid #e2e8f0" },
    danger:    { background: "transparent", color: "#c0392b", border: "1.5px solid rgba(192,57,43,0.2)" },
    sm:        { background: "#06b6d4", color: "#fff", padding: "8px 14px", fontSize: 11 },
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
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid #e2e8f0" }}>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 42, height: 23, borderRadius: 100, background: on ? "#06b6d4" : "#e2e8f0", border: `1.5px solid ${on ? "#06b6d4" : "rgba(6, 182, 212, 0.15)"}`, position: "relative", cursor: "pointer", transition: "all .3s", flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, left: 2, transform: on ? "translateX(19px)" : "translateX(0)", transition: "transform .3s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #e2e8f0" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#0f172e" }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{desc}</div>}
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
        style={{ background: f ? "#fff" : "#e2e8f0", border: `1.5px solid ${f ? "#06b6d4" : "transparent"}`, boxShadow: f ? "0 0 0 3px rgba(6, 182, 212, 0.1)" : "none", borderRadius: 8, padding: "10px 12px", minHeight: 56, cursor: "text", transition: "all .2s" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: tags.length ? 8 : 0 }}>
          {tags.map(t => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px 4px 12px", borderRadius: 100, background: "#fff", color: "#06b6d4", fontSize: 12, fontWeight: 500, border: "1.5px solid rgba(6, 182, 212, 0.3)" }}>
              {t}
              <button type="button" onClick={e => { e.stopPropagation(); onChange(tags.filter(x => x !== t)); }}
                style={{ width: 16, height: 16, borderRadius: "50%", border: "none", background: "rgba(6, 182, 212, 0.12)", color: "#06b6d4", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
        <input id="tag-inp" value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          onFocus={() => setF(true)} onBlur={() => setF(false)}
          placeholder="Ajouter une compétence..."
          style={{ border: "none", background: "transparent", outline: "none", fontFamily: "'Sora',sans-serif", fontSize: 13, color: "#0f172e", width: "100%", minWidth: 160 }}
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
    <div style={{ position: "fixed", bottom: 28, right: 28, padding: "13px 24px", background: isError ? "#c0392b" : "#0f172e", color: isError ? "#fff" : "#06b6d4", border: `1.5px solid ${isError ? "rgba(192,57,43,0.4)" : "rgba(6, 182, 212, 0.4)"}`, borderRadius: 100, fontSize: 13, fontWeight: 600, opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(10px)", transition: "all .3s", zIndex: 9999, pointerEvents: "none", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
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
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: "min(420px,90vw)", border: "1.5px solid #e2e8f0", boxShadow: "0 8px 48px rgba(0,0,0,0.25)" }}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: "#0f172e", marginBottom: 6 }}>Photo de profil</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>Choisissez une photo claire et professionnelle.</div>

        {preview ? (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", border: "3px solid #06b6d4", margin: "0 auto 12px" }}>
              <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <button onClick={() => { setPreview(null); setFile(null); }}
              style={{ background: "none", border: "none", color: "#64748b", fontSize: 12, cursor: "pointer" }}>
              Choisir une autre photo
            </button>
          </div>
        ) : (
          <div onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
            style={{ border: "2px dashed rgba(6, 182, 212, 0.3)", borderRadius: 12, padding: "32px 20px", textAlign: "center", cursor: "pointer", background: "#f8fafc", marginBottom: 16 }}>
            <Camera size={36} color="#06b6d4" style={{ display: "block", margin: "0 auto 10px" }} />
            <p style={{ fontSize: 13, color: "#64748b" }}>Glissez votre photo ici ou <span style={{ color: "#06b6d4", fontWeight: 600 }}>parcourir</span></p>
            <p style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>JPG, PNG, WEBP — max 5 Mo</p>
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

      <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, color: "#0f172e", marginBottom: 5 }}>Informations personnelles</h1>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 28 }}>Gérez vos informations de profil visibles par les autres utilisateurs.</p>

      {/* Photo */}
      <Card>
        <CardTitle icon={Camera}>Photo de profil</CardTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div onClick={() => setShowModal(true)}
            style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#06b6d4,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora', sans-serif", fontSize: "1.8rem", fontWeight: 700, color: "#fff", border: "2.5px solid rgba(6, 182, 212, 0.3)", overflow: "hidden", cursor: "pointer", flexShrink: 0 }}
          >
            {currentAvatarUrl
              ? <img src={currentAvatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials
            }
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#0f172e", marginBottom: 4 }}>Photo visible sur votre profil public</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>JPG, PNG ou WEBP · max 5 Mo</div>
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
              style={{ opacity: 0.6, cursor: "not-allowed", background: "#e2e8f0" }} />
          </Field>
          <Field label="Téléphone"><Input type="tel" value={form.phone} onChange={set("phone")} /></Field>
          <Field label="Bio / Présentation" span2>
            <Textarea value={form.bio} onChange={set("bio")} placeholder="Présentez-vous..." />
          </Field>
          {isWorker && (
            <Field label="Métiers enregistrés" span2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 42, alignItems: "center", padding: "10px 12px", background: "#e2e8f0", borderRadius: 8 }}>
                {(user.workerProfile?.professions || []).length > 0 ? (
                  user.workerProfile.professions.map((profession) => (
                    <span key={profession} style={{ padding: "5px 10px", borderRadius: 100, background: "#fff", color: "#0f172e", border: "1px solid rgba(6, 182, 212, 0.2)", fontSize: 12, fontWeight: 600 }}>
                      {profession}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: 12, color: "#64748b" }}>Aucun métier enregistré.</span>
                )}
              </div>
            </Field>
          )}
        </div>
      </Card>

      {/* Localisation */}
      <Card>
        <CardTitle icon={MapPin}>Localisation</CardTitle>

        {/* ── GPS detect button ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
            Renseignez votre ville manuellement ou utilisez la détection automatique.
          </p>
          <button
            type="button"
            onClick={detectLocation}
            disabled={locLoading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8,
              border: "1.5px solid rgba(6, 182, 212, 0.3)",
              background: "rgba(6, 182, 212, 0.06)", color: "#06b6d4",
              fontSize: 12, fontWeight: 600,
              cursor: locLoading ? "not-allowed" : "pointer",
              fontFamily: "'Sora',sans-serif",
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
                  <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 600, color: "#64748b", pointerEvents: "none" }}>TND</span>
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
      <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, color: "#0f172e", marginBottom: 5 }}>Compétences & Services</h1>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 28 }}>Définissez vos domaines d'expertise et les services que vous proposez.</p>

      <Card>
        <CardTitle icon={Tag}>Compétences / Métiers</CardTitle>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
          Tapez une compétence et appuyez sur{" "}
          <kbd style={{ background: "#e2e8f0", border: "1px solid rgba(6, 182, 212, 0.2)", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>Entrée</kbd>
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
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "1.5px dashed rgba(6, 182, 212, 0.3)", borderRadius: 8, padding: "10px 16px", color: "#06b6d4", fontSize: 13, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
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

function SectionPortfolio({ user, onSaved, onToast }) {
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [projects, setProjects] = useState(user.workerProfile?.portfolio || []);
  const emptyForm = {
    title: "",
    city: "",
    description: "",
    imageUrl: "",
    featured: false,
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setProjects(user.workerProfile?.portfolio || []);
  }, [user.workerProfile?.portfolio]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingIndex(null);
  };

  const handleImagePick = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await workerApi.uploadPortfolioImage(file);
      setForm((prev) => ({ ...prev, imageUrl: res.imageUrl || "" }));
      onToast("Image importée ✓");
    } catch (err) {
      onToast(err.message || "Upload image échoué", true);
    } finally {
      setUploadingImage(false);
    }
  };

  const addOrUpdateProject = () => {
    if (!form.title.trim()) return onToast("Le titre du projet est requis", true);
    if (!form.description.trim()) return onToast("La description est requise", true);

    const nextProject = {
      title: form.title.trim(),
      city: form.city.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl,
      featured: !!form.featured,
    };

    if (editingIndex === null) {
      setProjects((prev) => [...prev, nextProject]);
      onToast("Projet ajouté");
    } else {
      setProjects((prev) => prev.map((project, idx) => (idx === editingIndex ? nextProject : project)));
      onToast("Projet modifié");
    }

    resetForm();
  };

  const editProject = (index) => {
    const project = projects[index];
    setEditingIndex(index);
    setForm({
      title: project.title || "",
      city: project.city || "",
      description: project.description || "",
      imageUrl: project.imageUrl || "",
      featured: !!project.featured,
    });
  };

  const deleteProject = (index) => {
    setProjects((prev) => prev.filter((_, idx) => idx !== index));
    if (editingIndex === index) resetForm();
    onToast("Projet supprimé");
  };

  const toggleFeatured = (index) => {
    setProjects((prev) =>
      prev.map((project, idx) => {
        if (idx === index) return { ...project, featured: !project.featured };
        return { ...project, featured: false };
      })
    );
  };

  const savePortfolio = async () => {
    setSaving(true);
    try {
      const res = await workerApi.updateProfile({
        workerProfile: {
          ...user.workerProfile,
          portfolio: projects,
        },
      });
      onSaved(res.user);
      onToast("Portfolio enregistré ✓");
    } catch (err) {
      onToast(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, color: "#0f172e", marginBottom: 5 }}>Portfolio</h1>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 18 }}>
        Ajoutez seulement vos projets. La note et les avis sont laissés par les clients après une mission.
      </p>

      <Card>
        <CardTitle icon={Building2}>{editingIndex === null ? "Nouveau projet" : "Modifier le projet"}</CardTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Titre du projet"><Input value={form.title} onChange={set("title")} placeholder="Rénovation salle de bain" /></Field>
          <Field label="Ville"><Input value={form.city} onChange={set("city")} placeholder="Tunis" /></Field>
          <Field label="Description" span2>
            <Textarea value={form.description} onChange={set("description")} placeholder="Expliquez brièvement le travail réalisé..." />
          </Field>
          <Field label="Photo du projet" span2>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", cursor: uploadingImage ? "not-allowed" : "pointer", opacity: uploadingImage ? 0.7 : 1 }}>
                <Upload size={14} />
                {uploadingImage ? "Import..." : "Choisir depuis l'appareil"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  disabled={uploadingImage}
                  onChange={(e) => handleImagePick(e.target.files?.[0])}
                />
              </label>
              {form.imageUrl && <span style={{ fontSize: 12, color: "#64748b" }}>Image prête ✓</span>}
            </div>
          </Field>
        </div>

        <FormActions>
          {editingIndex !== null && <Btn variant="secondary" onClick={resetForm}>Annuler</Btn>}
          <Btn onClick={addOrUpdateProject}><Save size={14} /> {editingIndex === null ? "Ajouter" : "Mettre à jour"}</Btn>
        </FormActions>
      </Card>

      <Card>
        <CardTitle icon={ListChecks}>Projets enregistrés</CardTitle>
        {projects.length === 0 ? (
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Aucun projet pour le moment.</p>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {projects.map((project, index) => (
              <div key={`${project.title}-${index}`} style={{ border: "1.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
                {project.imageUrl ? (
                  <div style={{ height: 160, background: `url(${avatarUrl(project.imageUrl) || project.imageUrl}) center/cover no-repeat` }} />
                ) : (
                  <div style={{ height: 80, background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 12 }}>
                    Aucune image
                  </div>
                )}
                <div style={{ padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172e" }}>{project.title || "Projet"}</div>
                    {project.featured && (
                      <span style={{ fontSize: 11, color: "#06b6d4", border: "1px solid rgba(6, 182, 212, 0.3)", padding: "2px 8px", borderRadius: 100 }}>
                        En vedette
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                    {project.city || "Ville non précisée"}
                  </div>
                  <div style={{ fontSize: 13, color: "#0f172e", marginBottom: 10 }}>{project.description || ""}</div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <Btn variant="secondary" onClick={() => toggleFeatured(index)} style={{ padding: "8px 14px", fontSize: 11 }}>
                      {project.featured ? "Retirer vedette" : "Mettre en vedette"}
                    </Btn>
                    <Btn variant="secondary" onClick={() => editProject(index)} style={{ padding: "8px 14px", fontSize: 11 }}>Modifier</Btn>
                    <Btn variant="danger" onClick={() => deleteProject(index)} style={{ padding: "8px 14px", fontSize: 11 }}>
                      <Trash2 size={13} />
                    </Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <FormActions>
          <Btn onClick={savePortfolio} loading={saving}><Save size={14} /> Enregistrer le portfolio</Btn>
        </FormActions>
      </Card>
    </>
  );
}

function SectionDisponibilite({ user, onSaved, onToast }) {
  const BOOKABLE_HOURS = [8, 9, 10, 11, 12, 14, 15, 16, 17];
  const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const DAY_LABELS = {
    monday: "Lundi",
    tuesday: "Mardi",
    wednesday: "Mercredi",
    thursday: "Jeudi",
    friday: "Vendredi",
    saturday: "Samedi",
    sunday: "Dimanche",
  };

  const toHourLabel = (hour) => `${String(hour).padStart(2, "0")}:00`;

  const toDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const upcomingDates = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return Array.from({ length: 28 }, (_, index) => {
      const date = new Date(base);
      date.setDate(base.getDate() + index);
      const key = toDateKey(date);
      const dayKey = DAY_KEYS[date.getDay()];
      return {
        key,
        dayKey,
        label: `${DAY_LABELS[dayKey]} ${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
      };
    });
  }, []);

  const normalizeHours = (hours) => {
    if (!Array.isArray(hours)) return [];
    return [...new Set(hours.map(Number).filter((value) => BOOKABLE_HOURS.includes(value)))].sort((a, b) => a - b);
  };

  const normalizeCalendar = (calendarRaw, weeklyRaw) => {
    const calendarMap = {};
    if (Array.isArray(calendarRaw)) {
      calendarRaw.forEach((item) => {
        if (!item?.date) return;
        calendarMap[item.date] = normalizeHours(item.hours);
      });
    }

    const fallbackWeekly = weeklyRaw || {};
    upcomingDates.forEach((item) => {
      if (!calendarMap[item.key]) {
        calendarMap[item.key] = normalizeHours(fallbackWeekly[item.dayKey] || []);
      }
    });

    return calendarMap;
  };

  const [loading, setLoading] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [available, setAvailable] = useState(user.workerProfile?.isAvailable ?? true);
  const [selectedDateKey, setSelectedDateKey] = useState(() => upcomingDates[0]?.key || "");
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [reservationsByDate, setReservationsByDate] = useState({});

  const weekGroups = useMemo(
    () => Array.from({ length: 4 }, (_, index) => upcomingDates.slice(index * 7, index * 7 + 7)),
    [upcomingDates]
  );

  const selectedWeekDates = weekGroups[selectedWeekIndex] || [];
  const selectedDateObj = upcomingDates.find((item) => item.key === selectedDateKey);

  useEffect(() => {
    if (!selectedWeekDates.some((item) => item.key === selectedDateKey)) {
      const first = selectedWeekDates[0];
      if (first) setSelectedDateKey(first.key);
    }
  }, [selectedWeekIndex, selectedWeekDates, selectedDateKey]);

  useEffect(() => {
    setAvailable(user.workerProfile?.isAvailable ?? true);
  }, [user.workerProfile?.isAvailable]);

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

  useEffect(() => {
    const fetchReservations = async () => {
      setLoadingReservations(true);
      try {
        const data = await reservationApi.getWorkerReservations();
        const next = {};
        (Array.isArray(data) ? data : []).forEach((reservation) => {
          const dateKey = reservation?.bookingDate ? String(reservation.bookingDate).slice(0, 10) : "";
          if (!dateKey) return;
          if (!next[dateKey]) next[dateKey] = [];
          next[dateKey].push(reservation);
        });
        Object.keys(next).forEach((key) => {
          next[key].sort((a, b) => (a.bookingHour || 0) - (b.bookingHour || 0));
        });
        setReservationsByDate(next);
      } catch (err) {
        onToast(err.message || "Impossible de charger vos réservations", true);
      } finally {
        setLoadingReservations(false);
      }
    };

    fetchReservations();
  }, [onToast]);

  const selectedDateReservations = reservationsByDate[selectedDateKey] || [];
  const totalReservations = upcomingDates.reduce((sum, item) => sum + ((reservationsByDate[item.key] || []).length), 0);

  const getDateStatusStyle = (count) => {
    if (count === 0) return { background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" };
    if (count >= BOOKABLE_HOURS.length) return { background: "rgba(6, 182, 212, 0.12)", color: "#06b6d4", border: "1px solid rgba(6, 182, 212, 0.28)" };
    return { background: "rgba(6, 182, 212, 0.08)", color: "#0891b2", border: "1px solid rgba(6, 182, 212, 0.18)" };
  };

  return (
    <>
      <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, color: "#0f172e", marginBottom: 5 }}>Disponibilités</h1>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 28 }}>Contrôlez votre visibilité auprès des clients.</p>

      <Card>
        <CardTitle icon={CalendarDays}>Statut de disponibilité</CardTitle>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172e", marginBottom: 4 }}>
              {available
              ? <><CheckCircle size={15} color="#22c55e" /> Disponible pour des missions</>
              : <><XCircle size={15} color="#ef4444" /> Indisponible en ce moment</>
              }
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              {available
                ? "Les clients peuvent vous contacter."
                : "Votre profil reste visible mais sans nouvelles demandes."}
            </div>
          </div>
          <Toggle on={available} onChange={handleToggle} />
        </div>
        {loading && <div style={{ fontSize: 12, color: "#64748b" }}>Mise à jour...</div>}
      </Card>

      <Card>
        <CardTitle icon={CalendarDays}>Calendrier des réservations (4 semaines)</CardTitle>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
          Le client réserve sur les horaires standard. Ici vous voyez vos réservations confirmées/pending sur 4 semaines.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {weekGroups.map((week, index) => {
            const active = index === selectedWeekIndex;
            const first = week[0];
            const last = week[week.length - 1];
            const label = first && last
              ? `Semaine ${index + 1} · ${first.label.split(" ")[1]} → ${last.label.split(" ")[1]}`
              : `Semaine ${index + 1}`;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedWeekIndex(index)}
                style={{
                  border: active ? "1.5px solid #06b6d4" : "1.5px solid #e2e8f0",
                  background: active ? "rgba(6, 182, 212, 0.1)" : "#fff",
                  color: active ? "#06b6d4" : "#64748b",
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontFamily: "'Sora',sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) minmax(420px, 1.4fr)", gap: 16, alignItems: "start" }}>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".18em", color: "#64748b", marginBottom: 10, fontWeight: 700 }}>
              Dates de la semaine
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {selectedWeekDates.map((item) => {
                const active = item.key === selectedDateKey;
                const count = (reservationsByDate[item.key] || []).length;
                const statusStyle = getDateStatusStyle(count);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedDateKey(item.key)}
                    style={{
                      border: active ? "1.5px solid #06b6d4" : "1px solid #e2e8f0",
                      background: active ? "rgba(6, 182, 212, 0.08)" : "#fff",
                      borderRadius: 10,
                      padding: "10px 12px",
                      display: "flex",
                      justifyContent: "space--between",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#0f172e", fontWeight: active ? 700 : 600 }}>
                      {item.label}
                    </span>
                    <span style={{ ...statusStyle, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 100 }}>
                      {count}/{BOOKABLE_HOURS.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".18em", color: "#64748b", fontWeight: 700, marginBottom: 4 }}>
                  Date sélectionnée
                </div>
                <div style={{ fontSize: 14, color: "#0f172e", fontWeight: 700 }}>
                  {selectedDateObj?.label || "Date"} · {selectedDateReservations.length} réservation(s)
                </div>
              </div>
            </div>

            {loadingReservations ? (
              <div style={{ fontSize: 12, color: "#64748b" }}>Chargement des réservations...</div>
            ) : selectedDateReservations.length === 0 ? (
              <div style={{ fontSize: 12, color: "#64748b" }}>Aucune réservation sur cette date.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {selectedDateReservations.map((reservation) => (
                  <div
                    key={reservation._id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "10px 12px",
                      background: "#f8fafc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, color: "#0f172e", fontWeight: 700 }}>
                        {toHourLabel(reservation.bookingHour)} · {reservation.client?.firstName || "Client"} {reservation.client?.lastName || ""}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{reservation.serviceType || "Service"}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 100, background: "rgba(6, 182, 212, 0.08)", color: "#06b6d4", border: "1px solid rgba(6, 182, 212, 0.2)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>
                      {reservation.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#64748b", marginTop: 14 }}>
          Total sur 4 semaines: {totalReservations} réservation(s)
        </div>
      </Card>
    </>
  );
}

function SectionAvis({ user }) {
  const profileRating = Number(user.workerProfile?.rating || 0);
  const profileTotalReviews = Number(user.workerProfile?.totalReviews || 0);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [completedMissions, setCompletedMissions] = useState(0);

  const computedTotalReviews = reviews.length;
  const computedRating = computedTotalReviews > 0
    ? Number(
        (
          reviews.reduce((sum, item) => sum + Number(item?.clientReview?.rating || 0), 0) /
          computedTotalReviews
        ).toFixed(1)
      )
    : 0;

  const displayTotalReviews = computedTotalReviews > 0 ? computedTotalReviews : profileTotalReviews;
  const displayRating = computedTotalReviews > 0 ? computedRating : profileRating;
  const roundedStars = Math.max(0, Math.min(5, Math.round(displayRating)));

  useEffect(() => {
    const loadReviews = async () => {
      setLoadingReviews(true);
      try {
        const [reviewsData, reservationsData] = await Promise.all([
          reservationApi.getWorkerReviews(),
          reservationApi.getWorkerReservations(),
        ]);

        const safeReviews = Array.isArray(reviewsData) ? reviewsData : [];
        const safeReservations = Array.isArray(reservationsData) ? reservationsData : [];

        setReviews(safeReviews);
        setCompletedMissions(safeReservations.filter((item) => item?.status === "completed").length);
      } catch {
        setReviews([]);
        setCompletedMissions(0);
      } finally {
        setLoadingReviews(false);
      }
    };

    loadReviews();
  }, []);

  return (
    <>
      <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, color: "#0f172e", marginBottom: 5 }}>Avis & Évaluations</h1>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 28 }}>Les retours de vos clients.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { value: displayRating.toFixed(1), label: "Note moyenne", stars: true },
          { value: displayTotalReviews,      label: "Avis reçus" },
          { value: completedMissions,  label: "Missions complétées" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1.5px solid #f0e6da", borderRadius: 12, padding: 20, textAlign: "center", boxShadow: "0 2px 12px rgba(232,98,10,0.04)" }}>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: "2rem", fontWeight: 700, color: "#06b6d4" }}>{s.value}</div>
            {s.stars && <div style={{ color: "#e8620a", marginBottom: 2 }}>{"★".repeat(roundedStars)}{"☆".repeat(Math.max(0, 5 - roundedStars))}</div>}
            <div style={{ fontSize: 11, color: "#9a7c68" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardTitle icon={MessageSquare}>Avis clients</CardTitle>
        {loadingReviews ? (
          <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: "20px 0" }}>Chargement des avis...</p>
        ) : reviews.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9a7c68", textAlign: "center", padding: "20px 0" }}>
            Aucun avis pour l'instant. Complétez vos premières missions !
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {reviews.map((item) => {
              const reviewedAt = item?.clientReview?.reviewedAt ? new Date(item.clientReview.reviewedAt).toLocaleDateString() : "";
              const stars = Number(item?.clientReview?.rating || 0);
              return (
                <div key={item._id} style={{ border: "1px solid #f0e6da", borderRadius: 10, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1008" }}>
                      {item.client?.firstName || "Client"} {item.client?.lastName || ""}
                    </div>
                    <div style={{ fontSize: 12, color: "#06b6d4", fontWeight: 700 }}>
                      {"★".repeat(stars)}{"☆".repeat(Math.max(0, 5 - stars))}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: item?.clientReview?.comment ? 6 : 0 }}>
                    {item.serviceType || "Service"}{reviewedAt ? ` · ${reviewedAt}` : ""}
                  </div>
                  {item?.clientReview?.comment && (
                    <div style={{ fontSize: 13, color: "#0f172e" }}>{item.clientReview.comment}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
      <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, color: "#0f172e", marginBottom: 5 }}>Sécurité du compte</h1>
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
      <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, color: "#0f172e", marginBottom: 5 }}>Préférences de notifications</h1>
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
      {subPage === "portfolio"     && isWorker && <SectionPortfolio     {...shared} />}
      {subPage === "disponibilite" && isWorker && <SectionDisponibilite {...shared} />}
      {subPage === "avis"          && isWorker && <SectionAvis          {...shared} />}
      {subPage === "securite"      && <SectionSecurite      {...shared} />}
      {subPage === "notifications" && <SectionNotifications {...shared} />}
      {!isWorker && ["competences", "portfolio", "disponibilite", "avis"].includes(subPage) && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9a7c68", fontSize: 14 }}>
          Cette section est réservée aux prestataires.
        </div>
      )}
    </div>
  );
}