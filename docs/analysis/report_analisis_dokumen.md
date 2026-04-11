# Analisis Mendalam: Siklus Dokumen Pendaftaran hingga Kontrak
**Sistem Manajemen Rusunawa**

Laporan ini merinci seluruh dokumen yang terlibat dalam proses penerimaan penghuni baru, mulai dari tahap registrasi awal hingga penerbitan kontrak (Perjanjian Kerjasama).

---

## 1. Tahap Registrasi (Dokumen yang Diinput User)
Pada tahap ini, calon penghuni mengunggah dokumen kelengkapan administrasi sebagai basis verifikasi. Terdapat **8 slot dokumen** yang disediakan oleh sistem:

1.  **KTP (Kartu Tanda Penduduk)**: Wajib.
2.  **KK (Kartu Keluarga)**: Wajib.
3.  **Buku Nikah / Cerai**: Opsional (tergantung status perkawinan).
4.  **SKU / Keterangan Penghasilan**: Digunakan untuk menentukan jenis template surat permohonan.
5.  **SKCK**: Untuk verifikasi latar belakang keamanan.
6.  **Surat Keterangan Sehat**: Persyaratan kesehatan lingkungan Rusunawa.
7.  **Foto**: Untuk administrasi identitas.
8.  **Dokumen Lainnya**: Untuk berkas pendukung tambahan.

---

## 2. Tahap Wawancara & Kontrak (Dokumen yang Di-generate Sistem)
Setelah admin melakukan input data wawancara dan menyetujui aplikasi dengan status `contract_created`, sistem secara otomatis menjalankan `DocumentService.generate_bundle()`. 

Tahap ini menghasilkan **5 dokumen legal** utama yang menggabungkan data dari aplikasi dan data manajemen UPTD (Kepala UPTD, Bendahara, dsb):

| Nama Dokumen | Template yang Digunakan | Deskripsi Fungsi |
| :--- | :--- | :--- |
| **BA Wawancara** | `template_ba_wawancara.docx` | Berita Acara hasil interaksi tatap muka dan verifikasi lisan. |
| **SIP** | `template_sip.docx` | Surat Izin Penghunian (Izin resmi menempati unit). |
| **Kontrak (PK)** | `template_kontrak.docx` | Perjanjian Kerjasama (Item terpenting secara legal). |
| **Surat Jalan / SP** | `template_surat_jalan.docx` | Surat Pernyataan / Surat Jalan masuk barang ke Rusunawa. |
| **Surat Permohonan** | `template_pengajuan_...` | Disesuaikan secara otomatis berdasarkan pekerjaan (Wiraswasta vs Karyawan). |

---

## 3. Analisis Metadata & Alur Data
Sistem melakukan pemetaan data yang kompleks untuk mengisi variabel dalam dokumen (Placeholder tags):

- **Data Kamar**: Gedung, Lantai, Nomor Unit, dan Harga Sewa.
- **Data Biaya**: `deposit_amount` dan `parking_price` (berdasarkan jumlah motor).
- **Data Pejabat**: NIP dan Nama Kepala UPTD serta Bendahara secara dinamis ditarik dari tabel `Staff`.
- **Nomor Surat**: Nomor SK, Nomor PS, dan Nomor SIP yang diinput admin saat wawancara disuntikkan langsung ke dalam dokumen.

---

## 4. Ringkasan Statistik
*   **Total Dokumen yang Terlibat**: ±13 Dokumen per Penghuni.
*   **Dokumen Input (User)**: 8 file.
*   **Dokumen Output (Sistem)**: 5 file PDF/DOCX.
*   **Keamanan**: Semua dokumen output disimpan dalam direktori terproteksi `uploads/documents/[NIK]/bundle_[TIMESTAMP]`.

---

> [!TIP]
> **Efisiensi Sistem**: Dengan sistem "Bundle" ini, administrator hanya perlu melakukan satu kali klik (Submit Wawancara) untuk menghasilkan 5 dokumen legal yang sebelumnya harus diketik secara manual satu per satu.
