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
| **Payment**   | Xendit (webhook auto-update status)                     |
| **UI Library**| Lucide React · TanStack Table · next-themes             |
| **DevOps**    | Docker Compose · Concurrently (monorepo runner)         |

---

## Fitur Utama

### Admin Panel (`/admin`)

- ✅ **Dashboard** — ringkasan statistik utama
- ✅ **Manajemen Kamar** — CRUD kamar per-gedung/lantai/unit, status otomatis (kosong/isi/rusak)
- ✅ **Denah Fasilitas** — visualisasi denah lantai interaktif (`/admin/rooms/facilities`)
- ✅ **Manajemen Penghuni (Kontrak)** — CRUD kontrak, deposit, jumlah motor
- ✅ **Wawancara Calon Penghuni** — proses interview & pembuatan kontrak dengan tab riwayat (Antrian/Diterima/Ditolak)
- ✅ **Tagihan Bulanan** — generate tagihan dengan auto-kalkulasi (sewa + air + listrik + parkir motor)
- ✅ **Manajemen Tarif** — konfigurasi tarif per-rusunawa (`/admin/tariffs`)
- ✅ **Pengajuan Sewa** — review, approve/reject, konversi ke kontrak (`/admin/applications`)
- ✅ **Tiket Keluhan** — tracking keluhan penghuni (Lampu/Listrik, Air/Plumbing, Atap/Bangunan, Lainnya)
- ✅ **RBAC** — Role-Based Access Control (Super Admin / Admin / Penghuni)

### Super Admin Panel (`/admin/superadmin`)

- ✅ **Manajemen Pengurus** — CRUD data pengurus UPTD (foto, jabatan, tier, sosial media)
- ✅ **Landing Page Profil** — data pengurus tampil otomatis di section PROFIL halaman utama

### Portal Penghuni (`/portal`)

- ✅ **Lihat Tagihan** — riwayat tagihan pribadi + status pembayaran
- ✅ **Buat Tiket Keluhan** — formulir pengaduan kerusakan/masalah

### Landing Pages

- ✅ **Halaman Utama** — landing page responsif + dark mode
- ✅ **Halaman per-Rusunawa** — Cigugur Tengah, Cibeureum, Leuwigajah (informasi & denah ruangan)

### Integrasi

- ✅ **Xendit Webhook** — auto-update status invoice ke "Lunas" saat pembayaran masuk
- ✅ **Upload Dokumen** — simpan file KTP/dokumen pendukung

---

## Struktur Project

