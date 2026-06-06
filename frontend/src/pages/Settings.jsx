import { useState } from "react";
import {
  User, Lock, Eye, EyeOff, Trash2,
  CheckCircle, AlertCircle, Save, ArrowLeft,
  ChevronRight, Mail, Send,
} from "lucide-react";
import { clientApi, workerApi, avatarUrl } from "../api";
import Navbar from "../components/Navbar";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
.settings-wrap { min-height:100vh; background:#f1f5f9; font-family:'Sora',sans-serif; padding-top:64px; }
.settings-inner { max-width:900px; margin:0 auto; padding:32px 20px; display:grid; grid-template-columns:220px 1fr; gap:24px; align-items:start; }
@media(max-width:680px){ .settings-inner{ grid-template-columns:1fr; } }
.settings-sidebar { display:flex; flex-direction:column; gap:4px; }
.settings-nav-btn {
  display:flex; align-items:center; gap:10px; width:100%;
  padding:11px 14px; border-radius:10px; border:none; cursor:pointer;
  font-size:13px; font-weight:600; font-family:'Sora',sans-serif;
  background:transparent; color:#64748b; text-align:left; transition:all .15s;
}
.settings-nav-btn:hover { background:#fff; color:#0f172e; }
.settings-nav-btn.active { background:#fff; color:#06b6d4; box-shadow:0 1px 4px rgba(15,23,46,.08); }
.settings-nav-btn .nav-icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#f1f5f9; flex-shrink:0; transition:background .15s; }
.settings-nav-btn.active .nav-icon { background:rgba(6,182,212,.12); }
.settings-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; overflow:hidden; margin-bottom:16px; }
.settings-card-header { padding:18px 22px; border-bottom:1.5px solid #f1f5f9; display:flex; align-items:center; gap:10px; }
.settings-card-title { font-size:15px; font-weight:800; color:#0f172e; margin:0; }
.settings-card-body { padding:22px; }
.settings-field { margin-bottom:18px; }
.settings-field:last-child { margin-bottom:0; }
.settings-label { font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.08em; display:block; margin-bottom:7px; }
.settings-input {
  width:100%; border:1.5px solid #e2e8f0; border-radius:9px;
  padding:10px 14px; font-size:13px; font-family:'Sora',sans-serif;
  outline:none; transition:border-color .15s; box-sizing:border-box; color:#0f172e;
}
.settings-input:focus { border-color:#06b6d4; }
.settings-input:disabled { background:#f8fafc; color:#94a3b8; }
.settings-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
@media(max-width:520px){ .settings-row{ grid-template-columns:1fr; } }
.settings-btn {
  display:inline-flex; align-items:center; gap:7px; padding:10px 20px;
  border-radius:9px; border:none; font-size:13px; font-weight:700;
  font-family:'Sora',sans-serif; cursor:pointer; transition:all .15s;
}
.settings-btn-primary { background:#06b6d4; color:#fff; }
.settings-btn-primary:hover { background:#0891b2; }
.settings-btn-primary:disabled { background:#e2e8f0; color:#94a3b8; cursor:not-allowed; }
.settings-btn-danger { background:#fef2f2; color:#ef4444; border:1.5px solid #fecaca; }
.settings-btn-danger:hover { background:#fee2e2; }
.settings-btn-ghost { background:#f8fafc; color:#64748b; border:1.5px solid #e2e8f0; }
.settings-btn-ghost:hover { background:#f1f5f9; }
.settings-toast { position:fixed; bottom:28px; right:28px; z-index:9999; display:flex; align-items:center; gap:10px; padding:13px 18px; border-radius:12px; font-size:13px; font-weight:600; font-family:'Sora',sans-serif; box-shadow:0 8px 24px rgba(0,0,0,.12); animation:toast-in .25s ease; min-width:240px; }
.settings-toast.success { background:#0f172e; color:#fff; }
.settings-toast.error { background:#fef2f2; color:#b91c1c; border:1.5px solid #fecaca; }
@keyframes toast-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
`;

export default function Settings({ user, onNavigate, onLogout, onUpdateUser }) {
  const api = user.role === "worker" ? workerApi : clientApi;

  const [section, setSection] = useState("account");
  const [toast,   setToast]   = useState(null);
  const [saving,  setSaving]  = useState(false);

  // Personal info
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName,  setLastName]  = useState(user.lastName  || "");
  const [phone,     setPhone]     = useState(user.phone     || "");
  const [gender,    setGender]    = useState(user.gender    || "");
  const [birthDate, setBirthDate] = useState(
    user.birthDate ? String(user.birthDate).slice(0, 10) : ""
  );

  // Security — password
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd,     setNewPwd]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd,    setShowPwd]    = useState(false);

  // Security — delete account (0=idle, 1=code sent, 2=confirmed)
  const [delStep,    setDelStep]    = useState(0);
  const [delCode,    setDelCode]    = useState("");
  const [delLoading, setDelLoading] = useState(false);

  // Email change (0=idle, 1=code sent)
  const [emailStep,    setEmailStep]    = useState(0);
  const [newEmail,     setNewEmail]     = useState("");
  const [emailCode,    setEmailCode]    = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const saveAccount = async () => {
    setSaving(true);
    try {
      const data = await api.updateProfile({ firstName, lastName, phone, gender, birthDate });
      onUpdateUser?.({ ...user, ...(data.user || data) });
      showToast("Informations mises à jour");
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!currentPwd || !newPwd) return showToast("Remplissez tous les champs", "error");
    if (newPwd !== confirmPwd)  return showToast("Les mots de passe ne correspondent pas", "error");
    if (newPwd.length < 8)     return showToast("8 caractères minimum", "error");
    setSaving(true);
    try {
      await api.changePassword(currentPwd, newPwd);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      showToast("Mot de passe modifié");
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const sendDeleteCode = async () => {
    setDelLoading(true);
    try {
      await api.sendDeleteCode();
      setDelStep(1);
      showToast("Code envoyé sur " + user.email);
    } catch (e) { showToast(e.message, "error"); }
    finally { setDelLoading(false); }
  };

  const confirmDelete = async () => {
    if (!delCode) return showToast("Entrez le code reçu par email", "error");
    setDelLoading(true);
    try {
      await api.deleteAccount(delCode);
      onLogout?.();
    } catch (e) { showToast(e.message, "error"); }
    finally { setDelLoading(false); }
  };

  const sendEmailCode = async () => {
    if (!newEmail) return showToast("Entrez votre nouvel email", "error");
    setEmailLoading(true);
    try {
      await api.sendEmailChangeCode(newEmail);
      setEmailStep(1);
      showToast("Code envoyé sur " + newEmail);
    } catch (e) { showToast(e.message, "error"); }
    finally { setEmailLoading(false); }
  };

  const confirmEmailChange = async () => {
    if (!emailCode) return showToast("Entrez le code reçu par email", "error");
    setEmailLoading(true);
    try {
      const data = await api.changeEmail(emailCode);
      onUpdateUser?.({ ...user, ...(data.user || data) });
      setEmailStep(0); setNewEmail(""); setEmailCode("");
      showToast("Email modifié avec succès");
    } catch (e) { showToast(e.message, "error"); }
    finally { setEmailLoading(false); }
  };

  const sections = [
    { id: "account",  label: "Informations",  icon: User },
    { id: "email",    label: "Email",          icon: Mail },
    { id: "security", label: "Sécurité",      icon: Lock },
  ];

  return (
    <>
      <style>{css}</style>
      <Navbar
        user={user}
        activePage="settings"
        onHome={() => onNavigate("explore")}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="settings-wrap">
        <div className="settings-inner">

          {/* Sidebar */}
          <div>
            <button className="settings-btn settings-btn-ghost"
              style={{ width:"100%", marginBottom:12, justifyContent:"flex-start" }}
              onClick={() => onNavigate("profile")}>
              <ArrowLeft size={14}/> Retour au profil
            </button>

            <div className="settings-card" style={{ marginBottom:0 }}>
              <div style={{ padding:"16px 18px", borderBottom:"1.5px solid #f1f5f9", display:"flex", alignItems:"center", gap:12 }}>
                {avatarUrl(user.avatar)
                  ? <img src={avatarUrl(user.avatar)} alt="" style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:"2px solid #e2e8f0" }}/>
                  : <div style={{ width:40, height:40, borderRadius:"50%", background:"#0f172e", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:16, flexShrink:0 }}>
                      {(user.firstName?.[0] || "?").toUpperCase()}
                    </div>
                }
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172e", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>
                    {user.role === "worker" ? "Prestataire" : "Client"}
                  </div>
                </div>
              </div>

              <div className="settings-sidebar" style={{ padding:"8px 10px" }}>
                {sections.map(({ id, label, icon: Icon }) => (
                  <button key={id} className={`settings-nav-btn ${section === id ? "active" : ""}`}
                    onClick={() => setSection(id)}>
                    <span className="nav-icon"><Icon size={14}/></span>
                    {label}
                    <ChevronRight size={13} style={{ marginLeft:"auto", opacity:.4 }}/>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div>

            {section === "account" && (
              <div className="settings-card">
                <div className="settings-card-header">
                  <User size={16} color="#06b6d4"/>
                  <h3 className="settings-card-title">Informations personnelles</h3>
                </div>
                <div className="settings-card-body">
                  <div className="settings-row">
                    <div className="settings-field">
                      <label className="settings-label">Prénom</label>
                      <input className="settings-input" value={firstName} onChange={e => setFirstName(e.target.value)}/>
                    </div>
                    <div className="settings-field">
                      <label className="settings-label">Nom</label>
                      <input className="settings-input" value={lastName} onChange={e => setLastName(e.target.value)}/>
                    </div>
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">Email</label>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <input className="settings-input" value={user.email} disabled style={{ flex:1 }}/>
                      <button className="settings-btn settings-btn-ghost"
                        onClick={() => setSection("email")}
                        style={{ flexShrink:0, fontSize:12, gap:5 }}>
                        <Mail size={12}/> Changer
                      </button>
                    </div>
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">Téléphone</label>
                    <div style={{ display:"flex", border:"1.5px solid #e2e8f0", borderRadius:9, overflow:"hidden", transition:"border-color .15s" }}
                      onFocusCapture={e => e.currentTarget.style.borderColor = "#06b6d4"}
                      onBlurCapture={e  => e.currentTarget.style.borderColor = "#e2e8f0"}>
                      <span style={{ padding:"10px 12px", fontSize:12, color:"#64748b", fontWeight:600, background:"#f8fafc", borderRight:"1.5px solid #e2e8f0", whiteSpace:"nowrap" }}>
                        🇹🇳 +216
                      </span>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="XX XXX XXX"
                        style={{ flex:1, border:"none", background:"transparent", padding:"10px 12px", fontSize:13, outline:"none", fontFamily:"'Sora',sans-serif" }}/>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-field">
                      <label className="settings-label">Genre</label>
                      <select className="settings-input" value={gender} onChange={e => setGender(e.target.value)}>
                        <option value="">Non renseigné</option>
                        <option value="male">Homme</option>
                        <option value="female">Femme</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                    <div className="settings-field">
                      <label className="settings-label">Date de naissance</label>
                      <input type="date" className="settings-input" value={birthDate} onChange={e => setBirthDate(e.target.value)}/>
                    </div>
                  </div>

                  <div style={{ display:"flex", justifyContent:"flex-end", marginTop:4 }}>
                    <button className="settings-btn settings-btn-primary" onClick={saveAccount} disabled={saving}>
                      <Save size={14}/> {saving ? "Enregistrement…" : "Enregistrer"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {section === "email" && (
              <div className="settings-card">
                <div className="settings-card-header">
                  <Mail size={16} color="#06b6d4"/>
                  <h3 className="settings-card-title">Changer l'adresse email</h3>
                </div>
                <div className="settings-card-body">
                  <p style={{ fontSize:13, color:"#64748b", marginTop:0, lineHeight:1.6 }}>
                    Email actuel : <strong>{user.email}</strong>
                  </p>

                  {emailStep === 0 && (
                    <>
                      <div className="settings-field">
                        <label className="settings-label">Nouvel email</label>
                        <input type="email" className="settings-input" value={newEmail}
                          onChange={e => setNewEmail(e.target.value)}
                          placeholder="nouveau@email.com"/>
                      </div>
                      <div style={{ display:"flex", justifyContent:"flex-end" }}>
                        <button className="settings-btn settings-btn-primary"
                          onClick={sendEmailCode} disabled={emailLoading || !newEmail}>
                          <Send size={14}/> {emailLoading ? "Envoi…" : "Envoyer le code"}
                        </button>
                      </div>
                    </>
                  )}

                  {emailStep === 1 && (
                    <div style={{ background:"#f0fdfe", border:"1.5px solid #a5f3fc", borderRadius:10, padding:16 }}>
                      <p style={{ fontSize:13, color:"#0e7490", fontWeight:600, marginTop:0, marginBottom:12 }}>
                        Un code à 6 chiffres a été envoyé sur <strong>{newEmail}</strong>
                      </p>
                      <div className="settings-field">
                        <label className="settings-label">Code de vérification</label>
                        <input className="settings-input" value={emailCode}
                          onChange={e => setEmailCode(e.target.value)}
                          placeholder="123456" maxLength={6}
                          style={{ letterSpacing:"0.2em", fontSize:18, textAlign:"center" }}/>
                      </div>
                      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                        <button className="settings-btn settings-btn-primary"
                          onClick={confirmEmailChange} disabled={emailLoading || !emailCode}>
                          <CheckCircle size={14}/> {emailLoading ? "Modification…" : "Confirmer le changement"}
                        </button>
                        <button className="settings-btn settings-btn-ghost"
                          onClick={() => { setEmailStep(0); setEmailCode(""); }}>
                          Annuler
                        </button>
                        <button className="settings-btn settings-btn-ghost"
                          onClick={sendEmailCode} disabled={emailLoading} style={{ fontSize:12 }}>
                          Renvoyer le code
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {section === "security" && (
              <>
                <div className="settings-card">
                  <div className="settings-card-header">
                    <Lock size={16} color="#06b6d4"/>
                    <h3 className="settings-card-title">Changer le mot de passe</h3>
                  </div>
                  <div className="settings-card-body">
                    <div className="settings-field">
                      <label className="settings-label">Mot de passe actuel</label>
                      <div style={{ position:"relative" }}>
                        <input type={showPwd ? "text" : "password"} className="settings-input"
                          value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
                          placeholder="••••••••" style={{ paddingRight:40 }}/>
                        <button type="button" onClick={() => setShowPwd(v => !v)}
                          style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94a3b8", padding:0 }}>
                          {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      </div>
                    </div>
                    <div className="settings-row">
                      <div className="settings-field">
                        <label className="settings-label">Nouveau mot de passe</label>
                        <input type="password" className="settings-input" value={newPwd}
                          onChange={e => setNewPwd(e.target.value)} placeholder="Min. 8 caractères"/>
                      </div>
                      <div className="settings-field">
                        <label className="settings-label">Confirmer</label>
                        <input type="password" className="settings-input" value={confirmPwd}
                          onChange={e => setConfirmPwd(e.target.value)} placeholder="Répétez le mot de passe"
                          style={confirmPwd && confirmPwd !== newPwd ? { borderColor:"#ef4444" } : {}}/>
                      </div>
                    </div>
                    {confirmPwd && confirmPwd !== newPwd && (
                      <p style={{ fontSize:12, color:"#ef4444", margin:"0 0 12px", display:"flex", alignItems:"center", gap:5 }}>
                        <AlertCircle size={13}/> Les mots de passe ne correspondent pas
                      </p>
                    )}
                    <div style={{ display:"flex", justifyContent:"flex-end" }}>
                      <button className="settings-btn settings-btn-primary" onClick={changePassword}
                        disabled={saving || !currentPwd || !newPwd}>
                        <Save size={14}/> {saving ? "Modification…" : "Modifier le mot de passe"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-card" style={{ borderColor:"#fecaca" }}>
                  <div className="settings-card-header" style={{ background:"#fef2f2", borderColor:"#fecaca" }}>
                    <Trash2 size={16} color="#ef4444"/>
                    <h3 className="settings-card-title" style={{ color:"#b91c1c" }}>Supprimer le compte</h3>
                  </div>
                  <div className="settings-card-body">
                    <p style={{ fontSize:13, color:"#64748b", marginTop:0, lineHeight:1.6 }}>
                      Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement supprimées.
                      Un code de confirmation vous sera envoyé sur <strong>{user.email}</strong>.
                    </p>

                    {delStep === 0 && (
                      <button className="settings-btn settings-btn-danger" onClick={sendDeleteCode} disabled={delLoading}>
                        <Trash2 size={14}/> {delLoading ? "Envoi…" : "Supprimer mon compte"}
                      </button>
                    )}

                    {delStep === 1 && (
                      <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:10, padding:16 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:"#b91c1c", marginTop:0, marginBottom:12 }}>
                          Entrez le code à 6 chiffres reçu par email :
                        </p>
                        <div className="settings-field">
                          <input className="settings-input" value={delCode}
                            onChange={e => setDelCode(e.target.value)}
                            placeholder="123456" maxLength={6}
                            style={{ borderColor:"#fecaca", letterSpacing:"0.2em", fontSize:18, textAlign:"center" }}/>
                        </div>
                        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                          <button className="settings-btn settings-btn-danger" onClick={confirmDelete}
                            disabled={delLoading || !delCode}>
                            <Trash2 size={14}/> {delLoading ? "Suppression…" : "Confirmer la suppression"}
                          </button>
                          <button className="settings-btn settings-btn-ghost"
                            onClick={() => { setDelStep(0); setDelCode(""); }}>
                            Annuler
                          </button>
                          <button className="settings-btn settings-btn-ghost" onClick={sendDeleteCode}
                            disabled={delLoading} style={{ fontSize:12 }}>
                            Renvoyer le code
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className={`settings-toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          {toast.msg}
        </div>
      )}
    </>
  );
}
