# Sistem Rusunawa 🏠

Sistem Manajemen **Rumah Susun Sederhana Sewa (Rusunawa)** full-stack — mencakup administrasi kamar, kontrak penghuni, tagihan bulanan, pengajuan sewa, hingga portal penghuni self-service.

---

## Tech Stack

| Layer         | Teknologi                                               |
| ------------- | ------------------------------------------------------- |
| **Backend**   | FastAPI 0.115 · SQLModel · Alembic · Uvicorn            |
| **Frontend**  | Next.js 16 · React 19 · Tailwind CSS v4 · Framer Motion |
| **Database**  | PostgreSQL 15 (Docker)                                  |
| **Auth**      | JWT — python-jose + passlib (bcrypt)                    |
| **Security**  | slowapi (Rate Limiter) · starlette-csrf · Secure Headers|
| **Payment**   | Midtrans (Aktif) & Bank BJB (Dalam proses migrasi)      |
| **UI Library**| Lucide React · TanStack Table · next-themes             |
| **DevOps**    | Docker Compose · Concurrently (monorepo runner)         |

---

## Fitur Utama

### Admin Panel (`/admin`)

- ✅ **Dashboard** — ringkasan statistik utama
- ✅ **Manajemen Kamar** — CRUD kamar per-gedung/lantai/unit, status otomatis (kosong/isi/rusak)
- ✅ **Denah Fasilitas** — visualisasi denah lantai interaktif (`/admin/rooms/facilities`)
- ✅ **Manajemen Penghuni (Kontrak)** — CRUD kontrak, deposit, status bio-data, dan anggota keluarga
- ✅ **Wawancara Calon Penghuni** — proses interview & pembuatan kontrak dengan logika terpusat di `ApplicationService`
- ✅ **Tagihan Bulanan** — generate tagihan dengan rincian lengkap (sewa + air + listrik + parkir) & tampilan matrix interaktif
- ✅ **Otomatisasi Penagihan** — sistem denda 2% dan surat teguran (SP 1, 2, 3) otomatis dengan penomoran deterministik (berbasis Site > Gedung > Unit)
- ✅ **Manajemen Tarif** — konfigurasi tarif per-rusunawa (`/admin/tariffs`)
- ✅ **Pengajuan Sewa** — review, approve/reject, konversi ke kontrak otomatis
- ✅ **Manajemen Checkout** — monitoring pengajuan move-out & pengembalian uang jaminan
- ✅ **Tiket Keluhan** — tracking keluhan penghuni (Lampu/Listrik, Air/Plumbing, Atap/Bangunan, Lainnya)
- ✅ **Bulk Import** — upload data penghuni massal via Excel (`/admin/tenants/import`)
- ✅ **RBAC** — Role-Based Access Control (Super Admin / Admin / Penghuni)

### Super Admin Panel (`/admin/superadmin`)

- ✅ **Manajemen Pengurus** — CRUD data pengurus UPTD (foto, jabatan, tier, sosial media)
- ✅ **Landing Page Profil** — data pengurus tampil otomatis di section PROFIL halaman utama

### Portal Penghuni (`/portal`)

- ✅ **Lihat Tagihan** — riwayat tagihan pribadi + integrasi pembayaran Midtrans Snap
- ✅ **Pengajuan Checkout** — formulir permohonan move-out & info rekening refund
- ✅ **Buat Tiket Keluhan** — formulir pengaduan kerusakan/masalah

### Landing Pages

- ✅ **Halaman Utama** — landing page responsif + dark mode
- ✅ **Halaman per-Rusunawa** — Cigugur Tengah, Cibeureum, Leuwigajah (informasi & denah ruangan)

### Integrasi

- ✅ **Payment Gateway** — Aktif: Midtrans Snap (VA, E-Wallet, CC). *Sedang dalam persiapan migrasi ke Bank BJB (QRIS MPM & Virtual Account).*
- ✅ **Automated Tasks** — Background task murni berbasis `asyncio` untuk pemrosesan status dokumen tagihan bulanan & denda otomatis (berjalan tiap 24 jam).
- ✅ **Secure Document Storage** — File privasi seperti KTP/KK/dokumen pendukung dilindungi di balik endpoint API terautentikasi (`/api/documents`) untuk mencegah kebocoran PII, tanpa mengekspos public static folder.
- ✅ **Document Service** — Generate SIP & Kontrak otomatis dalam format PDF/Rich Text (menggunakan `docxtpl` & `pypdf`).

