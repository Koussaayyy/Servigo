// AdminDashboard.jsx - Admin dashboard with Servigo design system
import { useState, useEffect } from "react";
import {
  LogOut,
  LayoutDashboard,
  AlertCircle,
  Users,
  MessageSquare,
  Trash2,
  ChevronDown,
  Eye,
  EyeOff,
  Search,
  TrendingUp,
  Clock,
} from "lucide-react";
import { adminApi } from "../api";

export default function AdminDashboard({ admin, onLogout }) {
  const [activeTab, setActiveTab] = useState("reclamations");
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
  const [filterUserRole, setFilterUserRole] = useState("all");

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
      const [reclamationsData, usersData, statsData] = await Promise.all([
        adminApi.getReclamations(),
        adminApi.getUsers(),
        adminApi.getStats(),
      ]);
      
      setReclamations(Array.isArray(reclamationsData) ? reclamationsData : reclamationsData.reclamations || []);
      setUsers(Array.isArray(usersData) ? usersData : usersData.users || []);
      setStats(statsData);
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
    const entry = {
      id: Date.now(),
      action,
      recId,
      admin: admin?.firstName,
      timestamp: new Date().toLocaleTimeString("fr-FR"),
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
    if (!window.confirm("Supprimer cette réclamation ?")) return;
    try {
      await adminApi.deleteReclamation(reclamationId);
      setReclamations((prev) => prev.filter((r) => r._id !== reclamationId));
    } catch (err) {
      setError(err.message || "Erreur lors de la suppression");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    try {
      await adminApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      setError(err.message || "Erreur lors de la suppression");
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

  const getRoleBadge = (role) => {
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

  const statsArray = [
    {
      label: "Total Réclamations",
      value: stats?.reclamations?.total || 0,
      color: "#06b6d4",
      icon: MessageSquare,
      subtitle: `Avg: ${stats?.reclamations?.avgResolutionTime || 0}j`,
    },
    {
      label: "Nouvelles",
      value: stats?.reclamations?.new || 0,
      color: "#3b82f6",
      icon: AlertCircle,
      subtitle: "En attente",
    },
    {
      label: "En cours",
      value: stats?.reclamations?.inProgress || 0,
      color: "#f59e0b",
      icon: Clock,
      subtitle: "Traitement",
    },
    {
      label: "Résolues",
      value: stats?.reclamations?.resolved || 0,
      color: "#10b981",
      icon: TrendingUp,
      subtitle: "Complétées",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Sora, sans-serif" }}>
      {/* Header */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1.5px solid #e2e8f0",
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(6, 182, 212, 0.1)",
              border: "1.5px solid rgba(6, 182, 212, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 800,
              color: "#06b6d4",
            }}
          >
            S
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172e" }}>
              Servigo Admin
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Tableau de bord</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0f172e",
              }}
            >
              {admin?.firstName} {admin?.lastName}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {admin?.email}
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("adminToken");
              localStorage.removeItem("admin");
              onLogout?.();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1.5px solid rgba(239, 68, 68, 0.25)",
              color: "#ef4444",
              borderRadius: 8,
              padding: "9px 14px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: "28px", maxWidth: 1400, margin: "0 auto" }}>
        {/* Title */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <LayoutDashboard size={24} color="#06b6d4" />
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172e" }}>
              Tableau de bord
            </h1>
          </div>
          <p style={{ fontSize: 14, color: "#64748b" }}>
            Gérez les réclamations, utilisateurs et artisans de la plateforme
          </p>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
            marginBottom: 32,
          }}
        >
          {statsArray.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                style={{
                  background: "#fff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 28,
                  transition: "all 0.3s",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 16px rgba(6, 182, 212, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: `rgba(${
                      stat.color === "#06b6d4"
                        ? "6, 182, 212"
                        : stat.color === "#3b82f6"
                        ? "59, 130, 246"
                        : stat.color === "#f59e0b"
                        ? "245, 158, 11"
                        : "16, 185, 129"
                    }, 0.05)`,
                  }}
                />

                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 16,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {stat.label}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 12,
                    marginBottom: 16,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: 800,
                      color: stat.color,
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    marginBottom: 12,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {stat.subtitle}
                </div>

                <div
                  style={{
                    height: 4,
                    background: "#e2e8f0",
                    borderRadius: 2,
                    overflow: "hidden",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: "100%",
                      background: stat.color,
                      borderRadius: 2,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(220, 38, 38, 0.1)",
              border: "1.5px solid rgba(220, 38, 38, 0.25)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              color: "#b91c1c",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            borderBottom: "1.5px solid #e2e8f0",
            background: "#fff",
            borderRadius: "12px 12px 0 0",
            padding: "0 20px",
          }}
        >
          {[
            { id: "reclamations", label: "Réclamations", icon: MessageSquare },
            { id: "users", label: "Utilisateurs", icon: Users },
            { id: "activity", label: "Activité", icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 16px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: activeTab === tab.id ? "#06b6d4" : "#64748b",
                  borderBottom: activeTab === tab.id ? "2px solid #06b6d4" : "none",
                  transition: "all 0.2s",
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

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
              <div style={{ textAlign: "center" }}>✓</div>
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

        {/* Users Tab */}
        {activeTab === "users" && (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {/* Role Filter */}
            <div
              style={{
                background: "#f8fafc",
                borderBottom: "1.5px solid #e2e8f0",
                padding: "12px 20px",
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                Filtrer par rôle:
              </span>
              <select
                value={filterUserRole}
                onChange={(e) => setFilterUserRole(e.target.value)}
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
                <option value="all">Tous les rôles</option>
                <option value="client">Client</option>
                <option value="worker">Artisan</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Table Header */}
            <div
              style={{
                background: "#f8fafc",
                borderBottom: "1.5px solid #e2e8f0",
                padding: "16px 20px",
                display: "grid",
                gridTemplateColumns: "1fr 1.2fr 0.8fr 0.8fr 0.6fr",
                gap: 16,
                fontWeight: 700,
                fontSize: 11,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              <div>Nom</div>
              <div>Email</div>
              <div>Rôle</div>
              <div>Statut</div>
              <div>Actions</div>
            </div>

            {/* Users List */}
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                Chargement...
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                Aucun utilisateur
              </div>
            ) : (
              users
                .filter((user) => filterUserRole === "all" || user.role === filterUserRole)
                .map((user) => {
                  const roleStyle = getRoleBadge(user.role);
                  return (
                    <div
                      key={user._id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1.2fr 0.8fr 0.8fr 0.6fr",
                        gap: 16,
                        padding: "16px 20px",
                        borderBottom: "1.5px solid #f1f5f9",
                        alignItems: "center",
                        fontSize: 13,
                        color: "#0f172e",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>
                        {user.firstName} {user.lastName}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>
                        {user.email}
                      </div>
                      <div>
                        <span
                          style={{
                            background: roleStyle.bg,
                            color: roleStyle.text,
                            padding: "6px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {roleStyle.label}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          color: user.isActive ? "#10b981" : "#ef4444",
                        }}
                      >
                        {user.isActive ? (
                          <>
                            <Eye size={14} /> Actif
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} /> Inactif
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#ef4444",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        )}

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
  );
}
