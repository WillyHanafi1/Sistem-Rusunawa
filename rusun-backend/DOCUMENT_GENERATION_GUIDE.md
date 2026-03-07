# Panduan Pengaturan Template Surat Otomatis

Sistem ini memungkinkan Anda untuk menghasilkan 4 surat (Pengajuan, BA Wawancara, SIP, dan Kontrak) secara otomatis dalam format PDF setelah proses wawancara selesai.

## 📁 Lokasi Template
Semua file template Word (.docx) harus diletakkan di folder berikut:
`rusun-backend/app/templates/`

## 📄 Nama File Template
Sistem mencari file dengan nama spesifik berikut (pastikan namanya persis):
1. `template_pengajuan.docx`
2. `template_ba_wawancara.docx`
3. `template_sip.docx`
4. `template_kontrak.docx`

## 🏷️ Variabel (Tag) yang Tersedia
Gunakan tag di bawah ini di dalam file Word Anda. Sistem akan menggantinya secara otomatis dengan data penghuni. Gunakan format double kurung kurawal, contoh: `{{ nama_penyewa }}`.

### Data Pribadi & Kontak
- `{{ nama_penyewa }}` : Nama lengkap penghuni
- `{{ nik }}` : Nomor Induk Kependudukan
- `{{ telepon }}` : Nomor telepon/WhatsApp
- `{{ email }}` : Alamat email

### Data Unit & Gedung
- `{{ rusunawa }}` : Nama Rusunawa target
- `{{ nomor_kamar }}` : Nomor unit kamar
- `{{ lantai }}` : Lantai unit kamar

### Data Kontrak & Keuangan
- `{{ harga_sewa }}` : Harga sewa per bulan (format: Rp 000.000,00)
- `{{ deposit }}` : Jumlah uang jaminan/deposit
- `{{ tanggal_mulai }}` : Tanggal awal kontrak (DD-MM-YYYY)
- `{{ tanggal_selesai }}` : Tanggal akhir kontrak (DD-MM-YYYY)
- `{{ jumlah_motor }}` : Jumlah parkir motor yang didaftarkan

### Informasi Waktu
- `{{ tanggal_wawancara }}` : Tanggal saat proses wawancara disimpan
- `{{ tanggal_cetak }}` : Tanggal surat dihasilkan
- `{{ tahun }}` : Tahun saat ini (4 digit)

---

## 🚀 Langkah-langkah Pengaturan (Step-by-Step)

1. **Siapkan Format Surat**: Buka file surat asli Anda di Microsoft Word.
2. **Masukkan Tag**: Ganti bagian yang perlu diisi (seperti nama, NIK, dll) dengan tag yang sesuai di atas.
   - *Contoh*: "Yang bertanda tangan di bawah ini, Nama: `{{ nama_penyewa }}`"
3. **Simpan sebagai .docx**: Pastikan format file adalah `.docx` (bukan .doc atau .pdf).
4. **Beri Nama yang Benar**: Ubah nama file sesuai daftar "Nama File Template" di atas.
5. **Upload/Copy ke Folder**: Masukkan keempat file tersebut ke folder `rusun-backend/app/templates/`.
6. **Selesai**: Sekarang, setiap kali Anda menekan **"Simpan & Buat Kontrak"** di dashboard Admin, sistem akan otomatis membuat bundle 4 surat tersebut dalam versi PDF di folder `uploads/documents/<NIK>/`.