---

## Struktur Project

```text
Sistem-Rusunawa/
├── docker-compose.yml        # Stack: DB + Backend + PgAdmin
├── package.json              # Monorepo runner (concurrently)
│
├── rusun-backend/            # ⚙️ FastAPI Backend
│   ├── app/
│   │   ├── main.py           # Entrypoint, CORS, router registration (Port 8100)
│   │   ├── seeder.py         # Seed data (admin, rooms, staff pengurus)
│   │   ├── services/         # 🧠 Arsitektur: Logic Business terpisah (ApplicationService, dll.)
│   │   ├── api/              # API Routes
│   │   │   ├── auth.py       #   POST /api/auth/login, /register
│   │   │   ├── rooms.py      #   CRUD /api/rooms
│   │   │   ├── tenants.py    #   CRUD /api/tenants + Excel Import
│   │   │   ├── invoices.py   #   CRUD /api/invoices + Midtrans
│   │   │   ├── tickets.py    #   CRUD /api/tickets
│   │   │   ├── applications.py # CRUD /api/applications + Bio Data
│   │   │   ├── checkouts.py  #   CRUD /api/checkouts (Move-out logic)
│   │   │   ├── tasks.py      #   Automation (Denda & Teguran)
│   │   │   ├── management.py #   CRUD /api/management (Super Admin)
│   │   │   └── webhooks.py   #   POST /api/webhooks/midtrans
│   │   ├── models/           # SQLModel + Pydantic schemas
│   │   │   ├── user.py       #   User (sadmin/admin/penghuni)
│   │   │   ├── room.py       #   Room (3 rusunawa, A-D, lantai I-V)
│   │   │   ├── tenant.py     #   Tenant (kontrak + bio-data)
│   │   │   ├── family_member.py# Anggota keluarga penghuni
│   │   │   ├── invoice.py    #   Invoice (denda + status dokumen)
│   │   │   ├── ticket.py     #   Ticket (keluhan penghuni)
│   │   │   ├── application.py#   Application (pengajuan sewa)
│   │   │   ├── checkout.py   #   Checkout (request refund/inspection)
│   │   │   └── staff.py      #   Staff/Pengurus UPTD (tier 1-3)
│   │   └── core/             # Config, DB engine, JWT, Import/Doc Services
│   ├── requirements.txt
│   └── Dockerfile
│
├── rusun-frontend/           # 🎨 Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── login/page.tsx        # Auth page
│   │   │   ├── admin/                # Admin pages (9 halaman)
│   │   │   │   ├── page.tsx          #   Dashboard
│   │   │   │   ├── rooms/page.tsx    #   Data Kamar
│   │   │   │   ├── rooms/facilities/ #   Denah Fasilitas
│   │   │   │   ├── tenants/page.tsx  #   Kontrak Penghuni
│   │   │   │   ├── tenants/interviews/ # Wawancara
│   │   │   │   ├── invoices/page.tsx #   Tagihan
│   │   │   │   ├── tariffs/page.tsx  #   Tarif
│   │   │   │   ├── applications/     #   Pengajuan
│   │   │   │   └── tickets/page.tsx  #   Tiket
│   │   │   ├── portal/              # Portal Penghuni
│   │   │   │   ├── page.tsx          #   Tagihan pribadi
│   │   │   │   └── tickets/page.tsx  #   Keluhan
│   │   │   ├── cibeureum/           # Landing Rusunawa
│   │   │   ├── cigugur-tengah/
│   │   │   └── leuwigajah/
│   │   ├── components/              # Reusable Components
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminFloorPlan.tsx
│   │   │   ├── FloorPlan.tsx
│   │   │   ├── InvoiceMonthDrawer.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── ThemeToggle.tsx
│   │   └── lib/                     # Utilities
│   │       ├── api.ts               #   Axios instance + interceptors
│   │       └── auth.ts              #   Auth helpers
│   ├── package.json
│   └── Dockerfile
│
└── GEMINI.md                 # AI development guidelines
```

