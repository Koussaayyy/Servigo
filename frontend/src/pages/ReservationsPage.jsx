import { useEffect, useMemo, useState } from "react";
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

export default function ReservationsPage({ user }) {
  const isClient = user?.role === "client";
  const isWorker = user?.role === "worker";

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [workers, setWorkers] = useState([]);
  const [clientReservations, setClientReservations] = useState([]);
  const [clientHistory, setClientHistory] = useState([]);
  const [workerReservations, setWorkerReservations] = useState([]);
  const [availableHours, setAvailableHours] = useState([]);
  const [monthAvailability, setMonthAvailability] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [datePage, setDatePage] = useState(0);

  const [form, setForm] = useState({
    workerId: "",
    bookingDate: "",
    bookingHour: "",
    serviceType: "",
    address: "",
    notes: "",
  });

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, [isClient, isWorker]);

  const selectedWorker = useMemo(
    () => workers.find((worker) => String(worker._id) === String(form.workerId)),
    [workers, form.workerId]
  );

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
    setAvailableHours([]);
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
        setAvailableHours([]);
        setForm((prev) => ({ ...prev, bookingDate: "", bookingHour: "" }));
        return;
      }

      setSlotsLoading(true);
      try {
        let days = [];
        try {
          const data = await reservationApi.getWorkerMonthAvailability(form.workerId, selectedService);
          days = Array.isArray(data?.days) ? data.days : [];
        } catch {
          const dates = next30Days();
          const results = await Promise.all(
            dates.map(async (date) => {
              try {
                const daily = await reservationApi.getWorkerAvailableSlots(form.workerId, date, selectedService);
                return { date, availableHours: Array.isArray(daily?.availableHours) ? daily.availableHours : [] };
              } catch {
                return { date, availableHours: [] };
              }
            })
          );
          days = results;
        }

        setMonthAvailability(days);

        const firstBookable = days.find((item) => Array.isArray(item.availableHours) && item.availableHours.length > 0);
        const nextDate = firstBookable?.date || days[0]?.date || "";
        const nextHours = (days.find((item) => item.date === nextDate)?.availableHours || []);

        setAvailableHours(nextHours);
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
        setAvailableHours([]);
        setError(err.message || "Impossible de charger la disponibilité du mois");
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchMonth();
  }, [isClient, form.workerId, selectedService]);

  useEffect(() => {
    if (!form.bookingDate) {
      setAvailableHours([]);
      return;
    }
    const selectedDay = monthAvailability.find((item) => item.date === form.bookingDate);
    const dayHours = Array.isArray(selectedDay?.availableHours) ? selectedDay.availableHours : [];
    setAvailableHours(dayHours);
    setForm((prev) => (dayHours.includes(Number(prev.bookingHour)) ? prev : { ...prev, bookingHour: "" }));
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
      await loadData();
    } catch (err) {
      setError(err.message || "Reservation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const cancelReservation = async (id) => {
    setActionLoading(true);
    setError("");
    setMessage("");
    try {
      await reservationApi.cancelAsClient(id);
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

  if (loading) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "12px 0" }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 400, color: "#1a1008", marginBottom: 6 }}>Réservations</h1>
        <p style={{ color: "#9a7c68", fontSize: 13 }}>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "12px 0" }}>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 400, color: "#1a1008", marginBottom: 6 }}>Réservations</h1>
      <p style={{ color: "#9a7c68", fontSize: 13, marginBottom: 18 }}>
        {isClient ? "Recherchez un prestataire puis réservez un créneau." : "Gérez les demandes de réservation reçues."}
      </p>

      {error && <div style={{ marginBottom: 10, color: "#c0392b", fontSize: 13 }}>{error}</div>}
      {message && <div style={{ marginBottom: 10, color: "#1a1008", fontSize: 13 }}>{message}</div>}

      {isClient && (
        <>
          <section style={{ background: "#fff", border: "1.5px solid #f0e6da", borderRadius: 12, padding: 18, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, color: "#1a1008" }}>Nouvelle réservation</h3>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#9a7c68", marginBottom: 8 }}>1. Choisissez le service</div>
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
                        border: active ? "1.5px solid #e8620a" : "1.5px solid #f0e6da",
                        background: active ? "rgba(232,98,10,0.08)" : "#fff8f2",
                        color: "#1a1008",
                        fontFamily: "'DM Sans', sans-serif",
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
              <div style={{ fontSize: 12, color: "#9a7c68", marginBottom: 8 }}>2. Choisissez le prestataire</div>
              {!selectedService ? (
                <div style={{ fontSize: 12, color: "#9a7c68" }}>Commencez par sélectionner un service.</div>
              ) : filteredWorkers.length === 0 ? (
                <div style={{ fontSize: 12, color: "#9a7c68" }}>Aucun prestataire trouvé pour ce service.</div>
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
                          border: active ? "1.5px solid #e8620a" : "1.5px solid #f0e6da",
                          background: active ? "rgba(232,98,10,0.08)" : "#fff",
                          padding: 14,
                          textAlign: "left",
                          cursor: "pointer",
                          boxShadow: active ? "0 0 0 3px rgba(232,98,10,0.12)" : "none",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1008" }}>
                            {worker.firstName} {worker.lastName}
                          </div>
                          {active && (
                            <span style={{ fontSize: 11, color: "#e8620a", border: "1px solid rgba(232,98,10,0.25)", borderRadius: 100, padding: "3px 8px", fontWeight: 700 }}>
                              Sélectionné
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#9a7c68", marginBottom: 8 }}>
                          {worker.workerProfile?.city || "Ville non précisée"}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {(worker.workerProfile?.professions || []).slice(0, 3).map((profession) => (
                            <span key={profession} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 100, background: "#f0e6da", color: "#1a1008" }}>
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
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#9a7c68" }}>
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
                  <span style={{ fontSize: 12, color: "#9a7c68", fontWeight: 600 }}>
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
                    const freeCount = Array.isArray(day.availableHours) ? day.availableHours.length : 0;
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
                          border: active ? "1.5px solid #e8620a" : "1.5px solid #f0e6da",
                          background: active ? "rgba(232,98,10,0.1)" : "#fff",
                          color: active ? "#e8620a" : "#9a7c68",
                          opacity: freeCount === 0 ? 0.45 : 1,
                          cursor: (slotsLoading || freeCount === 0) ? "not-allowed" : "pointer",
                          fontFamily: "'DM Sans', sans-serif",
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
                    <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "#9a7c68", paddingTop: 8 }}>
                      {!form.workerId ? "Choisissez un prestataire" : "Aucune disponibilité trouvée ce mois"}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#9a7c68" }}>
                4. Choisissez l'heure libre
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 8 }}>
                  {availableHours.map((hour) => {
                    const active = String(form.bookingHour) === String(hour);
                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, bookingHour: String(hour) }))}
                        disabled={!form.bookingDate || slotsLoading}
                        style={{
                          padding: "10px 8px",
                          borderRadius: 8,
                          border: active ? "1.5px solid #e8620a" : "1.5px solid #f0e6da",
                          background: active ? "#e8620a" : "#fff",
                          color: active ? "#fff" : "#1a1008",
                          cursor: (!form.bookingDate || slotsLoading) ? "not-allowed" : "pointer",
                          opacity: (!form.bookingDate || slotsLoading) ? 0.6 : 1,
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {fmtHour(hour)}
                      </button>
                    );
                  })}
                  {!slotsLoading && availableHours.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "#9a7c68", paddingTop: 8 }}>
                      {!form.bookingDate ? "Choisissez une date" : "Aucune heure libre ce jour"}
                    </div>
                  )}
                  {slotsLoading && (
                    <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "#9a7c68", paddingTop: 8 }}>
                      Chargement des disponibilités du mois...
                    </div>
                  )}
                </div>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#9a7c68", gridColumn: "span 2" }}>
                Adresse
                <input value={form.address} onChange={updateForm("address")} style={inputStyle} placeholder="Adresse d'intervention" />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#9a7c68", gridColumn: "span 2" }}>
                Notes
                <textarea value={form.notes} onChange={updateForm("notes")} style={{ ...inputStyle, minHeight: 74, resize: "vertical" }} placeholder="Détails utiles" />
              </label>
            </div>

            <button className="submit-btn" disabled={actionLoading} onClick={createReservation} style={{ marginTop: 12, maxWidth: 260 }}>
              {actionLoading ? "Envoi..." : "Réserver ce créneau"}
            </button>
          </section>

          <section style={{ background: "#fff", border: "1.5px solid #f0e6da", borderRadius: 12, padding: 18, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, color: "#1a1008" }}>Mes réservations</h3>
            {clientReservations.length === 0 ? (
              <p style={{ margin: 0, color: "#9a7c68", fontSize: 13 }}>Aucune réservation active.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {clientReservations.map((reservation) => (
                  <ReservationRow
                    key={reservation._id}
                    reservation={reservation}
                    rightAction={
                      ["pending", "accepted"].includes(reservation.status)
                        ? (
                          <button className="mode-tab" onClick={() => cancelReservation(reservation._id)} disabled={actionLoading}>
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

          <section style={{ background: "#fff", border: "1.5px solid #f0e6da", borderRadius: 12, padding: 18 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, color: "#1a1008" }}>Historique</h3>
            {clientHistory.length === 0 ? (
              <p style={{ margin: 0, color: "#9a7c68", fontSize: 13 }}>Aucun historique.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {clientHistory.map((reservation) => (
                  <ReservationRow key={reservation._id} reservation={reservation} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {isWorker && (
        <section style={{ background: "#fff", border: "1.5px solid #f0e6da", borderRadius: 12, padding: 18 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, color: "#1a1008" }}>Demandes reçues</h3>
          {workerReservations.length === 0 ? (
            <p style={{ margin: 0, color: "#9a7c68", fontSize: 13 }}>Aucune demande pour le moment.</p>
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

function ReservationRow({ reservation, rightAction }) {
  const worker = reservation.worker;
  const client = reservation.client;
  const person = worker || client || {};

  return (
    <div style={{ border: "1px solid #f0e6da", borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 14, color: "#1a1008", fontWeight: 600 }}>
          {person.firstName || "Utilisateur"} {person.lastName || ""}
        </div>
        <div style={{ fontSize: 12, color: "#9a7c68" }}>
          {fmtDate(reservation.bookingDate)} à {fmtHour(reservation.bookingHour)} · {reservation.serviceType || "Service"}
        </div>
        {reservation.address && (
          <div style={{ fontSize: 12, color: "#9a7c68" }}>{reservation.address}</div>
        )}
        <div style={{ fontSize: 11, marginTop: 3, color: "#9a7c68", textTransform: "uppercase", letterSpacing: ".08em" }}>
          Statut: {reservation.status}
        </div>
      </div>
      {rightAction}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "#f0e6da",
  border: "1.5px solid transparent",
  borderRadius: 8,
  padding: "10px 12px",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  color: "#1a1008",
  outline: "none",
};
