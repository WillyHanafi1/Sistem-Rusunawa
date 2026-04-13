import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // WAJIB untuk mengirim HttpOnly Cookies secara otomatis
});

// CSRF Interceptor: Attach X-CSRF-Token to non-GET requests
api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();
  if (method && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = Cookies.get("csrftoken");
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
  }
  return config;
});

/**
 * Ensures a CSRF token is present in cookies by calling the backend /csrf endpoint.
 */
export const ensureCsrfToken = async () => {
  try {
    const token = Cookies.get("csrftoken");
    // If token already exists, we might still want to refresh it or just skip
    if (!token) {
      await axios.get("/api/auth/csrf", { withCredentials: true });
    }
  } catch (err) {
    console.error("Failed to fetch CSRF token:", err);
  }
};

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

export const handleDownload = async (url: string, filename?: string, openInNewTab = false) => {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    
    // Attempt to extract filename from response headers if not provided
    let fileName = filename;
    const contentDisposition = response.headers['content-disposition'];
    if (!fileName && contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch && fileNameMatch.length > 1) {
        fileName = fileNameMatch[1];
      }
    }

    const contentType = response.headers['content-type'] || 'application/pdf';
    const blob = new Blob([response.data], { type: contentType });
    const blobUrl = window.URL.createObjectURL(blob);
    
    if (openInNewTab) {
      const newWindow = window.open(blobUrl, '_blank');
      if (!newWindow) {
        // If popup is blocked, fall back to download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', fileName || 'document.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } else {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName || 'document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Cleanup
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
    }
  } catch (error) {
    console.error("Download failed:", error);
    throw error;
  }
};


/**
 * Preview a PDF document in a new browser tab.
 * 
 * Uses authenticated axios instance (cookies + interceptors) to fetch the PDF
 * as a Blob, then creates a local Object URL and opens it in a new tab.
 * This approach:
 * - Guarantees auth cookies are sent (via axios withCredentials)
 * - Ensures Content-Type is application/pdf (validated)
 * - Bypasses any proxy header-stripping issues
 * - Falls back to download if popup is blocked
 * 
 * @param endpoint - API endpoint path (e.g., "/invoices/1/print?doc_type=skrd")
 * @param fallbackFilename - Filename for download fallback (e.g., "skrd_1.pdf")
 */
/**
 * Membuka pratinjau PDF di tab baru menggunakan sistem One-time Token (OTT).
 * Keuntungan: Browser menggunakan native PDF viewer, lebih ringan (no blob memory), 
 * dan bypass semua masalah proxy MIME-type.
 * 
 * @param endpoint - Endpoint asli (misal: /invoices/751/print?doc_type=skrd)
 */
export const previewPdf = async (endpoint: string): Promise<void> => {
  // 1. Buka tab kosong SINKRON segera — krusial agar tidak diblokir browser popup blocker
  const newWindow = typeof window !== "undefined" ? window.open('', '_blank') : null;
  
  if (newWindow) {
    newWindow.document.write(`
      <html>
        <head><title>Memuat Dokumen...</title></head>
        <body style="font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#f4f4f5; color:#71717a; margin:0;">
          <div style="width:30px; height:30px; border:3px solid #e4e4e7; border-top-color:#0f172a; border-radius:50%; animation:spin 1s linear infinite;"></div>
          <p style="margin-top:16px; font-size:14px; font-weight:500;">Menyiapkan pratinjau dokumen...</p>
          <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        </body>
      </html>
    `);
  }

  try {
    // 2. Tentukan endpoint token berbasis endpoint aslinya
    // Single: /invoices/123/print -> /invoices/123/token
    // Bulk:   /invoices/print-bulk -> /invoices/bulk-token
    // map backend route to token route - safe regex mapping
    const tokenEndpoint = endpoint.includes('/print-bulk')
      ? endpoint.replace(/\/print-bulk(\?|$)/, '/bulk-token$1')
      : endpoint.replace(/\/print(\?|$)/, '/token$1');

    // 3. Ambil token pratinjau (60 detik expired, sekali pakai)
    // Endpoint ini memerlukan cookie admin
    const response = await api.get(tokenEndpoint);
    const { token } = response.data;

    // 4. Arahkan tab baru ke URL pratinjau publik backend
    const previewUrl = `/api/invoices/preview/${token}`;
    
    if (newWindow) {
      newWindow.location.href = previewUrl;
    } else {
      // Fallback jika tab gagal dibuka di baris pertama
      window.open(previewUrl, '_blank');
    }

  } catch (error: any) {
    if (newWindow) newWindow.close();
    
    let message = 'Gagal memproses pratinjau dokumen.';
    if (error.response?.data?.detail) {
      message = error.response.data.detail;
    } else if (error.message) {
      message = error.message;
    }
    
    throw new Error(message);
  }
};


export default api;