```text
Sistem-Rusunawa/
├── docker-compose.yml        # Stack: DB + Backend + PgAdmin
├── package.json              # Monorepo runner (concurrently)
│
├── rusun-backend/            # ⚙️ FastAPI Backend
│   ├── app/
│   │   ├── main.py           # Entrypoint, CORS, router registration
│   │   ├── seeder.py         # Seed data (admin, rooms, staff pengurus)
│   │   ├── api/              # API Routes
│   │   │   ├── auth.py       #   POST /api/auth/login, /register
│   │   │   ├── rooms.py      #   CRUD /api/rooms
│   │   │   ├── tenants.py    #   CRUD /api/tenants
│   │   │   ├── invoices.py   #   CRUD /api/invoices + generate
│   │   │   ├── tickets.py    #   CRUD /api/tickets
│   │   │   ├── applications.py # CRUD /api/applications + interview
│   │   │   ├── management.py #   CRUD /api/management (Super Admin)
│   │   │   └── webhooks.py   #   POST /api/webhooks/xendit
│   │   ├── models/           # SQLModel + Pydantic schemas
│   │   │   ├── user.py       #   User (sadmin/admin/penghuni)
│   │   │   ├── room.py       #   Room (3 rusunawa, A-D, lantai I-V)
│   │   │   ├── tenant.py     #   Tenant (kontrak + deposit)
│   │   │   ├── invoice.py    #   Invoice (multi-charge breakdown)
│   │   │   ├── ticket.py     #   Ticket (keluhan penghuni)
│   │   │   ├── application.py#   Application (pengajuan sewa)
│   │   │   └── staff.py      #   Staff/Pengurus UPTD (tier 1-3)
│   │   └── core/             # Config, DB engine, JWT security
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
| `GET`    | `/api/invoices`                       | Auth           | Daftar tagihan                     |
| `POST`   | `/api/invoices`                       | Admin          | Generate tagihan bulanan           |
| `GET`    | `/api/tickets`                        | Auth           | Daftar tiket keluhan               |
| `POST`   | `/api/tickets`                        | Auth           | Buat tiket keluhan baru            |
| `GET`    | `/api/applications`                   | Auth           | Daftar pengajuan sewa              |
| `POST`   | `/api/applications`                   | Public         | Ajukan sewa baru                   |
| `PUT`    | `/api/applications/{id}/interview`    | Admin          | Proses hasil wawancara             |
| `GET`    | `/api/management/`                    | Public         | Daftar pengurus UPTD (landing page)|
| `POST`   | `/api/management/`                    | Super Admin    | Tambah pengurus baru               |
| `PUT`    | `/api/management/{id}`                | Super Admin    | Update data pengurus               |
| `DELETE` | `/api/management/{id}`                | Super Admin    | Hapus pengurus                     |
| `POST`   | `/api/webhooks/xendit`                | Xendit         | Webhook auto-update status invoice |
| `GET`    | `/api/uploads/{path}`                 | Auth           | Akses file dokumen yang diupload   |

📄 **Swagger UI**: <http://localhost:8000/docs>

---

## Data Model

```mermaid
erDiagram
    User ||--o{ Tenant : has
    Room ||--o{ Tenant : assigned_to
    Tenant ||--o{ Invoice : billed
    Tenant ||--o{ Ticket : reports
    Application }o--|| Room : targets

    User {
        int id PK
        string email UK
        string name
        string phone
        enum role "sadmin | admin | penghuni"
        bool is_active
    }

    Room {
        int id PK
        enum rusunawa "Cigugur Tengah | Cibeureum | Leuwigajah"
        string building "A, B, C, D"
        int floor "1-5"
        int unit_number "1-12"
        int room_type "21, 24, 27 m²"
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
        int motor_count "0-4"
        bool is_active
    }

    Invoice {
        int id PK
        int tenant_id FK
        int period_month
        int period_year
        decimal base_rent
        decimal water_charge
        decimal electricity_charge
        decimal parking_charge
        decimal total_amount
        date due_date
        enum status "unpaid | paid | overdue | cancelled"
    }

    Ticket {
        int id PK
        int tenant_id FK
        int room_id FK
        enum category "Lampu | Air | Atap | Lainnya"
        string description
        enum status "pending | progress | resolved"
    }

    Application {
        int id PK
        string nik
        string full_name
        enum rusunawa_target
        enum status "pending | approved | rejected | interview | contract_created"
    }

    Staff {
        int id PK
        string name
        string role
        string nip
        int tier "1=Kepala, 2=Sub-Leader, 3=Operasional"
        string image_url
        json socials
        bool is_active
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

| Aspek | Status | Keterangan |
|-------|--------|------------|
| 3 lokasi Rusunawa | ✅ | `RusunawaSite` enum |
| Tipe kamar (21/24/27 m²) | ✅ | `room_type` field |
| Tarif per-lantai | ✅ | Seeder `PRICE_TABLE` |
| Alur pengajuan & wawancara | ✅ | `Application` → interview → kontrak |
| RBAC (sadmin/admin/penghuni) | ✅ | `UserRole` enum |
| Komponen tagihan (sewa+air+listrik+parkir) | ✅ | `Invoice` model |
| Manajemen pengurus UPTD | ✅ | `Staff` model (tier 1–3) |
| Dokumen otomatis (4 template) | ✅ | `DocumentService` |
| Validasi deposit 2× sewa | ⚠️ | Belum divalidasi otomatis |
| Validasi durasi kontrak 6–24 bln | ⚠️ | Belum divalidasi otomatis |
| Perpanjangan kontrak maks 12 bln | ❌ | Belum ada fitur |
| Denda keterlambatan 2%/bulan | ❌ | Belum ada |
| Mekanisme surat teguran (SP 1/2/3) | ❌ | Belum ada |
| Komponen kebersihan terpisah | ⚠️ | Digabung `other_charge` |
| Syarat dokumen lengkap (KK/Surat Nikah/dll) | ⚠️ | Baru KTP saja |
| Unit difabel (tarif berbeda) | ❌ | Belum dibedakan |
| Pengembalian uang jaminan | ❌ | Belum ada alur |

> **Skor kepatuhan saat ini: ~50% (9/18 aspek)**. Fitur yang belum ada termasuk denda, surat teguran, dan perpanjangan kontrak — sebagian besar adalah fitur fase berikutnya.

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

---

## License

Private — Willy Hanafi © 2026
