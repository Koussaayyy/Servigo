// HomePage.jsx  –  ServigoPro landing page
// Props:
//   onLogin()    → go to login screen
//   onSignup()   → go to signup screen
//   onExplore()  → go to Explore marketplace

import { useEffect, useMemo, useState, useRef } from "react";
import {
  Search, MapPin, Wrench, Zap, Paintbrush, Hammer, Snowflake,
  ShieldCheck, Star, Bookmark, ChevronRight, Menu, X,
  CheckCircle2, Send, Shield, Award, Users, TrendingUp,
  Facebook, Instagram, Twitter,
} from "lucide-react";

const MOCK_WORKERS = [
  { _id:"1",  firstName:"Ahmed",   lastName:"Ben Ali",   workerProfile:{ professions:["Plombier"],       city:"Tunis",    hourlyRate:45, rating:4.8, totalReviews:127, isAvailable:true  }},
  { _id:"2",  firstName:"Sarra",   lastName:"Mansour",   workerProfile:{ professions:["Électricien"],    city:"Sfax",     hourlyRate:55, rating:4.9, totalReviews:89,  isAvailable:true  }},
  { _id:"3",  firstName:"Karim",   lastName:"Trabelsi",  workerProfile:{ professions:["Peintre"],        city:"Sousse",   hourlyRate:35, rating:4.6, totalReviews:203, isAvailable:false }},
  { _id:"4",  firstName:"Leila",   lastName:"Gharbi",    workerProfile:{ professions:["Menuisier"],      city:"Tunis",    hourlyRate:60, rating:4.7, totalReviews:56,  isAvailable:true  }},
  { _id:"5",  firstName:"Mehdi",   lastName:"Bouzid",    workerProfile:{ professions:["Climatisation"],  city:"Nabeul",   hourlyRate:70, rating:5.0, totalReviews:44,  isAvailable:true  }},
  { _id:"6",  firstName:"Rania",   lastName:"Jebali",    workerProfile:{ professions:["Serrurier"],      city:"Monastir", hourlyRate:40, rating:4.5, totalReviews:78,  isAvailable:false }},
  { _id:"7",  firstName:"Youssef", lastName:"Hmidi",     workerProfile:{ professions:["Plombier"],       city:"Bizerte",  hourlyRate:42, rating:4.3, totalReviews:32,  isAvailable:true  }},
  { _id:"8",  firstName:"Amira",   lastName:"Chatti",    workerProfile:{ professions:["Peintre"],        city:"Tunis",    hourlyRate:38, rating:4.9, totalReviews:151, isAvailable:true  }},
  { _id:"9",  firstName:"Samir",   lastName:"Ayed",      workerProfile:{ professions:["Électricien"],    city:"Sfax",     hourlyRate:50, rating:4.4, totalReviews:67,  isAvailable:true  }},
  { _id:"10", firstName:"Nesrine", lastName:"Ferjani",   workerProfile:{ professions:["Menuisier"],      city:"Sousse",   hourlyRate:55, rating:4.6, totalReviews:29,  isAvailable:false }},
  { _id:"11", firstName:"Amine",   lastName:"Khelifi",   workerProfile:{ professions:["Climatisation"],  city:"Tunis",    hourlyRate:65, rating:4.8, totalReviews:93,  isAvailable:true  }},
  { _id:"12", firstName:"Fatma",   lastName:"Zouari",    workerProfile:{ professions:["Serrurier"],      city:"Ariana",   hourlyRate:38, rating:4.7, totalReviews:41,  isAvailable:true  }},
];

const CATEGORIES = [
  { key:"Plombier",      icon:Wrench      },
  { key:"Électricien",   icon:Zap         },
  { key:"Peintre",       icon:Paintbrush  },
  { key:"Menuisier",     icon:Hammer      },
  { key:"Climatisation", icon:Snowflake   },
  { key:"Serrurier",     icon:ShieldCheck },
];

const NAV_LINKS = ["Accueil","Comment ça marche","Services","À propos"];
const avatarInitials = (n) => n?.[0]?.toUpperCase() || "?";