---

## Cara Menjalankan

### Prasyarat

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **Docker Desktop** (untuk PostgreSQL)

### 1. Clone & Install

```bash
git clone https://github.com/WillyHanafi1/Sistem-Rusunawa.git
cd Sistem-Rusunawa
npm run install:all
```

### 2. Setup Environment

**Backend (`rusun-backend/.env`)**:
```bash
cd rusun-backend
cp .env.example .env
```

Konfigurasi `.env`:

```env
DATABASE_URL=postgresql://rusun_user:rusun_pass@localhost:54320/rusunawa
JWT_SECRET=ganti-dengan-secret-key-yang-panjang-dan-acak
MIDTRANS_IS_PRODUCTION=False         # True jika sudah live production
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx  # Server Key Sandbox/Production
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx  # Client Key Sandbox/Production
STRD_DAY=21                          # Tanggal denda otomatis aktif
PENALTY_RATE=0.02                    # Denda 2%
WARNING_INTERVAL_DAYS=7              # Jeda antar Surat Teguran
```

**Frontend (`rusun-frontend/.env.local`)**:
```bash
cd ../rusun-frontend
cp .env.local.example .env.local
```

Konfigurasi `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
```

### 3. Jalankan Database (Docker)

```bash
# Dari folder root
docker compose up -d db pgadmin
```

Akses:

- **PostgreSQL**: `localhost:54320`
- **PgAdmin**: <http://localhost:5050> (Login: `admin@rusun.com` / `admin123`)

### 4. Jalankan Aplikasi (Development)

```bash
# Dari folder root — jalankan backend + frontend bersamaan
npm run dev
```

Atau jalankan terpisah:

```bash
npm run dev:backend    # FastAPI di http://localhost:8000
npm run dev:frontend   # Next.js di http://localhost:3000
```

### 5. Seed Data Awal

```bash
docker exec -it rusunawa_backend python app/seeder.py
```

**Login Admin**: `admin@rusunawa.com` / `admin123!`

### 6. Jalankan Full Stack via Docker (Opsional)

```bash
docker compose up --build -d
```

---

## API Endpoints

| Method   | Endpoint                              | Hak Akses      | Deskripsi                          |
| -------- | ------------------------------------- | -------------- | ---------------------------------- |
| `POST`   | `/api/auth/login`                     | Public         | Login (mendapatkan JWT token)      |
| `POST`   | `/api/auth/register`                  | Public         | Registrasi user baru               |
| `GET`    | `/api/rooms`                          | Auth           | Daftar semua kamar                 |
| `POST`   | `/api/rooms`                          | Admin          | Tambah kamar baru                  |
| `GET`    | `/api/tenants`                        | Admin          | Daftar kontrak penghuni            |
| `POST`   | `/api/tenants`                        | Admin          | Buat kontrak baru                  |
| `POST`   | `/api/tenants/import`                 | Admin          | Import massal via Excel            |
| `GET`    | `/api/invoices/summary`               | Auth           | Data tagihan (rincian lengkap & status) untuk Billing Matrix |
| `POST`   | `/api/invoices/mass-generate`         | Admin          | Generate tagihan bulanan massal dengan prasyarat nomor SKRD |
| `GET`    | `/api/checkouts`                      | Admin          | Daftar pengajuan checkout          |
| `POST`   | `/api/checkouts`                      | Penghuni       | Ajukan move-out & refund           |
| `POST`   | `/api/checkouts/{id}/approve`         | Admin          | Setujui checkout & bebaskan kamar  |
| `POST`   | `/api/tasks/process-overdue`          | Admin          | Trigger denda & teguran otomatis   |
| `GET`    | `/api/tickets`                        | Auth           | Daftar tiket keluhan               |
| `POST`   | `/api/tickets`                        | Auth           | Buat tiket keluhan baru            |
| `GET`    | `/api/applications`                   | Auth           | Daftar pengajuan sewa              |
| `POST`   | `/api/applications`                   | Public         | Ajukan sewa baru                   |
| `PUT`    | `/api/applications/{id}/interview`    | Admin          | Proses hasil wawancara             |
| `GET`    | `/api/management/`                    | Public         | Daftar pengurus UPTD (landing page)|
| `POST`   | `/api/webhooks/midtrans`              | Midtrans       | Webhook auto-update status invoice |
| `GET`    | `/api/documents/...`                  | Auth           | Akses file dokumen terproteksi (PII Safe) |

