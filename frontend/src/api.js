// src/services/api.js
const BASE = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const handle = async (res) => {
  const data = await res.json();
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