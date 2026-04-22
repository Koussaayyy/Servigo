import { useCallback, useEffect, useMemo, useState } from "react";
import { reservationApi, workerApi } from "../api";
import { PROFESSIONS } from "../constants/data";

const fmtHour = (hour) => `${String(hour).padStart(2, "0")}:00`;
const fmtDate = (dateValue) => {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return String(dateValue).slice(0, 10);
  return d.toLocaleDateString();
};

const normalizeProfession = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const next30Days = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
};

const toLocalISODate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function ReservationsPage({ user, preselectedWorkerId = "", preselectedProfession = "", onPrefillApplied }) {
  const isClient = user?.role === "client";
  const isWorker = user?.role === "worker";
  const [prefillDone, setPrefillDone] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [workers, setWorkers] = useState([]);
  const [clientReservations, setClientReservations] = useState([]);
  const [clientHistory, setClientHistory] = useState([]);
  const [workerReservations, setWorkerReservations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [monthAvailability, setMonthAvailability] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [datePage, setDatePage] = useState(0);
  const [reviewForms, setReviewForms] = useState({});
  const [reviewLoadingId, setReviewLoadingId] = useState("");

  const [form, setForm] = useState({
    workerId: "",
    bookingDate: "",
    bookingHour: "",
    serviceType: "",
    address: "",
    notes: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (isClient) {
        const [workersData, reservationsData, historyData] = await Promise.all([
          workerApi.getAllWorkers(),
          reservationApi.getClientReservations(),
          reservationApi.getClientHistory(),
        ]);
        setWorkers(Array.isArray(workersData) ? workersData : []);
        setClientReservations(Array.isArray(reservationsData) ? reservationsData : []);
        setClientHistory(Array.isArray(historyData) ? historyData : []);
      }

      if (isWorker) {
        const reservationsData = await reservationApi.getWorkerReservations();
        setWorkerReservations(Array.isArray(reservationsData) ? reservationsData : []);
      }
    } catch (err) {
      setError(err.message || "Failed to load reservations.");
    } finally {
      setLoading(false);
    }
  }, [isClient, isWorker]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isClient || prefillDone) return;

    const consumePrefill = () => {
      setPrefillDone(true);
      onPrefillApplied?.();
    };

    if (!preselectedWorkerId && !preselectedProfession) {
      consumePrefill();
      return;
    }

    const worker = workers.find((item) => String(item?._id) === String(preselectedWorkerId));

    if (worker) {
      const profession = preselectedProfession || worker.workerProfile?.professions?.[0] || "";
      if (profession) setSelectedService(profession);
      setForm((prev) => ({
        ...prev,
        serviceType: profession || prev.serviceType,
        workerId: String(worker._id),
        bookingHour: "",
      }));
      consumePrefill();
      return;
    }

    if (!loading && preselectedProfession) {
      setSelectedService(preselectedProfession);
      setForm((prev) => ({ ...prev, serviceType: preselectedProfession, bookingHour: "" }));
      consumePrefill();
      return;
    }

    if (!loading && preselectedWorkerId && !preselectedProfession) {
      consumePrefill();
    }
  }, [
    isClient,
    prefillDone,
    preselectedWorkerId,
    preselectedProfession,
    workers,
    loading,
    onPrefillApplied,
  ]);

  const datePages = useMemo(() => {
    const pages = [];
    for (let index = 0; index < monthAvailability.length; index += 7) {
      pages.push(monthAvailability.slice(index, index + 7));
    }
    return pages;
  }, [monthAvailability]);

  const visibleDates = datePages[datePage] || [];

  const professions = useMemo(() => {
    const values = new Set();
    PROFESSIONS.forEach((profession) => {
      const normalized = String(profession || "").trim();
      if (normalized) values.add(normalized);
    });
    workers.forEach((worker) => {
      const list = worker.workerProfile?.professions || [];
      list.forEach((profession) => {
        const normalized = String(profession || "").trim();
        if (normalized) values.add(normalized);
      });
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [workers]);

  const filteredWorkers = useMemo(() => {
    if (!selectedService) return [];
    const target = normalizeProfession(selectedService);
    return workers.filter((worker) =>
      (worker.workerProfile?.professions || [])
        .map((profession) => normalizeProfession(profession))
        .includes(target)
    );
  }, [workers, selectedService]);

  useEffect(() => {
    setForm((prev) => {
      const validWorker = filteredWorkers.some((worker) => String(worker._id) === String(prev.workerId));
      if (validWorker) return prev;
      if (filteredWorkers.length > 0) {
        return { ...prev, serviceType: selectedService, workerId: String(filteredWorkers[0]._id), bookingHour: "" };
      }
      return { ...prev, serviceType: selectedService, workerId: "", bookingHour: "" };
    });
    setSlots([]);
  }, [selectedService, filteredWorkers]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, bookingHour: "" }));
  }, [form.workerId]);

  useEffect(() => {
    setDatePage(0);
  }, [form.workerId, selectedService]);

  useEffect(() => {
    const fetchMonth = async () => {
      if (!isClient || !form.workerId || !selectedService) {
        setMonthAvailability([]);
        setSlots([]);
        setForm((prev) => ({ ...prev, bookingDate: "", bookingHour: "" }));
        return;
      }

      setSlotsLoading(true);
      try {
        let days = [];
        try {
          const data = await reservationApi.getWorkerMonthAvailability(form.workerId, selectedService);
          const rawDays = Array.isArray(data?.days) ? data.days : [];
          days = rawDays.map((day) => {
            if (Array.isArray(day?.slots)) {
              return { date: day.date, slots: day.slots };
            }

            const hours = Array.isArray(day?.availableHours) ? day.availableHours : [];
            const slotsFromHours = [8, 9, 10, 11, 12, 14, 15, 16, 17].map((hour) => ({
              hour,
              status: hours.includes(hour) ? "available" : "accepted",
            }));
            return { date: day.date, slots: slotsFromHours };
          });
        } catch {
          const dates = next30Days();
          const results = await Promise.all(
            dates.map(async (date) => {
              try {
                const daily = await reservationApi.getWorkerAvailableSlots(form.workerId, date, selectedService);
                return { date, slots: Array.isArray(daily?.slots) ? daily.slots : [] };
              } catch {
                return { date, slots: [] };
              }
            })
          );
          days = results;
        }

        setMonthAvailability(days);

        const firstBookable = days.find((item) => Array.isArray(item.slots) && item.slots.some(s => s.status === "available"));
        const nextDate = firstBookable?.date || days[0]?.date || "";
        const nextSlots = (days.find((item) => item.date === nextDate)?.slots || []);

        setSlots(nextSlots);
        if (nextDate) {
          const pageIndex = Math.max(0, Math.floor(days.findIndex((item) => item.date === nextDate) / 7));
          setDatePage(pageIndex);
        }
        setForm((prev) => ({
          ...prev,
          bookingDate: nextDate,
          bookingHour: "",
        }));
      } catch (err) {
        setMonthAvailability([]);
        setSlots([]);
        setError(err.message || "Impossible de charger la disponibilité du mois");
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchMonth();
  }, [isClient, form.workerId, selectedService]);

  useEffect(() => {
    if (!form.bookingDate) {
      setSlots([]);
      return;
    }
    const selectedDay = monthAvailability.find((item) => item.date === form.bookingDate);
    const daySlots = Array.isArray(selectedDay?.slots) ? selectedDay.slots : [];
    setSlots(daySlots);
    const isBookingValid = daySlots.find((s) => s.status === "available" && String(s.hour) === String(form.bookingHour));
    setForm((prev) => (isBookingValid ? prev : { ...prev, bookingHour: "" }));
  }, [form.bookingDate, monthAvailability]);

  const updateForm = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const createReservation = async () => {
    setError("");
    setMessage("");

    if (!selectedService || !form.workerId || !form.bookingDate || form.bookingHour === "") {
      return setError("Select service, worker, date and hour first.");
    }

    setActionLoading(true);
    try {
      await reservationApi.create({
        workerId: form.workerId,
        bookingDate: form.bookingDate,
        bookingHour: Number(form.bookingHour),
        serviceType: selectedService,
        address: form.address,
        notes: form.notes,
      });

      setMessage("Reservation created ✅");
      setForm((prev) => ({ ...prev, bookingHour: "", notes: "" }));
      
      // Refresh available slots for this date
      try {
        const updatedData = await reservationApi.getWorkerAvailableSlots(form.workerId, form.bookingDate, selectedService);
        const newSlots = Array.isArray(updatedData?.slots) ? updatedData.slots : [];
        setMonthAvailability((prev) =>
          prev.map((item) => item.date === form.bookingDate ? { ...item, slots: newSlots } : item)
        );
        setSlots(newSlots);
      } catch (err) {
        console.error("Failed to refresh slots:", err);
      }
      
      await loadData();
    } catch (err) {
      setError(err.message || "Reservation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const cancelReservation = async (reservation) => {
    setActionLoading(true);
    setError("");
    setMessage("");
    try {
      const isAccepted = reservation?.status === "accepted";
      const shouldCancel = window.confirm(
        isAccepted
          ? "Cette réservation est déjà confirmée par le prestataire. Confirmer l'annulation ?"
          : "Confirmer l'annulation de cette réservation ?"
      );

      if (!shouldCancel) {
        setActionLoading(false);
        return;
      }

      const payload = {
        reason: "Cancelled by client",
        ...(isAccepted ? { confirmation: "CLIENT_CONFIRMED" } : {}),
      };

      await reservationApi.cancelAsClient(reservation._id, payload);
      setMessage("Reservation cancelled");
      await loadData();
    } catch (err) {
      setError(err.message || "Cancel failed");
    } finally {
      setActionLoading(false);
    }
  };

  const setWorkerStatus = async (id, status) => {
    setActionLoading(true);
    setError("");
    setMessage("");
    try {
      await reservationApi.setWorkerStatus(id, status);
      setMessage(`Reservation ${status}`);
      await loadData();
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const updateReviewForm = (reservationId, key, value) => {
    setReviewForms((prev) => ({
      ...prev,
      [reservationId]: {
        rating: key === "rating" ? value : (prev[reservationId]?.rating || ""),
        comment: key === "comment" ? value : (prev[reservationId]?.comment || ""),
        open: true,
      },
    }));
  };

  const toggleReviewForm = (reservationId) => {
    setReviewForms((prev) => {
      const current = prev[reservationId] || { rating: "", comment: "", open: false };
      return {
        ...prev,
        [reservationId]: {
          ...current,
          open: !current.open,
        },
      };
    });
  };

  const submitReview = async (reservationId) => {
    const current = reviewForms[reservationId] || { rating: "", comment: "" };
    const rating = Number(current.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError("Choisissez une note entre 1 et 5.");
      return;
    }

    setReviewLoadingId(reservationId);
    setError("");
    setMessage("");
    try {
      await reservationApi.submitClientReview(reservationId, {
        rating,
        comment: String(current.comment || "").trim(),
      });
      setMessage("Avis envoyé ✅");
      setReviewForms((prev) => ({
        ...prev,
        [reservationId]: { rating: "", comment: "", open: false },
      }));
      await loadData();
    } catch (err) {
      setError(err.message || "Envoi de l'avis impossible");
    } finally {
      setReviewLoadingId("");
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "12px 0" }}>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, color: "#0f172e", marginBottom: 6 }}>Réservations</h1>
        <p style={{ color: "#64748b", fontSize: 13 }}>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "12px 0" }}>
      <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, color: "#0f172e", marginBottom: 6 }}>Réservations</h1>
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 18 }}>
        {isClient ? "Recherchez un prestataire puis réservez un créneau." : "Gérez les demandes de réservation reçues."}
      </p>

      {error && <div style={{ marginBottom: 10, color: "#c0392b", fontSize: 13 }}>{error}</div>}
      {message && <div style={{ marginBottom: 10, color: "#0f172e", fontSize: 13 }}>{message}</div>}

      {isClient && (
        <>
          <section style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 18, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, color: "#0f172e" }}>Nouvelle réservation</h3>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>1. Choisissez le service</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                {professions.map((profession) => {
                  const active = selectedService === profession;
                  return (
                    <button
                      key={profession}
                      type="button"
                      onClick={() => {
                        setSelectedService(profession);
                        setForm((prev) => ({ ...prev, serviceType: profession, workerId: "", bookingHour: "" }));
                      }}
                      style={{
                        padding: "12px 10px",
                        borderRadius: 10,
                        border: active ? "1.5px solid #06b6d4" : "1.5px solid #e2e8f0",
                        background: active ? "rgba(6, 182, 212, 0.08)" : "#f8fafc",
                        color: "#0f172e",
                        fontSize: 13,
                        fontWeight: 600,
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      {profession}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>2. Choisissez le prestataire</div>
              {!selectedService ? (
                <div style={{ fontSize: 12, color: "#64748b" }}>Commencez par sélectionner un service.</div>
              ) : filteredWorkers.length === 0 ? (
                <div style={{ fontSize: 12, color: "#64748b" }}>Aucun prestataire trouvé pour ce service.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  {filteredWorkers.map((worker) => {
                    const active = String(form.workerId) === String(worker._id);

                    return (
                      <button
                        key={worker._id}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, workerId: worker._id, bookingHour: "" }))}
                        style={{
                          borderRadius: 12,
                          border: active ? "1.5px solid #06b6d4" : "1.5px solid #e2e8f0",
                          background: active ? "rgba(232,98,10,0.08)" : "#fff",
                          padding: 14,
                          textAlign: "left",
                          cursor: "pointer",
                          boxShadow: active ? "0 0 0 3px rgba(232,98,10,0.12)" : "none",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172e" }}>
                            {worker.firstName} {worker.lastName}
                          </div>
                          {active && (
                            <span style={{ fontSize: 11, color: "#06b6d4", border: "1px solid rgba(6, 182, 212, 0.25)", borderRadius: 100, padding: "3px 8px", fontWeight: 700 }}>
                              Sélectionné
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                          {worker.workerProfile?.city || "Ville non précisée"}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {(worker.workerProfile?.professions || []).slice(0, 3).map((profession) => (
                            <span key={profession} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 100, background: "#e2e8f0", color: "#0f172e" }}>
                              {profession}
                            </span>
                          ))}
                        </div>

                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#64748b" }}>
                3. Choisissez la date (30 prochains jours)
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <button
                    type="button"
                    className="mode-tab"
                    onClick={() => setDatePage((prev) => Math.max(0, prev - 1))}
                    disabled={datePage === 0}
                    style={{ marginRight: 8 }}
                  >
                    ← Semaine précédente
                  </button>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                    Semaine {datePage + 1}/{Math.max(1, datePages.length)}
                  </span>
                  <button
                    type="button"
                    className="mode-tab"
                    onClick={() => setDatePage((prev) => Math.min(Math.max(0, datePages.length - 1), prev + 1))}
                    disabled={datePage >= datePages.length - 1}
                    style={{ marginLeft: 8 }}
                  >
                    Semaine suivante →
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8 }}>
                  {visibleDates.map((day) => {
                    const daySlots = Array.isArray(day.slots) ? day.slots : [];
                    const freeCount = daySlots.filter((slot) => slot.status === "available").length;
                    const active = form.bookingDate === day.date;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, bookingDate: day.date, bookingHour: "" }))}
                        disabled={slotsLoading || freeCount === 0}
                        style={{
                          padding: "9px 8px",
                          borderRadius: 8,
                          border: active ? "1.5px solid #06b6d4" : "1.5px solid #e2e8f0",
                          background: active ? "rgba(6, 182, 212, 0.1)" : "#fff",
                          color: active ? "#06b6d4" : "#64748b",
                          opacity: freeCount === 0 ? 0.45 : 1,
                          cursor: (slotsLoading || freeCount === 0) ? "not-allowed" : "pointer",
                          fontFamily: "'Sora', sans-serif",
                          fontSize: 12,
                          textAlign: "left",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 12 }}>{fmtDate(day.date)}</div>
                        <div style={{ fontSize: 11 }}>{freeCount} h libre(s)</div>
                      </button>
                    );
                  })}
                  {!slotsLoading && visibleDates.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "#64748b", paddingTop: 8 }}>
                      {!form.workerId ? "Choisissez un prestataire" : "Aucune disponibilité trouvée ce mois"}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#64748b" }}>
                4. Choisissez l'heure libre
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#64748b", marginBottom: 4, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: "#ecfdf5", border: "1px solid #10b981" }}></div>
                    <span>Libre</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: "#fffbeb", border: "1px solid #f59e0b" }}></div>
                    <span>En attente</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: "#fee2e2", border: "1px solid #ef4444" }}></div>
                    <span>Réservé</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: "#f1f5f9", border: "1px solid #94a3b8" }}></div>
                    <span>Passé</span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 8 }}>
                  {slots.map((slot) => {
                    const active = String(form.bookingHour) === String(slot.hour);
                    const isAvailable = slot.status === "available";
                    const isPending = slot.status === "pending";
                    const isTaken = slot.status === "accepted" || slot.status === "completed";
                    const isPassed = slot.status === "passed";
                    
                    let bgColor = "#fff";
                    let borderColor = "#e2e8f0";
                    let textColor = "#0f172e";
                    let opacity = 1;
                    let cursor = "pointer";
                    
                    if (isAvailable && active) {
                      bgColor = "#10b981"; // Green when selected
                      borderColor = "#10b981";
                      textColor = "#fff";
                    } else if (isAvailable && !active) {
                      bgColor = "#ecfdf5"; // Light green
                      borderColor = "#10b981";
                      textColor = "#059669";
                    } else if (isPending && active) {
                      bgColor = "#f59e0b"; // Orange when selected
                      borderColor = "#f59e0b";
                      textColor = "#fff";
                    } else if (isPending && !active) {
                      bgColor = "#fffbeb"; // Light orange
                      borderColor = "#f59e0b";
                      textColor = "#b45309";
                    } else if (isTaken) {
                      bgColor = "#fee2e2"; // Light red
                      borderColor = "#ef4444";
                      textColor = "#991b1b";
                      cursor = "not-allowed";
                      opacity = 0.7;
                    } else if (isPassed) {
                      bgColor = "#f1f5f9";
                      borderColor = "#94a3b8";
                      textColor = "#64748b";
                      cursor = "not-allowed";
                      opacity = 0.75;
                    }
                    
                    return (
                      <button
                        key={`${slot.hour}`}
                        type="button"
                        onClick={() => isAvailable && setForm((prev) => ({ ...prev, bookingHour: String(slot.hour) }))}
                        disabled={!isAvailable || !form.bookingDate || slotsLoading}
                        title={`${fmtHour(slot.hour)} - ${slot.status === "available" ? "Libre" : slot.status === "pending" ? "En attente" : slot.status === "passed" ? "Passé" : "Réservé"}`}
                        style={{
                          padding: "10px 8px",
                          borderRadius: 8,
                          border: `1.5px solid ${borderColor}`,
                          background: bgColor,
                          color: textColor,
                          cursor: (!form.bookingDate || slotsLoading) ? "not-allowed" : cursor,
                          opacity: (!form.bookingDate || slotsLoading) ? 0.6 : opacity,
                          fontFamily: "'Sora', sans-serif",
                          fontWeight: 600,
                          fontSize: 13,
                          transition: "all .2s",
                        }}
                      >
                        {fmtHour(slot.hour)}
                      </button>
                    );
                  })}
                </div>
                {slots.length === 0 && (
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>
                    {!form.workerId ? "Choisissez un prestataire" : "Aucune disponibilité trouvée ce mois"}
                  </div>
                )}
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#64748b", gridColumn: "span 2" }}>
                Adresse
                <input value={form.address} onChange={updateForm("address")} style={inputStyle} placeholder="Adresse d'intervention" />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#64748b", gridColumn: "span 2" }}>
                Notes
                <textarea value={form.notes} onChange={updateForm("notes")} style={{ ...inputStyle, minHeight: 74, resize: "vertical" }} placeholder="Détails utiles" />
              </label>
            </div>

            <button className="submit-btn" disabled={actionLoading} onClick={createReservation} style={{ marginTop: 12, maxWidth: 260 }}>
              {actionLoading ? "Envoi..." : "Réserver ce créneau"}
            </button>
          </section>

          <section style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 18, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, color: "#0f172e" }}>Mes réservations</h3>
            {clientReservations.length === 0 ? (
              <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Aucune réservation active.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {clientReservations.map((reservation) => (
                  <ReservationRow
                    key={reservation._id}
                    reservation={reservation}
                    rightAction={
                      ["pending", "accepted"].includes(reservation.status)
                        ? (
                          <button className="mode-tab" onClick={() => cancelReservation(reservation)} disabled={actionLoading}>
                            Annuler
                          </button>
                        )
                        : null
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, color: "#0f172e" }}>Historique</h3>
            {clientHistory.length === 0 ? (
              <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Aucun historique.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {clientHistory.map((reservation) => {
                  const hasReview = !!reservation?.clientReview?.rating;
                  const isCompleted = reservation?.status === "completed";
                  const formState = reviewForms[reservation._id] || { rating: "", comment: "", open: false };

                  return (
                    <ReservationRow
                      key={reservation._id}
                      reservation={reservation}
                      rightAction={
                        isCompleted ? (
                          hasReview ? (
                            <span style={{ fontSize: 11, color: "#2e7d32", fontWeight: 700 }}>Avis envoyé</span>
                          ) : (
                            <button className="mode-tab" onClick={() => toggleReviewForm(reservation._id)} disabled={reviewLoadingId === reservation._id}>
                              {formState.open ? "Fermer" : "Laisser un avis"}
                            </button>
                          )
                        ) : null
                      }
                    >
                      {isCompleted && hasReview && (
                        <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                          Note: {"★".repeat(Number(reservation.clientReview.rating))}{"☆".repeat(Math.max(0, 5 - Number(reservation.clientReview.rating)))}
                          {reservation.clientReview.comment ? ` · ${reservation.clientReview.comment}` : ""}
                        </div>
                      )}

                      {isCompleted && !hasReview && formState.open && (
                        <div style={{ marginTop: 10, borderTop: "1px solid #e2e8f0", paddingTop: 10, display: "grid", gap: 8 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#64748b" }}>
                            Note
                            <select
                              value={formState.rating}
                              onChange={(event) => updateReviewForm(reservation._id, "rating", event.target.value)}
                              style={{ ...inputStyle, width: 96, padding: "8px 10px", fontSize: 12 }}
                            >
                              <option value="">--</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                          </div>
                          <textarea
                            value={formState.comment}
                            onChange={(event) => updateReviewForm(reservation._id, "comment", event.target.value)}
                            placeholder="Votre retour sur la mission (optionnel)"
                            style={{ ...inputStyle, minHeight: 64, resize: "vertical", fontSize: 12 }}
                          />
                          <div>
                            <button className="submit-btn" onClick={() => submitReview(reservation._id)} disabled={reviewLoadingId === reservation._id} style={{ maxWidth: 220 }}>
                              {reviewLoadingId === reservation._id ? "Envoi..." : "Envoyer l'avis"}
                            </button>
                          </div>
                        </div>
                      )}
                    </ReservationRow>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {isWorker && (
        <section style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, color: "#0f172e" }}>Demandes reçues</h3>
          {workerReservations.length === 0 ? (
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Aucune demande pour le moment.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {workerReservations.map((reservation) => (
                <ReservationRow
                  key={reservation._id}
                  reservation={reservation}
                  rightAction={
                    reservation.status === "pending" ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="mode-tab" onClick={() => setWorkerStatus(reservation._id, "accepted")} disabled={actionLoading}>Accepter</button>
                        <button className="mode-tab" onClick={() => setWorkerStatus(reservation._id, "rejected")} disabled={actionLoading}>Refuser</button>
                      </div>
                    ) : reservation.status === "accepted" ? (
                      <button className="mode-tab" onClick={() => setWorkerStatus(reservation._id, "completed")} disabled={actionLoading}>Terminer</button>
                    ) : null
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ReservationRow({ reservation, rightAction, children }) {
  const worker = reservation.worker;
  const client = reservation.client;
  const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
  const person = isObject(worker)
    ? worker
    : isObject(client)
      ? client
      : {};

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 14, color: "#0f172e", fontWeight: 600 }}>
          {person.firstName || "Utilisateur"} {person.lastName || ""}
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          {fmtDate(reservation.bookingDate)} à {fmtHour(reservation.bookingHour)} · {reservation.serviceType || "Service"}
        </div>
        {reservation.address && (
          <div style={{ fontSize: 12, color: "#64748b" }}>{reservation.address}</div>
        )}
        <div style={{ fontSize: 11, marginTop: 3, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em" }}>
          Statut: {reservation.status}
        </div>
        {children}
      </div>
      {rightAction}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "#e2e8f0",
  border: "1.5px solid transparent",
  borderRadius: 8,
  padding: "10px 12px",
  fontFamily: "'Sora', sans-serif",
  fontSize: 13,
  color: "#0f172e",
  outline: "none",
};
