// src/services/api.js
// All backend calls live here — import what you need in your components

const BASE = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Throws a proper Error with the backend message
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
};

// ════════════════════════════════════════════
//  CLIENT
// ════════════════════════════════════════════
export const clientApi = {
  // Load full profile from DB
  getProfile: () =>
    fetch(`${BASE}/client/profile`, { headers: authHeaders() }).then(handle),

  // Save personal info + clientProfile
  updateProfile: (data) =>
    fetch(`${BASE}/client/profile`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handle),

  // Change password
  changePassword: (currentPassword, newPassword) =>
    fetch(`${BASE}/client/password`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    }).then(handle),

  // Upload avatar photo (File object from input)
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append("avatar", file);
    return fetch(`${BASE}/client/avatar`, {
      method: "PUT",
      // Do NOT set Content-Type — browser sets it automatically with boundary
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form,
    }).then(handle);
  },

  // Remove avatar
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
  // Load full profile from DB
  getProfile: () =>
    fetch(`${BASE}/worker/profile`, { headers: authHeaders() }).then(handle),

  // Save personal info + workerProfile fields
  updateProfile: (data) =>
    fetch(`${BASE}/worker/profile`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handle),

  // Change password
  changePassword: (currentPassword, newPassword) =>
    fetch(`${BASE}/worker/password`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    }).then(handle),

  // Upload avatar photo (File object from input)
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append("avatar", file);
    return fetch(`${BASE}/worker/avatar`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form,
    }).then(handle);
  },

  // Remove avatar
  deleteAvatar: () =>
    fetch(`${BASE}/worker/avatar`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(handle),

  // Toggle available / unavailable
  toggleAvailability: () =>
    fetch(`${BASE}/worker/availability`, {
      method: "PUT",
      headers: authHeaders(),
    }).then(handle),
};

// ════════════════════════════════════════════
//  UTILITY
// ════════════════════════════════════════════

// Convert stored "/uploads/avatars/x.jpg" → full URL for <img src>
export const avatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;
  return `http://localhost:5000${avatarPath}`;
};