/* ─── WorkerCard ─────────────────────────────────────────────────────────── */
function WorkerCard({ worker }) {
  const [saved, setSaved] = useState(false);
  const [hov,   setHov]   = useState(false);
  const fn      = worker?.firstName || "Pro";
  const ln      = worker?.lastName  || "";
  const prof    = worker?.workerProfile?.professions?.[0] || "Service";
  const city    = worker?.workerProfile?.city || "—";
  const rate    = Number(worker?.workerProfile?.hourlyRate || 0);
  const rating  = Number(worker?.workerProfile?.rating    || 0);
  const reviews = Number(worker?.workerProfile?.totalReviews || 0);
  const avail   = worker?.workerProfile?.isAvailable !== false;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:"#fff",border:hov?"1.5px solid rgba(6,182,212,0.4)":"1.5px solid #e2e8f0",borderRadius:12,padding:22,transition:"all 0.25s cubic-bezier(0.22,1,0.36,1)",transform:hov?"translateY(-3px)":"none",boxShadow:hov?"0 12px 40px rgba(6,182,212,0.1), 0 4px 16px rgba(0,0,0,0.05)":"0 1px 6px rgba(0,0,0,0.04)",cursor:"default",position:"relative",overflow:"hidden" }}
    >
      {hov && <div style={{ position:"absolute",top:0,left:0,right:0,height:2.5,background:"linear-gradient(90deg,#06b6d4,#22d3ee)",borderRadius:"12px 12px 0 0" }} />}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
        <div style={{
  width:44,
  height:44,
  borderRadius:10,
  background:"#f1f5f9",
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  fontSize:17,
  fontWeight:700,
  color:"#64748b",
  flexShrink:0,
  transition:"none"
}}>
  {avatarInitials(fn)}
