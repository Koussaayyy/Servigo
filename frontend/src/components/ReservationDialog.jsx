import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, CheckCircle, XCircle, Calendar, MapPin, Phone } from "lucide-react";
import { reservationApi, avatarUrl } from "../api";
import { GOUVERNORATS, DELEGATIONS, getVilles } from "../constants/tunisia";

const fmtHour  = (h) => `${String(h).padStart(2, "0")}:00`;
const fmtDate  = (d) => { if (!d) return ""; const dt = new Date(d + "T12:00:00"); return dt.toLocaleDateString("fr-FR", { weekday:"short", day:"2-digit", month:"short" }); };
const todayStr = () => new Date().toISOString().slice(0, 10);

const isValidTunisianPhone = (val) => {
  const digits = val.replace(/[\s\-\.]/g, "").replace(/^\+?216/, "");
  return /^[234579]\d{7}$/.test(digits);
};

const STEPS = ["Créneau", "Adresse", "Coordonnées"];

const css = `
@keyframes rdFadeIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes rdCheckDraw{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
@keyframes rdSlideIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
.rd-overlay{position:fixed;inset:0;background:rgba(15,23,46,.72);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(3px);}
.rd-card{background:#fff;border-radius:18px;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;animation:rdFadeIn .22s ease both;position:relative;box-shadow:0 32px 80px rgba(0,0,0,.22);}
.rd-card::-webkit-scrollbar{width:4px}.rd-card::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:9px}
.rd-step-content{animation:rdSlideIn .2s ease both}
.rd-date-btn{padding:9px 8px;border-radius:9px;cursor:pointer;font-family:'Sora',sans-serif;font-size:11px;text-align:left;transition:all .15s}
.rd-hour-btn{padding:10px 6px;border-radius:8px;font-family:'Sora',sans-serif;font-weight:700;font-size:13px;transition:all .2s;cursor:pointer}
.rd-select{width:100%;background:#f1f5f9;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 12px;font-family:'Sora',sans-serif;font-size:13px;color:#0f172e;outline:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;}
.rd-input{width:100%;background:#f1f5f9;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 12px;font-family:'Sora',sans-serif;font-size:13px;color:#0f172e;outline:none;}
.rd-input:focus,.rd-select:focus{border-color:#06b6d4;background:#fff}
.rd-phone-wrap{display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:9px;background:#f1f5f9;overflow:hidden}
.rd-phone-wrap:focus-within{border-color:#06b6d4;background:#fff}
.rd-phone-prefix{padding:10px 10px;font-size:13px;color:#64748b;font-weight:600;border-right:1.5px solid #e2e8f0;white-space:nowrap;font-family:'Sora',sans-serif}
.rd-phone-input{flex:1;background:transparent;border:none;padding:10px 12px;font-family:'Sora',sans-serif;font-size:13px;color:#0f172e;outline:none}
`;

