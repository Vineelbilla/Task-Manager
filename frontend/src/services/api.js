import axios from "axios";

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://task-manager-production-9e38.up.railway.app/api";

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;