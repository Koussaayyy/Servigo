// AdminDashboard.jsx - Admin dashboard with Servigo design system
import { useState, useEffect, useRef } from "react";
import {
  LogOut, LayoutDashboard, AlertCircle, Users, MessageSquare,
  Trash2, ChevronDown, Eye, EyeOff, Search, TrendingUp, Clock,
  Flag, RefreshCcw, UserCheck, UserX, Calendar, CheckCircle,
  XCircle, Briefcase, ShieldCheck, User, Settings, Plus, X,
  Zap, Droplets, HardHat, AppWindow, Axe, Palette, Snowflake,
  Lock, Sprout, LayoutGrid, PackageOpen, Cog, Hammer, Wrench,
  Paintbrush, Scissors, Truck, Home, Flame,
} from "lucide-react";
import { adminApi } from "../api";

export default function AdminDashboard({ admin, onLogout }) {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("adminTab") || "dashboard");

  const switchTab = (tab) => { setActiveTab(tab); localStorage.setItem("adminTab", tab); };
  const [reservations, setReservations] = useState([]);
  const [signals, setSignals] = useState([]);
  const [services, setServices] = useState([]);
  const [signalLoading, setSignalLoading] = useState(false);
  const [reclamations, setReclamations] = useState([]);
  const [filteredReclamations, setFilteredReclamations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [stats, setStats] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [selectedRecIds, setSelectedRecIds] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState({});
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");
  
  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [signalFilter, setSignalFilter] = useState("new");
  const [resSearch, setResSearch] = useState("");
  const [resStatusFilter, setResStatusFilter] = useState("all");
  const [bannedSearch, setBannedSearch] = useState("");
  const [bannedRoleFilter, setBannedRoleFilter] = useState("all");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceIcon, setNewServiceIcon] = useState("Briefcase");
  const [newServiceColor, setNewServiceColor] = useState("#06b6d4");
  const [serviceLoading, setServiceLoading] = useState(false);
  const [svcWorkerSearch, setSvcWorkerSearch] = useState("");
  const [svcWorkerFilter, setSvcWorkerFilter] = useState("all");
  const [clientSearch, setClientSearch] = useState("");
  const [clientStatusFilter, setClientStatusFilter] = useState("all");
  const [workerSearch, setWorkerSearch] = useState("");
  const [workerVerifFilter, setWorkerVerifFilter] = useState("all");
  const [workerStatusFilter, setWorkerStatusFilter] = useState("all");
  const [dialog, setDialog] = useState(null);
  const dialogResolver = useRef(null);

  const closeDialog = (result = false) => {
    if (dialogResolver.current) {
      dialogResolver.current(result);
      dialogResolver.current = null;
    }
    setDialog(null);
  };

  const openConfirmDialog = ({ title, message, confirmText = "OK", cancelText = "Annuler", danger = false }) =>
    new Promise((resolve) => {
      dialogResolver.current = resolve;
      setDialog({ type: "confirm", title, message, confirmText, cancelText, danger });
    });

  const openInfoDialog = ({ title = "Information", message }) => {
    if (dialogResolver.current) {
      dialogResolver.current(false);
      dialogResolver.current = null;
    }
    setDialog({ type: "info", title, message });
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Apply filters whenever data or filters change
  useEffect(() => {
    applyFilters();
  }, [reclamations, searchTerm, filterStatus, filterCategory, filterPriority]);

  const applyFilters = () => {
    let filtered = reclamations;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.email.toLowerCase().includes(term) ||
          r.message.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((r) => r.category === filterCategory);
    }

    // Priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter((r) => r.priority === filterPriority);
    }

    setFilteredReclamations(filtered);
  };

  const loadAllData = async () => {
    setLoading(true);
    setError("");
    try {
      const [reclamationsData, usersData, statsData, signalsData, reservationsData, servicesData] = await Promise.all([
        adminApi.getReclamations(),
        adminApi.getUsers(),
        adminApi.getStats(),
        adminApi.getSignals(),
        adminApi.getAllReservations(),
        adminApi.getServices(),
      ]);

      setReclamations(Array.isArray(reclamationsData) ? reclamationsData : reclamationsData.reclamations || []);
      setUsers(Array.isArray(usersData) ? usersData : usersData.users || []);
      setStats(statsData);
      setSignals(Array.isArray(signalsData) ? signalsData : []);
      setReservations(Array.isArray(reservationsData) ? reservationsData : []);
      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reclamationId, newStatus, newPriority = null) => {
    try {
      const updateData = { status: newStatus };
      if (newPriority) {
        updateData.priority = newPriority;
      }
      await adminApi.updateReclamationStatus(reclamationId, updateData);
      setReclamations((prev) =>
        prev.map((r) => {
          if (r._id === reclamationId) {
            const updated = { ...r, status: newStatus };
            if (newPriority) updated.priority = newPriority;
            return updated;
          }
          return r;
        })
      );
      addActivity(`Statut changé en ${newStatus}`, reclamationId);
    } catch (err) {
      setError(err.message || "Erreur lors de la mise à jour");
    }
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedRecIds.size === 0) return;
    
    try {
      for (const recId of selectedRecIds) {
        await adminApi.updateReclamationStatus(recId, { status: bulkStatus });
      }
      setReclamations((prev) =>
        prev.map((r) => 
          selectedRecIds.has(r._id) ? { ...r, status: bulkStatus } : r
        )
      );
      addActivity(`Mise à jour en masse (${selectedRecIds.size}) à ${bulkStatus}`, "bulk");
      setSelectedRecIds(new Set());
      setBulkStatus("");
    } catch (err) {
      setError(err.message || "Erreur lors de la mise à jour");
    }
  };

  const addActivity = (action, recId) => {
    const now = new Date();
    const entry = {
      id: Date.now(),
      action,
      recId,
      admin: admin?.firstName || admin?.email || "Admin",
      // include date + time for clearer logs
      timestamp: now.toLocaleString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
    };
    setActivityLog((prev) => [entry, ...prev.slice(0, 9)]);
  };

  const toggleRecSelection = (recId) => {
    const newSelected = new Set(selectedRecIds);
    if (newSelected.has(recId)) {
      newSelected.delete(recId);
    } else {
      newSelected.add(recId);
    }
    setSelectedRecIds(newSelected);
  };

  const saveAdminNote = async (recId) => {
    if (!noteText.trim()) return;
    setAdminNotes((prev) => ({
      ...prev,
      [recId]: noteText,
    }));
    try {
      await adminApi.updateReclamationStatus(recId, { adminNotes: noteText });
      addActivity("Note admin ajoutée", recId);
    } catch (err) {
      console.error("Error saving note:", err);
    }
    setEditingNote(null);
    setNoteText("");
  };

  const handleDeleteReclamation = async (reclamationId) => {
    if (!(await openConfirmDialog({ title: "Supprimer la réclamation", message: "Supprimer cette réclamation ?", confirmText: "Supprimer", danger: true }))) return;
    try {
      await adminApi.deleteReclamation(reclamationId);
      setReclamations((prev) => prev.filter((r) => r._id !== reclamationId));
      addActivity("Réclamation supprimée", reclamationId);
    } catch (err) {
      openInfoDialog({ title: "Erreur", message: err.message || "Erreur lors de la suppression" });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!(await openConfirmDialog({ title: "Supprimer l'utilisateur", message: "Supprimer cet utilisateur ?", confirmText: "Supprimer", danger: true }))) return;
    try {
      await adminApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      addActivity("Utilisateur supprimé", userId);
    } catch (err) {
      openInfoDialog({ title: "Erreur", message: err.message || "Erreur lors de la suppression" });
    }
  };

  const getVerificationBadge = (status) => {
    const map = {
      not_submitted: { label: "Non soumis", bg: "#f1f5f9", text: "#64748b" },
      pending: { label: "En attente", bg: "rgba(245,158,11,0.12)", text: "#b45309" },
      approved: { label: "Approuvé", bg: "rgba(34,197,94,0.12)", text: "#15803d" },
      rejected: { label: "Refusé", bg: "rgba(239,68,68,0.12)", text: "#b91c1c" },
    };
    return map[status] || map.not_submitted;
  };

  const reviewWorkerVerification = async (workerId, status) => {
    try {
      let rejectionReason = "";
      if (status === "rejected") {
        rejectionReason = window.prompt("Motif du refus (optionnel):", "") || "";
      }

      await adminApi.reviewWorkerVerification(workerId, { status, rejectionReason });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === workerId
            ? {
                ...u,
                workerVerification: {
                  ...u.workerVerification,
                  status,
                  rejectionReason,
                },
              }
            : u
        )
      );
      addActivity(`Vérification artisan ${status === "approved" ? "approuvée" : "refusée"}`, workerId);
    } catch (err) {
      setError(err.message || "Erreur lors de la revue du dossier artisan");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: {
        bg: "rgba(59, 130, 246, 0.1)",
        text: "#3b82f6",
        label: "Nouvelle",
      },
      in_progress: {
        bg: "rgba(245, 158, 11, 0.1)",
        text: "#f59e0b",
        label: "En cours",
      },
      resolved: {
        bg: "rgba(16, 185, 129, 0.1)",
        text: "#10b981",
        label: "Résolue",
      },
    };
    return styles[status] || styles.new;
  };

  const getRoleBadge = (role, workerVerificationStatus = "") => {
    if (role === "worker" && workerVerificationStatus !== "approved") {
      return {
        bg: "rgba(245, 158, 11, 0.1)",
        text: "#f59e0b",
        label: "Prestataire (en attente)",
      };
    }

    const styles = {
      client: {
        bg: "rgba(59, 130, 246, 0.1)",
        text: "#3b82f6",
        label: "Client",
      },
      worker: {
        bg: "rgba(245, 158, 11, 0.1)",
        text: "#f59e0b",
        label: "Artisan",
      },
      admin: {
        bg: "rgba(16, 185, 129, 0.1)",
        text: "#10b981",
        label: "Admin",
      },
    };
    return styles[role] || styles.client;
  };

  const statGroups = [
    {
      title: "Utilisateurs",
      icon: Users,
      cards: [
        { label: "Clients",             value: stats?.users?.totalClients  || 0, icon: User,       color: "#06b6d4" },
        { label: "Prestataires",        value: stats?.users?.totalWorkers  || 0, icon: Briefcase,  color: "#8b5cf6" },
        { label: "Vérifications en att.", value: stats?.workers?.pendingVerifications || 0, icon: ShieldCheck, color: "#f59e0b" },
        { label: "Prestataires approuvés", value: stats?.workers?.approved || 0, icon: UserCheck,  color: "#10b981" },
      ],
    },
    {
      title: "Réservations",
      icon: Calendar,
      cards: [
        { label: "Total",       value: stats?.reservations?.total     || 0, icon: Calendar,      color: "#06b6d4" },
        { label: "En attente",  value: stats?.reservations?.pending   || 0, icon: Clock,         color: "#f59e0b" },
        { label: "Acceptées",   value: stats?.reservations?.accepted  || 0, icon: CheckCircle,   color: "#8b5cf6" },
        { label: "Terminées",   value: stats?.reservations?.completed || 0, icon: TrendingUp,    color: "#10b981" },
        { label: "Annulées",    value: stats?.reservations?.cancelled || 0, icon: XCircle,       color: "#94a3b8" },
      ],
    },
    {
      title: "Réclamations",
      icon: MessageSquare,
      cards: [
        { label: "Total",     value: stats?.reclamations?.total      || 0, icon: MessageSquare, color: "#06b6d4", sub: `Moy. résolution : ${stats?.avgResolutionTimeDays || 0}j` },
        { label: "Nouvelles", value: stats?.reclamations?.new        || 0, icon: AlertCircle,   color: "#ef4444" },
        { label: "En cours",  value: stats?.reclamations?.inProgress || 0, icon: Clock,         color: "#f59e0b" },
        { label: "Résolues",  value: stats?.reclamations?.resolved   || 0, icon: TrendingUp,    color: "#10b981" },
      ],
    },
    {
      title: "Modération & Sécurité",
      icon: UserX,
      cards: [
        { label: "Total bannis",            value: users.filter(u => !u.isActive || (u.role==="worker" && u.workerStatus==="suspended")).length, icon: UserX,       color: "#ef4444" },
        { label: "Prestataires suspendus",  value: users.filter(u => u.role==="worker" && u.workerStatus==="suspended").length,                  icon: Briefcase,   color: "#f97316" },
        { label: "Comptes désactivés",      value: users.filter(u => !u.isActive).length,                                                        icon: EyeOff,      color: "#94a3b8" },
        { label: "Signalements en attente", value: signals.filter(s => s.status==="new").length,                                                  icon: Flag,        color: "#f59e0b" },
      ],
    },
  ];

  const sidebarNav = [
    { id:"dashboard",    label:"Tableau de bord",      icon:LayoutDashboard },
    { id:"reclamations", label:"Réclamations",   icon:MessageSquare,  badge: reclamations.filter(r=>r.status==="new").length },
    { id:"signals",      label:"Signalements",   icon:Flag,           badge: signals.filter(s=>s.status==="new").length },
    { id:"users",        label:"Clients",        icon:Users,          badge: users.filter(u=>u.role==="client").length },
    { id:"workers",      label:"Prestataires",   icon:Briefcase,      badge: users.filter(u=>u.role==="worker"&&u.workerVerification?.status==="pending").length },
    { id:"banned",       label:"Bannis",         icon:UserX,          badge: users.filter(u=>!u.isActive||(u.role==="worker"&&u.workerStatus==="suspended")).length },
    { id:"services",     label:"Services",       icon:Settings,  badge: services.length },
    { id:"reservations", label:"Réservations",   icon:Calendar },
    { id:"activity",     label:"Activité",       icon:Clock },
  ];

  const pageTitles = {
    dashboard:    { title:"Tableau de bord",   sub:"Vue d'ensemble de la plateforme" },
    reclamations: { title:"Réclamations",      sub:"Gérez les réclamations des utilisateurs" },
    signals:      { title:"Signalements",      sub:"Gérez les signalements de mauvais comportements" },
    users:        { title:"Clients",            sub:"Gérez les comptes clients" },
    workers:      { title:"Prestataires",      sub:"Gérez les comptes prestataires et leurs vérifications" },
    banned:       { title:"Utilisateurs bannis", sub:"Comptes suspendus ou désactivés" },
    services:     { title:"Services",           sub:"Gérez les métiers proposés sur la plateforme" },
    reservations: { title:"Réservations",       sub:"Toutes les réservations de la plateforme" },
    activity:     { title:"Journal d'activité",sub:"Historique des actions administratives" },
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}) : "—";
  const fmtHour = (h) => `${String(h).padStart(2,"0")}:00`;

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'Sora',sans-serif", background:"#f1f5f9" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Sidebar ── */}
      <aside style={{ width:240, background:"#0f172e", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, bottom:0, zIndex:100, overflowY:"auto" }}>
        {/* Logo */}
        <div style={{ padding:"22px 20px 18px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34,height:34,borderRadius:9,background:"rgba(6,182,212,0.15)",border:"1.5px solid rgba(6,182,212,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#06b6d4",flexShrink:0 }}>S</div>
            <div>
              <div style={{ fontSize:13,fontWeight:800,color:"#fff",letterSpacing:"-0.3px" }}>Servigo</div>
              <div style={{ fontSize:10,color:"rgba(148,163,184,0.7)",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase" }}>Admin</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex:1, padding:"12px 10px" }}>
          {sidebarNav.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => switchTab(item.id)}
                style={{ display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",borderRadius:9,border:"none",background: active?"rgba(6,182,212,0.12)":"transparent",color: active?"#06b6d4":"rgba(148,163,184,0.85)",fontSize:13,fontWeight: active?700:500,cursor:"pointer",marginBottom:2,transition:"all .15s",textAlign:"left",fontFamily:"'Sora',sans-serif" }}
                onMouseEnter={e => { if(!active) e.currentTarget.style.background="rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { if(!active) e.currentTarget.style.background="transparent"; }}>
                <Icon size={15} style={{ flexShrink:0 }}/>
                <span style={{ flex:1 }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{ background:"#ef4444",color:"#fff",borderRadius:999,fontSize:9,fontWeight:800,padding:"2px 6px",lineHeight:"14px" }}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Admin info + logout */}
        <div style={{ padding:"14px 16px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:12,fontWeight:700,color:"#fff" }}>{admin?.firstName} {admin?.lastName}</div>
            <div style={{ fontSize:10,color:"rgba(148,163,184,0.65)",marginTop:2 }}>{admin?.email}</div>
          </div>
          <button onClick={() => { localStorage.removeItem("adminToken"); localStorage.removeItem("admin"); onLogout?.(); }}
            style={{ display:"flex",alignItems:"center",gap:7,width:"100%",padding:"8px 10px",borderRadius:8,border:"1.5px solid rgba(239,68,68,0.25)",background:"rgba(239,68,68,0.08)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"background .15s" }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.16)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(239,68,68,0.08)"}>
            <LogOut size={13}/> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex:1, marginLeft:240, display:"flex", flexDirection:"column", minHeight:"100vh" }}>

        {/* Top bar */}
        <div style={{ background:"#fff", borderBottom:"1.5px solid #e2e8f0", padding:"16px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
          <div>
            <h1 style={{ fontSize:18,fontWeight:800,color:"#0f172e",marginBottom:2 }}>
              {pageTitles[activeTab]?.title}
            </h1>
            <p style={{ fontSize:12,color:"#94a3b8" }}>
              {pageTitles[activeTab]?.sub}
            </p>
          </div>
          <button onClick={loadAllData} disabled={loading}
            style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .15s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#06b6d4";e.currentTarget.style.color="#06b6d4";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color="#64748b";}}>
            <RefreshCcw size={13} style={{ animation: loading?"spin 1s linear infinite":"none" }}/> Actualiser
          </button>
        </div>

        <main style={{ padding:"24px 28px", flex:1 }}>

          {/* Error */}
          {error && <div style={{ background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:10,padding:"12px 16px",marginBottom:20,color:"#b91c1c",fontSize:13 }}>{error}</div>}

          {/* ── Dashboard Overview ── */}
          {activeTab === "dashboard" && (
            <div style={{ display:"flex",flexDirection:"column",gap:32 }}>
              {statGroups.map((group) => {
                const GIcon = group.icon;
                return (
                  <div key={group.title}>
                    {/* Section header */}
                    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
                      <div style={{ width:28,height:28,borderRadius:8,background:"#f1f5f9",border:"1.5px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        <GIcon size={13} color="#475569"/>
                      </div>
                      <span style={{ fontSize:12,fontWeight:800,color:"#475569",textTransform:"uppercase",letterSpacing:"0.12em" }}>{group.title}</span>
                      <div style={{ flex:1,height:"1.5px",background:"linear-gradient(to right,#e2e8f0 60%,transparent)",marginLeft:4 }}/>
                    </div>

                    {/* Cards */}
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14 }}>
                      {group.cards.map((stat) => {
                        const Icon = stat.icon;
                        return (
                          <div key={stat.label}
                            style={{ background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 4px rgba(15,23,46,.06),0 1px 2px rgba(15,23,46,.04)",transition:"transform .18s,box-shadow .18s",position:"relative",cursor:"default" }}
                            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 12px 32px ${stat.color}22,0 2px 8px rgba(15,23,46,.08)`;}}
                            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 1px 4px rgba(15,23,46,.06),0 1px 2px rgba(15,23,46,.04)";}}>

                            {/* Colored top accent */}
                            <div style={{ height:4,background:`linear-gradient(90deg,${stat.color},${stat.color}66)` }}/>

                            <div style={{ padding:"18px 20px",position:"relative",overflow:"hidden" }}>
                              {/* Watermark icon */}
                              <div style={{ position:"absolute",right:-10,bottom:-10,opacity:.06,pointerEvents:"none" }}>
                                <Icon size={88} color={stat.color}/>
                              </div>

                              {/* Icon badge */}
                              <div style={{ width:40,height:40,borderRadius:12,background:`${stat.color}14`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16 }}>
                                <Icon size={20} color={stat.color}/>
                              </div>

                              {/* Number */}
                              <div style={{ fontSize:40,fontWeight:900,color:"#0f172e",lineHeight:1,letterSpacing:"-1px",marginBottom:6 }}>
                                {loading ? <span style={{ color:"#e2e8f0" }}>—</span> : stat.value}
                              </div>

                              {/* Label */}
                              <div style={{ fontSize:12,fontWeight:700,color:"#64748b",letterSpacing:"0.01em" }}>{stat.label}</div>
                              {stat.sub && (
                                <div style={{ fontSize:11,color:"#94a3b8",marginTop:5,display:"flex",alignItems:"center",gap:4 }}>
                                  <span style={{ width:6,height:6,borderRadius:"50%",background:stat.color,display:"inline-block",flexShrink:0 }}/>
                                  {stat.sub}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Services Tab ── */}
          {activeTab === "services" && (() => {
            const ICON_OPTIONS = [
              { name:"Zap",        Icon:Zap,        label:"Électricité" },
              { name:"Droplets",   Icon:Droplets,   label:"Plomberie" },
              { name:"HardHat",    Icon:HardHat,    label:"Construction" },
              { name:"Hammer",     Icon:Hammer,     label:"Menuiserie" },
              { name:"Wrench",     Icon:Wrench,     label:"Réparation" },
              { name:"Paintbrush", Icon:Paintbrush, label:"Peinture" },
              { name:"Snowflake",  Icon:Snowflake,  label:"Climatisation" },
              { name:"Lock",       Icon:Lock,       label:"Serrurerie" },
              { name:"Sprout",     Icon:Sprout,     label:"Jardinage" },
              { name:"LayoutGrid", Icon:LayoutGrid, label:"Carrelage" },
              { name:"Truck",      Icon:Truck,      label:"Déménagement" },
              { name:"Cog",        Icon:Cog,        label:"Mécanique" },
              { name:"Scissors",   Icon:Scissors,   label:"Coiffure" },
              { name:"Home",       Icon:Home,       label:"Maison" },
              { name:"AppWindow",  Icon:AppWindow,  label:"Vitrerie" },
              { name:"Axe",        Icon:Axe,        label:"Bois" },
              { name:"PackageOpen",Icon:PackageOpen,label:"Livraison" },
              { name:"Palette",    Icon:Palette,    label:"Art" },
              { name:"Flame",      Icon:Flame,      label:"Chauffage" },
              { name:"Briefcase",  Icon:Briefcase,  label:"Autre" },
            ];
            const COLOR_OPTIONS = ["#06b6d4","#3b82f6","#8b5cf6","#f59e0b","#10b981","#ef4444","#f97316","#84cc16","#ec4899","#64748b"];
            const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map(o => [o.name, o.Icon]));

            const addService = async () => {
              if (!newServiceName.trim()) return;
              setServiceLoading(true);
              try {
                const created = await adminApi.createService({ name: newServiceName.trim(), icon: newServiceIcon, color: newServiceColor });
                setServices(prev => [...prev, created]);
                setNewServiceName("");
                setNewServiceIcon("Briefcase");
                setNewServiceColor("#06b6d4");
              } catch (err) {
                openInfoDialog({ title: "Erreur", message: err.message || "Erreur lors de la création du service" });
              } finally {
                setServiceLoading(false);
              }
            };

            const removeService = async (id) => {
              if (!(await openConfirmDialog({ title: "Supprimer le service", message: "Supprimer ce service ?", confirmText: "Supprimer", danger: true }))) return;
              try {
                await adminApi.deleteService(id);
                setServices(prev => prev.filter(s => s._id !== id));
              } catch (err) {
                openInfoDialog({ title: "Erreur", message: err.message || "Erreur lors de la suppression du service" });
              }
            };

            const SelectedIcon = ICON_MAP[newServiceIcon] || Briefcase;

            // ── computed data ──────────────────────────────────────
            const allWorkers = users.filter(u => u.role === "worker");
            const serviceStats = services
              .map(s => ({
                ...s,
                workerCount: allWorkers.filter(w => (w.workerProfile?.professions || []).includes(s.name)).length,
              }))
              .sort((a, b) => b.workerCount - a.workerCount);

            const filteredWorkers = allWorkers
              .filter(w => {
                if (svcWorkerFilter === "all") return true;
                return (w.workerProfile?.professions || []).includes(svcWorkerFilter);
              })
              .filter(w => {
                if (!svcWorkerSearch.trim()) return true;
                const q = svcWorkerSearch.toLowerCase();
                return (
                  (w.firstName || "").toLowerCase().includes(q) ||
                  (w.lastName  || "").toLowerCase().includes(q) ||
                  (w.email     || "").toLowerCase().includes(q)
                );
              });

            return (
              <div style={{ display:"flex",flexDirection:"column",gap:24 }}>

                {/* ── Service stats ── */}
                {serviceStats.length > 0 && (
                  <div>
                    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
                      <div style={{ width:28,height:28,borderRadius:8,background:"#f1f5f9",border:"1.5px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center" }}>
                        <TrendingUp size={13} color="#475569"/>
                      </div>
                      <span style={{ fontSize:12,fontWeight:800,color:"#475569",textTransform:"uppercase",letterSpacing:"0.12em" }}>Popularité des services</span>
                      <div style={{ flex:1,height:"1.5px",background:"linear-gradient(to right,#e2e8f0 60%,transparent)" }}/>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14 }}>
                      {serviceStats.map((s, idx) => {
                        const SIcon = ICON_MAP[s.icon] || Briefcase;
                        const maxCount = serviceStats[0]?.workerCount || 1;
                        const pct = maxCount > 0 ? Math.round((s.workerCount / maxCount) * 100) : 0;
                        return (
                          <div key={s._id}
                            style={{ background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(15,23,46,.06)",transition:"transform .18s,box-shadow .18s",cursor:"default" }}
                            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px ${s.color}22`;}}
                            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 1px 4px rgba(15,23,46,.06)";}}>
                            <div style={{ height:3,background:`linear-gradient(90deg,${s.color},${s.color}66)` }}/>
                            <div style={{ padding:"14px 16px" }}>
                              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
                                <div style={{ width:36,height:36,borderRadius:10,background:`${s.color}14`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                                  <SIcon size={18} color={s.color}/>
                                </div>
                                {idx === 0 && s.workerCount > 0 && (
                                  <span style={{ fontSize:9,fontWeight:800,background:`${s.color}18`,color:s.color,borderRadius:999,padding:"2px 8px",textTransform:"uppercase",letterSpacing:"0.08em" }}>
                                    Top
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize:28,fontWeight:900,color:"#0f172e",lineHeight:1,letterSpacing:"-0.5px",marginBottom:4 }}>{s.workerCount}</div>
                              <div style={{ fontSize:12,fontWeight:700,color:"#64748b",marginBottom:10 }}>{s.name}</div>
                              <div style={{ height:4,background:"#f1f5f9",borderRadius:999,overflow:"hidden" }}>
                                <div style={{ height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${s.color},${s.color}aa)`,borderRadius:999,transition:"width .4s" }}/>
                              </div>
                              <div style={{ fontSize:10,color:"#94a3b8",marginTop:4 }}>
                                {s.workerCount === 1 ? "1 prestataire" : `${s.workerCount} prestataires`}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Workers by service ── */}
                <div>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
                    <div style={{ width:28,height:28,borderRadius:8,background:"#f1f5f9",border:"1.5px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Briefcase size={13} color="#475569"/>
                    </div>
                    <span style={{ fontSize:12,fontWeight:800,color:"#475569",textTransform:"uppercase",letterSpacing:"0.12em" }}>Prestataires par service</span>
                    <div style={{ flex:1,height:"1.5px",background:"linear-gradient(to right,#e2e8f0 60%,transparent)" }}/>
                  </div>

                  <div style={{ background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:14,overflow:"hidden" }}>
                    {/* Toolbar */}
                    <div style={{ background:"#f8fafc",borderBottom:"1.5px solid #e2e8f0",padding:"12px 20px",display:"flex",flexWrap:"wrap",alignItems:"center",gap:10 }}>
                      <span style={{ fontSize:13,fontWeight:700,color:"#0f172e" }}>
                        {filteredWorkers.length} / {allWorkers.length} prestataire{allWorkers.length !== 1 ? "s" : ""}
                      </span>
                      <div style={{ flex:1 }}/>
                      {/* Service filter */}
                      <select value={svcWorkerFilter} onChange={e => setSvcWorkerFilter(e.target.value)}
                        style={{ border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:12,fontFamily:"Sora,sans-serif",background:"#fff",cursor:"pointer",outline:"none",maxWidth:200 }}>
                        <option value="all">Tous les services</option>
                        {services.map(s => (
                          <option key={s._id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                      {/* Search */}
                      <div style={{ position:"relative" }}>
                        <Search size={13} style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"#94a3b8" }}/>
                        <input type="text" placeholder="Nom ou email…" value={svcWorkerSearch}
                          onChange={e => setSvcWorkerSearch(e.target.value)}
                          style={{ border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 10px 7px 28px",fontSize:12,fontFamily:"Sora,sans-serif",background:"#fff",width:190,outline:"none" }}/>
                      </div>
                    </div>

                    {/* Table header */}
                    <div style={{ background:"#f8fafc",borderBottom:"1.5px solid #e2e8f0",padding:"10px 20px",display:"grid",gridTemplateColumns:"1.2fr 1.4fr 0.8fr 2fr",gap:16,fontWeight:700,fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.1em" }}>
                      <div>Nom</div><div>Email</div><div>Statut</div><div>Services</div>
                    </div>

                    {filteredWorkers.length === 0 ? (
                      <div style={{ padding:"40px 20px",textAlign:"center",color:"#94a3b8" }}>
                        <Briefcase size={32} color="#e2e8f0" style={{ marginBottom:10 }}/>
                        <p style={{ fontSize:13,fontWeight:500,margin:0 }}>
                          {svcWorkerSearch || svcWorkerFilter !== "all" ? "Aucun résultat." : "Aucun prestataire."}
                        </p>
                      </div>
                    ) : (
                      filteredWorkers.map(w => {
                        const profs = w.workerProfile?.professions || [];
                        return (
                          <div key={w._id} style={{ display:"grid",gridTemplateColumns:"1.2fr 1.4fr 0.8fr 2fr",gap:16,padding:"12px 20px",borderBottom:"1.5px solid #f1f5f9",alignItems:"center",fontSize:13 }}>
                            <div style={{ fontWeight:600,color:"#0f172e" }}>{w.firstName} {w.lastName}</div>
                            <div style={{ color:"#64748b",fontSize:12,wordBreak:"break-all" }}>{w.email}</div>
                            <div style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,color:w.isActive?"#10b981":"#ef4444" }}>
                              {w.isActive ? <><Eye size={12}/> Actif</> : <><EyeOff size={12}/> Inactif</>}
                            </div>
                            <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                              {profs.length === 0
                                ? <span style={{ color:"#94a3b8",fontSize:12 }}>Aucun service</span>
                                : profs.map(p => {
                                    const svc = services.find(s => s.name === p);
                                    const PIco = svc ? (ICON_MAP[svc.icon] || Briefcase) : Briefcase;
                                    const color = svc?.color || "#64748b";
                                    return (
                                      <span key={p} style={{ display:"inline-flex",alignItems:"center",gap:4,background:`${color}14`,color,border:`1px solid ${color}30`,borderRadius:999,padding:"3px 9px",fontSize:11,fontWeight:700 }}>
                                        <PIco size={11}/> {p}
                                      </span>
                                    );
                                  })
                              }
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* ── Manage services (add / delete) ── */}
                <div>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
                    <div style={{ width:28,height:28,borderRadius:8,background:"#f1f5f9",border:"1.5px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Settings size={13} color="#475569"/>
                    </div>
                    <span style={{ fontSize:12,fontWeight:800,color:"#475569",textTransform:"uppercase",letterSpacing:"0.12em" }}>Gérer les services</span>
                    <div style={{ flex:1,height:"1.5px",background:"linear-gradient(to right,#e2e8f0 60%,transparent)" }}/>
                  </div>

                  {/* Add form */}
                  <div style={{ background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:14,padding:24,marginBottom:16 }}>
                    <h3 style={{ fontSize:14,fontWeight:800,color:"#0f172e",marginTop:0,marginBottom:18 }}>Ajouter un service</h3>
                    <div style={{ marginBottom:14 }}>
                      <label style={{ fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:6 }}>Nom</label>
                      <input type="text" placeholder="Ex: Électricien, Plombier…" value={newServiceName}
                        onChange={e => setNewServiceName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addService()}
                        style={{ border:"1.5px solid #e2e8f0",borderRadius:9,padding:"9px 14px",fontSize:13,fontFamily:"Sora,sans-serif",width:"100%",maxWidth:340,outline:"none",boxSizing:"border-box" }}/>
                    </div>
                    <div style={{ marginBottom:14 }}>
                      <label style={{ fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:8 }}>Icône</label>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
                        {ICON_OPTIONS.map(({ name, Icon: Ico, label }) => (
                          <button key={name} onClick={() => setNewServiceIcon(name)} title={label}
                            style={{ width:42,height:42,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .15s",
                              border: newServiceIcon === name ? `2px solid ${newServiceColor}` : "1.5px solid #e2e8f0",
                              background: newServiceIcon === name ? `${newServiceColor}18` : "#f8fafc" }}>
                            <Ico size={17} color={newServiceIcon === name ? newServiceColor : "#64748b"}/>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom:18 }}>
                      <label style={{ fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:8 }}>Couleur</label>
                      <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                        {COLOR_OPTIONS.map(c => (
                          <button key={c} onClick={() => setNewServiceColor(c)}
                            style={{ width:26,height:26,borderRadius:"50%",background:c,border: newServiceColor===c ? "3px solid #0f172e" : "3px solid transparent",cursor:"pointer",transition:"transform .15s",transform: newServiceColor===c?"scale(1.2)":"scale(1)" }}/>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:10,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"9px 14px" }}>
                        <div style={{ width:34,height:34,borderRadius:9,background:`${newServiceColor}18`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                          <SelectedIcon size={17} color={newServiceColor}/>
                        </div>
                        <span style={{ fontSize:13,fontWeight:700,color:"#0f172e" }}>{newServiceName || "Aperçu"}</span>
                      </div>
                      <button onClick={addService} disabled={serviceLoading || !newServiceName.trim()}
                        style={{ display:"flex",alignItems:"center",gap:7,background: newServiceName.trim() ? newServiceColor : "#e2e8f0",color: newServiceName.trim() ? "#fff" : "#94a3b8",border:"none",borderRadius:9,padding:"10px 18px",fontSize:13,fontWeight:700,cursor: newServiceName.trim() ? "pointer" : "not-allowed",transition:"all .15s" }}>
                        <Plus size={15}/> Ajouter
                      </button>
                    </div>
                  </div>

                  {/* Services list */}
                  <div style={{ background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:14,overflow:"hidden" }}>
                    <div style={{ background:"#f8fafc",borderBottom:"1.5px solid #e2e8f0",padding:"11px 20px",display:"flex",alignItems:"center",gap:8 }}>
                      <Settings size={13} color="#64748b"/>
                      <span style={{ fontSize:13,fontWeight:700,color:"#0f172e" }}>{services.length} service{services.length !== 1 ? "s" : ""}</span>
                    </div>
                    {services.length === 0 ? (
                      <div style={{ padding:"40px 20px",textAlign:"center",color:"#94a3b8" }}>
                        <Settings size={32} color="#e2e8f0" style={{ marginBottom:10 }}/>
                        <p style={{ fontSize:13,margin:0 }}>Aucun service. Ajoutez-en un ci-dessus.</p>
                      </div>
                    ) : (
                      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:12,padding:16 }}>
                        {services.map(s => {
                          const SIcon = ICON_MAP[s.icon] || Briefcase;
                          const cnt = allWorkers.filter(w => (w.workerProfile?.professions || []).includes(s.name)).length;
                          return (
                            <div key={s._id} style={{ border:`1.5px solid ${s.color}30`,borderRadius:12,padding:"12px 14px",background:`${s.color}06`,display:"flex",alignItems:"center",gap:10 }}>
                              <div style={{ width:38,height:38,borderRadius:10,background:`${s.color}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                                <SIcon size={18} color={s.color}/>
                              </div>
                              <div style={{ flex:1,minWidth:0 }}>
                                <div style={{ fontSize:13,fontWeight:700,color:"#0f172e",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{s.name}</div>
                                <div style={{ fontSize:11,color:"#94a3b8",marginTop:2 }}>{cnt} prestataire{cnt !== 1 ? "s" : ""}</div>
                              </div>
                              <button onClick={() => removeService(s._id)}
                                style={{ background:"none",border:"none",cursor:"pointer",color:"#cbd5e1",padding:4,borderRadius:6,display:"flex",flexShrink:0,transition:"color .15s" }}
                                onMouseEnter={e => e.currentTarget.style.color="#ef4444"}
                                onMouseLeave={e => e.currentTarget.style.color="#cbd5e1"}>
                                <X size={14}/>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })()}

          {/* ── Reservations Tab ── */}
          {activeTab === "reservations" && (() => {
            const statusColor = { pending:"#f59e0b", accepted:"#10b981", rejected:"#ef4444", cancelled:"#94a3b8", completed:"#06b6d4" };
            const statusLabel = { pending:"En attente", accepted:"Acceptée", rejected:"Refusée", cancelled:"Annulée", completed:"Terminée" };
            const filtered = reservations
              .filter(r => resStatusFilter === "all" || r.status === resStatusFilter)
              .filter(r => {
                if (!resSearch.trim()) return true;
                const q = resSearch.toLowerCase();
                return (
                  (r.client?.firstName || "").toLowerCase().includes(q) ||
                  (r.client?.lastName  || "").toLowerCase().includes(q) ||
                  (r.worker?.firstName || "").toLowerCase().includes(q) ||
                  (r.worker?.lastName  || "").toLowerCase().includes(q) ||
                  (r.serviceType       || "").toLowerCase().includes(q)
                );
              });
            return (
              <div style={{ background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,overflow:"hidden" }}>
                {/* Toolbar */}
                <div style={{ background:"#f8fafc",borderBottom:"1.5px solid #e2e8f0",padding:"12px 20px",display:"flex",flexWrap:"wrap",alignItems:"center",gap:10 }}>
                  <Calendar size={14} color="#06b6d4"/>
                  <span style={{ fontSize:13,fontWeight:700,color:"#0f172e" }}>
                    {filtered.length} / {reservations.length} réservation{reservations.length !== 1 ? "s" : ""}
                  </span>
                  <div style={{ flex:1 }}/>
                  {/* Status pills */}
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    {[
                      { key:"all",       label:"Toutes" },
                      { key:"pending",   label:"En attente",  color:"#f59e0b" },
                      { key:"accepted",  label:"Acceptées",   color:"#10b981" },
                      { key:"completed", label:"Terminées",   color:"#06b6d4" },
                      { key:"cancelled", label:"Annulées",    color:"#94a3b8" },
                      { key:"rejected",  label:"Refusées",    color:"#ef4444" },
                    ].map(({ key, label, color }) => (
                      <button key={key} onClick={() => setResStatusFilter(key)}
                        style={{ padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:700,cursor:"pointer",border:"none",
                          background: resStatusFilter === key ? (color || "#06b6d4") : "#e2e8f0",
                          color:      resStatusFilter === key ? "#fff" : "#64748b",
                          transition:"all .15s" }}>
                        {label}
                        {key !== "all" && (
                          <span style={{ marginLeft:5,opacity:0.8 }}>
                            ({reservations.filter(r => r.status === key).length})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {/* Search */}
                  <div style={{ position:"relative" }}>
                    <Search size={13} style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"#94a3b8" }}/>
                    <input type="text" placeholder="Client, prestataire, service…" value={resSearch}
                      onChange={e => setResSearch(e.target.value)}
                      style={{ border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 10px 7px 28px",fontSize:12,fontFamily:"Sora,sans-serif",background:"#fff",width:220,outline:"none" }}/>
                  </div>
                </div>

                {loading ? (
                  <div style={{ padding:32,textAlign:"center",color:"#94a3b8",fontSize:13 }}>Chargement…</div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding:40,textAlign:"center",color:"#94a3b8",fontSize:13 }}>
                    {resSearch || resStatusFilter !== "all" ? "Aucun résultat pour cette recherche." : "Aucune réservation."}
                  </div>
                ) : (
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
                      <thead>
                        <tr style={{ background:"#f8fafc",borderBottom:"1.5px solid #f1f5f9" }}>
                          {["Client","Prestataire","Date","Créneau","Service","Statut","Créé le"].map(h => (
                            <th key={h} style={{ padding:"10px 14px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:10,textTransform:"uppercase",letterSpacing:"0.07em",whiteSpace:"nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((r, i) => (
                          <tr key={r._id} style={{ borderBottom:"1px solid #f8fafc",background:i%2===0?"#fff":"#fafcff" }}>
                            <td style={{ padding:"10px 14px",fontWeight:600,color:"#0f172e" }}>{r.client?.firstName||"?"} {r.client?.lastName||""}</td>
                            <td style={{ padding:"10px 14px",color:"#334155" }}>{r.worker?.firstName||"?"} {r.worker?.lastName||""}</td>
                            <td style={{ padding:"10px 14px",color:"#64748b",whiteSpace:"nowrap" }}>{fmtDate(r.bookingDate)}</td>
                            <td style={{ padding:"10px 14px",color:"#64748b",whiteSpace:"nowrap" }}>{r.bookingHour!=null?`${fmtHour(r.bookingHour)} – ${fmtHour((r.bookingHour||0)+(r.duration||2))}`:"—"}</td>
                            <td style={{ padding:"10px 14px",color:"#64748b" }}>{r.serviceType||"—"}</td>
                            <td style={{ padding:"10px 14px" }}>
                              <span style={{ display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:999,fontSize:10,fontWeight:700,background:`${statusColor[r.status]||"#94a3b8"}18`,color:statusColor[r.status]||"#94a3b8",border:`1.5px solid ${statusColor[r.status]||"#94a3b8"}40` }}>
                                {statusLabel[r.status]||r.status}
                              </span>
                            </td>
                            <td style={{ padding:"10px 14px",color:"#94a3b8",whiteSpace:"nowrap" }}>{fmtDate(r.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

        {/* Reclamations Tab */}
        {activeTab === "reclamations" && (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {/* Search & Filter Controls */}
            <div
              style={{
                background: "#f8fafc",
                borderBottom: "1.5px solid #e2e8f0",
                padding: "16px 20px",
                display: "grid",
                gridTemplateColumns: "1fr 0.8fr 0.8fr 0.8fr",
                gap: 12,
                alignItems: "center",
              }}
            >
              {/* Search */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#fff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Chercher par nom, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: "none",
                    background: "none",
                    outline: "none",
                    flex: 1,
                    fontSize: 12,
                    fontFamily: "Sora, sans-serif",
                    color: "#0f172e",
                  }}
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontFamily: "Sora, sans-serif",
                  background: "#fff",
                  color: "#0f172e",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <option value="all">Tous les statuts</option>
                <option value="new">Nouvelle</option>
                <option value="in_progress">En cours</option>
                <option value="resolved">Résolue</option>
              </select>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontFamily: "Sora, sans-serif",
                  background: "#fff",
                  color: "#0f172e",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <option value="all">Toutes les catégories</option>
                <option value="technical">Technique</option>
                <option value="support">Support</option>
                <option value="complaint">Réclamation</option>
                <option value="suggestion">Suggestion</option>
                <option value="billing">Facturation</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                style={{
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontFamily: "Sora, sans-serif",
                  background: "#fff",
                  color: "#0f172e",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <option value="all">Toutes les priorités</option>
                <option value="low">Basse</option>
                <option value="medium">Moyen</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            {/* Bulk Actions Bar */}
            {selectedRecIds.size > 0 && (
              <div
                style={{
                  background: "rgba(6, 182, 212, 0.1)",
                  borderBottom: "1.5px solid #e2e8f0",
                  padding: "12px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 13,
                  color: "#06b6d4",
                  fontWeight: 600,
                }}
              >
                <span>{selectedRecIds.size} sélectionnés</span>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  style={{
                    border: "1.5px solid #06b6d4",
                    borderRadius: 6,
                    padding: "6px 10px",
                    fontSize: 12,
                    fontFamily: "Sora, sans-serif",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Changer le statut...</option>
                  <option value="new">Nouvelle</option>
                  <option value="in_progress">En cours</option>
                  <option value="resolved">Résolue</option>
                </select>
                <button
                  onClick={handleBulkStatusChange}
                  disabled={!bulkStatus}
                  style={{
                    background: bulkStatus ? "#06b6d4" : "#cbd5e1",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    cursor: bulkStatus ? "pointer" : "not-allowed",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "Sora, sans-serif",
                  }}
                >
                  Appliquer
                </button>
                <button
                  onClick={() => setSelectedRecIds(new Set())}
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "Sora, sans-serif",
                  }}
                >
                  Annuler
                </button>
              </div>
            )}

            {/* Table Header */}
            <div
              style={{
                background: "#f8fafc",
                borderBottom: "1.5px solid #e2e8f0",
                padding: "16px 20px",
                display: "grid",
                gridTemplateColumns: "0.4fr 1fr 1.2fr 1.5fr 0.8fr 0.8fr",
                gap: 12,
                fontWeight: 700,
                fontSize: 11,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              <div style={{ display:"flex",justifyContent:"center" }}><CheckCircle size={13} color="#94a3b8"/></div>
              <div>Nom</div>
              <div>Email</div>
              <div>Message</div>
              <div>Statut</div>
              <div>Actions</div>
            </div>

            {/* Reclamations List */}
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                Chargement...
              </div>
            ) : filteredReclamations.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                {reclamations.length === 0 ? "Aucune réclamation" : "Aucun résultat trouvé"}
              </div>
            ) : (
              filteredReclamations.map((rec) => {
                const statusStyle = getStatusBadge(rec.status);
                const isExpanded = expandedId === `rec-${rec._id}`;
                const isSelected = selectedRecIds.has(rec._id);
                return (
                  <div key={rec._id}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "0.4fr 1fr 1.2fr 1.5fr 0.8fr 0.8fr",
                        gap: 12,
                        padding: "16px 20px",
                        borderBottom: "1.5px solid #f1f5f9",
                        alignItems: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        background: isExpanded ? "#f8fafc" : isSelected ? "rgba(6, 182, 212, 0.05)" : "#fff",
                      }}
                      onClick={() =>
                        setExpandedId(isExpanded ? null : `rec-${rec._id}`)
                      }
                    >
                      <div style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleRecSelection(rec._id);
                          }}
                          style={{ cursor: "pointer", width: 16, height: 16 }}
                        />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172e" }}>
                        {rec.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {rec.email}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {rec.message.substring(0, 30)}...
                        <ChevronDown
                          size={14}
                          style={{
                            marginLeft: "auto",
                            transform: isExpanded
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                            transition: "all 0.2s",
                          }}
                        />
                      </div>
                      <select
                        value={rec.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(rec._id, e.target.value);
                        }}
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          border: `1.5px solid ${statusStyle.text}`,
                          borderRadius: 6,
                          padding: "6px 10px",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "Sora, sans-serif",
                        }}
                      >
                        <option value="new">Nouvelle</option>
                        <option value="in_progress">En cours</option>
                        <option value="resolved">Résolue</option>
                      </select>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReclamation(rec._id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#ef4444",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Expanded Row */}
                    {isExpanded && (
                      <div
                        style={{
                          background: "#f8fafc",
                          borderBottom: "1.5px solid #f1f5f9",
                          padding: "20px",
                          borderLeft: "3px solid #06b6d4",
                        }}
                      >
                        <div style={{ maxWidth: 900 }}>
                          <div style={{ marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#94a3b8",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.1em",
                                  marginBottom: 6,
                                }}
                              >
                                Catégorie
                              </div>
                              <div style={{ fontSize: 13, color: "#0f172e", fontWeight: 600 }}>
                                {rec.category ? rec.category.charAt(0).toUpperCase() + rec.category.slice(1) : "N/A"}
                              </div>
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#94a3b8",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.1em",
                                  marginBottom: 6,
                                }}
                              >
                                Priorité
                              </div>
                              <select
                                value={rec.priority || "medium"}
                                onChange={(e) => {
                                  handleStatusChange(rec._id, rec.status, e.target.value);
                                }}
                                style={{
                                  border: "1.5px solid #e2e8f0",
                                  borderRadius: 6,
                                  padding: "6px 10px",
                                  fontSize: 12,
                                  fontFamily: "Sora, sans-serif",
                                  background: "#fff",
                                  cursor: "pointer",
                                }}
                              >
                                <option value="low">Basse</option>
                                <option value="medium">Moyen</option>
                                <option value="high">Haute</option>
                                <option value="urgent">Urgente</option>
                              </select>
                            </div>
                          </div>
                          
                          <div style={{ marginBottom: 20 }}>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#94a3b8",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                marginBottom: 6,
                              }}
                            >
                              Message Complet
                            </div>
                            <p
                              style={{
                                fontSize: 13,
                                color: "#64748b",
                                lineHeight: 1.8,
                                background: "#fff",
                                padding: 12,
                                borderRadius: 6,
                                border: "1.5px solid #e2e8f0",
                              }}
                            >
                              {rec.message}
                            </p>
                          </div>

                          {/* Admin Notes Section */}
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#94a3b8",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.1em",
                                }}
                              >
                                Notes Admin
                              </div>
                              {editingNote !== rec._id && (
                                <button
                                  onClick={() => {
                                    setEditingNote(rec._id);
                                    setNoteText(adminNotes[rec._id] || "");
                                  }}
                                  style={{
                                    background: "rgba(6, 182, 212, 0.1)",
                                    color: "#06b6d4",
                                    border: "1.5px solid #06b6d4",
                                    borderRadius: 4,
                                    padding: "4px 8px",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontFamily: "Sora, sans-serif",
                                  }}
                                >
                                  {adminNotes[rec._id] ? "Modifier" : "Ajouter"}
                                </button>
                              )}
                            </div>
                            {editingNote === rec._id ? (
                              <div style={{ display: "flex", gap: 8 }}>
                                <textarea
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                  placeholder="Ajouter une note..."
                                  style={{
                                    flex: 1,
                                    border: "1.5px solid #e2e8f0",
                                    borderRadius: 6,
                                    padding: 10,
                                    fontSize: 12,
                                    fontFamily: "Sora, sans-serif",
                                    color: "#0f172e",
                                    minHeight: 70,
                                    outline: "none",
                                  }}
                                />
                                <div style={{ display: "flex", gap: 6, flexDirection: "column" }}>
                                  <button
                                    onClick={() => saveAdminNote(rec._id)}
                                    style={{
                                      background: "#06b6d4",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: 4,
                                      padding: "6px 10px",
                                      fontSize: 11,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      fontFamily: "Sora, sans-serif",
                                    }}
                                  >
                                    Enregistrer
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingNote(null);
                                      setNoteText("");
                                    }}
                                    style={{
                                      background: "#f1f5f9",
                                      color: "#64748b",
                                      border: "none",
                                      borderRadius: 4,
                                      padding: "6px 10px",
                                      fontSize: 11,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      fontFamily: "Sora, sans-serif",
                                    }}
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                style={{
                                  background: "#fff",
                                  border: "1.5px solid #e2e8f0",
                                  borderRadius: 6,
                                  padding: 12,
                                  fontSize: 12,
                                  color: adminNotes[rec._id] ? "#0f172e" : "#94a3b8",
                                  minHeight: 50,
                                  fontStyle: adminNotes[rec._id] ? "normal" : "italic",
                                }}
                              >
                                {adminNotes[rec._id] || "Aucune note"}
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              fontSize: 11,
                              color: "#94a3b8",
                              display: "flex",
                              gap: 20,
                            }}
                          >
                            <span>
                              Reçu:{" "}
                              {new Date(rec.createdAt).toLocaleDateString("fr-FR")}
                            </span>
                            <span>
                              Mis à jour:{" "}
                              {new Date(rec.updatedAt).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Signals Tab */}
        {activeTab === "signals" && (
          <div style={{ background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,padding:24 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:18 }}>
              <h2 style={{ fontSize:18,fontWeight:700,color:"#0f172e",margin:0 }}>
                Signalements ({signals.filter(s => signalFilter === "all" ? true : s.status === signalFilter).length})
              </h2>
              <div style={{ display:"flex",gap:6 }}>
                {[
                  { key:"new",      label:"Nouveaux",  color:"#f59e0b" },
                  { key:"reviewed", label:"Traités",   color:"#22c55e" },
                  { key:"all",      label:"Tous",      color:"#64748b" },
                ].map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => setSignalFilter(key)}
                    style={{
                      padding:"6px 14px",
                      borderRadius:8,
                      fontSize:12,
                      fontWeight:700,
                      cursor:"pointer",
                      border: signalFilter === key ? "none" : "1.5px solid #e2e8f0",
                      background: signalFilter === key ? color : "#f8fafc",
                      color: signalFilter === key ? "#fff" : "#64748b",
                      transition:"all .15s",
                    }}
                  >
                    {label}
                    {key !== "all" && (
                      <span style={{ marginLeft:6,background: signalFilter === key ? "rgba(255,255,255,0.3)" : "#e2e8f0",color: signalFilter === key ? "#fff" : "#64748b",borderRadius:10,padding:"1px 6px",fontSize:10 }}>
                        {signals.filter(s => s.status === key).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <p style={{ color:"#94a3b8",fontSize:13 }}>Chargement…</p>
            ) : signals.filter(s => signalFilter === "all" ? true : s.status === signalFilter).length === 0 ? (
              <div style={{ textAlign:"center",padding:"40px 20px",color:"#94a3b8" }}>
                <Flag size={36} color="#e2e8f0" style={{ marginBottom:12 }}/>
                <p style={{ fontSize:13,fontWeight:500,margin:0 }}>
                  {signalFilter === "new" ? "Aucun nouveau signalement." : signalFilter === "reviewed" ? "Aucun signalement traité." : "Aucun signalement pour le moment."}
                </p>
                {signalFilter === "new" && <p style={{ fontSize:11,marginTop:6 }}>Les signalements apparaissent quand un client signale un prestataire après une réservation terminée.</p>}
              </div>
            ) : (
              <div style={{ display:"grid",gap:12 }}>
                {signals.filter(s => signalFilter === "all" ? true : s.status === signalFilter).map((s) => {
                  const reasonLabels = { mauvais_travail:"Mauvais travail", comportement:"Comportement", non_venu:"Non venu", autre:"Autre" };
                  const res = s.reservationId;
                  const workerShowed = res?.serviceStartedAt ? true : false;
                  const bookingDate = res?.bookingDate ? new Date(res.bookingDate).toLocaleDateString("fr-FR") : "-";
                  const bookingTime = res?.bookingHour ? `${String(res.bookingHour).padStart(2,"0")}:00` : "-";
                  const serviceStartTime = res?.serviceStartedAt ? new Date(res.serviceStartedAt).toLocaleString("fr-FR") : "-";
                  const clientEmail = s.clientId?.email || "";
                  const workerEmail = s.workerId?.email || "";
                  const workerId = s.workerId?._id || s.workerId;
                  const workerName = s.workerName || s.workerId?.firstName || "prestataire";
                  const workerWarnings = Number(s.workerId?.warningCount || 0);
                  const mailSubject = "Servigo - Signalement de réservation";
                  const mailBody = `Bonjour ${s.clientName || "client"},\n\nNous avons bien reçu votre signalement concernant la réservation du ${bookingDate} à ${bookingTime}.\n\nMerci de votre message.`;
                  const reviewedNoShow = s.status === "reviewed" && !workerShowed;
                  const reportOutcome = workerShowed ? "Le prestataire a démarré le service" : "Aucun démarrage de service enregistré";
                  return (
                    <div key={s._id} style={{ border:"1.5px solid #e2e8f0",borderRadius:12,padding:16,background:"#fff" }}>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr auto",gap:14,alignItems:"start" }}>
                        <div>
                          <div style={{ display:"flex",flexWrap:"wrap",alignItems:"center",gap:8,marginBottom:6 }}>
                            <div style={{ fontSize:14,fontWeight:800,color:"#0f172e" }}>
                              {s.clientName || "Client"} → {workerName}
                            </div>
                          </div>

                          <div style={{ fontSize:12,color:"#64748b",marginBottom:8,lineHeight:1.6 }}>
                            Signalement par <strong>{s.clientName || "Client"}</strong> contre <strong>{workerName}</strong>
                            {s.serviceType && ` · Service : ${s.serviceType}`}
                            <br />
                            Motif : <strong>{reasonLabels[s.reason] || s.reason}</strong>
                          </div>

                          <div style={{ display:"grid",gap:10,marginBottom:10 }}>
                            <div style={{ border:`1.5px solid ${workerShowed ? "#bbf7d0" : "#fecaca"}`,background:workerShowed ? "#f0fdf4" : "#fef2f2",borderRadius:10,padding:12 }}>
                              <div style={{ fontSize:11,fontWeight:800,color:workerShowed ? "#15803d" : "#b91c1c",marginBottom:4 }}>
                                {reportOutcome}
                              </div>
                              <div style={{ fontSize:11,color:"#64748b",lineHeight:1.6 }}>
                                <div>Réservation : {bookingDate} à {bookingTime}</div>
                                {workerShowed && <div>Service commencé : {serviceStartTime}</div>}
                                {!workerShowed && <div>Le prestataire n’a pas de démarrage enregistré.</div>}
                              </div>
                            </div>

                            {s.message && (
                              <div style={{ fontSize:12,color:"#334155",background:"#f8fafc",borderRadius:10,padding:"10px 12px",border:"1px solid #e2e8f0" }}>
                                {s.message}
                              </div>
                            )}
                          </div>

                          <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
                            <span style={{ fontSize:11,color:"#94a3b8" }}>Signalé le {new Date(s.createdAt).toLocaleDateString("fr-FR",{ day:"2-digit",month:"short",year:"numeric" })}</span>
                            {clientEmail && (
                              <a
                                href={`mailto:${clientEmail}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`}
                                style={{
                                  textDecoration:"none",
                                  background:"rgba(6,182,212,0.1)",
                                  color:"#0891b2",
                                  border:"1.5px solid rgba(6,182,212,0.25)",
                                  borderRadius:8,
                                  padding:"7px 12px",
                                  fontSize:12,
                                  fontWeight:700,
                                }}
                              >
                                Contacter
                              </a>
                            )}
                            <button
                              onClick={async () => {
                                try {
                                  if (s.warningApplied) return;
                                  const updated = await adminApi.updateSignalStatus(s._id, {
                                    status: "reviewed",
                                    verified: true,
                                    adminNotes: workerShowed ? "Signalement validé par l'administration" : "Signalement validé: no-show confirmé",
                                  });
                                  setSignals(prev => prev.map(x => x._id === s._id ? updated : x));
                                  loadAllData();
                                } catch (err) {
                                  openInfoDialog({ title: "Erreur", message: "Erreur: " + (err.message || "Action impossible") });
                                }
                              }}
                              style={{
                                background:s.warningApplied ? "#f8fafc" : "#22c55e",
                                color:s.warningApplied ? "#94a3b8" : "#fff",
                                border:"none",
                                borderRadius:8,
                                padding:"7px 12px",
                                fontSize:12,
                                fontWeight:700,
                                cursor:s.warningApplied ? "not-allowed" : "pointer",
                              }}
                              disabled={s.warningApplied}
                            >
                              {s.warningApplied ? "Validé" : "Valider"}
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await adminApi.deleteSignal(s._id);
                                  setSignals(prev => prev.filter(x => x._id !== s._id));
                                  loadAllData();
                                } catch (err) {
                                  openInfoDialog({ title: "Erreur", message: "Erreur: " + (err.message || "Action impossible") });
                                }
                              }}
                              style={{
                                background:"#f8fafc",
                                color:"#334155",
                                border:"1.5px solid #e2e8f0",
                                borderRadius:8,
                                padding:"7px 12px",
                                fontSize:12,
                                fontWeight:700,
                                cursor:"pointer",
                              }}
                            >
                              Ignorer
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await adminApi.banWorker(workerId, `Suspension manuelle après signalement: ${s.reason}`);
                                  loadAllData();
                                } catch (err) {
                                  openInfoDialog({ title: "Erreur", message: "Erreur: " + (err.message || "Action impossible") });
                                }
                              }}
                              style={{
                                background:"#ef4444",
                                color:"#fff",
                                border:"none",
                                borderRadius:8,
                                padding:"7px 12px",
                                fontSize:12,
                                fontWeight:700,
                                cursor:"pointer",
                              }}
                            >
                              Bannir
                            </button>
                          </div>
                        </div>
                        <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8 }}>
                          <div style={{ fontSize:11,color:"#94a3b8",display:"flex",alignItems:"center",gap:4 }}><AlertCircle size={11}/> {workerWarnings} avertissements</div>
                          {workerWarnings > 0 && (
                            <button
                              onClick={async () => {
                                try {
                                  await adminApi.resetWorkerWarnings(workerId);
                                  loadAllData();
                                } catch (err) {
                                  openInfoDialog({ title: "Erreur", message: "Erreur: " + (err.message || "Action impossible") });
                                }
                              }}
                              style={{
                                display:"inline-flex",
                                alignItems:"center",
                                gap:6,
                                background:"#ecfeff",
                                color:"#0f766e",
                                border:"1.5px solid #a5f3fc",
                                borderRadius:8,
                                padding:"6px 10px",
                                fontSize:11,
                                fontWeight:700,
                                cursor:"pointer",
                              }}
                            >
                              <RefreshCcw size={12} /> Réinitialiser
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === "users" && (() => {
          const clients = users.filter(u => u.role === "client");
          const filteredClients = clients
            .filter(u => clientStatusFilter === "all" ? true : clientStatusFilter === "active" ? u.isActive : !u.isActive)
            .filter(u => {
              if (!clientSearch.trim()) return true;
              const q = clientSearch.toLowerCase();
              return (
                (u.firstName || "").toLowerCase().includes(q) ||
                (u.lastName  || "").toLowerCase().includes(q) ||
                (u.email     || "").toLowerCase().includes(q) ||
                (u.phone     || "").toLowerCase().includes(q)
              );
            });
          return (
            <div style={{ background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,overflow:"hidden" }}>
              {/* Toolbar */}
              <div style={{ background:"#f8fafc",borderBottom:"1.5px solid #e2e8f0",padding:"12px 20px",display:"flex",flexWrap:"wrap",alignItems:"center",gap:10 }}>
                <Users size={14} color="#3b82f6" />
                <span style={{ fontSize:13,fontWeight:700,color:"#0f172e" }}>
                  {filteredClients.length} / {clients.length} client{clients.length !== 1 ? "s" : ""}
                </span>
                <div style={{ flex:1 }}/>
                {/* Status filter pills */}
                <div style={{ display:"flex",gap:6 }}>
                  {[
                    { key:"all",      label:"Tous" },
                    { key:"active",   label:"Actifs" },
                    { key:"inactive", label:"Inactifs" },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setClientStatusFilter(key)}
                      style={{ padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",
                        background: clientStatusFilter === key ? "#3b82f6" : "#e2e8f0",
                        color:      clientStatusFilter === key ? "#fff"    : "#64748b",
                        transition:"all .15s" }}>
                      {label}
                    </button>
                  ))}
                </div>
                {/* Search */}
                <div style={{ position:"relative" }}>
                  <Search size={13} style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"#94a3b8" }}/>
                  <input type="text" placeholder="Nom, email, téléphone…" value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    style={{ border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 10px 7px 28px",fontSize:12,fontFamily:"Sora,sans-serif",background:"#fff",width:210,outline:"none" }}/>
                </div>
              </div>

              {/* Table header */}
              <div style={{ background:"#f8fafc",borderBottom:"1.5px solid #e2e8f0",padding:"11px 20px",display:"grid",gridTemplateColumns:"1.2fr 1.4fr 1fr 0.8fr 1fr 0.5fr",gap:16,fontWeight:700,fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.1em" }}>
                <div>Nom</div><div>Email</div><div>Téléphone</div><div>Statut</div><div>Inscrit le</div><div>Actions</div>
              </div>

              {loading ? (
                <div style={{ padding:40,textAlign:"center",color:"#94a3b8" }}>Chargement…</div>
              ) : filteredClients.length === 0 ? (
                <div style={{ padding:40,textAlign:"center",color:"#94a3b8" }}>
                  {clientSearch || clientStatusFilter !== "all" ? "Aucun résultat pour cette recherche." : "Aucun client."}
                </div>
              ) : (
                filteredClients.map(user => (
                  <div key={user._id} style={{ display:"grid",gridTemplateColumns:"1.2fr 1.4fr 1fr 0.8fr 1fr 0.5fr",gap:16,padding:"14px 20px",borderBottom:"1.5px solid #f1f5f9",alignItems:"center",fontSize:13,color:"#0f172e" }}>
                    <div style={{ fontWeight:600 }}>{user.firstName} {user.lastName}</div>
                    <div style={{ color:"#64748b",fontSize:12 }}>{user.email}</div>
                    <div style={{ color:"#64748b",fontSize:12 }}>{user.phone || "—"}</div>
                    <div style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,color:user.isActive?"#10b981":"#ef4444" }}>
                      {user.isActive ? <><Eye size={13}/> Actif</> : <><EyeOff size={13}/> Inactif</>}
                    </div>
                    <div style={{ color:"#94a3b8",fontSize:12 }}>
                      {new Date(user.createdAt).toLocaleDateString("fr-FR",{ day:"2-digit",month:"short",year:"numeric" })}
                    </div>
                    <button onClick={() => handleDeleteUser(user._id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Trash2 size={16}/>
                    </button>
                  </div>
                ))
              )}
            </div>
          );
        })()}

        {/* Workers / Prestataires Tab */}
        {activeTab === "workers" && (() => {
          const workers = users.filter(u => u.role === "worker");
          const filteredWorkers = workers
            .filter(u => workerStatusFilter === "all" ? true : workerStatusFilter === "active" ? u.isActive : !u.isActive)
            .filter(u => workerVerifFilter === "all" ? true : (u.workerVerification?.status || "not_submitted") === workerVerifFilter)
            .filter(u => {
              if (!workerSearch.trim()) return true;
              const q = workerSearch.toLowerCase();
              return (
                (u.firstName || "").toLowerCase().includes(q) ||
                (u.lastName  || "").toLowerCase().includes(q) ||
                (u.email     || "").toLowerCase().includes(q)
              );
            });
          return (
            <div style={{ background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,overflow:"hidden" }}>
              {/* Toolbar */}
              <div style={{ background:"#f8fafc",borderBottom:"1.5px solid #e2e8f0",padding:"12px 20px",display:"flex",flexWrap:"wrap",alignItems:"center",gap:10 }}>
                <Briefcase size={14} color="#f59e0b"/>
                <span style={{ fontSize:13,fontWeight:700,color:"#0f172e" }}>
                  {filteredWorkers.length} / {workers.length} prestataire{workers.length !== 1 ? "s" : ""}
                </span>
                {workers.filter(w => w.workerVerification?.status === "pending").length > 0 && (
                  <span style={{ background:"rgba(245,158,11,0.12)",color:"#b45309",borderRadius:999,padding:"3px 10px",fontSize:11,fontWeight:700 }}>
                    {workers.filter(w => w.workerVerification?.status === "pending").length} en attente
                  </span>
                )}
                <div style={{ flex:1 }}/>
                {/* Verification filter */}
                <select value={workerVerifFilter} onChange={e => setWorkerVerifFilter(e.target.value)}
                  style={{ border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:12,fontFamily:"Sora,sans-serif",background:"#fff",cursor:"pointer",outline:"none" }}>
                  <option value="all">Toutes vérifications</option>
                  <option value="pending">En attente</option>
                  <option value="approved">Approuvés</option>
                  <option value="rejected">Refusés</option>
                  <option value="not_submitted">Non soumis</option>
                </select>
                {/* Status filter pills */}
                <div style={{ display:"flex",gap:6 }}>
                  {[
                    { key:"all",      label:"Tous" },
                    { key:"active",   label:"Actifs" },
                    { key:"inactive", label:"Inactifs" },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setWorkerStatusFilter(key)}
                      style={{ padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",
                        background: workerStatusFilter === key ? "#f59e0b" : "#e2e8f0",
                        color:      workerStatusFilter === key ? "#fff"    : "#64748b",
                        transition:"all .15s" }}>
                      {label}
                    </button>
                  ))}
                </div>
                {/* Search */}
                <div style={{ position:"relative" }}>
                  <Search size={13} style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"#94a3b8" }}/>
                  <input type="text" placeholder="Nom ou email…" value={workerSearch}
                    onChange={e => setWorkerSearch(e.target.value)}
                    style={{ border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 10px 7px 28px",fontSize:12,fontFamily:"Sora,sans-serif",background:"#fff",width:200,outline:"none" }}/>
                </div>
              </div>

              {/* Table header */}
              <div style={{ background:"#f8fafc",borderBottom:"1.5px solid #e2e8f0",padding:"11px 20px",display:"grid",gridTemplateColumns:"1.1fr 1.3fr 0.8fr 1.5fr 1fr 0.5fr",gap:16,fontWeight:700,fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.1em" }}>
                <div>Nom</div><div>Email</div><div>Statut</div><div>Vérification</div><div>Avertissements</div><div>Actions</div>
              </div>

              {loading ? (
                <div style={{ padding:40,textAlign:"center",color:"#94a3b8" }}>Chargement…</div>
              ) : filteredWorkers.length === 0 ? (
                <div style={{ padding:40,textAlign:"center",color:"#94a3b8" }}>
                  {workerSearch || workerVerifFilter !== "all" || workerStatusFilter !== "all" ? "Aucun résultat pour cette recherche." : "Aucun prestataire."}
                </div>
              ) : (
                filteredWorkers.map(user => {
                  const verification = user.workerVerification || {};
                  const badge = getVerificationBadge(verification.status || "not_submitted");
                  return (
                    <div key={user._id} style={{ display:"grid",gridTemplateColumns:"1.1fr 1.3fr 0.8fr 1.5fr 1fr 0.5fr",gap:16,padding:"14px 20px",borderBottom:"1.5px solid #f1f5f9",alignItems:"center",fontSize:13,color:"#0f172e" }}>
                      <div style={{ fontWeight:600 }}>{user.firstName} {user.lastName}</div>
                      <div style={{ color:"#64748b",fontSize:12 }}>{user.email}</div>
                      <div style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,color:user.isActive?"#10b981":"#ef4444" }}>
                        {user.isActive ? <><Eye size={13}/> Actif</> : <><EyeOff size={13}/> Inactif</>}
                      </div>
                      <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                        <span style={{ background:badge.bg,color:badge.text,padding:"5px 9px",borderRadius:6,fontSize:11,fontWeight:700,width:"fit-content" }}>
                          {badge.label}
                        </span>
                        <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                          {verification.cinDocumentUrl && (
                            <a href={`http://localhost:5000${verification.cinDocumentUrl}`} target="_blank" rel="noreferrer"
                              style={{ fontSize:11,color:"#06b6d4",textDecoration:"none",fontWeight:600 }}>Voir CIN</a>
                          )}
                          {verification.certificationDocumentUrl && (
                            <a href={`http://localhost:5000${verification.certificationDocumentUrl}`} target="_blank" rel="noreferrer"
                              style={{ fontSize:11,color:"#06b6d4",textDecoration:"none",fontWeight:600 }}>Voir certificat</a>
                          )}
                        </div>
                        {verification.status !== "approved" && verification.cinDocumentUrl && verification.certificationDocumentUrl && (
                          <div style={{ display:"flex",gap:6 }}>
                            <button onClick={() => reviewWorkerVerification(user._id, "approved")}
                              style={{ border:"1px solid rgba(34,197,94,0.35)",background:"rgba(34,197,94,0.1)",color:"#15803d",borderRadius:6,fontSize:11,fontWeight:700,padding:"5px 8px",cursor:"pointer" }}>
                              Approuver
                            </button>
                            <button onClick={() => reviewWorkerVerification(user._id, "rejected")}
                              style={{ border:"1px solid rgba(239,68,68,0.35)",background:"rgba(239,68,68,0.1)",color:"#b91c1c",borderRadius:6,fontSize:11,fontWeight:700,padding:"5px 8px",cursor:"pointer" }}>
                              Refuser
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <span style={{ background:Number(user.warningCount||0)>=3?"#fef2f2":Number(user.warningCount||0)>0?"#fef3c7":"#f0fdf4",color:Number(user.warningCount||0)>=3?"#b91c1c":Number(user.warningCount||0)>0?"#b45309":"#15803d",padding:"5px 9px",borderRadius:999,fontSize:11,fontWeight:800,display:"inline-flex",alignItems:"center",gap:5 }}>
                          {Number(user.warningCount||0)>=1
                            ? <><AlertCircle size={11}/> {user.warningCount} avertissements</>
                            : <><CheckCircle size={11}/> 0 avertissement</>}
                        </span>
                      </div>
                      <button onClick={() => handleDeleteUser(user._id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center" }}>
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          );
        })()}

        {/* Banned Users Tab */}
        {activeTab === "banned" && (() => {
          const bannedUsers = users.filter(u =>
            !u.isActive || (u.role === "worker" && u.workerStatus === "suspended")
          );
          const filtered = bannedUsers
            .filter(u => bannedRoleFilter === "all" || u.role === bannedRoleFilter)
            .filter(u => {
              if (!bannedSearch.trim()) return true;
              const q = bannedSearch.toLowerCase();
              return (
                (u.firstName || "").toLowerCase().includes(q) ||
                (u.lastName  || "").toLowerCase().includes(q) ||
                (u.email     || "").toLowerCase().includes(q)
              );
            });
          return (
            <div style={{ background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,overflow:"hidden" }}>
              {/* Header */}
              <div style={{ background:"#fef2f2",borderBottom:"1.5px solid #fecaca",padding:"14px 20px",display:"flex",flexWrap:"wrap",gap:12,alignItems:"center" }}>
                <UserX size={16} color="#ef4444" />
                <span style={{ fontSize:13,fontWeight:700,color:"#b91c1c" }}>
                  {bannedUsers.length} utilisateur{bannedUsers.length !== 1 ? "s" : ""} banni{bannedUsers.length !== 1 ? "s" : ""}
                </span>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginLeft:"auto",flexWrap:"wrap" }}>
                  {/* Role filter */}
                  <select
                    value={bannedRoleFilter}
                    onChange={e => setBannedRoleFilter(e.target.value)}
                    style={{ border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:12,fontFamily:"Sora,sans-serif",background:"#fff",cursor:"pointer" }}
                  >
                    <option value="all">Tous les rôles</option>
                    <option value="client">Clients</option>
                    <option value="worker">Prestataires</option>
                  </select>
                  {/* Search */}
                  <div style={{ position:"relative" }}>
                    <Search size={13} style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"#94a3b8" }} />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={bannedSearch}
                      onChange={e => setBannedSearch(e.target.value)}
                      style={{ border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 10px 7px 28px",fontSize:12,fontFamily:"Sora,sans-serif",background:"#fff",width:180,outline:"none" }}
                    />
                  </div>
                </div>
              </div>

              {/* Table header */}
              <div style={{ background:"#f8fafc",borderBottom:"1.5px solid #e2e8f0",padding:"12px 20px",display:"grid",gridTemplateColumns:"1.2fr 1.4fr 0.8fr 1.1fr 1fr 1fr",gap:14,fontWeight:700,fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.1em" }}>
                <div>Nom</div>
                <div>Email</div>
                <div>Rôle</div>
                <div>Raison du ban</div>
                <div>Date</div>
                <div>Actions</div>
              </div>

              {/* Rows */}
              {loading ? (
                <div style={{ padding:40,textAlign:"center",color:"#94a3b8" }}>Chargement…</div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign:"center",padding:"48px 20px",color:"#94a3b8" }}>
                  <UserX size={36} color="#e2e8f0" style={{ marginBottom:12 }} />
                  <p style={{ fontSize:13,fontWeight:500,margin:0 }}>
                    {bannedSearch || bannedRoleFilter !== "all" ? "Aucun résultat pour cette recherche." : "Aucun utilisateur banni pour le moment."}
                  </p>
                </div>
              ) : (
                filtered.map(u => {
                  const isSuspended = u.role === "worker" && u.workerStatus === "suspended";
                  const isInactive  = !u.isActive;
                  const banDate = isSuspended && u.bannedAt
                    ? new Date(u.bannedAt).toLocaleDateString("fr-FR",{ day:"2-digit",month:"short",year:"numeric" })
                    : isInactive
                    ? new Date(u.updatedAt || u.createdAt).toLocaleDateString("fr-FR",{ day:"2-digit",month:"short",year:"numeric" })
                    : "—";
                  const roleStyle = getRoleBadge(u.role, u.workerVerification?.status || "not_submitted");
                  return (
                    <div key={u._id} style={{ display:"grid",gridTemplateColumns:"1.2fr 1.4fr 0.8fr 1.1fr 1fr 1fr",gap:14,padding:"14px 20px",borderBottom:"1.5px solid #f1f5f9",alignItems:"center",fontSize:13,color:"#0f172e" }}>
                      <div style={{ fontWeight:700 }}>{u.firstName} {u.lastName}</div>
                      <div style={{ color:"#64748b",fontSize:12,wordBreak:"break-all" }}>{u.email}</div>
                      <div>
                        <span style={{ background:roleStyle.bg,color:roleStyle.text,padding:"5px 9px",borderRadius:6,fontSize:11,fontWeight:700 }}>
                          {roleStyle.label}
                        </span>
                      </div>
                      <div style={{ fontSize:12 }}>
                        {isSuspended ? (
                          <div>
                            <span style={{ background:"#fef2f2",color:"#b91c1c",padding:"4px 8px",borderRadius:6,fontSize:11,fontWeight:700,display:"inline-block",marginBottom:4 }}>
                              Suspendu
                            </span>
                            {u.banReason && <div style={{ color:"#64748b",fontSize:11,marginTop:2 }}>{u.banReason}</div>}
                          </div>
                        ) : isInactive ? (
                          <span style={{ background:"#fef3c7",color:"#b45309",padding:"4px 8px",borderRadius:6,fontSize:11,fontWeight:700 }}>
                            Compte désactivé
                          </span>
                        ) : "—"}
                      </div>
                      <div style={{ color:"#64748b",fontSize:12 }}>{banDate}</div>
                      <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                        {isSuspended && (
                          <button
                            onClick={async () => {
                              if (!(await openConfirmDialog({ title: "Débannir le compte", message: `Débannir ${u.firstName} ${u.lastName} ?`, confirmText: "Débannir", danger: true }))) return;
                              try {
                                await adminApi.unbanWorker(u._id);
                                setUsers(prev => prev.map(x => x._id === u._id ? { ...x, workerStatus:"active", bannedAt:null, banReason:"" } : x));
                              } catch(err) { openInfoDialog({ title: "Erreur", message: "Erreur: " + (err.message || "Action impossible") }); }
                            }}
                            style={{ background:"#22c55e",color:"#fff",border:"none",borderRadius:7,padding:"6px 11px",fontSize:11,fontWeight:700,cursor:"pointer" }}
                          >
                            Débannir
                          </button>
                        )}
                        {isInactive && (
                          <button
                            onClick={async () => {
                              if (!(await openConfirmDialog({ title: "Réactiver le compte", message: `Réactiver le compte de ${u.firstName} ${u.lastName} ?`, confirmText: "Réactiver", danger: false }))) return;
                              try {
                                await adminApi.toggleUserStatus(u._id);
                                setUsers(prev => prev.map(x => x._id === u._id ? { ...x, isActive:true } : x));
                              } catch(err) { openInfoDialog({ title: "Erreur", message: "Erreur: " + (err.message || "Action impossible") }); }
                            }}
                            style={{ background:"#06b6d4",color:"#fff",border:"none",borderRadius:7,padding:"6px 11px",fontSize:11,fontWeight:700,cursor:"pointer" }}
                          >
                            Réactiver
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!(await openConfirmDialog({ title: "Supprimer définitivement", message: `Supprimer définitivement le compte de ${u.firstName} ${u.lastName} ? Cette action est irréversible.`, confirmText: "Supprimer", danger: true }))) return;
                            try {
                              await adminApi.deleteUser(u._id);
                              setUsers(prev => prev.filter(x => x._id !== u._id));
                            } catch(err) { openInfoDialog({ title: "Erreur", message: "Erreur: " + (err.message || "Action impossible") }); }
                          }}
                          style={{ background:"none",border:"1.5px solid #fecaca",borderRadius:7,padding:"6px 10px",fontSize:11,fontWeight:700,color:"#ef4444",cursor:"pointer" }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })()}

        {/* Activity Log Tab */}
        {activeTab === "activity" && (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {/* Timeline */}
            <div style={{ padding: 20 }}>
              {activityLog.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                  Aucune activité
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  {activityLog.map((entry, idx) => (
                    <div
                      key={entry.id}
                      style={{
                        display: "flex",
                        gap: 16,
                        marginBottom: idx < activityLog.length - 1 ? 20 : 0,
                        position: "relative",
                      }}
                    >
                      {/* Timeline dot */}
                      <div
                        style={{
                          position: "relative",
                          width: 32,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: "#06b6d4",
                            border: "3px solid #fff",
                            boxShadow: "0 0 0 3px rgba(6, 182, 212, 0.2)",
                          }}
                        />
                        {idx < activityLog.length - 1 && (
                          <div
                            style={{
                              width: 2,
                              flex: 1,
                              background: "#e2e8f0",
                              marginTop: 12,
                              marginBottom: 12,
                            }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, paddingTop: 2 }}>
                        <div
                          style={{
                            background: "#f8fafc",
                            border: "1.5px solid #e2e8f0",
                            borderRadius: 8,
                            padding: 12,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172e" }}>
                              {entry.admin}
                            </span>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>
                              {entry.timestamp}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                            {entry.action}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </main>
      </div>

      {dialog && (
        <div
          style={{ position:"fixed", inset:0, background:"rgba(15,23,46,0.55)", zIndex:4000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={() => dialog.type === "info" && closeDialog(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width:"100%", maxWidth:420, background:"#fff", borderRadius:16, border:"1.5px solid #e2e8f0", boxShadow:"0 24px 70px rgba(0,0,0,0.22)", overflow:"hidden", fontFamily:"'Sora',sans-serif" }}
          >
            <div style={{ padding:"18px 20px", background: dialog.type === "confirm" ? "#0f172e" : "#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
              <div style={{ fontSize:15, fontWeight:800, color: dialog.type === "confirm" ? "#fff" : "#0f172e" }}>{dialog.title}</div>
            </div>
            <div style={{ padding:"18px 20px", color:"#334155", fontSize:13, lineHeight:1.7 }}>
              {dialog.message}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", padding:"0 20px 20px" }}>
              {dialog.type === "confirm" && (
                <button
                  onClick={() => closeDialog(false)}
                  style={{ padding:"10px 16px", borderRadius:10, border:"1.5px solid #e2e8f0", background:"#fff", color:"#64748b", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Sora',sans-serif" }}
                >
                  {dialog.cancelText || "Annuler"}
                </button>
              )}
              <button
                onClick={() => {
                  if (dialog.type === "confirm") {
                    closeDialog(true);
                    return;
                  }
                  closeDialog(false);
                }}
                style={{
                  padding:"10px 16px",
                  borderRadius:10,
                  border:"none",
                  background: dialog.type === "confirm" && dialog.danger ? "#ef4444" : "#06b6d4",
                  color:"#fff",
                  fontSize:12,
                  fontWeight:700,
                  cursor:"pointer",
                  fontFamily:"'Sora',sans-serif",
                }}
              >
                {dialog.type === "confirm" ? (dialog.confirmText || "OK") : "Fermer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
