import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const BASE_URL = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // WAJIB untuk mengirim HttpOnly Cookies secara otomatis
});

// Tidak lagi memerlukan penyuntikan token manual karena browser menanganinya via Cookie

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Jika 401 Unauthorized, artinya sesi habis atau token salah
    if (err.response?.status === 401 && typeof window !== "undefined") {
      // Sapu bersih semua kemungkinan cookie di berbagai path
      const paths = ['/', '/admin', '/portal', '/login'];
      paths.forEach(path => {
        Cookies.remove("access_token", { path });
        Cookies.remove("user_role", { path });
        Cookies.remove("user_name", { path });
      });
      
      // Fallback tanpa path
      Cookies.remove("access_token");
      Cookies.remove("user_role");
      Cookies.remove("user_name");

      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
