# Analisis Berkas & Template — Sistem Rusunawa

Analisis ini merujuk pada **Perwal Cimahi No. 36 Tahun 2017** sebagai sumber regulasi, dan membandingkannya dengan implementasi di codebase project.

---

## 1. Berkas yang Harus Disiapkan Calon Penghuni (Pendaftaran)

Berdasarkan **Pasal 11 Perwal** dan implementasi di [application.py](file:///d:/Project/Sistem%20Rusunawa/rusun-backend/app/models/application.py), berikut daftar berkas pendaftaran:

| # | Berkas (Perwal Pasal 11) | Field di Model `Application` | Upload di API | Status |
|---|---|---|---|---|
| 1 | Fotokopi KTP suami/istri | `ktp_file_path` | `ktp_file` (wajib) | ✅ Ada |
| 2 | Fotokopi Kartu Keluarga | `kk_file_path` | `kk_file` (opsional) | ✅ Ada |
| 3 | Fotokopi Surat Nikah | `marriage_cert_file_path` | `marriage_cert_file` (opsional) | ✅ Ada |
| 4 | Surat Keterangan Penghasilan | `sku_file_path` | `sku_file` (opsional) | ✅ Ada |
| 5 | Surat Keterangan Belum Punya Rumah | — | — | ❌ **Tidak ada** |
| 6 | Surat Pernyataan bersedia memenuhi ketentuan | `has_signed_statement` (boolean) | `has_signed_statement` | ⚠️ Hanya flag, bukan file |
| 7 | Surat Pernyataan sanggup bayar retribusi | — | — | ❌ **Tidak ada** |
| 8 | Surat Permohonan Menghuni | — | — | ❌ **Tidak ada** (tapi di-generate via `template_pengajuan`) |
| 9 | Pas Foto 4×6 (2 buah) | `photo_file_path` | `photo_file` (opsional) | ✅ Ada |
| 10 | SKCK *(tambahan sistem)* | `skck_file_path` | `skck_file` (opsional) | ✅ Ada (bukan Perwal) |
| 11 | Surat Keterangan Sehat *(tambahan sistem)* | `health_cert_file_path` | `health_cert_file` (opsional) | ✅ Ada (bukan Perwal) |

> [!IMPORTANT]
> **3 berkas dari Perwal yang belum ada di sistem:**
> - **Surat Keterangan Belum Mempunyai Rumah** — Formulir E di lampiran Perwal
> - **Surat Pernyataan sanggup bayar retribusi** — Formulir B di lampiran Perwal (terpisah dari "bersedia memenuhi ketentuan")
> - **Surat Permohonan Menghuni** — Formulir A di lampiran Perwal. Saat ini di-generate oleh sistem sebagai `template_pengajuan`, bukan diupload oleh calon penghuni.

> [!NOTE]
> Sistem menambahkan 2 berkas yang **tidak ada di Perwal**: SKCK dan Surat Keterangan Sehat. Ini boleh saja sebagai tambahan kebijakan internal UPTD.

---

## 2. Berkas/Dokumen yang Didapat Penghuni Setelah Terdaftar

Setelah proses wawancara berhasil (`contract_created`), sistem otomatis men-generate **bundle dokumen** melalui [DocumentService.generate_bundle()](file:///d:/Project/Sistem%20Rusunawa/rusun-backend/app/core/document_service.py#L22-L146):

| # | Dokumen yang Di-generate | Template File | Kode Perwal | Status |
|---|---|---|---|---|
| 1 | Surat Pengajuan (Karyawan/Wiraswasta) | `template_pengajuan_karyawan.docx` / `template_pengajuan_wiraswasta.docx` | Formulir A | ✅ Ada |
| 2 | Berita Acara Wawancara | `template_ba_wawancara.docx` | — | ✅ Ada |
| 3 | Surat Izin Penghunian (SIP) | `template_sip.docx` | — | ✅ Ada |
| 4 | Perjanjian Sewa Menyewa (Kontrak) | `template_kontrak.docx` | Formulir J | ✅ Ada |
| 5 | Surat Jalan | `template_surat_jalan.docx` | — | ✅ Ada |
| 6 | Berita Acara Checkout | `template_ba_checkout.docx` | — | ✅ Ada (di-generate saat bundle) |

### Dokumen Tagihan Bulanan (Invoice)

Setelah menjadi penghuni, admin dapat men-generate dokumen tagihan via [invoices.py](file:///d:/Project/Sistem%20Rusunawa/rusun-backend/app/api/invoices.py):

| # | Dokumen Tagihan | Template File | Kode Perwal | Status Template |
|---|---|---|---|---|
| 1 | SKRD (Surat Ketetapan Retribusi Daerah) | `SKRD Februari 2026.doc` | Formulir R | ⚠️ Ada tapi bukan format template yang benar |
| 2 | STRD (Surat Tagihan Retribusi Daerah) | `STRD Januari 2025 Cibereum...docx` | Formulir S | ⚠️ Ada tapi bukan format template yang benar |
| 3 | Surat Teguran 1 | `Teguran 1 Januari 2025.docx` | Formulir K | ⚠️ Ada tapi bukan format template yang benar |
| 4 | Surat Teguran 2 | — | Formulir N | ❌ **Tidak ada** |
| 5 | Surat Teguran 3 | — | — | ❌ **Tidak ada** |

> [!WARNING]
> **Masalah kritis pada template invoice**: Sistem `generate_invoice_document()` mencari file dengan format `template_{doc_type}.docx` (misalnya `template_skrd.docx`, `template_strd.docx`, `template_teguran1.docx`), namun yang ada di folder `templates/` adalah file-file contoh manual (bukan template dengan placeholder `{{ }}`):
> - `SKRD Februari 2026.doc` → seharusnya `template_skrd.docx`
> - `STRD Januari 2025 Cibereum...docx` → seharusnya `template_strd.docx`
> - `Teguran 1 Januari 2025.docx` → seharusnya `template_teguran1.docx`
>
> **Akibatnya, cetak SKRD/STRD/Teguran akan GAGAL (FileNotFoundError).**

---

## 3. Berkas untuk Proses Keluar (Checkout)

Berdasarkan [checkout model](file:///d:/Project/Sistem%20Rusunawa/rusun-backend/app/models/checkout.py) dan [checkout API](file:///d:/Project/Sistem%20Rusunawa/rusun-backend/app/api/checkouts.py), serta [portal page](file:///d:/Project/Sistem%20Rusunawa/rusun-frontend/src/app/portal/page.tsx):

### Yang Harus Disiapkan Penghuni saat Mengajukan Keluar:

| # | Data/Berkas | Implementasi | Status |
|---|---|---|---|
| 1 | Info Rekening Bank (nama bank) | `bank_name` | ✅ Ada |
| 2 | Nomor Rekening | `bank_account_number` | ✅ Ada |
| 3 | Nama Pemilik Rekening | `bank_account_holder` | ✅ Ada |
| 4 | Tanggal Rencana Keluar | `checkout_date` (frontend) | ✅ Ada |
| 5 | Formulir Pengunduran Diri | — | ❌ **Tidak ada** |

### Dokumen yang Dihasilkan Saat Proses Keluar:

| # | Dokumen | Template | Kode Perwal | Status |
|---|---|---|---|---|
| 1 | Berita Acara Checkout | `template_ba_checkout.docx` | — | ✅ Template ada |
| 2 | Surat Keluar | `template_surat_keluar.docx` | — | ⚠️ Template ada di folder, tapi **tidak di-generate oleh sistem** |
| 3 | Nota Dinas Penarikan Jaminan | — | Formulir L/M | ❌ **Tidak ada** |
| 4 | Surat Pengunduran Diri | — | Formulir O | ❌ **Tidak ada** |
| 5 | Kwitansi Pengembalian Uang Jaminan | — | Formulir Q | ❌ **Tidak ada** |

> [!CAUTION]
> **Proses checkout sangat minim.** Berdasarkan Perwal, penghuni yang keluar seharusnya:
> 1. Mengajukan **Formulir Pengunduran Diri** (Formulir O)
> 2. Mendapat **Nota Dinas Penarikan Jaminan** (Formulir L/M)
> 3. Mendapat **Kwitansi Pengembalian Uang Jaminan** (Formulir Q)
> 4. Dilakukan **Inspeksi Fasilitas** menggunakan **Cek List Fasilitas Hunian** (Formulir I — 26 item)
>
> Saat ini checkout hanya mengumpulkan data bank dan membuat request → approve/reject. Tidak ada generate dokumen otomatis.

---

## 4. Analisis Kelengkapan Template

### File Template yang Ada di `rusun-backend/app/templates/`:

```
✅ template_pengajuan_karyawan.docx     — Surat Pengajuan (Karyawan)
✅ template_pengajuan_wiraswasta.docx   — Surat Pengajuan (Wiraswasta)
✅ template_ba_wawancara.docx           — Berita Acara Wawancara
✅ template_sip.docx                    — Surat Izin Penghunian
✅ template_kontrak.docx                — Perjanjian Sewa Menyewa
✅ template_surat_jalan.docx            — Surat Jalan
✅ template_ba_checkout.docx            — Berita Acara Checkout
⚠️ template_surat_keluar.docx          — Template ada, TIDAK terhubung ke sistem

📄 SKRD Februari 2026.doc              — File contoh manual, bukan template
📄 STRD Januari 2025 Cibereum...docx   — File contoh manual, bukan template
📄 Teguran 1 Januari 2025.docx         — File contoh manual, bukan template
📄 Rekap SKRD Cibereum ...xlsx         — File rekap Excel manual
```

### Template yang BELUM ADA tapi DIBUTUHKAN Sistem:

| # | Template yang Dibutuhkan | Diperlukan Oleh | Prioritas |
|---|---|---|---|
| 1 | `template_skrd.docx` | `generate_invoice_document("skrd")` | 🔴 **Kritis** — Cetak SKRD akan error |
| 2 | `template_strd.docx` | `generate_invoice_document("strd")` | 🔴 **Kritis** — Cetak STRD akan error |
| 3 | `template_teguran1.docx` | `generate_invoice_document("teguran1")` | 🔴 **Kritis** — Cetak Teguran akan error |
| 4 | `template_teguran2.docx` | `generate_invoice_document("teguran2")` | 🔴 **Kritis** — Cetak Teguran akan error |
| 5 | `template_teguran3.docx` | `generate_invoice_document("teguran3")` | 🔴 **Kritis** — Cetak Teguran akan error |

### Template yang BELUM ADA dan BELUM ADA di Sistem (Perwal):

| # | Dokumen Perwal | Formulir | Prioritas |
|---|---|---|---|
| 1 | Formulir Pengunduran Diri | O | 🟡 Sedang |
| 2 | Cek List Kelengkapan Berkas | G | 🟡 Sedang |
| 3 | Cek List Persyaratan Umum & Administrasi | H | 🟡 Sedang |
| 4 | Cek List Fasilitas Hunian (26 item) | I | 🟡 Sedang |
| 5 | Nota Dinas Penarikan Jaminan | L/M | 🟡 Sedang |
| 6 | Kwitansi Penerimaan Uang Jaminan | Q | 🟡 Sedang |
| 7 | Surat Keterangan Belum Punya Rumah | E | 🟢 Rendah (upload) |
| 8 | Formulir Data Pemohon & Kependudukan | F | 🟢 Rendah (data sudah di-capture digital) |

---

## 5. Ringkasan & Rekomendasi

### Kondisi Saat Ini

```mermaid
graph LR
    subgraph "✅ LENGKAP"
        A[Pendaftaran Online<br/>7 jenis upload]
        B[Bundle Wawancara<br/>6 template]
    end
    subgraph "🔴 KRITIS"
        C[Cetak SKRD ❌]
        D[Cetak STRD ❌]
        E[Cetak Teguran ❌]
    end
    subgraph "⚠️ BELUM LENGKAP"
        F[Proses Checkout<br/>Minim dokumen]
        G[template_surat_keluar<br/>Ada tapi tidak terhubung]
    end
```

### Prioritas Perbaikan

| Prioritas | Aksi | Dampak |
|---|---|---|
| 🔴 **P0 — Kritis** | Buat `template_skrd.docx`, `template_strd.docx`, `template_teguran1.docx`, `template_teguran2.docx`, `template_teguran3.docx` dengan tag `{{ }}` | Fitur cetak invoice/tagihan **tidak berfungsi** tanpa ini |
| 🟠 **P1 — Tinggi** | Hubungkan `template_surat_keluar.docx` dan `template_ba_checkout.docx` ke proses checkout (auto-generate saat approve) | Proses keluar tanpa dokumen resmi |
| 🟡 **P2 — Sedang** | Tambahkan Formulir Pengunduran Diri (O), Cek List Fasilitas (I), Nota Dinas Jaminan (L/M), Kwitansi Jaminan (Q) | Kelengkapan administrasi Perwal |
| 🟢 **P3 — Rendah** | Tambahkan field upload untuk Surat Keterangan Belum Punya Rumah, Surat Pernyataan sanggup bayar | Kesesuaian penuh dengan Perwal |