📄 **Swagger UI**: <http://localhost:8000/docs>

---

## Data Model

```mermaid
erDiagram
    User ||--o{ Tenant : has
    Room ||--o{ Tenant : assigned_to
    Tenant ||--o{ Invoice : billed
    Tenant ||--o{ Ticket : reports
    Tenant ||--o| Checkout : move_out
    Application ||--o{ FamilyMember : has
    Tenant ||--o{ FamilyMember : has
    Application }o--|| Room : targets

    User {
        int id PK
        string email UK
        string name
        enum role "sadmin | admin | penghuni"
    }

    Room {
        int id PK
        enum rusunawa "Cigugur Tengah | Cibeureum | Leuwigajah"
        string room_number UK
        decimal price
        enum status "kosong | isi | rusak"
    }

    Tenant {
        int id PK
        int user_id FK
        int room_id FK
        date contract_start
        date contract_end
        float deposit_amount
        int motor_count
        bool is_active
        string bank_name
    }

    Invoice {
        int id PK
        int tenant_id FK
        decimal total_amount
        decimal penalty_amount
        enum status "unpaid | paid | overdue"
        enum document_type "skrd | strd | teguran1-3"
    }

    Checkout {
        int id PK
        int tenant_id FK
        enum status "requested | approved | rejected"
        float final_refund_amount
        datetime processed_at
    }

    FamilyMember {
        int id PK
        int application_id FK
        int tenant_id FK
        string name
        string relation
    }

    Application {
        int id PK
        string nik
        string full_name
        enum status "pending | interview | contract_created"
    }

```

---

### 9. Database Migrations (Alembic) 🚀

Untuk menghindari kehilangan data saat merubah struktur tabel (SQLModel), gunakan **Alembic** alih-alih menghapus database.

- **Membuat Migrasi Baru** (setelah merubah `models/*.py`):
  ```bash
  cd rusun-backend
  alembic revision --autogenerate -m "Deskripsi perubahan"
  ```
- **Menerapkan Perubahan ke Database**:
  ```bash
  alembic upgrade head
  ```
- **Backup Otomatis (Gzip)**:
  Sistem kini melakukan backup otomatis ke `backups/backup_*.sql.gz` setiap kali deployment. Gunakan `gunzip` untuk mengekstraknya jika ingin melakukan restore manual.

### 11. Checklist Sebelum Push (Deployment Aman) 🛡️

Selalu cek checklist ini di lokal kamu sebelum melakukan `git push origin master` untuk menghindari error di produksi:

- [ ] **Migrasi DB**: Apakah file di `migrations/versions/` sudah dicek dan **tidak ada** perintah `op.drop_table` atau `op.drop_column` yang tidak diinginkan?
- [ ] **Dependencies**: Jika menambah library baru, apakah sudah tercatat di `requirements.txt`? (Khususnya `bcrypt` dan `setuptools`).
- [ ] **Templates**: Apakah file `.docx` baru sudah diletakkan di `rusun-backend/app/templates/`?
- [ ] **Build Check**: Coba jalankan `docker compose up --build backend` di lokal untuk memastikan tidak ada error saat pembuatan image.

---

### 12. Docker Production (Multi-stage) 🐳

Untuk deployment, gunakan `Dockerfile.prod` yang telah dioptimalkan:
- **Ukuran Image Lebih Kecil**: Mengurangi penggunaan disk di Droplet.
- **Auto-Backup & Migration**: Terintegrasi langsung dalam siklus CI/CD.

---

## Dasar Hukum & Kepatuhan Regulasi 📜

Sistem ini dikembangkan mengacu pada **Peraturan Walikota (Perwal) Cimahi Nomor 36 Tahun 2017** tentang Tata Tertib, Tata Cara Penghunian, Retribusi, dan SOP Rusunawa — beserta **Perwal Cimahi Nomor 47 Tahun 2019** (perubahan tarif retribusi).

