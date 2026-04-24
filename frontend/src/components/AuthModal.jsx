import { useState } from "react";
import { X } from "lucide-react";
import LoginForm from "../pages/LoginForm";
import SignupPicker from "../pages/SignupPicker";
import ClientSignup from "../pages/ClientSignup";
import WorkerSignup from "../pages/WorkerSignup";
import GoogleCompleteSignup from "../pages/GoogleCompleteSignup";

export default function AuthModal({ mode = "login", onClose, onSuccess }) {
  const [authMode, setAuthMode] = useState(mode);
  const [googleCredential, setGoogleCredential] = useState(null);

  const handleSuccess = (user) => {
    onSuccess(user);
    onClose();
  };

  return (
    <div style={{ position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(15,23,46,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:"20px" }}>
      <div style={{ background:"#fff",borderRadius:16,display:"grid",gridTemplateColumns:"1fr 1fr",maxWidth:900,width:"100%",maxHeight:"90vh",overflowY:"auto",position:"relative",boxShadow:"0 30px 80px rgba(15,23,46,0.35)",overflow:"hidden" }}>
        <div style={{ background:"linear-gradient(145deg, #0f172e 0%, #10203c 58%, #12436e 100%)",padding:50,display:"flex",flexDirection:"column",justifyContent:"space-between",alignItems:"flex-start",color:"#fff",position:"relative",overflow:"hidden" }}>
          <div style={{ position:"absolute",top:0,right:-20,width:200,height:200,background:"rgba(34,211,238,0.12)",borderRadius:"50%",zIndex:0 }} />
          <div style={{ position:"absolute",bottom:-30,left:-50,width:250,height:250,background:"rgba(6,182,212,0.14)",borderRadius:"50%",zIndex:0 }} />

          <div style={{ position:"relative",zIndex:1 }}>
            <h2 style={{ fontSize:34,fontWeight:800,lineHeight:1.2,marginBottom:30 }}>Rejoignez Servigo</h2>
            <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
              {[
                { text:"Artisans vérifiés en Tunisie" },
                { text:"Réservation rapide et sécurisée" },
                { text:"Tarifs transparents et honnêtes" },
              ].map((item, index) => (
                <div key={index} style={{ display:"flex",alignItems:"flex-start",gap:12 }}>
                  <div style={{ fontSize:22,fontWeight:700,color:"#22d3ee",marginTop:-2 }}>✓</div>
                  <div style={{ fontSize:15,fontWeight:600,lineHeight:1.4 }}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position:"relative",zIndex:1,width:"100%",textAlign:"center" }}>
            <div style={{ width:60,height:60,border:"2px solid #22d3ee",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:28,color:"#22d3ee",margin:"0 auto",marginBottom:16,background:"rgba(15,23,46,0.35)" }}>S</div>
            <div style={{ fontSize:12,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(226,232,240,0.9)" }}>Servigo</div>
          </div>
        </div>

        <div style={{ padding:48,overflowY:"auto",display:"flex",flexDirection:"column",justifyContent:"flex-start" }}>
          <button onClick={onClose} style={{ position:"absolute",top:20,right:20,background:"none",border:"none",fontSize:28,cursor:"pointer",color:"#94a3b8",zIndex:10,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <X size={24} />
          </button>

          {authMode === "login" && (
            <LoginForm onSuccess={handleSuccess} />
          )}

          {authMode === "signup" && (
            <SignupPicker
              onSelect={(selectedType) => setAuthMode(`signup-${selectedType}`)}
              onGoogleSuccess={handleSuccess}
              onGoogleComplete={(credential) => { setGoogleCredential(credential); setAuthMode("signup-google"); }}
            />
          )}

          {authMode === "signup-google" && googleCredential && (
            <GoogleCompleteSignup
              googleCredential={googleCredential}
              onSuccess={(user) => { setGoogleCredential(null); handleSuccess(user); }}
            />
          )}

          {authMode === "signup-client" && (
            <ClientSignup
              onBack={() => setAuthMode("signup")}
              onSuccess={handleSuccess}
            />
          )}

          {authMode === "signup-worker" && (
            <WorkerSignup
              onBack={() => setAuthMode("signup")}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
}