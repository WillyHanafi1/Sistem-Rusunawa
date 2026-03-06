# Sistem Rusunawa 🏠

Sistem manajemen Rumah Susun Sederhana Sewa (Rusunawa) full-stack.

## Tech Stack
- **Backend**: FastAPI + SQLModel + PostgreSQL
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS v4
- **Auth**: JWT (python-jose + passlib bcrypt)
- **Payment**: Xendit (webhook auto-update status)
- **Database**: PostgreSQL 15 via Docker

## Fitur
- ✅ RBAC (Admin & Penghuni)
- ✅ Manajemen Kamar (CRUD + status otomatis)
- ✅ Manajemen Penghuni (kontrak, deposit)
- ✅ Generate Tagihan Bulanan (auto-kalkulasi tarif)
- ✅ Webhook Xendit (status invoice auto-update ke Lunas)
- ✅ Portal Penghuni (lihat tagihan sendiri)

## Cara Menjalankan

Langkah paling cepat adalah menggunakan Docker. Pastikan Anda sudah menginstal Docker Desktop di komputer Anda.

### 1. Persiapan Environment
Pindah ke folder backend dan copy file `.env.example` menjadi `.env`:
```bash
cd rusun-backend
cp .env.example .env
```
*(Catatan: Anda bisa mengubah DATABASE_URL jika perlu, tapi defaultnya sudah saya sesuaikan untuk Docker)*

### 2. Jalankan dengan Docker (Rekomendasi)
Kembali ke folder **root** proyek dan jalankan:
```bash
docker compose up --build -d
```
Aplikasi akan tersedia di:
- **Frontend**: http://localhost:3000
- **Backend (API Docs)**: http://localhost:8000/docs
- **PgAdmin**: http://localhost:5050 (Login: `admin@rusun.com` / `admin123`)

### 3. Generate Data Awal (Seeding)
Setelah kontainer berjalan, buat user admin default:
```bash
docker exec -it rusunawa_backend python app/seeder.py
```
Login Admin: `admin@rusunawa.com` / `admin123!`

---

## Struktur Project
```
Sistem-Rusunawa/
├── docker-compose.yml   # Konfigurasi seluruh stack (DB, BE, FE)
├── rusun-backend/       # FastAPI Backend
│   ├── app/             # Source code (API, Models, DB)
│   └── Dockerfile       # Image Backend
├── rusun-frontend/      # Next.js Frontend
│   ├── src/             # Source code (Pages, Components)
│   └── Dockerfile       # Image Frontend
└── package.json         # Unified runner (npm run dev)
```
