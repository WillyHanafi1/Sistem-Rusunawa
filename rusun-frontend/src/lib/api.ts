import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // WAJIB untuk mengirim HttpOnly Cookies secara otomatis
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

let isLoggingOut = false;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Check if it's a network error (no response)
    if (!err.response) {
      console.error("Backend Error: Server Rusunawa tidak dapat dihubungi.");
      return Promise.reject(err);
    }

    // If 401 and NOT already retried — try refreshing the token
    if (err.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if we're on a public route
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const isProtectedRoute = currentPath.startsWith("/admin") || currentPath.startsWith("/portal");
        if (!isProtectedRoute) {
          return Promise.reject(err);
        }
      }

      // Don't try to refresh the refresh endpoint itself
      if (originalRequest.url?.includes("/auth/refresh") || originalRequest.url?.includes("/auth/login")) {
        return Promise.reject(err);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      isRefreshing = true;

      try {
        // Attempt to refresh the access token
        await axios.post("/api/auth/refresh", {}, { withCredentials: true });
        processQueue(null);
        return api(originalRequest); // Retry the original request
      } catch (refreshError) {
        processQueue(refreshError);
        
        // Refresh failed — session truly expired, force logout
        if (!isLoggingOut && typeof window !== "undefined") {
          isLoggingOut = true;
          console.warn("Session expired. Redirecting to login...");

          try {
            await fetch("/api/auth/logout", { method: "POST" });
          } catch (e) {
            // Ignore logout errors
          }

          const paths = ["/", "/admin", "/portal", "/login"];
          paths.forEach((path) => {
            Cookies.remove("access_token", { path });
            Cookies.remove("user_role", { path });
            Cookies.remove("user_name", { path });
          });

          const currentPath = window.location.pathname;
          window.location.href = "/login?redirect=" + encodeURIComponent(currentPath);
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
