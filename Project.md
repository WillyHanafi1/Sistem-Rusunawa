Mantap. Sebagai seorang *Senior Developer*, mari kita susun *Product Requirements Document* (PRD) versi ringkas namun komprehensif, lalu kita petakan langkah eksekusi pertamanya.

Berikut adalah rancangan *requirements* untuk aplikasi Rusunawa ini, dibagi berdasarkan fitur inti:

### 1. Kebutuhan Sistem (System Requirements)

**A. Modul Autentikasi & Otorisasi (RBAC)**

* **Admin:** Bisa mengakses seluruh sistem (master data, keuangan, manajemen keluhan).
* **Penghuni:** Hanya bisa melihat data tagihan dan kamar miliknya sendiri, serta membuat tiket keluhan.

**B. Modul Master Data (Portal Admin)**

* **Manajemen Unit/Kamar:** CRUD data gedung, lantai, nomor kamar, tipe (misal: tipe studio, tipe 2 kamar), status kamar (Kosong, Isi, Rusak), dan harga sewa dasar.
* **Manajemen Penghuni:** Pendaftaran penghuni baru, *upload* dokumen (KTP/KK), dan alokasi penghuni ke kamar tertentu beserta masa kontraknya.

**C. Modul Keuangan & Tagihan (Core Feature)**

* **Generate Tagihan (Admin):** Pembuatan *invoice* bulanan. Bisa gabungan antara tarif flat (sewa kamar) dan tarif variabel (meteran air & listrik jika ada).
* **Payment Gateway (Admin & Penghuni):** * Penghuni bisa melihat tagihan aktif di *dashboard* mereka dan klik "Bayar".
* Sistem men-generate *payment link* atau Virtual Account/QRIS via Midtrans/Xendit.


* **Webhook Listener (Backend):** Endpoint untuk menerima *callback* dari Payment Gateway agar status tagihan otomatis berubah menjadi "Lunas" (tanpa admin harus cek mutasi manual).

**D. Modul Keluhan/Operasional (Opsional/Fase 2)**

* **Ticketing:** Penghuni bisa melaporkan kerusakan (misal: "Lampu lorong mati").
* **Tracking:** Admin bisa mengubah status tiket (Menunggu, Dikerjakan Teknisi, Selesai).

---

### 2. Apa yang Perlu Kamu Buat Pertama Kali?

Jangan langsung membuat halaman Login di FE atau mengutak-atik integrasi Payment Gateway. Mari kita mulai dari fondasi datanya. Berikut adalah urutan eksekusi (*roadmap*) untuk minggu pertamamu:

**Langkah 1: Setup *Environment* & Repositori (Hari 1)**

* Buat dua *folder/repo*: `rusun-frontend` (Next.js) dan `rusun-backend` (FastAPI).
* Siapkan *database* PostgreSQL lokal (atau via Docker).

**Langkah 2: Pemodelan Database / ERD (Hari 1-2) 👈 Ini prioritas pertamamu**
Kamu harus menetapkan struktur tabel inti sebelum menulis logika apapun. Tabel yang wajib dibuat pertama kali:

* `Users` (id, email, password_hash, role: admin/penghuni)
* `Rooms` (id, room_number, floor, price, status)
* `Tenants` (id, user_id, room_id, contract_start, contract_end)
* `Invoices` (id, tenant_id, amount, due_date, status: unpaid/paid, payment_url)

**Langkah 3: Bangun "Slice 1" - Master Data Kamar & Auth (Hari 3-5)**

* **Backend (FastAPI):**
* Buat koneksi DB (menggunakan SQLAlchemy atau SQLModel).
* Buat *endpoint* login untuk *generate* JWT Token.
* Buat *endpoint* CRUD sederhana untuk tabel `Rooms` yang diproteksi (hanya Admin yang bisa akses).


* **Frontend (Next.js):**
* Buat halaman Login.
* Simpan JWT Token (di *cookies* agar aman).
* Buat halaman Dashboard Admin (Tabel/Grid sederhana untuk menampilkan daftar `Rooms` yang di-fetch dari backend).



**Langkah 4: Bangun "Slice 2" - Tagihan & Webhook (Minggu ke-2)**
Setelah Master Data stabil, baru kamu masuk ke pembuatan API tagihan, integrasi SDK Xendit/Midtrans, dan pembuatan *Webhook listener*.

---

**Bagaimana?** Jika kamu setuju dengan alur ini, langkah konkret pertama yang bisa kita kerjakan sekarang adalah membuat kode **Model Database (SQLAlchemy/SQLModel)** untuk FastAPI-nya.

Apakah kamu ingin aku buatkan *boilerplate* kode Python-nya untuk model `Users`, `Rooms`, dan `Invoices` agar kamu bisa langsung *copy-paste* dan modifikasi?