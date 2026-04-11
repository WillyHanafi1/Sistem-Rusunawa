# Panduan Otomatisasi Dokumen Rusunawa

Dokumen ini berisi daftar variabel yang dapat digunakan di dalam Microsoft Word (.docx) untuk pengisian otomatis. Pastikan menggunakan format `{{nama_variabel}}`.

## 1. Variabel Umum & Tanggal
| Variabel | Keterangan | Contoh Output |
| :--- | :--- | :--- |
| `{{tanggal_now_indo}}` | Tanggal cetak (mengikuti input SIP Date) | 11 April 2026 |
| `{{tanggal_terbilang}}` | Angka tanggal dalam kata | Sebelas |
| `{{hari_now}}` | Nama hari saat ini | Sabtu |
| `{{bulan_now_indo}}` | Nama bulan saat ini | April |
| `{{tahun_now}}` | Angka tahun saat ini | 2026 |
| `{{tahun_terbilang}}` | Angka tahun dalam kata | Dua Ribu Dua Puluh Enam |

## 2. Pihak Management (Pejabat)
Diambil otomatis dari database Staf yang bertanda "Aktif".
| Variabel | Keterangan |
| :--- | :--- |
| `{{nama_kepala_uptd}}` | Nama Kepala UPTD |
| `{{nip_kepala_uptd}}` | NIP Kepala UPTD |
| `{{pangkat_kepala_uptd}}` | Pangkat/Golongan Kepala |
| `{{nama_kasubag_tu}}` | Nama Kasubag Tata Usaha |
| `{{nip_kasubag_tu}}` | NIP Kasubag Tata Usaha |
| `{{pangkat_kasubag_tu}}` | Pangkat Kasubag Tata Usaha |

## 3. Data Penyewa (Pihak Kedua)
| Variabel | Keterangan |
| :--- | :--- |
| `{{nama_penyewa}}` | Nama Lengkap Penyewa |
| `{{nik}}` | NIK Penyewa |
| `{{tempat_tgl_lahir_penyewa}}` | Tempat, Tanggal Lahir (Contoh: Bandung, 07 Oktober 1989) |
| `{{telepon}}` | Nomor Telepon |
| `{{email}}` | Alamat Email |
| `{{agama}}` | Agama |
| `{{status_perkawinan}}` | Status (Kawin/Belum) |
| `{{pekerjaan}}` | Pekerjaan |
| `{{alamat_sebelumnya}}` | Alamat lama penyewa |
| `{{jumlah_keluarga}}` | Jumlah anggota keluarga (Angka: 4) |
| `{{jumlah_keluarga_terbilang}}` | Jumlah anggota keluarga (Teks: 4 (Empat)) |

## 4. Lokasi & Unit
| Variabel | Keterangan | Contoh |
| :--- | :--- | :--- |
| `{{nama_rusunawa}}` | Nama Rusunawa Target | Cigugur Tengah |
| `{{gedung}}` | Blok / Gedung | D |
| `{{lantai}}` | Lantai (Angka) | 2 |
| `{{lantai_romawi}}` | Lantai (Angka Romawi) | II |
| `{{unit}}` | Nomor Unit / Hunian | 07 |
| `{{room_number}}` | Nama Unit Lengkap | Cigugur Tengah - D II 07 |
| `{{lokasi_lengkap}}` | Alamat Lengkap Unit | D II 07 Rusunawa Cigugur Tengah |

## 5. Khusus Surat Jalan (SIP Baru)
| Variabel | Keterangan | Contoh |
| :--- | :--- | :--- |
| `{{sip_number}}` | Nomor Surat Ijin Penghunian | 648.1/SIP/... |
| `{{hari_masuk}}` | Hari rencana masuk | Minggu |
| `{{tanggal_masuk_indo}}` | Tanggal rencana masuk | 08 Februari 2026 |

## 6. Khusus BAST (Serah Terima Hunian)
| Variabel | Keterangan | Contoh |
| :--- | :--- | :--- |
| `{{ba_number}}` | Nomor Berita Acara Serah Terima | 648.1/BA/... |
| `{{ba_date_indo}}` | Tanggal Serah Terima (Lengkap) | 05 Februari 2026 |
| `{{hari_ba}}` | Hari serah terima | Kamis |
| `{{tanggal_ba}}` | Angka tanggal | 05 |
| `{{tanggal_ba_terbilang}}` | Tanggal dalam kata-kata | Lima |
| `{{bulan_ba_indo}}` | Nama bulan | Februari |
| `{{tahun_ba}}` | Angka tahun | 2026 |
| `{{tahun_ba_terbilang}}` | Tahun dalam kata-kata | Dua Ribu Dua Puluh Enam |
| `{{lantai_romawi}}` | Lantai dalam angka romawi | II |
| `{{nama_penyewa_kapital}}` | Nama penyewa huruf besar | MAYA MULYANI |
| `{{nama_kordinator}}` | Nama Kordinator Lapangan | ASEP SURYANA MASDUKI |
| `{{nip_kordinator}}` | NIP Kordinator Lapangan | 19820410 200901 1 005 |
| `{{pangkat_kordinator}}` | Pangkat Kordinator | Penata |
| `{{jabatan_kordinator}}` | Jabatan lengkap | Kordinator Rusun Cigugur Tengah |

## 7. Khusus BA Wawancara (SK Ketetapan)
| Variabel | Keterangan | Contoh |
| :--- | :--- | :--- |
| `{{sk_number}}` | Nomor SK Ketetapan | 648.1/SK/... |
| `{{sk_date_indo}}` | Tanggal SK (Format Standar) | 03 Februari 2026 |
| `{{hari_sk}}` | Nama hari pada SK | Selasa |
| `{{tanggal_sk}}` | Angka tanggal (03) | 03 |
| `{{tanggal_sk_terbilang}}` | Angka tanggal dalam kata | Tiga |
| `{{bulan_sk_indo}}` | Nama bulan | Februari |
| `{{tahun_sk}}` | Angka tahun | 2026 |
| `{{tahun_sk_terbilang}}` | Angka tahun dalam kata | Dua Ribu Dua Puluh Enam |
| `{{hasil_verifikasi}}` | Status kelolosan | Lolos |

## 7. Tabel Keluarga (Khusus Surat Jalan & BA)
Gunakan tag perulangan di dalam tabel Word Anda:
`{% for p in keluarga %}` ...isi baris... `{% endfor %}`

| Kolom | Variabel | Deskripsi |
| :--- | :--- | :--- |
| **No** | `{{p.no}}` | Nomor urut (1, 2, 3...) |
| **Nama** | `{{p.nama}}` | Nama anggota keluarga |
| **Umur** | `{{p.umur}}` | Umur |
| **L/P** | `{{p.lp}}` | Jenis Kelamin (Singkatan L/P) |
| **Agama** | `{{p.agama}}` | Agama |
| **Status** | `{{p.status}}` | Status Perkawinan |
| **Hub** | `{{p.hub}}` | Hubungan (Istri/Anak/dll) |
| **Pekerjaan** | `{{p.pekerjaan}}` | Pekerjaan |

## 8. Keuangan
| Variabel | Keterangan | Contoh |
| :--- | :--- | :--- |
| `{{harga_sewa}}` | Harga sewa per bulan | Rp 300.000 |
| `{{harga_sewa_terbilang}}` | Harga sewa dalam kata | Tiga Ratus Ribu Rupiah |
| `{{deposit}}` | Uang jaminan (2x sewa) | Rp 600.000 |
| `{{deposit_terbilang}}` | Uang jaminan dalam kata | Enam Ratus Ribu Rupiah |
