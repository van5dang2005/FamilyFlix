import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Không xử lý 401 cho request login hoặc register
      const url = error.config?.url || "";
      if (!url.includes("/login") && !url.includes("/register")) {
        // Xóa token và user khỏi localStorage
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("current_user_id");
        localStorage.removeItem("current_user");
        
        // Chuyển hướng về login
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;