</div>
          <div>
            <div style={{ fontSize:14,fontWeight:700,color:"#0f172e" }}>{fn} {ln}</div>
            <div style={{ fontSize:11,fontWeight:600,color:"#06b6d4",marginTop:2,letterSpacing:"0.06em" }}>{prof}</div>
          </div>
        </div>
        <button onClick={() => setSaved(s => !s)} style={{ background:saved?"rgba(6,182,212,0.1)":"transparent",border:`1.5px solid ${saved?"rgba(6,182,212,0.35)":"#e2e8f0"}`,borderRadius:7,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s",color:saved?"#06b6d4":"#94a3b8" }}>
          <Bookmark size={12} fill={saved?"#06b6d4":"none"} />
        </button>
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:4,marginBottom:14 }}>
        <MapPin size={10} color="#94a3b8" />
        <span style={{ fontSize:12,color:"#64748b" }}>{city}</span>
        <span style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:5 }}>
          <div style={{ width:5,height:5,borderRadius:"50%",background:avail?"#10b981":"#f59e0b" }} />
          <span style={{ fontSize:11,color:avail?"#059669":"#d97706",fontWeight:600 }}>{avail?"Disponible":"Indisponible"}</span>
        </span>
      </div>
      <div style={{ display:"flex",gap:8,marginBottom:16 }}>
        <div style={{ flex:1,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 10px" }}>
          <div style={{ fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4 }}>Note</div>
          <div style={{ display:"flex",alignItems:"center",fontSize:13,fontWeight:700,color:"#0f172e",gap:4 }}>
            <Star size={11} color="#f59e0b" fill="#f59e0b" />{rating.toFixed(1)}
            <span style={{ fontSize:11,color:"#94a3b8",fontWeight:400 }}>({reviews})</span>
          </div>
        </div>
        <div style={{ flex:1,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 10px" }}>
          <div style={{ fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4 }}>Tarif</div>
          <div style={{ fontSize:13,fontWeight:700,color:"#0f172e" }}>{rate>0?`${rate} TND/h`:"Sur devis"}</div>
        </div>
      </div>
      <button style={{ width:"100%",background:hov?"#0f172e":"#f8fafc",color:hov?"#06b6d4":"#0f172e",border:`1.5px solid ${hov?"#0f172e":"#e2e8f0"}`,borderRadius:8,padding:"10px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.12em",textTransform:"uppercase",transition:"all 0.25s" }}>
        Réserver maintenant
      </button>
    </div>
  );
}

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
.hide-desktop {
  display: none !important;
}

@media (max-width: 768px) {
  .hide-desktop {
    display: flex !important;
  }
  .hide-mobile {
    display: none !important;
  }
}
html { scroll-behavior:smooth; }
body { background:#f8fafc; color:#0f172e; font-family:'Sora',sans-serif; -webkit-font-smoothing:antialiased; }
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
input,textarea,select,button{font-family:'Sora',sans-serif}
input,textarea{background:#f1f5f9;border:1.5px solid #e2e8f0;border-radius:8px;padding:12px 16px;font-size:14px;color:#0f172e;width:100%;outline:none;transition:border-color .2s,background .2s,box-shadow .2s}
input:focus,textarea:focus{border-color:#06b6d4;background:#fff;box-shadow:0 0 0 3px rgba(6,182,212,0.1)}
input::placeholder,textarea::placeholder{color:#94a3b8}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes floatB{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.anim-1{animation:fadeUp .5s ease both}
.anim-2{animation:fadeUp .5s .1s ease both}
.anim-3{animation:fadeUp .5s .2s ease both}
.float{animation:float 6s ease-in-out infinite}
.floatB{animation:floatB 8s 1.5s ease-in-out infinite}
@media(max-width:768px){
  .hide-mobile{display:none!important}
  .hero-grid{grid-template-columns:1fr!important}
  .how-grid{grid-template-columns:1fr 1fr!important}
  .cards-grid{grid-template-columns:1fr!important}
  .about-grid{grid-template-columns:1fr!important}
  .footer-grid{grid-template-columns:1fr 1fr!important}
  .hero-h{font-size:34px!important}
  .form-grid{grid-template-columns:1fr!important}
}
`;

/* ─── HomePage ───────────────────────────────────────────────────────────── */
export default function HomePage({ onLogin, onSignup, onExplore }) {
  const [hovered, setHovered] = useState(null);
  const [navOpen,       setNavOpen]       = useState(false);
  const [search,        setSearch]        = useState("");
  const [activeCat,     setActiveCat]     = useState("");
  const [showAll,       setShowAll]       = useState(false);
  const [form,          setForm]          = useState({ name:"",email:"",subject:"",message:"" });
  const [formSent,      setFormSent]      = useState(false);
  const [formLoading,   setFormLoading]   = useState(false);
  const [activeSection, setActiveSection] = useState("Accueil");
  const [scrolled,      setScrolled]      = useState(false);

  const servicesRef = useRef(null);
  const howRef      = useRef(null);
  const aboutRef    = useRef(null);
  const reclamRef   = useRef(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const scrollTo = (s) => {
    setNavOpen(false); setActiveSection(s);
    const map = { "Comment ça marche":howRef, "Services":servicesRef, "À propos":aboutRef };
    if (s === "Accueil") window.scrollTo({ top:0, behavior:"smooth" });
    else map[s]?.current?.scrollIntoView({ behavior:"smooth", block:"start" });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_WORKERS.filter(w => {
      const profs = w.workerProfile?.professions || [];
      const name  = `${w.firstName} ${w.lastName}`;
      const city  = w.workerProfile?.city || "";
      const matchQ = !q || name.toLowerCase().includes(q) || profs.some(p => p.toLowerCase().includes(q)) || city.toLowerCase().includes(q);
      const matchC = !activeCat || profs.some(p => p.toLowerCase().includes(activeCat.toLowerCase()));
      return matchQ && matchC;
    });
  }, [search, activeCat]);

  const displayed = showAll ? filtered : filtered.slice(0, 9);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) return;
    setFormLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setFormSent(true); setFormLoading(false);
  };

  const Badge = ({ label }) => (
    <div style={{ display:"inline-flex",alignItems:"center",gap:7,background:"rgba(6,182,212,0.07)",border:"1.5px solid rgba(6,182,212,0.18)",borderRadius:999,padding:"6px 14px",fontSize:10,fontWeight:700,color:"#06b6d4",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:20 }}>
      <div style={{ width:5,height:5,borderRadius:"50%",background:"#06b6d4" }} />{label}
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div style={{ background:"#f8fafc",minHeight:"100vh" }}>

        {/* BG */}
        <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0,background:"radial-gradient(ellipse 55% 45% at 10% 10%, rgba(6,182,212,0.05), transparent), radial-gradient(ellipse 50% 50% at 90% 90%, rgba(6,182,212,0.03), transparent), repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(6,182,212,0.012) 60px, rgba(6,182,212,0.012) 61px)" }} />

        {/* NAVBAR */}
        <nav style={{ position:"fixed",top:0,left:0,right:0,zIndex:1000,background:scrolled?"rgba(248,250,252,0.94)":"rgba(248,250,252,0.6)",backdropFilter:"blur(20px)",borderBottom:scrolled?"1.5px solid #e2e8f0":"1.5px solid transparent",boxShadow:scrolled?"0 2px 16px rgba(0,0,0,0.05)":"none",transition:"all 0.3s ease" }}>
          <div style={{ maxWidth:1160,margin:"0 auto",height:64,display:"flex",alignItems:"center",gap:0,padding:"0 28px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginRight:40,flexShrink:0 }}>
              <div style={{ width:34,height:34,border:"2px solid #06b6d4",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:"#06b6d4" }}>S</div>
              <span style={{ fontWeight:700,fontSize:16,letterSpacing:"-0.3px",color:"#0f172e" }}>servigo</span>
            </div>
            <div className="hide-mobile" style={{ display:"flex",gap:2,flex:1 }}>
              {NAV_LINKS.map(l => (
                <button key={l} onClick={() => scrollTo(l)} style={{ background:activeSection===l?"rgba(6,182,212,0.08)":"none",border:activeSection===l?"1.5px solid rgba(6,182,212,0.2)":"1.5px solid transparent",cursor:"pointer",fontSize:12,fontWeight:600,letterSpacing:"0.06em",color:activeSection===l?"#06b6d4":"#64748b",padding:"7px 14px",borderRadius:24,transition:"all .2s" }}>
                  {l}
                </button>
              ))}
            </div>
            <div className="hide-mobile" style={{ display:"flex",gap:10 }}>
              <button onClick={onLogin}  style={{ border:"1.5px solid #e2e8f0",background:"#fff",color:"#0f172e",borderRadius:24,padding:"9px 20px",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .2s" }}>Se connecter</button>
              <button onClick={onSignup} style={{ border:"none",background:"#0f172e",color:"#06b6d4",borderRadius:24,padding:"9px 20px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase",boxShadow:"0 4px 16px rgba(6,182,212,0.15)" }}>Créer un compte</button>
            </div>
            <button className="hide-desktop" onClick={() => setNavOpen(o => !o)} style={{ marginLeft:"auto",background:"#fff",border:"1.5px solid #e2e8f0",color:"#0f172e",borderRadius:8,padding:8,cursor:"pointer",display:"flex" }}>
              {navOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
          {navOpen && (
            <div style={{ background:"rgba(248,250,252,0.98)",backdropFilter:"blur(20px)",borderTop:"1.5px solid #e2e8f0",padding:"16px 28px 20px",display:"flex",flexDirection:"column",gap:4 }}>
              {NAV_LINKS.map(l => <button key={l} onClick={() => scrollTo(l)} style={{ background:"none",border:"none",color:"#64748b",fontSize:14,fontWeight:600,textAlign:"left",padding:"10px 0",cursor:"pointer",borderBottom:"1px solid #f1f5f9" }}>{l}</button>)}
              <div style={{ display:"flex",gap:10,marginTop:12 }}>
                <button onClick={onLogin}  style={{ flex:1,border:"1.5px solid #e2e8f0",background:"#fff",color:"#0f172e",borderRadius:8,padding:10,fontSize:12,fontWeight:600,cursor:"pointer" }}>Se connecter</button>
                <button onClick={onSignup} style={{ flex:1,border:"none",background:"#0f172e",color:"#06b6d4",borderRadius:8,padding:10,fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.08em" }}>Créer un compte</button>
              </div>
            </div>
          )}
        </nav>

        {/* HERO */}
        <section style={{ position:"relative",zIndex:1,minHeight:"100vh",display:"flex",alignItems:"center",padding:"100px 28px 80px" }}>
          <div style={{ maxWidth:1160,margin:"0 auto",width:"100%",display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center" }} className="hero-grid">
            <div>
              <div className="anim-1"><Badge label="Professionnels vérifiés en Tunisie" /></div>
              <h1 className="anim-2 hero-h" style={{ fontSize:58,fontWeight:800,lineHeight:1.08,letterSpacing:"-2.5px",color:"#0f172e",marginBottom:22 }}>
                L'artisan parfait<br /><em style={{ fontStyle:"italic",color:"#06b6d4" }}>près de chez vous</em>
              </h1>
              <p className="anim-3" style={{ fontSize:15,color:"#64748b",lineHeight:1.9,marginBottom:36,maxWidth:440 }}>
                Trouvez, comparez et réservez les meilleurs artisans en quelques secondes. Qualité garantie, tarifs transparents.
              </p>
              <div className="anim-3" style={{ display:"flex",alignItems:"center",gap:10,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:24,padding:"5px 5px 5px 16px",marginBottom:16,maxWidth:500,boxShadow:"0 4px 20px rgba(0,0,0,0.06)" }}>
                <Search size={16} color="#94a3b8" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Plombier, électricien, peintre..." style={{ flex:1,border:"none",outline:"none",fontSize:13,color:"#0f172e",background:"transparent",padding:"8px 0",boxShadow:"none" }} />
                <button onClick={() => servicesRef.current?.scrollIntoView({ behavior:"smooth" })} style={{ background:"#0f172e",color:"#06b6d4",border:"none",borderRadius:24,padding:"11px 20px",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",letterSpacing:"0.1em",textTransform:"uppercase" }}>Rechercher</button>
              </div>
              {/* Explore CTA */}
              <div className="anim-3" style={{ marginBottom:36 }}>
                <button
                  onClick={onExplore}
                  style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(6,182,212,0.08)",border:"1.5px solid rgba(6,182,212,0.25)",color:"#06b6d4",borderRadius:24,padding:"10px 20px",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:"0.06em",transition:"all .2s" }}
                >
                  Voir tous les artisans <ChevronRight size={14} />
                </button>
              </div>
              <div className="anim-3" style={{ display:"flex",alignItems:"center",gap:32 }}>
                {[["500+","Artisans actifs"],["4.8★","Note moyenne"],["98%","Satisfaction"]].map(([n,l],i) => (
                  <div key={i}>
                    <div style={{ fontSize:22,fontWeight:800,color:"#0f172e",letterSpacing:"-0.8px" }}>{n}</div>
                    <div style={{ fontSize:10,color:"#94a3b8",marginTop:2,textTransform:"uppercase",letterSpacing:"0.12em" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero card */}
            <div className="hide-mobile float" style={{ position:"relative" }}>
              <div style={{ background:"#0f172e",border:"1.5px solid rgba(6,182,212,0.2)",borderRadius:16,padding:28,boxShadow:"0 0 0 1.5px rgba(6,182,212,0.08), 0 32px 80px rgba(0,0,0,0.2), 0 8px 32px rgba(6,182,212,0.08)" }}>
                <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:24 }}>
                  <div style={{ width:48,height:48,borderRadius:10,border:"2px solid rgba(6,182,212,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#06b6d4" }}>A</div>
                  <div>
                    <div style={{ fontSize:15,fontWeight:700,color:"#fff" }}>Foulen Fouleni</div>
                    <div style={{ fontSize:11,color:"#06b6d4",fontWeight:600,letterSpacing:"0.06em" }}>Plombier certifié</div>
                  </div>
                  <div style={{ marginLeft:"auto",background:"rgba(16,185,129,0.1)",border:"1.5px solid rgba(16,185,129,0.25)",borderRadius:999,padding:"5px 12px",fontSize:10,fontWeight:700,color:"#10b981",display:"flex",alignItems:"center",gap:5 }}>
                    <div style={{ width:5,height:5,borderRadius:"50%",background:"#10b981" }} />Disponible
                  </div>
                </div>
                <div style={{ display:"flex",gap:8,marginBottom:20 }}>
                  {[["4.8","Note"],["127","Avis"],["45 TND/h","Tarif"]].map(([v,l]) => (
                    <div key={l} style={{ flex:1,background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"10px 8px",textAlign:"center",border:"1.5px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ fontSize:15,fontWeight:700,color:"#fff" }}>{v}</div>
                      <div style={{ fontSize:9,color:"#475569",marginTop:2,textTransform:"uppercase",letterSpacing:"0.1em" }}>{l}</div>
                    </div>
                  ))}
                </div>
                <button onClick={onExplore} style={{ width:"100%",background:"#06b6d4",color:"#0f172e",border:"none",borderRadius:8,padding:13,fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:"0.14em",textTransform:"uppercase" }}>Voir les artisans</button>
              </div>
              <div className="floatB" style={{ position:"absolute",top:-18,right:-32,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 16px",boxShadow:"0 8px 28px rgba(0,0,0,0.08)",display:"flex",alignItems:"center",gap:8 }}>
                <div style={{ width:7,height:7,borderRadius:"50%",background:"#10b981" }} />
                <span style={{ fontSize:12,fontWeight:600,color:"#0f172e" }}>247 artisans en ligne</span>
              </div>
              <div className="float" style={{ position:"absolute",bottom:32,left:-36,animationDelay:"1s",background:"#fff",border:"1.5px solid rgba(6,182,212,0.2)",borderRadius:10,padding:"10px 16px",boxShadow:"0 8px 28px rgba(6,182,212,0.08)" }}>
                <div style={{ fontSize:10,color:"#94a3b8",marginBottom:2,textTransform:"uppercase",letterSpacing:"0.1em" }}>Réservation confirmée</div>
                <div style={{ fontSize:12,fontWeight:700,color:"#06b6d4" }}>✓ Leila Gharbi · Demain 9h</div>
              </div>
            </div>
          </div>
        </section>

        {/* TICKER */}
        <div style={{ position:"relative",zIndex:1,background:"#0f172e",borderTop:"1.5px solid rgba(6,182,212,0.1)",borderBottom:"1.5px solid rgba(6,182,212,0.1)",padding:"14px 0",overflow:"hidden" }}>
          <div style={{ display:"flex",animation:"ticker 28s linear infinite",width:"max-content" }}>
            {[...Array(2)].map((_,ri) => (
              <div key={ri} style={{ display:"flex" }}>
                {["Plombier","Électricien","Peintre","Menuisier","Climatisation","Serrurier","Plombier","Électricien","Peintre","Menuisier","Climatisation","Serrurier"].map((item,i) => (
                  <span key={i} style={{ fontSize:11,fontWeight:600,color:i%2===0?"#06b6d4":"#334155",letterSpacing:"0.2em",textTransform:"uppercase",padding:"0 24px",whiteSpace:"nowrap" }}>
                    {i%2===0?"✦":"·"} {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

       {/* HOW IT WORKS */}
<section ref={howRef} style={{ position:"relative",zIndex:1,padding:"100px 28px",background:"#fff" }}>
  <div style={{ maxWidth:1160,margin:"0 auto" }}>

    <div style={{ textAlign:"center",marginBottom:60 }}>
      <Badge label="Processus" />
      <h2 style={{ fontFamily:"'Sora',sans-serif",fontSize:40,fontWeight:800,letterSpacing:"-1.5px",color:"#0f172e",marginBottom:10,lineHeight:1.15 }}>
        Comment ça marche
      </h2>
      <p style={{ fontSize:14,color:"#64748b",lineHeight:1.8,maxWidth:400,margin:"0 auto" }}>
        Réservez un professionnel en 4 étapes ultra simples
      </p>
    </div>

    <div className="how-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,position:"relative" }}>

      <div className="hide-mobile" style={{
        position:"absolute",
        top:40,
        left:"14%",
        right:"14%",
        height:"1px",
        background:"repeating-linear-gradient(90deg,#e2e8f0,#e2e8f0 4px,transparent 4px,transparent 10px)",
        zIndex:0
      }} />

      {[
        { icon:"/icons/search.png", title:"Recherchez", desc:"Trouvez l'artisan idéal selon votre ville et votre besoin." },
        { icon:"/icons/calenda.png", title:"Réservez", desc:"Choisissez la date et l'heure qui vous convient." },
        { icon:"/icons/noname.png", title:"Confirmez", desc:"Validez les détails en toute sécurité." },
        { icon:"/icons/star.png", title:"Évaluez", desc:"Notez votre expérience et aidez la communauté." },
      ].map((item,i) => (

        <div
          key={i}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{
            position:"relative",
            zIndex:1,
            background:"#f8fafc",
            border:"1.5px solid #e2e8f0",
            borderRadius:12,
            padding:"28px 20px 24px",
            textAlign:"center",
            transition:"all 0.3s ease"
          }}
        >

         <img 
  src={item.icon}
  alt={item.title}
  style={{
    width:60,
    height:60,
    objectFit:"contain",
    transition:"transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
    transform: hovered === i
      ? "scale(1.06) translateY(-2px) rotate(6deg)"
      : "scale(1) rotate(0deg)"
  }}
/>

          <div style={{ fontSize:15,fontWeight:700,color:"#0f172e",marginBottom:8 }}>
            {item.title}
          </div>

          <div style={{ fontSize:12,color:"#64748b",lineHeight:1.7 }}>
            {item.desc}
          </div>

        </div>
      ))}

    </div>

  </div>
</section>

        {/* SERVICES */}
        <section ref={servicesRef} style={{ position:"relative",zIndex:1,padding:"100px 28px",background:"#f8fafc" }}>
          <div style={{ maxWidth:1160,margin:"0 auto" }}>
            <div style={{ textAlign:"center",marginBottom:48 }}>
              <Badge label="Prestataires" />
              <h2 style={{ fontFamily:"'Sora',sans-serif",fontSize:40,fontWeight:800,letterSpacing:"-1.5px",color:"#0f172e",marginBottom:10 }}>Services disponibles</h2>
              <p style={{ fontSize:14,color:"#64748b" }}>Artisans qualifiés, vérifiés et notés par la communauté</p>
            </div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:24 }}>
              <button onClick={() => setActiveCat("")} style={{ background:activeCat===""?"#0f172e":"#fff",color:activeCat===""?"#06b6d4":"#64748b",border:activeCat===""?"1.5px solid #0f172e":"1.5px solid #e2e8f0",borderRadius:999,padding:"8px 18px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.1em",transition:"all .2s" }}>TOUS</button>
              {CATEGORIES.map(c => {
                const Icon   = c.icon;
                const active = activeCat === c.key;
                return (
                  <button key={c.key} onClick={() => setActiveCat(active?"":c.key)} style={{ background:active?"rgba(6,182,212,0.08)":"#fff",border:active?"1.5px solid rgba(6,182,212,0.35)":"1.5px solid #e2e8f0",color:active?"#06b6d4":"#64748b",borderRadius:999,padding:"8px 16px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.08em",transition:"all .2s",display:"inline-flex",alignItems:"center",gap:6 }}>
                    <Icon size={12} />{c.key.toUpperCase()}
                  </button>
                );
              })}
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:10,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:24,padding:"10px 18px",marginBottom:36,maxWidth:460,marginLeft:"auto",marginRight:"auto",boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
              <Search size={14} color="#94a3b8" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un prestataire, ville..." style={{ flex:1,border:"none",outline:"none",fontSize:13,color:"#0f172e",background:"transparent",padding:0,boxShadow:"none" }} />
            </div>
            <div className="cards-grid" style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14 }}>
              {displayed.length === 0
                ? <div style={{ gridColumn:"1/-1",textAlign:"center",color:"#94a3b8",padding:60,fontSize:14 }}>Aucun prestataire trouvé.</div>
                : displayed.map(w => <WorkerCard key={w._id} worker={w} />)
              }
            </div>
            {/* Show all / go to Explore */}
            <div style={{ textAlign:"center",marginTop:40,display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap" }}>
              <button onClick={onExplore} style={{ background:"#0f172e",border:"none",color:"#06b6d4",borderRadius:999,padding:"12px 30px",fontSize:11,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,letterSpacing:"0.1em",textTransform:"uppercase",boxShadow:"0 4px 16px rgba(6,182,212,0.12)" }}>
                Explorer tous les artisans <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* À PROPOS */}
        <section ref={aboutRef} style={{ position:"relative",zIndex:1,padding:"100px 28px",background:"#fff" }}>
          <div style={{ maxWidth:1160,margin:"0 auto" }}>
            <div className="about-grid" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center" }}>
              <div>
                <Badge label="Notre mission" />
                <h2 style={{ fontFamily:"'Sora',sans-serif",fontSize:38,fontWeight:800,letterSpacing:"-1.5px",color:"#0f172e",marginBottom:16,lineHeight:1.15 }}>
                  La plateforme de{" "}<em style={{ fontStyle:"italic",color:"#06b6d4" }}>confiance</em>{" "}en Tunisie
                </h2>
                <p style={{ fontSize:14,color:"#64748b",lineHeight:1.9,marginBottom:14,maxWidth:440 }}>Servigo connecte particuliers et artisans qualifiés. Chaque prestataire est vérifié manuellement pour garantir des profils authentiques et des avis réels.</p>
                <p style={{ fontSize:14,color:"#64748b",lineHeight:1.9,marginBottom:36,maxWidth:440 }}> Recherche, réservation, avis , service client 24/7 . Parce que votre maison mérite le meilleur.</p>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                  {[
                    { icon:<Shield size={15} />,text:"Artisans vérifiés" },
                    { icon:<Award size={15} />, text:"Qualité garantie"  },
                    { icon:<Users size={15} />, text:"Communauté active" },
                    { icon:<TrendingUp size={15} />,text:"Satisfaction 98%" },
                  ].map((f,i) => (
                    <div key={i} style={{ background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"13px 14px",display:"flex",alignItems:"center",gap:10 }}>
                      <div style={{ width:32,height:32,borderRadius:8,background:"rgba(6,182,212,0.08)",border:"1.5px solid rgba(6,182,212,0.18)",color:"#06b6d4",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{f.icon}</div>
                      <span style={{ fontSize:12,fontWeight:600,color:"#0f172e" }}>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ background:"#0f172e",border:"1.5px solid rgba(6,182,212,0.15)",borderRadius:16,padding:32,boxShadow:"0 32px 80px rgba(0,0,0,0.14)" }}>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
                    {[["500+","Artisans"],["12K+","Réservations"],["4.8/5","Note globale"],["24/7","Support"]].map(([n,l]) => (
                      <div key={l} style={{ background:"rgba(6,182,212,0.06)",border:"1.5px solid rgba(6,182,212,0.12)",borderRadius:10,padding:"18px 14px",textAlign:"center" }}>
                        <div style={{ fontSize:26,fontWeight:800,color:"#06b6d4",marginBottom:4,letterSpacing:"-0.8px" }}>{n}</div>
                        <div style={{ fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.12em" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:"rgba(6,182,212,0.07)",border:"1.5px solid rgba(6,182,212,0.15)",borderRadius:10,padding:"16px 18px",display:"flex",alignItems:"center",gap:14 }}>
                    <div style={{ width:40,height:40,borderRadius:10,border:"1.5px solid rgba(6,182,212,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>🏆</div>
                    <div>
                      <div style={{ fontSize:13,fontWeight:700,color:"#fff",marginBottom:2 }}>Meilleure plateforme 2026</div>
                      <div style={{ fontSize:11,color:"#64748b" }}>Récompensée par TechTunisie Awards</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RÉCLAMATION */}
        <section ref={reclamRef} style={{ position:"relative",zIndex:1,padding:"100px 28px",background:"#f8fafc" }}>
          <div style={{ maxWidth:760,margin:"0 auto" }}>
            <div style={{ textAlign:"center",marginBottom:48 }}>
              <Badge label="Support" />
              <h2 style={{ fontFamily:"'Sora',sans-serif",fontSize:40,fontWeight:800,letterSpacing:"-1.5px",color:"#0f172e",marginBottom:10 }}>Formulaire de réclamation</h2>
              <p style={{ fontSize:14,color:"#64748b" }}>Une question ? Notre équipe répond en moins de 24h.</p>
            </div>
            <div style={{ background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:16,padding:40,boxShadow:"0 16px 60px rgba(0,0,0,0.06)" }}>
              {formSent ? (
                <div style={{ textAlign:"center",padding:"40px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:12 }}>
                  <div style={{ width:64,height:64,borderRadius:"50%",background:"rgba(6,182,212,0.1)",border:"1.5px solid rgba(6,182,212,0.25)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <CheckCircle2 size={28} color="#06b6d4" />
                  </div>
                  <div style={{ fontSize:22,fontWeight:800,color:"#0f172e",letterSpacing:"-0.5px" }}>Message envoyé !</div>
                  <div style={{ color:"#64748b",fontSize:14 }}>Notre équipe vous répondra dans les 24h.</div>
                  <button onClick={() => { setFormSent(false); setForm({ name:"",email:"",subject:"",message:"" }); }} style={{ marginTop:12,background:"#0f172e",color:"#06b6d4",border:"none",borderRadius:8,padding:"12px 28px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.12em",textTransform:"uppercase" }}>
                    Nouvelle réclamation
                  </button>
                </div>
              ) : (
                <div className="form-grid" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
                  {[
                    { label:"Nom complet *",key:"name",placeholder:"Votre nom",span:false },
                    { label:"Email *",key:"email",placeholder:"votre@email.com",type:"email",span:false },
                    { label:"Sujet",key:"subject",placeholder:"Objet de la réclamation",span:true },
                  ].map(f => (
                    <div key={f.key} style={{ gridColumn:f.span?"1/-1":"auto" }}>
                      <label style={{ display:"block",fontSize:9,fontWeight:700,color:"#94a3b8",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:7 }}>{f.label}</label>
                      <input type={f.type||"text"} value={form[f.key]} onChange={e => setForm(p => ({ ...p,[f.key]:e.target.value }))} placeholder={f.placeholder} />
                    </div>
                  ))}
                  <div style={{ gridColumn:"1/-1" }}>
                    <label style={{ display:"block",fontSize:9,fontWeight:700,color:"#94a3b8",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:7 }}>Message *</label>
                    <textarea value={form.message} onChange={e => setForm(p => ({ ...p,message:e.target.value }))} placeholder="Décrivez votre problème..." style={{ minHeight:120,resize:"vertical" }} />
                  </div>
                  <div style={{ gridColumn:"1/-1" }}>
                    <button onClick={handleSubmit} disabled={formLoading} style={{ background:"#0f172e",color:"#06b6d4",border:"none",borderRadius:24,padding:"14px 28px",fontSize:11,fontWeight:700,cursor:formLoading?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",gap:8,opacity:formLoading?0.6:1,letterSpacing:"0.12em",textTransform:"uppercase",boxShadow:"0 4px 20px rgba(6,182,212,0.12)" }}>
                      {formLoading?"Envoi en cours...":<><Send size={13} />Envoyer le message</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ position:"relative",zIndex:1,background:"#0f172e",borderTop:"1.5px solid rgba(6,182,212,0.1)",padding:"60px 28px 32px" }}>
          <div style={{ maxWidth:1160,margin:"0 auto" }}>
            <div className="footer-grid" style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:48,marginBottom:48 }}>
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
                  <div style={{ width:32,height:32,border:"2px solid #06b6d4",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#06b6d4" }}>S</div>
                  <span style={{ fontWeight:700,fontSize:16,color:"#fff",letterSpacing:"-0.3px" }}>servigo</span>
                </div>
                <p style={{ fontSize:13,color:"#64748b",lineHeight:1.8,marginBottom:24,maxWidth:220 }}>La plateforme qui connecte artisans et particuliers en Tunisie.</p>
                <div style={{ display:"flex",gap:8 }}>
                  {[Facebook,Twitter,Instagram].map((Icon,i) => (
                    <button key={i} style={{ width:34,height:34,borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",color:"#475569",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              </div>
              {[
                { title:"Navigation", items:NAV_LINKS, click:true },
                { title:"Services",   items:CATEGORIES.map(c => c.key) },
                { title:"Contact",    items:["contact@servigo.tn","+216 71 000 000","Tunis, Tunisie"] },
              ].map((col,i) => (
                <div key={i}>
                  <div style={{ fontSize:9,fontWeight:700,color:"#06b6d4",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:18 }}>{col.title}</div>
                  {col.items.map((item,j) => (
                    <div key={j} onClick={col.click?()=>scrollTo(item):undefined} style={{ fontSize:13,color:"#475569",marginBottom:10,cursor:col.click?"pointer":"default",lineHeight:1.6 }}>{item}</div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ borderTop:"1.5px solid rgba(255,255,255,0.06)",paddingTop:24,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
              <span style={{ fontSize:12,color:"#334155" }}>© 2026 Servigo. Tous droits réservés.</span>
              <span style={{ fontSize:12,color:"#334155" }}>2TWo09NAS</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