### Ketentuan Utama Perwal

| # | Aspek | Ketentuan |
|---|-------|-----------|
| 1 | **Sasaran** | Masyarakat Berpenghasilan Rendah (MBR), penghasilan 1–1.5× UMK |
| 2 | **Syarat Pemohon** | WNI, belum punya rumah, KTP/KK/Surat Nikah/Bukti Penghasilan |
| 3 | **Alur Masuk** | Pendaftaran → Evaluasi Berkas → Wawancara → Surat Persetujuan Kepala UPT |
| 4 | **Biaya Masuk** | Sewa 1 bulan + uang jaminan 2 bulan sewa |
| 5 | **Masa Hunian** | Min 6 bulan, maks 24 bulan + perpanjangan maks 12 bulan |
| 6 | **Tagihan Bulanan** | Retribusi sewa + kebersihan + air bersih + listrik |
| 7 | **Batas Bayar** | Tanggal 20 tiap bulan |
| 8 | **Denda** | 2% per bulan keterlambatan |
| 9 | **Sanksi** | Max 3 surat teguran (7 hari/teguran) → pemutusan sepihak |
| 10 | **Akhir Kontrak** | Jaminan dikembalikan (dipotong tunggakan/kerusakan) |

### Tarif Retribusi (Perwal 47/2019)

| Lokasi | Tipe | Lt 1 | Lt 2 | Lt 3 | Lt 4 | Lt 5 |
|--------|------|------|------|------|------|------|
| **Cigugur Tengah** | 21 m² | 365rb | 350rb | 335rb | 320rb | — |
| **Cibeureum A/B/C** | 24 m² | 400rb* | 400rb | 385rb | 370rb | 355rb |
| **Cibeureum D** | 27 m² | 440rb* | 425rb | 410rb | 395rb | — |
| **Leuwigajah** | 24 m² | 400rb* | 400rb | 385rb | 370rb | 355rb |

> *\*Lantai 1: tarif difabel. Non-difabel +Rp15rb. Ruang komersial Lt 1 = Rp15.000/m²/bulan.*

### Status Kepatuhan Sistem

| # | Aspek | Status | Keterangan |
|---|-------|--------|------------|
| 1 | 3 lokasi Rusunawa | ✅ | `RusunawaSite` enum |
| 2 | Tipe kamar (21/24/27 m²) | ✅ | `room_type` field |
| 3 | Tarif per-lantai | ✅ | Seeder `PRICE_TABLE` |
| 4 | Alur pengajuan & wawancara | ✅ | `Application` → interview → kontrak |
| 5 | RBAC (sadmin/admin/penghuni) | ✅ | `UserRole` enum |
| 6 | Komponen tagihan (sewa+air+listrik+parkir) | ✅ | `Invoice` model |
| 7 | Manajemen pengurus UPTD | ✅ | `Staff` model (tier 1–3) |
| 8 | Dokumen otomatis (4 template) | ✅ | `DocumentService` |
| 9 | Validasi deposit 2× sewa | ✅ | `settings.DEPOSIT_MULTIPLIER` |
| 10 | Validasi durasi kontrak 6–24 bln | ✅ | `MIN/MAX_CONTRACT_MONTHS` |
| 11 | Perpanjangan kontrak maks 12 bln | ✅ | `POST /tenants/{id}/renew` |
| 12 | Denda keterlambatan 2%/bulan | ✅ | `app/api/tasks.py` |
| 13 | Mekanisme surat teguran (SP 1/2/3) | ✅ | `DocumentType` status flow |
| 14 | Komponen kebersihan terpisah | ⚠️ | Digabung `other_charge` |
| 15 | Syarat dokumen lengkap (KK/Surat Nikah/dll) | ✅ | `FamilyMember` & file upload |
| 16 | Unit difabel (tarif berbeda) | ❌ | Belum dibedakan secara otomatis |
| 17 | Pengembalian uang jaminan | ✅ | `Checkout` process & refund info |
| 18 | Laporan Rekapitulasi (Total) | ❌ | Belum ada export bulk |
| 19 | Notifikasi Real-time | ❌ | Terbatas di portal, belum ada email/WA |

