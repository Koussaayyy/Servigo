// src/services/api.js
const BASE = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");
const getAdminToken = () => localStorage.getItem("adminToken");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const adminHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getAdminToken()}`,
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

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
//  AUTH
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
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

  // ÔöÇÔöÇ Google Login ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  googleLogin: (credential, extraData = {}) =>
    fetch(`${BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential, ...extraData }),
    }).then(handle),

  // ÔöÇÔöÇ Forgot Password ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
 forgotPassword: (email) =>
    fetch(`${BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then(handle),

  // ÔöÇÔöÇ Reset Password ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  resetPassword: (token, password) =>
    fetch(`${BASE}/auth/reset-password/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).then(handle),

  // ÔöÇÔöÇ Verify Email ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  verifyEmail: (email, code) =>
    fetch(`${BASE}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    }).then(handle),

  resendVerificationCode: (email) =>
    fetch(`${BASE}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    banWorker: (workerId, banReason) =>
      fetch(`${BASE}/admin/workers/${workerId}/ban`, {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ banReason }),
      }).then(handle),
      body: JSON.stringify({ email }),
    }).then(handle),
};

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
//  CLIENT
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
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

  sendDeleteCode: () =>
    fetch(`${BASE}/client/send-delete-code`, {
      method: "POST",
      headers: authHeaders(),
    }).then(handle),

  deleteAccount: (code) =>
    fetch(`${BASE}/client/account`, {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ code }),
    }).then(handle),

  sendEmailChangeCode: (newEmail) =>
    fetch(`${BASE}/client/send-email-change-code`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ newEmail }),
    }).then(handle),

  changeEmail: (code) =>
    fetch(`${BASE}/client/email`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ code }),
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

  getNotifications: () =>
    fetch(`${BASE}/client/notifications`, { headers: authHeaders() }).then(handle),

  markAllNotificationsAsRead: () =>
    fetch(`${BASE}/client/notifications/read-all`, {
      method: "PUT",
      headers: authHeaders(),
    }).then(handle),

  markNotificationAsRead: (notificationId) =>
    fetch(`${BASE}/client/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: authHeaders(),
    }).then(handle),

  getSavedWorkers: () =>
    fetch(`${BASE}/client/saved-workers`, { headers: authHeaders() }).then(handle),

  saveWorker: (workerId) =>
    fetch(`${BASE}/client/saved-workers/${workerId}`, {
      method: "POST",
      headers: authHeaders(),
    }).then(handle),

  unsaveWorker: (workerId) =>
    fetch(`${BASE}/client/saved-workers/${workerId}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(handle),
};

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
//  WORKER
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
export const workerApi = {
  getById: (workerId) => fetch(`${BASE}/workers/${workerId}`).then(handle),

  getMarketplaceWorkers: ({ profession = "", city = "" } = {}) => {
    const query = new URLSearchParams();
    if (profession) query.set("profession", profession);
    if (city) query.set("city", city);
    const qs = query.toString();
    return fetch(`${BASE}/workers${qs ? `?${qs}` : ""}`).then(handle);
  },

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

  sendDeleteCode: () =>
    fetch(`${BASE}/worker/send-delete-code`, {
      method: "POST",
      headers: authHeaders(),
    }).then(handle),

  deleteAccount: (code) =>
    fetch(`${BASE}/worker/account`, {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ code }),
    }).then(handle),

  sendEmailChangeCode: (newEmail) =>
    fetch(`${BASE}/worker/send-email-change-code`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ newEmail }),
    }).then(handle),

  changeEmail: (code) =>
    fetch(`${BASE}/worker/email`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ code }),
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

  addPortfolioItem: (formData) =>
    fetch(`${BASE}/worker/portfolio`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    }).then(handle),

  updatePortfolioItem: (itemId, formData) =>
    fetch(`${BASE}/worker/portfolio/${itemId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    }).then(handle),

  deletePortfolioItem: (itemId) =>
    fetch(`${BASE}/worker/portfolio/${itemId}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(handle),

  deletePortfolioReview: (itemId, reviewId) =>
    fetch(`${BASE}/worker/portfolio/${itemId}/review/${reviewId}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(handle),

  updateSchedule: (schedule) =>
    fetch(`${BASE}/worker/schedule`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ availabilitySchedule: schedule }),
    }).then(handle),

  getNotifications: () =>
    fetch(`${BASE}/worker/notifications`, { headers: authHeaders() }).then(handle),

  markAllNotificationsAsRead: () =>
    fetch(`${BASE}/worker/notifications/read-all`, {
      method: "PUT",
      headers: authHeaders(),
    }).then(handle),

  markNotificationAsRead: (notificationId) =>
    fetch(`${BASE}/worker/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: authHeaders(),
    }).then(handle),

  addService: (service) =>
    fetch(`${BASE}/worker/services`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(service),
    }).then(handle),

  updateService: (serviceId, service) =>
    fetch(`${BASE}/worker/services/${serviceId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(service),
    }).then(handle),

  deleteService: (serviceId) =>
    fetch(`${BASE}/worker/services/${serviceId}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(handle),
};

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
//  UTILITY
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
export const avatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;
  return `http://localhost:5000${avatarPath}`;
};

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
//  RESERVATIONS
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
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

  create: (payload) => {
    const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
    return fetch(`${BASE}/reservations`, {
      method: "POST",
      headers: isFormData
        ? { Authorization: `Bearer ${getToken()}` }
        : authHeaders(),
      body: isFormData ? payload : JSON.stringify(payload),
    }).then(handle);
  },

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

  submitClientSignal: (reservationId, payload) =>
    fetch(`${BASE}/reservations/${reservationId}/client-signal`, {
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

  startService: (reservationId, code) =>
    fetch(`${BASE}/reservations/${reservationId}/start-service`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ code }),
    }).then(handle),
};

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
//  PORTFOLIO
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
export const portfolioApi = {
  toggleLike: (workerId, itemId) =>
    fetch(`${BASE}/workers/${workerId}/portfolio/${itemId}/like`, { method: "POST", headers: authHeaders() }).then(handle),

  addComment: (workerId, itemId, text) =>
    fetch(`${BASE}/workers/${workerId}/portfolio/${itemId}/comment`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify({ text }),
    }).then(handle),

  editComment: (workerId, itemId, commentId, text) =>
    fetch(`${BASE}/workers/${workerId}/portfolio/${itemId}/comment/${commentId}`, {
      method: "PUT", headers: authHeaders(), body: JSON.stringify({ text }),
    }).then(handle),

  deleteComment: (workerId, itemId, commentId) =>
    fetch(`${BASE}/workers/${workerId}/portfolio/${itemId}/comment/${commentId}`, {
      method: "DELETE", headers: authHeaders(),
    }).then(handle),

  toggleCommentLike: (workerId, itemId, commentId) =>
    fetch(`${BASE}/workers/${workerId}/portfolio/${itemId}/comment/${commentId}/like`, {
      method: "POST", headers: authHeaders(),
    }).then(handle),
};

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
//  RECLAMATIONS
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
export const reclamationApi = {
  create: (payload) =>
    fetch(`${BASE}/reclamations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),
};

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
//  ADMIN AUTH
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
export const adminAuthApi = {
  login: (email, password) =>
    fetch(`${BASE}/admin-auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then(handle),
};

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
//  ADMIN
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
export const adminApi = {
  getNotifications: () =>
    fetch(`${BASE}/admin/notifications`, { headers: adminHeaders() }).then(handle),

  markAllNotificationsRead: () =>
    fetch(`${BASE}/admin/notifications/read-all`, { method: "PUT", headers: adminHeaders() }).then(handle),

  getAllReservations: () =>
    fetch(`${BASE}/admin/reservations`, { headers: adminHeaders() }).then(handle),

  getReclamations: () =>
    fetch(`${BASE}/admin/reclamations`, {
      headers: adminHeaders(),
    }).then(handle),

  updateReclamationStatus: (reclamationId, data) =>
    fetch(`${BASE}/reclamations/${reclamationId}`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify(data),
    }).then(handle),

  deleteReclamation: (reclamationId) =>
    fetch(`${BASE}/reclamations/${reclamationId}`, {
      method: "DELETE",
      headers: adminHeaders(),
    }).then(handle),

  getUsers: () =>
    fetch(`${BASE}/admin/users`, {
      headers: adminHeaders(),
    }).then(handle),

  getStats: () =>
    fetch(`${BASE}/admin/stats`, {
      headers: adminHeaders(),
    }).then(handle),

  getWorkerVerifications: (status = "pending") =>
    fetch(`${BASE}/admin/worker-verifications?status=${encodeURIComponent(status)}`, {
      headers: adminHeaders(),
    }).then(handle),

  reviewWorkerVerification: (workerId, data) =>
    fetch(`${BASE}/admin/worker-verifications/${workerId}/review`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify(data),
    }).then(handle),

  deleteUser: (userId) =>
    fetch(`${BASE}/admin/users/${userId}`, {
      method: "DELETE",
      headers: adminHeaders(),
    }).then(handle),

  toggleUserStatus: (userId) =>
    fetch(`${BASE}/admin/users/${userId}/toggle`, {
      method: "PUT",
      headers: adminHeaders(),
    }).then(handle),

  getSignals: () =>
    fetch(`${BASE}/admin/signals`, { headers: adminHeaders() }).then(handle),

  updateSignalStatus: (signalId, data) =>
    fetch(`${BASE}/admin/signals/${signalId}/status`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify(data),
    }).then(handle),

  deleteSignal: (signalId) =>
    fetch(`${BASE}/admin/signals/${signalId}`, {
      method: "DELETE",
      headers: adminHeaders(),
    }).then(handle),

  banWorker: (workerId, banReason) =>
    fetch(`${BASE}/admin/workers/${workerId}/ban`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ banReason }),
    }).then(handle),

  warnWorker: (workerId, signalId, warningNote, warningReason) =>
    fetch(`${BASE}/admin/workers/${workerId}/warn`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ signalId, warningNote, warningReason }),
    }).then(handle),

  unbanWorker: (workerId) =>
    fetch(`${BASE}/admin/workers/${workerId}/unban`, {
      method: "PATCH",
      headers: adminHeaders(),
    }).then(handle),

  resetWorkerWarnings: (workerId) =>
    fetch(`${BASE}/admin/workers/${workerId}/reset-warnings`, {
      method: "PATCH",
      headers: adminHeaders(),
    }).then(handle),

  getWorkerReports: (workerId) =>
    fetch(`${BASE}/admin/workers/${workerId}/reports`, { headers: adminHeaders() }).then(handle),

  getServices: () =>
    fetch(`${BASE}/admin/services`, { headers: adminHeaders() }).then(handle),

  createService: (data) =>
    fetch(`${BASE}/admin/services`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify(data),
    }).then(handle),

  deleteService: (id) =>
    fetch(`${BASE}/admin/services/${id}`, {
      method: "DELETE",
      headers: adminHeaders(),
    }).then(handle),
};

export const chatApi = {
  send: (message, city) =>
    fetch(`${BASE}/chat`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ message, city }),
    }).then(handle),
};

export const servicesApi = {
  getAll: () => fetch(`${BASE}/workers/services`).then(handle),
};