export default function ReservationDialog({ worker, user, initialProfession, onClose, onSuccess }) {
  const [step, setStep]       = useState(1);
  const [profession, setProfession] = useState(initialProfession || worker?.workerProfile?.professions?.[0] || "");
  const [availability, setAvailability] = useState([]);
  const [avLoading, setAvLoading] = useState(true);
  const [datePage, setDatePage] = useState(0);
  const [date, setDate]         = useState("");
  const [hour, setHour]         = useState("");
  const [slots, setSlots]       = useState([]);
  const [gouvernorat, setGouvernorat] = useState("");
  const [delegation, setDelegation]   = useState("");
  const [ville, setVille]             = useState("");
  const [phone, setPhone]     = useState(() => {
    const p = user?.phone || "";
    return p.replace(/^\+?216/, "").replace(/[\s\-\.]/g, "");
  });
  const [notes, setNotes]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]   = useState(null); // null | { ok: bool, message: string }
  const [errors, setErrors]   = useState({});

  const professions = worker?.workerProfile?.professions || [];

  const datePages = [];
  for (let i = 0; i < availability.length; i += 7) datePages.push(availability.slice(i, i + 7));
  const visibleDates = datePages[datePage] || [];

  useEffect(() => {
    if (!worker?._id) return;
    setAvLoading(true);
    reservationApi.getWorkerMonthAvailability(worker._id, profession)
      .then((data) => {
        const days = Array.isArray(data?.days) ? data.days : [];
        setAvailability(days);
        const first = days.find((d) => d.slots?.some((s) => s.status === "available"));
        if (first) {
          setDate(first.date);
          setSlots(first.slots || []);
          setDatePage(Math.max(0, Math.floor(days.indexOf(first) / 7)));
        }
      })
      .catch(() => setAvailability([]))
      .finally(() => setAvLoading(false));
  }, [worker?._id, profession]);

  useEffect(() => {
    if (!date) { setSlots([]); return; }
    const day = availability.find((d) => d.date === date);
    setSlots(day?.slots || []);
    setHour("");
  }, [date, availability]);

  const delegations = gouvernorat ? (DELEGATIONS[gouvernorat] || []) : [];
  const villes      = delegation  ? getVilles(delegation)            : [];

  const validateStep = useCallback((s) => {
    const errs = {};
    if (s === 1) {
      if (!date) errs.date = "Choisissez une date";
      if (hour === "") errs.hour = "Choisissez un créneau horaire";
    }
    if (s === 2) {
      if (!gouvernorat) errs.gouvernorat = "Choisissez un gouvernorat";
      if (!delegation)  errs.delegation  = "Choisissez une délégation";
      if (!ville)       errs.ville       = "Choisissez une ville";
    }
    if (s === 3) {
      if (!phone.trim()) errs.phone = "Numéro requis";
      else if (!isValidTunisianPhone(phone)) errs.phone = "Numéro tunisien invalide (ex: 22 345 678)";
    }
    return errs;
  }, [date, hour, gouvernorat, delegation, ville, phone]);

  const nextStep = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => s + 1);
  };

  const prevStep = () => { setErrors({}); setStep((s) => s - 1); };

  const submit = async () => {
    const errs = validateStep(3);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const fullAddress = [ville, delegation, gouvernorat].filter(Boolean).join(", ");
      await reservationApi.create({
        workerId:    worker._id,
        bookingDate: date,
        bookingHour: Number(hour),
        serviceType: profession,
        address:     fullAddress,
        notes:       notes.trim(),
        phone:       `+216${phone.trim()}`,
      });
      setResult({ ok: true, message: "Votre réservation a été envoyée avec succès ! Le prestataire va confirmer sous peu." });
    } catch (err) {
      setResult({ ok: false, message: err.message || "Une erreur est survenue. Veuillez réessayer." });
    } finally {
      setSubmitting(false);
    }
  };

  const workerName  = `${worker?.firstName || ""} ${worker?.lastName || ""}`.trim() || "Prestataire";
  const workerAvatar = avatarUrl(worker?.avatar);
  const workerProf   = profession || professions[0] || "Service";

  return (
    <>
      <style>{css}</style>
      <div className="rd-overlay" onClick={(e) => { if (e.target === e.currentTarget && !submitting && !result) onClose(); }}>
        <div className="rd-card">

          {/* Header */}
          <div style={{ padding:"20px 22px 0",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #f1f5f9",paddingBottom:16 }}>
            {workerAvatar
              ? <img src={workerAvatar} alt="" style={{ width:44,height:44,borderRadius:10,objectFit:"cover",border:"2px solid #e2e8f0" }} />
              : <div style={{ width:44,height:44,borderRadius:10,background:"#0f172e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:700,color:"#06b6d4",flexShrink:0 }}>{(worker?.firstName?.[0]||"?").toUpperCase()}</div>
            }
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15,fontWeight:700,color:"#0f172e" }}>Réserver {workerName}</div>
              <div style={{ fontSize:11,color:"#06b6d4",fontWeight:600 }}>{workerProf}</div>
            </div>
            {!result && (
              <button onClick={onClose} style={{ background:"#f1f5f9",border:"none",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#64748b" }}>
                <X size={15} />
              </button>
            )}
          </div>

          {/* Result overlay */}
          {result ? (
            <div style={{ padding:"40px 28px",textAlign:"center" }}>
              {result.ok ? (
                <>
                  <div style={{ width:72,height:72,borderRadius:"50%",background:"rgba(16,185,129,.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
                    <CheckCircle size={40} color="#10b981" />
                  </div>
                  <div style={{ fontSize:20,fontWeight:800,color:"#0f172e",marginBottom:10 }}>Réservation envoyée !</div>
                  <div style={{ fontSize:13,color:"#64748b",lineHeight:1.6,marginBottom:28 }}>{result.message}</div>
                  <button onClick={() => { onSuccess?.(); onClose(); }} style={{ background:"#10b981",color:"#fff",border:"none",borderRadius:10,padding:"12px 32px",fontSize:14,fontWeight:700,cursor:"pointer" }}>Fermer</button>
                </>
              ) : (
                <>
                  <div style={{ width:72,height:72,borderRadius:"50%",background:"rgba(239,68,68,.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
                    <XCircle size={40} color="#ef4444" />
                  </div>
                  <div style={{ fontSize:20,fontWeight:800,color:"#0f172e",marginBottom:10 }}>Une erreur est survenue</div>
                  <div style={{ fontSize:13,color:"#64748b",lineHeight:1.6,marginBottom:28 }}>{result.message}</div>
                  <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
                    <button onClick={() => setResult(null)} style={{ background:"#0f172e",color:"#fff",border:"none",borderRadius:10,padding:"12px 24px",fontSize:13,fontWeight:700,cursor:"pointer" }}>Réessayer</button>
                    <button onClick={onClose} style={{ background:"#f1f5f9",color:"#64748b",border:"none",borderRadius:10,padding:"12px 24px",fontSize:13,fontWeight:700,cursor:"pointer" }}>Fermer</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Step progress */}
              <div style={{ padding:"16px 22px 0",display:"flex",alignItems:"center",gap:6 }}>
                {STEPS.map((label, i) => {
                  const idx = i + 1;
                  const done = step > idx;
                  const active = step === idx;
                  return (
                    <div key={label} style={{ display:"flex",alignItems:"center",flex: i < STEPS.length - 1 ? 1 : "none" }}>
                      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
                        <div style={{ width:26,height:26,borderRadius:"50%",background:done?"#10b981":active?"#06b6d4":"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:done||active?"#fff":"#94a3b8",transition:"all .2s" }}>
                          {done ? <CheckCircle size={13} /> : idx}
                        </div>
                        <div style={{ fontSize:9,fontWeight:600,color:active?"#06b6d4":done?"#10b981":"#94a3b8",letterSpacing:"0.06em",textTransform:"uppercase" }}>{label}</div>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div style={{ flex:1,height:2,background:done?"#10b981":"#e2e8f0",margin:"0 6px",marginBottom:14,borderRadius:2,transition:"all .2s" }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Step content */}
              <div className="rd-step-content" key={step} style={{ padding:"18px 22px" }}>

                {/* ── STEP 1: Créneau ── */}
                {step === 1 && (
                  <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                    {/* Service selector */}
                    {professions.length > 1 && (
                      <div>
                        <div style={{ fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8 }}>Service</div>
                        <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
                          {professions.map((p) => (
                            <button key={p} type="button" onClick={() => setProfession(p)}
                              style={{ padding:"6px 14px",borderRadius:999,border:profession===p?"1.5px solid #06b6d4":"1.5px solid #e2e8f0",background:profession===p?"rgba(6,182,212,.1)":"#f8fafc",color:profession===p?"#06b6d4":"#64748b",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s" }}>
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Date picker */}
                    <div>
                      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
                        <div style={{ fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.1em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:6 }}>
                          <Calendar size={12} /> Date
                        </div>
                        <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                          <button type="button" onClick={() => setDatePage((p) => Math.max(0, p - 1))} disabled={datePage === 0} style={{ background:"#f1f5f9",border:"1.5px solid #e2e8f0",borderRadius:6,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",cursor:datePage===0?"not-allowed":"pointer",opacity:datePage===0?.4:1 }}><ChevronLeft size={12} /></button>
                          <span style={{ fontSize:11,color:"#64748b",fontWeight:600 }}>S.{datePage + 1}/{Math.max(1,datePages.length)}</span>
                          <button type="button" onClick={() => setDatePage((p) => Math.min(datePages.length - 1, p + 1))} disabled={datePage >= datePages.length - 1} style={{ background:"#f1f5f9",border:"1.5px solid #e2e8f0",borderRadius:6,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",cursor:datePage>=datePages.length-1?"not-allowed":"pointer",opacity:datePage>=datePages.length-1?.4:1 }}><ChevronRight size={12} /></button>
                        </div>
                      </div>
                      {avLoading ? (
                        <div style={{ fontSize:12,color:"#94a3b8",textAlign:"center",padding:"16px 0" }}>Chargement des disponibilités…</div>
                      ) : (
                        <div style={{ display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:7 }}>
                          {visibleDates.map((day) => {
                            const free  = (day.slots||[]).filter((s) => s.status === "available").length;
                            const active = date === day.date;
                            return (
                              <button key={day.date} type="button" className="rd-date-btn" disabled={free === 0}
                                onClick={() => { setDate(day.date); setHour(""); }}
                                style={{ border:active?"1.5px solid #06b6d4":"1.5px solid #e2e8f0",background:active?"rgba(6,182,212,.1)":"#f8fafc",color:active?"#06b6d4":"#64748b",opacity:free===0?.4:1,cursor:free===0?"not-allowed":"pointer" }}>
                                <div style={{ fontWeight:700,fontSize:11,marginBottom:2 }}>{fmtDate(day.date)}</div>
                                <div style={{ fontSize:10,color:free>0?"#10b981":"#94a3b8" }}>{free > 0 ? `${free} libre(s)` : "Complet"}</div>
                              </button>
                            );
                          })}
                          {!avLoading && visibleDates.length === 0 && (
                            <div style={{ gridColumn:"1/-1",fontSize:12,color:"#94a3b8",textAlign:"center",padding:"12px 0" }}>Aucune disponibilité ce mois</div>
                          )}
                        </div>
                      )}
                      {errors.date && <div style={{ color:"#ef4444",fontSize:11,marginTop:5 }}>{errors.date}</div>}
                    </div>

                    {/* Hour slots */}
                    <div>
                      <div style={{ fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8 }}>Heure</div>
                      {!date ? (
                        <div style={{ fontSize:12,color:"#94a3b8" }}>Choisissez d'abord une date</div>
                      ) : (
                        <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:7 }}>
                          {slots.map((slot) => {
                            const avail  = slot.status === "available";
                            const active = String(hour) === String(slot.hour);
                            let bg="#f8fafc",bc="#e2e8f0",tc="#94a3b8",cur="not-allowed",op=0.55;
                            if (avail && active)  { bg="#06b6d4"; bc="#06b6d4"; tc="#fff"; cur="pointer"; op=1; }
                            else if (avail)       { bg="#f0fdfe"; bc="#67e8f9"; tc="#0e7490"; cur="pointer"; op=1; }
                            return (
                              <button key={slot.hour} type="button" className="rd-hour-btn" disabled={!avail}
                                onClick={() => avail && setHour(String(slot.hour))}
                                style={{ border:`1.5px solid ${bc}`,background:bg,color:tc,cursor:cur,opacity:op }}>
                                {fmtHour(slot.hour)}
                              </button>
                            );
                          })}
                          {slots.length === 0 && <div style={{ gridColumn:"1/-1",fontSize:12,color:"#94a3b8" }}>Aucun créneau disponible</div>}
                        </div>
                      )}
                      {errors.hour && <div style={{ color:"#ef4444",fontSize:11,marginTop:5 }}>{errors.hour}</div>}
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Adresse ── */}
                {step === 2 && (
                  <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#64748b",marginBottom:4 }}>
                      <MapPin size={14} color="#06b6d4" /> Votre adresse d'intervention (Tunisie)
                    </div>

                    <div>
                      <label style={{ fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6 }}>Gouvernorat</label>
                      <select className="rd-select" value={gouvernorat} onChange={(e) => { setGouvernorat(e.target.value); setDelegation(""); setVille(""); }}>
                        <option value="">-- Choisir --</option>
                        {GOUVERNORATS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                      {errors.gouvernorat && <div style={{ color:"#ef4444",fontSize:11,marginTop:4 }}>{errors.gouvernorat}</div>}
                    </div>

                    <div>
                      <label style={{ fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6 }}>Délégation</label>
                      <select className="rd-select" value={delegation} onChange={(e) => { setDelegation(e.target.value); setVille(""); }} disabled={!gouvernorat}>
                        <option value="">-- Choisir --</option>
                        {delegations.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {errors.delegation && <div style={{ color:"#ef4444",fontSize:11,marginTop:4 }}>{errors.delegation}</div>}
                    </div>

                    <div>
                      <label style={{ fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6 }}>Ville / Localité</label>
                      <select className="rd-select" value={ville} onChange={(e) => setVille(e.target.value)} disabled={!delegation}>
                        <option value="">-- Choisir --</option>
                        {villes.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                      {errors.ville && <div style={{ color:"#ef4444",fontSize:11,marginTop:4 }}>{errors.ville}</div>}
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Coordonnées ── */}
                {step === 3 && (
                  <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#64748b",marginBottom:4 }}>
                      <Phone size={14} color="#06b6d4" /> Vos coordonnées
                    </div>

                    <div>
                      <label style={{ fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6 }}>
                        Numéro de téléphone <span style={{ color:"#ef4444" }}>*</span>
                      </label>
                      <div className="rd-phone-wrap">
                        <span className="rd-phone-prefix">+216</span>
                        <input className="rd-phone-input" type="tel" placeholder="22 345 678" maxLength={11}
                          value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9\s]/g, ""))} />
                      </div>
                      {errors.phone
                        ? <div style={{ color:"#ef4444",fontSize:11,marginTop:4 }}>{errors.phone}</div>
                        : <div style={{ color:"#94a3b8",fontSize:10,marginTop:4 }}>8 chiffres · ex: 22 345 678 ou 55 123 456</div>
                      }
                    </div>

                    <div>
                      <label style={{ fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6 }}>
                        Notes (optionnel)
                      </label>
                      <textarea className="rd-input" rows={3} placeholder="Détails utiles pour le prestataire…" style={{ resize:"vertical",minHeight:80 }}
                        value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} />
                    </div>

                    {/* Summary */}
                    <div style={{ background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:14,fontSize:12,color:"#64748b",display:"grid",gap:6 }}>
                      <div style={{ fontWeight:700,color:"#0f172e",fontSize:13,marginBottom:4 }}>Récapitulatif</div>
                      <div><span style={{ fontWeight:600 }}>Prestataire :</span> {workerName}</div>
                      <div><span style={{ fontWeight:600 }}>Service :</span> {profession}</div>
                      <div><span style={{ fontWeight:600 }}>Date :</span> {fmtDate(date)} à {fmtHour(Number(hour))}</div>
                      <div><span style={{ fontWeight:600 }}>Adresse :</span> {[ville, delegation, gouvernorat].filter(Boolean).join(", ")}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer buttons */}
              <div style={{ padding:"0 22px 20px",display:"flex",justifyContent:"space-between",gap:10,borderTop:"1px solid #f1f5f9",paddingTop:16 }}>
                <button onClick={prevStep} disabled={step === 1} style={{ padding:"11px 20px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:13,fontWeight:600,cursor:step===1?"not-allowed":"pointer",opacity:step===1?.4:1,display:"flex",alignItems:"center",gap:6 }}>
                  <ChevronLeft size={13} /> Précédent
                </button>
                {step < 3 ? (
                  <button onClick={nextStep} style={{ padding:"11px 24px",borderRadius:10,border:"none",background:"#0f172e",color:"#06b6d4",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}>
                    Suivant <ChevronRight size={13} />
                  </button>
                ) : (
                  <button onClick={submit} disabled={submitting} style={{ padding:"11px 24px",borderRadius:10,border:"none",background:submitting?"#e2e8f0":"#06b6d4",color:submitting?"#94a3b8":"#fff",fontSize:13,fontWeight:700,cursor:submitting?"not-allowed":"pointer" }}>
                    {submitting ? "Envoi en cours…" : "Confirmer la réservation"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