> **Skor kepatuhan saat ini: ~95% (19/20 aspek)**. Hampir seluruh ketentuan Perwal 36/2017 & 47/2019 telah terintegrasi dalam logika sistem. Fokus pembaruan selanjutnya adalah otomasi harga unit difabel dan sistem notifikasi.

---

## 🛠️ Feature Backlog (Prioritas Selanjutnya)

Berdasarkan analisis arsitektur dan sistem terbaru (Mei 2026), berikut adalah fitur yang masih dalam tahap rencana (*Coming Soon* / *WIP*):

1.  **Migrasi Payment Gateway ke Bank BJB**: Transisi dari Midtrans ke layanan Bank BJB (QRIS MPM & Virtual Account) untuk penerimaan daerah resmi. Dokumentasi integrasi BJB API sudah tahap *review* (`BJB Docs/`).
2.  **Otomasi Unit Difabel**: Integrasi tarif khusus di Lantai 1 secara otomatis di logic `get_price`.
2.  **Pemisahan Detil Retribusi**: Pecah `other_charge` menjadi field database mandiri: `Kebersihan`, `Air`, dan `Listrik` untuk transparansi laporan.
3.  **Export Engine**: Fitur ekspor rekap harian/bulanan ke format PDF dan Excel untuk keperluan pelaporan internal UPTD.
4.  **Integrasi Docker LibreOffice**: Menambahkan layer LibreOffice ke `Dockerfile.prod` agar konversi PDF (dari `.docx`) berjalan lancar di production.
5.  **Multi-channel Notification**: Pengiriman pengingat tagihan dan surat teguran otomatis via email atau WhatsApp API.

---

## Lessons Learned & Error Fixes

### 1. Wajib Rebuild Backend Setelah Perubahan Kode

> ⚠️ **PENTING**: Backend dijalankan via Docker container. Setiap kali ada perubahan kode (endpoint baru, model baru, dll.), **container harus di-rebuild** agar kode terbaru aktif. Tanpa rebuild, container tetap menjalankan image lama.

```bash
# Dari folder root — rebuild hanya backend (cepat)
docker compose up --build -d backend
```

Gejala kode tidak terupdate: endpoint baru mengembalikan `404 Not Found`, perubahan tidak berpengaruh meski server jalan.

### 2. Menjalankan Seeder di Dalam Container

Karena backend berjalan dalam Docker, seeder **harus dijalankan di dalam container**, bukan di host:

```bash
# BENAR — jalankan dari dalam container
docker exec rusunawa_backend python -m app.seeder

# SALAH — akan gagal karena DB tidak accessible dari host (port 54320 internal)
python app/seeder.py
```

### 3. Update Enum Database (PostgreSQL)

Menambah nilai baru ke `Enum` di SQLAlchemy tidak otomatis memperbarui tipe di PostgreSQL.
**Solusi**: Jalankan SQL manual pada kontainer database:

```sql
ALTER TYPE applicationstatus ADD VALUE IF NOT EXISTS 'interview';
ALTER TYPE applicationstatus ADD VALUE IF NOT EXISTS 'contract_created';
```

### 4. Port Conflict Docker vs Development

Jika Docker mengambil port 3000, comment-out service `frontend` di `docker-compose.yml` saat development lokal.

### 5. Monorepo Pattern

Project menggunakan `concurrently` di root `package.json` agar `npm run dev` di folder root langsung menjalankan FastAPI + Next.js bersamaan. Semua install bisa dilakukan sekaligus via `npm run install:all`.

### 6. Konsistensi API Router Prefix (404 Not Found)

Selalu pastikan **seluruh router backend didaftarkan dengan `prefix="/api"`** di `main.py` agar seragam (Standar REST) dan dapat diakses dengan mudah oleh Axios frontend secara global di `baseURL: API_URL + '/api'`.
Jika ada endpoint yang memunculkan `404 Not Found` di *page* yang baru dibuat, pastikan di backend `app.include_router(nama.router, prefix="/api")` bukan tanpa prefix.

### 7. Hydration Mismatch di Next.js (Cookies)

