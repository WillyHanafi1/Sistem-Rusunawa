import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // WAJIB untuk mengirim HttpOnly Cookies secara otomatis
});

// Tidak lagi memerlukan penyuntikan token manual karena browser menanganinya via Cookie

let isLoggingOut = false;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    // Check if it's a network error (no response)
    if (!err.response) {
      console.error("Backend Error: Server Rusunawa tidak dapat dihubungi. Pastikan backend di http://localhost:8100 sudah menyala.");
    }
    // Jika 401 Unauthorized, artinya sesi habis atau token salah
    if (err.response?.status === 401 && typeof window !== "undefined" && !isLoggingOut) {
      const currentPath = window.location.pathname;

      // Jangan logout jika kita di halaman publik (selain /admin atau /portal)
      const isProtectedRoute = currentPath.startsWith("/admin") || currentPath.startsWith("/portal");
      
      if (!isProtectedRoute) {
        // console.warn("401 on public route, avoiding global logout.");
        return Promise.reject(err);
      }

      isLoggingOut = true;
      console.warn("Sesi tidak valid (401). Membersihkan sesi...");

      try {
        // Panggil route logout kita sendiri untuk hapus HttpOnly cookie di server-side Next.js
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (e) {
        console.error("Gagal membersihkan sesi (Server-side):", e);
      }

      // Bersihkan cookie client-side yang tersisa
      const paths = ["/", "/admin", "/portal", "/login"];
      paths.forEach((path) => {
        Cookies.remove("access_token", { path });
        Cookies.remove("user_role", { path });
        Cookies.remove("user_name", { path });
      });

      // Redirect ke login
      window.location.href = "/login?redirect=" + encodeURIComponent(currentPath);
    }
    return Promise.reject(err);
  }
);

export default api;
