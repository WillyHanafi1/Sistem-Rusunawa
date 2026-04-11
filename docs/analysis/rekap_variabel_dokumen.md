# Laporan Teknis Variabel Template Dokumen Rusunawa (Detail)

Laporan ini menyajikan daftar lengkap variabel yang tersedia untuk digunakan dalam template dokumen Microsoft Word (`.docx`) untuk sistem Rusunawa. Variabel-variabel ini secara otomatis diisi oleh backend saat proses pembuatan dokumen (SKRD, STRD, dan Surat Teguran).

---

## 1. Kelompok Identitas & Penghuni
Variabel untuk menampilkan data pribadi penyewa.

| Variabel | Sumber Data | Format | Contoh |
| :--- | :--- | :--- | :--- |
| `{{ nama }}` | `User.name` | Teks Campuran | Dian Pertiwi |
| `{{ nama_penyewa }}` | `User.name` | Teks Campuran | Dian Pertiwi |
| `{{ nik }}` | `Tenant.nik` | 16 Digit String | 327701... |
| `{{ id_penghuni }}` | `get_room_code()` | 8 Digit String | 02040419 |
| `{{ id_kamar }}` | `get_room_code()` | 8 Digit String | 02040419 |
| `{{ alamat_hunian }}` | Dinamis | Gedung Lantai Unit | C IV 12 |

---

## 2. Kelompok Lokasi (Situs & Unit)
Variabel untuk merinci lokasi fisik hunian.

| Variabel | Sumber Data | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- |
| `{{ rusunawa }}` | `Room.rusunawa` | Nama Rusunawa (Uppercase) | CIBEUREUM |
| `{{ location_name }}` | `Room.rusunawa` | Alias untuk `rusunawa` | CIBEUREUM |
| `{{ gedung }}` | `Room.building` | Huruf Gedung | C |
| `{{ building }}` | `Room.building` | Huruf Gedung | C |
| `{{ lantai }}` | `Room.floor` | Angka Lantai (Integer) | 4 |
| `{{ floor }}` | `Room.floor` | Angka Lantai (String) | 4 |
| `{{ floor_roman }}` | Dinamis | Lantai dalam Romawi | IV |
| `{{ unit }}` | `Room.unit_number` | Nomor Unit | 12 |
| `{{ room_number }}` | `Room.room_number` | Full Nomor Kamar | C IV 12 |

---

## 3. Kelompok Data Surat & Metadata
Variabel untuk administrasi surat-menyurat.

| Variabel | Sumber Data | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- |
| `{{ nomor_surat }}` | `Invoice` | Nomor surat resmi (dinamis per tipe) | 974/T1/02.1120/... |
| `{{ invoice_number }}` | `Invoice` | Alias untuk `nomor_surat` | 974/T1/02.1120/... |
| `{{ tanggal_surat }}` | `Invoice` | Tanggal tanda tangan (Bhs Indo) | 27 Januari 2026 |
| `{{ tanggal_ttd }}` | `Invoice` | Alias untuk `tanggal_surat` | 27 Januari 2026 |
| `{{ tanggal_cetak }}` | System Time | Tanggal download dokumen | 08-04-2026 |
| `{{ tenggat_bayar }}` | `Invoice.due_date` | Batas akhir pembayaran (Teguran) | 03 Februari 2026 |
| `{{ tahun }}` | System Time | Tahun saat ini | 2026 |

---

## 4. Kelompok Periode Tagihan
Variabel untuk periode sewa yang ditagihkan.

| Variabel | Sumber Data | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- |
| `{{ bulan_tagihan }}` | `Invoice.period_month` | Nama Bulan Indonesia | Januari |
| `{{ billing_month }}` | `Invoice.period_month` | Nama Bulan Indonesia | Januari |
| `{{ tahun_tagihan }}` | `Invoice.period_year` | Angka Tahun | 2026 |
| `{{ year }}` | `Invoice.period_year` | Angka Tahun | 2026 |

---

## 5. Kelompok Rincian Biaya (Keuangan)
Seluruh variabel biaya diformat dengan tanda titik sebagai pemisah ribuan (Format Indonesia).

| Variabel | Sumber Data | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- |
| `{{ sewa_price }}` | `Invoice.base_rent` | Harga sewa dasar | 450.000 |
| `{{ parking_price }}` | `Invoice.parking_charge` | Biaya parkir | 30.000 |
| `{{ water_price }}` | `Invoice.water_charge` | Biaya air | 125.500 |
| `{{ electricity_price }}`| `Invoice.electricity_charge`| Biaya listrik | 210.000 |
| `{{ other_price }}` | `Invoice.other_charge` | Biaya lain-lain | 0 |
| `{{ additional_price }}` | `Sum(Charges)` | Total biaya non-sewa | 365.500 |
| `{{ penalty_price }}` | `Invoice.penalty_amount` | Denda 2% | 9.600 |
| `{{ denda }}` | `Invoice.penalty_amount` | Alias untuk `penalty_price` | 9.600 |
| `{{ total_tagihan }}` | `Invoice.total_amount` | Total Tagihan Netto | 825.100 |
| `{{ total_bayar }}` | `Invoice.total_amount` | Alias untuk `total_tagihan` | 825.100 |
| `{{ total_price_words }}` | `terbilang()` | Ejaan Total Terbilang | #Delapan Ratus...# |

---

## 6. Kelompok Pejabat & Rekening
Variabel untuk identitas penandatangan dan informasi pembayaran.

| Variabel | Role Staff | Deskripsi |
| :--- | :--- | :--- |
| `{{ nama_kepala_uptd }}` | Kepala UPTD | Nama lengkap Kepala UPTD |
| `{{ nip_kepala_uptd }}` | Kepala UPTD | NIP Kepala UPTD |
| `{{ pangkat_kepala_uptd }}`| Kepala UPTD | Pangkat/Golongan (Contoh: Penata Tk. I) |
| `{{ nama_bendahara }}` | Bendahara | Nama lengkap Bendahara Penerimaan |
| `{{ info_rekening }}` | Config | Nomor Rekening & Nama Bank |
| `{{ bank_account_info }}` | Dinamis | Rekening + Nama Bendahara Aktif |

---

### Catatan Penggunaan Template:
1. Pastikan penulisan variabel dalam file `.docx` menggunakan kurung kurawal ganda: `{{ nama_variabel }}`.
2. Untuk tabel rincian dinamis (looping), gunakan sintaks `{% tr for item in items %}` (jika diaktifkan di backend untuk multi-periode).
3. Jika data di database kosong (NULL), sistem akan otomatis menampilkan tanda `"-"`.
