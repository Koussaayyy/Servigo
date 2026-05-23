import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Star, MapPin, Bot } from "lucide-react";
import { chatApi, avatarUrl } from "../api";

const css = `
@keyframes cbFadeIn{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes cbPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes cbDot{0%,80%,100%{opacity:0}40%{opacity:1}}
.cb-btn{position:fixed;bottom:28px;right:28px;z-index:8000;width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,#06b6d4,#0891b2);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(6,182,212,.45);transition:transform .2s,box-shadow .2s;}
.cb-btn:hover{transform:scale(1.1);box-shadow:0 12px 40px rgba(6,182,212,.55);}
.cb-window{position:fixed;bottom:100px;right:28px;z-index:8000;width:370px;max-width:calc(100vw - 32px);background:#fff;border-radius:20px;box-shadow:0 24px 80px rgba(15,23,46,.22);animation:cbFadeIn .22s ease both;display:flex;flex-direction:column;overflow:hidden;height:520px;max-height:calc(100vh - 120px);}
.cb-header{background:linear-gradient(135deg,#0f172e,#1e293b);padding:16px 18px;display:flex;align-items:center;gap:12px;flex-shrink:0;}
.cb-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:#f8fafc;}
.cb-messages::-webkit-scrollbar{width:3px}.cb-messages::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:9px}
.cb-msg-bot{display:flex;gap:8px;align-items:flex-start;}
.cb-msg-user{display:flex;justify-content:flex-end;}
.cb-bubble-bot{background:#fff;border:1.5px solid #e2e8f0;border-radius:0 14px 14px 14px;padding:10px 13px;font-size:13px;color:#0f172e;line-height:1.6;max-width:290px;box-shadow:0 1px 4px rgba(0,0,0,.05);}
.cb-bubble-user{background:linear-gradient(135deg,#06b6d4,#0891b2);border-radius:14px 14px 0 14px;padding:10px 13px;font-size:13px;color:#fff;line-height:1.6;max-width:260px;}
.cb-avatar-bot{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#0f172e,#1e293b);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;}
.cb-input-row{display:flex;gap:8px;padding:12px 14px;border-top:1.5px solid #e2e8f0;background:#fff;flex-shrink:0;}
.cb-input{flex:1;border:1.5px solid #e2e8f0;border-radius:10px;padding:9px 13px;font-family:'Sora',sans-serif;font-size:13px;color:#0f172e;outline:none;background:#f8fafc;resize:none;}
.cb-input:focus{border-color:#06b6d4;background:#fff;}
.cb-send{width:38px;height:38px;border-radius:10px;border:none;background:#06b6d4;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:background .18s;}
.cb-send:hover{background:#0891b2;}
.cb-send:disabled{background:#e2e8f0;cursor:not-allowed;}
.cb-worker-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:10px 12px;display:flex;gap:10px;align-items:center;margin-top:6px;cursor:pointer;transition:border-color .18s,box-shadow .18s;}
.cb-worker-card:hover{border-color:#06b6d4;box-shadow:0 4px 16px rgba(6,182,212,.12);}
.cb-dots span{display:inline-block;width:6px;height:6px;border-radius:50%;background:#94a3b8;margin:0 2px;animation:cbDot 1.2s infinite;}
.cb-dots span:nth-child(2){animation-delay:.2s}.cb-dots span:nth-child(3){animation-delay:.4s}
.cb-badge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;border:2px solid #fff;}
`;

const WELCOME = "Bonjour ! Je suis l'assistant Servigo 👋\nDécrivez-moi votre problème et je vous suggère le meilleur prestataire.";

export default function ChatBot({ user, onViewWorker }) {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [messages, setMessages] = useState([{ role:"bot", text: WELCOME }]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role:"user", text }]);
    setLoading(true);
    try {
      const data = await chatApi.send(text);
      setMessages(prev => [...prev, { role:"bot", text: data.reply, workers: data.recommendedWorkers || [] }]);
      if (!open) setUnread(n => n + 1);
    } catch (err) {
      setMessages(prev => [...prev, { role:"bot", text: `Erreur: ${err?.message || "inconnue"}` }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (!user) return null;

  return (
    <>
      <style>{css}</style>

      {open && (
        <div className="cb-window">
          {/* Header */}
          <div className="cb-header">
            <div style={{ width:38,height:38,borderRadius:12,background:"rgba(6,182,212,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <Bot size={20} color="#06b6d4" />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14,fontWeight:700,color:"#fff" }}>Assistant Servigo</div>
              <div style={{ fontSize:11,color:"#06b6d4",fontWeight:500 }}>Propulsé par Gemini AI</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#94a3b8" }}>
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="cb-messages">
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "bot" ? (
                  <div className="cb-msg-bot">
                    <div className="cb-avatar-bot"><Bot size={14} color="#06b6d4" /></div>
                    <div>
                      <div className="cb-bubble-bot" style={{ whiteSpace:"pre-wrap" }}>{msg.text}</div>
                      {msg.workers?.length > 0 && (
                        <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:6 }}>
                          {msg.workers.map((w) => {
                            const wAvatar = avatarUrl(w.avatar);
                            const wName   = `${w.firstName||""} ${w.lastName||""}`.trim();
                            const wRating = Number(w.workerProfile?.rating || 0);
                            const wCity   = w.workerProfile?.city || "";
                            const wProfs  = (w.workerProfile?.professions || []).join(", ");
                            return (
                              <div key={String(w._id)} className="cb-worker-card"
                                onClick={() => { onViewWorker?.(w); setOpen(false); }}>
                                {wAvatar
                                  ? <img src={wAvatar} alt={wName} style={{ width:40,height:40,borderRadius:"50%",objectFit:"cover",flexShrink:0 }} />
                                  : <div style={{ width:40,height:40,borderRadius:"50%",background:"#0f172e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#06b6d4",flexShrink:0 }}>{(wName[0]||"?").toUpperCase()}</div>
                                }
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:12,fontWeight:700,color:"#0f172e",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{wName}</div>
                                  <div style={{ fontSize:11,color:"#64748b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{wProfs}</div>
                                  <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:2 }}>
                                    {wCity && <span style={{ display:"flex",alignItems:"center",gap:3,fontSize:10,color:"#94a3b8" }}><MapPin size={9} />{wCity}</span>}
                                    {wRating > 0 && <span style={{ display:"flex",alignItems:"center",gap:3,fontSize:10,color:"#f59e0b",fontWeight:700 }}><Star size={9} fill="#f59e0b" />{wRating.toFixed(1)}</span>}
                                  </div>
                                </div>
                                <div style={{ fontSize:10,color:"#06b6d4",fontWeight:700,flexShrink:0 }}>Voir →</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="cb-msg-user">
                    <div className="cb-bubble-user">{msg.text}</div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="cb-msg-bot">
                <div className="cb-avatar-bot"><Bot size={14} color="#06b6d4" /></div>
                <div className="cb-bubble-bot">
                  <div className="cb-dots"><span/><span/><span/></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="cb-input-row">
            <textarea ref={inputRef} className="cb-input" rows={1} placeholder="Décrivez votre problème…"
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              style={{ height:38, overflowY:"hidden" }} />
            <button className="cb-send" onClick={send} disabled={!input.trim() || loading}>
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button className="cb-btn" onClick={() => setOpen(o => !o)} style={{ position:"fixed" }}>
        {open ? <X size={24} color="#fff" /> : <MessageCircle size={24} color="#fff" />}
        {!open && unread > 0 && <div className="cb-badge">{unread}</div>}
      </button>
    </>
  );
}
