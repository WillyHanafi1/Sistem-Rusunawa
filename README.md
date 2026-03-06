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

### Backend
```bash
cd rusun-backend
docker compose up -d          # Start PostgreSQL
pip install -r requirements.txt
python app/seeder.py          # Buat admin default
uvicorn app.main:app --reload
```
API docs: http://localhost:8000/docs
Admin: `admin@rusunawa.com` / `admin123!`

### Frontend
```bash
cd rusun-frontend
npm install
npm run dev
```
App: http://localhost:3000

## Struktur Project
```
Sistem-Rusunawa/
├── rusun-backend/     # FastAPI + SQLModel
│   ├── app/
│   │   ├── api/       # endpoints
│   │   ├── core/      # config, db, security
│   │   └── models/    # SQLModel tables
│   └── docker-compose.yml
└── rusun-frontend/    # Next.js 16
    └── src/
        ├── app/       # App Router pages
        ├── components/
        └── lib/       # api client, auth utils
```
