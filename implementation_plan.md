# Security Audit Implementation Plan: Sistem-Rusunawa

Tujuan dari rencana ini adalah untuk melakukan **Static Application Security Testing (SAST)** / Audit Keamanan Kode Sumber secara menyeluruh pada proyek *Sistem-Rusunawa*. Fokus utama adalah mengidentifikasi kerentanan keamanan pada sisi *Backend* (FastAPI) dan *Frontend* (Next.js) sebelum aplikasi didistribusikan ke lingkungan produksi.

## User Review Required

> [!IMPORTANT]
> Mohon baca cakupan pengujian di bawah ini dan konfirmasikan apakah ini sudah sesuai dengan yang Anda butuhkan. Setelah Anda menyetujui (Approve), saya akan mulai mengeksekusi langkah-langkah audit ini secara sistematis.

## Proposed Audit Scope & Methodology

Proses audit akan dibagi menjadi beberapa fase berdasarkan komponen aplikasi:

### 1. Backend Security Audit (FastAPI & SQLModel)
Bagian ini memfokuskan pada perlindungan data, autentikasi, dan pencegahan eksploitasi pada API.

- **Authentication & Authorization (`rusun-backend/app/api`, `rusun-backend/app/core`)**
  - Menganalisis implementasi JWT (JSON Web Tokens) dan manajemen *session*.
  - Memeriksa kekuatan algoritma *hashing* password (seperti *bcrypt*).
  - Melakukan pengecekan pembatasan hak akses (Role-Based Access Control / RBAC) untuk *endpoint* admin vs penyewa biasa.
- **Data Input Validation & Injection Prevention (`rusun-backend/app/models`, `rusun-backend/app/crud`)**
  - Mengaudit model *Pydantic* untuk memastikan semua input pengguna divalidasi dan disanitasi.
  - Memeriksa eksekusi *query* database untuk memastikan tidak ada celah *SQL Injection* (karena Anda menggunakan SQLModel/SQLAlchemy, risiko lebih ke *raw query* jika ada).
- **Business Logic & File Handling (`rusun-backend/app/services`, dokumen/upload)**
  - Mengevaluasi keamanan fitur *upload* dokumen. Apakah rentan terhadap serangan *Path Traversal* atau pengunggahan file berbahaya (contoh: `.php` atau `.exe` terselubung)?
  - Memeriksa fitur pengunduhan file (contoh: cetak formulir pendaftaran) dari kerentanan *Insecure Direct Object Reference* (IDOR) - apakah *User A* bisa mengunduh kontrak *User B*?
- **Configuration & Secrets (`rusun-backend/.env`, `docker-compose.yml`)**
  - Memastikan *hardcoded passwords* atau kunci API tidak tersebar di seluruh basis kode.

### 2. Frontend Security Audit (Next.js)
Bagian ini fokus pada keamanan interaksi pengguna di sisi *browser*.

- **Cross-Site Scripting (XSS) Prevention (`rusun-frontend/src/views`, `rusun-frontend/src/components`)**
  - Menganalisis bagaimana data yang tidak tepercaya di-*render* di halaman web.
  - Memeriksa penggunaan `dangerouslySetInnerHTML` di kode React/Next.js Anda.
- **Client-Side Storage & Session Handling**
  - Mengevaluasi cara token JWT disimpan (misalnya `localStorage` vs `HttpOnly cookies`). Penyimpanan di `localStorage` sangat rentan terhadap *XSS*.
  - Mengaudit keamanan mekanisme perlindungan *middleware* (`rusun-frontend/src/middleware.ts`) untuk memastikan rute yang dilindungi tidak bocor ke klien yang belum *login*.
- **CSRF & API Integration**
  - Memeriksa konfigurasi *Cross-Origin Resource Sharing* (CORS) jika dikonfigurasi di backend untuk memastikan *origin* frontend sudah *strict*.
  - Melakukan review terhadap cara aplikasi Next.js memanggil API backend (apakah menggunakan token bearer yang aman pada *headers*).

### 3. Dependencies Vulnerability Check
- Mengaudit berkas `rusun-backend/requirements.txt` dan `rusun-frontend/package.json`.
- Mencari keberadaan pustaka/paket pihak ketiga yang memiliki celah keamanan publik yang diketahui (CVEs) dan menyarankan proses pembaruan.

---

## Open Questions

> [!TIP]
> **Adakah prioritas khusus?**
> Jika ada bagian yang baru-baru ini mengalami masalah keamanan (misalnya, masalah autentikasi yang Anda sebutkan secara implisit pada *chat* sebelumnya terkait perbaikan login *loop*), apakah Anda ingin saya memulai dari komponen tersebut terlebih dahulu?

> [!WARNING]
> Proses SAST ini akan berupa pembacaan dan analisis source-code. Tidak ada serangan merusak yang dilemparkan ke database lokal atau konfigurasi Anda. Semua tetap aman dan hasilnya hanya akan berupa dokumen *laporan kerentanan*.

## Verification Plan

Setelah saya menyelesaikan analisis, saya akan memberikan verifikasi melalui:
1. **Laporan Kerentanan Detil (`security_report.md` artifact):** Diurutkan dari Kritis (*Critical*) hingga Rendah (*Low*).
2. **Kode Remediasi:** Menawarkan perbaikan *source-code* secara langsung (*patch*) terhadap masalah-masalah yang ditemukan dan meminta izin Anda untuk menerapkannya.
3. **Checklist Panduan Pengujian Manual:** Jika diperlukan, saya akan memberikan perintah *curl* atau skenario sederhana yang bisa Anda uji secara manual sebelum (sebagai eksploitasi) dan sesudah perbaikan dilakukan.