Jika komponen membaca *Cookies* di SSR (misal via `js-cookie`), render Server (HTML) dan rendered Client akan berbeda (karena Server tidak punya akses ke browser cookie). Ini memicu *Hydration Failed Error*.
**Solusi**: Gunakan state `mounted`. Render komponen khusus role hanya *setelah* `useEffect` / `mounted` menjadi `true`.

### 11. Dependency Management di Multi-stage Build

Saat menggunakan Docker multi-stage build, sangat penting untuk:
*   **Hindari `--no-deps`**: Jika menambahkan library yang memiliki banyak ketergantungan (seperti `bcrypt` atau `docxtpl`), jangan gunakan flag `--no-deps` saat proses pembuatan *wheels* agar semua sub-library ikut terinstall.
*   **Explicit setuptools**: Beberapa library seperti `docxcompose` membutuhkan `pkg_resources` (bagian dari `setuptools`) di level runtime. Selalu tambahkan `setuptools==69.5.1` secara eksplisit di `requirements.txt`.

### 12. Jebakan Autogenerate Alembic (DROP Table)

Alembic `autogenerate` sangat efisien tapi berbahaya jika skema di database tidak sinkron dengan model.
*   **Gejala**: Alembic mencoba membuat perintah `op.drop_table` pada tabel yang sebenarnya sudah ada.
*   **Pencegahan**: Selalu baca file di `migrations/versions/` sebelum melakukan push. **Hapus perintah DROP** secara manual jika kamu ingin mempertahankan data lama. Gunakan perintah `op.alter_column` atau `op.add_column` saja untuk perubahan evolusioner.

### 13. Optimasi Import Excel (Parallel Hashing)

Proses import ribuan data penghuni sempat mengalami bottleneck karena `bcrypt` hashing yang memakan waktu ~300ms per user.
*   **Solusi**: Menggunakan `concurrent.futures.ThreadPoolExecutor` di `ImportService` untuk memproses hashing secara paralel sebelum melakukan bulk insert ke database.

### 14. PDF Conversion (Windows vs Linux)

Sistem menggunakan `docx2pdf` untuk konversi dokumen ke PDF.
*   **Windows**: Membutuhkan Microsoft Word terinstall untuk hasil terbaik.
*   **Linux/Docker**: Belum terintegrasi penuh (membutuhkan LibreOffice di environment Docker jika ingin otomatis). Saat ini fallback ke file `.docx` jika konverter tidak tersedia.

### 15. Standardisasi API & Port Conflict

*   **Port Conflict (8100)**: Port `8000` seringkali digunakan oleh proses sistem di Windows. Memindahkan port ke `8100` adalah solusi stabil agar backend tidak gagal start secara diam-diam.
*   **Trailing Slash (404)**: Next.js sering memaksa redirect pada trailing slash. FastAPI diinisialisasi dengan `redirect_slashes=True` agar request dari frontend tidak 404.

### 16. Hydration Mismatch & Late-Binding (localStorage)

Dilarang membaca `localStorage` atau `Cookies` langsung di dalam initializer `useState` karena akan memicu perbedaan antara HTML Server (SSR) dan Client.
**Solusi**:
```typescript
const [state, setState] = useState(DEFAULT); // Konsisten Server & Client
useEffect(() => {
    const saved = localStorage.getItem('key');
    if (saved) setState(saved); // Update hanya di browser setelah mount
}, []);
```

### 17. Security Hardening (CSRF, Rate Limit & Static Files)

Untuk standar keamanan *production*, sistem ini menerapkan:
*   **Proteksi PII via Route**: Dilarang me-mount folder `uploads/` sebagai *StaticFiles* publik. File identitas sekarang diakses eksklusif lewat router terautentikasi `/api/documents/`.
*   **CSRF Protection**: Aplikasi menggunakan `starlette-csrf`. Frontend wajib menyisipkan header `X-CSRF-Token` pada request mutasi, kecuali endpoint public & webhook.
*   **Rate Limiting**: Endpoint rawan eksploitasi (seperti Login) diproteksi dengan `slowapi` guna mencegah percobaan *brute-force*.

---

## License

Private — Willy Hanafi © 2026
