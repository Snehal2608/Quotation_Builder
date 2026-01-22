import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Helper to get token and headers
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// --- AUTH ---
export const registerUser = async (formData) => {
  // Fixed: Accepts FormData for logo/image uploads
  const res = await axios.post(`${API_URL}/auth/register`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const loginUser = async (data) => {
  const res = await axios.post(`${API_URL}/auth/login`, data);
  if (res.data.token) {
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
  }
  return res.data;
};

export const logoutUser = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  try {
    if (user) await axios.post(`${API_URL}/auth/logout`, { email: user.email });
  } catch (err) {
    console.error("Logout error", err);
  }
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// --- RATES CRUD (Fixed for Images/FormData) ---
export const getRates = async () => {
  const res = await axios.get(`${API_URL}/rates`, getAuthHeader());
  return res.data;
};

export const createRate = async (formData) => {
  // Fixed: Supports image upload via multipart/form-data
  const res = await axios.post(`${API_URL}/rates`, formData, {
    headers: {
      ...getAuthHeader().headers,
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const updateRate = async (id, data) => {
  // Handles both JSON and FormData updates
  const headers = data instanceof FormData 
    ? { ...getAuthHeader().headers, "Content-Type": "multipart/form-data" }
    : getAuthHeader().headers;

  const res = await axios.put(`${API_URL}/rates/${id}`, data, { headers });
  return res.data;
};

export const deleteRate = async (id) => {
  const res = await axios.delete(`${API_URL}/rates/${id}`, getAuthHeader());
  return res.data;
};

// --- PDF DOWNLOAD (CRITICAL FIX) ---
export const downloadQuotationPDF = async (quoteData) => {
  // Fixed: Uses responseType: 'blob' to prevent file corruption
  const res = await axios.post(`${API_URL}/quotation/download`, quoteData, {
    ...getAuthHeader(),
    responseType: "blob", 
  });
  return res.data;
};

// --- ADMIN & NOTIFICATIONS ---
export const getAllUsers = async () => {
  const res = await axios.get(`${API_URL}/admin/users`, getAuthHeader());
  return res.data;
};

export const sendAdminNotification = async (notifData) => {
  // Fixed: Triggered when user calculates a quote
  const res = await axios.post(`${API_URL}/notifications`, notifData, getAuthHeader());
  return res.data;
};

export const getAdminNotifications = async () => {
  const res = await axios.get(`${API_URL}/notifications/admin`, getAuthHeader());
  return res.data;
};

export const markNotificationsRead = async () => {
  const res = await axios.put(`${API_URL}/notifications/read-all`, {}, getAuthHeader());
  return res.data;
};