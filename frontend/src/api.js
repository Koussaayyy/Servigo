// src/services/api.js
const BASE = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const handle = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let data;
  if (isJson) {
    data = await res.json();
  } else {
    const text = await res.text();
    data = { message: text || "Unexpected response format" };
  }

  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

// ════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════
export const authApi = {
  login: (email, password) =>
    fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then(handle),

  register: (data) =>
    fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  getMe: () =>
    fetch(`${BASE}/auth/me`, { headers: authHeaders() }).then(handle),

  // ── Google Login ──────────────────────────
  googleLogin: (credential, extraData = {}) =>
    fetch(`${BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential, ...extraData }),
    }).then(handle),

  // ── Forgot Password ───────────────────────
 forgotPassword: (email) =>
    fetch(`${BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then(handle),

  // ── Reset Password ────────────────────────
  resetPassword: (token, password) =>
    fetch(`${BASE}/auth/reset-password/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).then(handle),
};

// ════════════════════════════════════════════
//  CLIENT
// ════════════════════════════════════════════
export const clientApi = {
  getProfile: () =>
    fetch(`${BASE}/client/profile`, { headers: authHeaders() }).then(handle),

  updateProfile: (data) =>
    fetch(`${BASE}/client/profile`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handle),

  changePassword: (currentPassword, newPassword) =>
    fetch(`${BASE}/client/password`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    }).then(handle),

  deleteAccount: (currentPassword) =>
    fetch(`${BASE}/client/account`, {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword }),
    }).then(handle),

  uploadAvatar: (file) => {
    const form = new FormData();
    form.append("avatar", file);
    return fetch(`${BASE}/client/avatar`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form,
    }).then(handle);
  },

  deleteAvatar: () =>
    fetch(`${BASE}/client/avatar`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(handle),
};

// ════════════════════════════════════════════
//  WORKER
// ════════════════════════════════════════════
export const workerApi = {
  getAllWorkers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${BASE}/worker/all${query ? `?${query}` : ""}`).then(handle);
  },

  getProfile: () =>
    fetch(`${BASE}/worker/profile`, { headers: authHeaders() }).then(handle),

  updateProfile: (data) =>
    fetch(`${BASE}/worker/profile`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handle),

  changePassword: (currentPassword, newPassword) =>
    fetch(`${BASE}/worker/password`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    }).then(handle),

  deleteAccount: (currentPassword) =>
    fetch(`${BASE}/worker/account`, {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword }),
    }).then(handle),

  uploadAvatar: (file) => {
    const form = new FormData();
    form.append("avatar", file);
    return fetch(`${BASE}/worker/avatar`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form,
    }).then(handle);
  },

  uploadPortfolioImage: (file) => {
    const form = new FormData();
    form.append("image", file);
    return fetch(`${BASE}/worker/portfolio/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form,
    }).then(handle);
  },

  deleteAvatar: () =>
    fetch(`${BASE}/worker/avatar`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(handle),

  toggleAvailability: () =>
    fetch(`${BASE}/worker/availability`, {
      method: "PUT",
      headers: authHeaders(),
    }).then(handle),
};

// ════════════════════════════════════════════
//  UTILITY
// ════════════════════════════════════════════
export const avatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;
  return `http://localhost:5000${avatarPath}`;
};

// ════════════════════════════════════════════
//  RESERVATIONS
// ════════════════════════════════════════════
export const reservationApi = {
  getWorkerMonthAvailability: (workerId, serviceType = "") => {
    const query = new URLSearchParams();
    if (serviceType) query.set("serviceType", serviceType);
    const qs = query.toString();
    return fetch(`${BASE}/reservations/worker/${workerId}/month-availability${qs ? `?${qs}` : ""}`, {
      headers: authHeaders(),
    }).then(handle);
  },

  getWorkerAvailableSlots: (workerId, date, serviceType = "") => {
    const query = new URLSearchParams();
    if (date) query.set("date", date);
    if (serviceType) query.set("serviceType", serviceType);
    return fetch(`${BASE}/reservations/worker/${workerId}/available-slots?${query.toString()}`, {
      headers: authHeaders(),
    }).then(handle);
  },

  create: (payload) =>
    fetch(`${BASE}/reservations`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handle),

  getClientReservations: () =>
    fetch(`${BASE}/reservations/client`, {
      headers: authHeaders(),
    }).then(handle),

  getClientHistory: () =>
    fetch(`${BASE}/reservations/client/history`, {
      headers: authHeaders(),
    }).then(handle),

  cancelAsClient: (reservationId, payload = {}) =>
    fetch(`${BASE}/reservations/${reservationId}/client-cancel`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handle),

  submitClientReview: (reservationId, payload) =>
    fetch(`${BASE}/reservations/${reservationId}/client-review`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handle),

  getWorkerReservations: () =>
    fetch(`${BASE}/reservations/worker`, {
      headers: authHeaders(),
    }).then(handle),

  getWorkerReviews: () =>
    fetch(`${BASE}/reservations/worker/reviews`, {
      headers: authHeaders(),
    }).then(handle),

  setWorkerStatus: (reservationId, status) =>
    fetch(`${BASE}/reservations/${reservationId}/worker-status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }).then(handle),
};