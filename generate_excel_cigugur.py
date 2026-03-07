import pandas as pd
import re

data_text = """
 A 	 I 	 1 	 Fety Sumarni 	10 Mar 25
 A 	 I 	 2 	 Ar Farida 	3 Jun 25
 A 	 I 	 3 	 Oden Wawan 	1 Feb 23
 A 	 I 	 4 	 Dadang Darussalam 	25 Aug 23
 A 	 I 	 5 	 Juariah 	03 Juni 2024
 A 	 I 	 7 	 Enung  	25 Mar 21
 A 	 I 	 8 	 Nufikawati 	8 Jun 23
 A 	 I 	 9 	 Ramdan Nugraha 	2 Jul 25
 A 	 I 	 10 	 Visa N. 	4 May 21
 A 	 I 	 11 	 Jajat Sudrajat 	8 Jun 23
 A 	 I 	 12 	 Renita Septiani 	8 Jun 23
 A 	 II 	 1 	 Dewi Ria Rosmayani 	9 Aug 23
 A 	 II 	 2 	 M.Nurbudi 	23 Nov 22
 A 	 II 	 3 	 Wiwi winengsih 	9 Aug 23
 A 	 II 	 4 	 Abdal Salam 	8 Jul 22
 A 	 II 	 5 	 Susan Rosadi 	18 Aug 23
 A 	 II 	 6 	 Sari sulastri 	20 Oct 22
 A 	 II 	 7 	 Imas Mulyati 	8 Jun 23
 A 	 II 	 8 	 Winda Mindriyah 	20 Oct 22
 A 	 II 	 9 	 Andi Rohandi 	7 Sep 22
 A 	 II 	 10 	 Ismuryati 	13 Jun 23
 A 	 II 	 11 	 Rendy Mulyana 	25 Aug 23
 A 	 II 	 12 	 Ade Martinah 	22 Jun 23
 A 	 III 	 1 	 Maimah 	24 Aug 23
 A 	 III 	 2 	 Nurwanti 	5 Aug 21
 A 	 III 	 3 	 Entis 	16 Dec 19
 A 	 III 	 4 	 Asep Nurdin 	3 Jan 24
 A 	 III 	 5 	 Syahrul R. 	12 Aug 20
 A 	 III 	 6 	 Cecep S 	2 Jun 21
 A 	 III 	 8 	 Nurazizah 	16 Nov 22
 A 	 III 	 9 	 Dede Sajidin 	4 Aug 22
 A 	 III 	 10 	 Supiyan Priyanto 	2 Oct 23
 A 	 III 	 11 	 Nuraida 	17 Dec 24
 A 	 III 	 12 	 Yeni Maryani 	16 Nov 22
 A 	 IV 	 1 	 Yunita 	15 Oct 21
 A 	 IV 	 2 	Luli Hermato	3 Nov 23
 A 	 IV 	 3 	 Sumiyati 	6 Feb 23
 A 	 IV 	 4 	 Salyono 	3 Dec 21
 A 	 IV 	 5 	 Leni Pujianti 	3 Dec 21
 A 	 IV 	 6 	 Ujang Saepudin 	12 Jan 21
 A 	 IV 	 7 	 Nina Sumartina 	21 Oct 22
 A 	 IV 	 8 	 Darya Aryawan 	12 Jun 23
 A 	 IV 	 9 	 Dayat 	16 Jan 25
 A 	 IV 	 10 	 Miftah Farid 	02-Des-2024
 A 	 IV 	 11 	 Ridwan 	6 Dec 24
 A 	 IV 	 12 	 Iin Nurlela 	3 Dec 21
 B 	 I 	 1 	 Yulismiati 	26 Oct 22
 B 	 I 	 2 	 Ujang Wahyu 	16 Oct 23
 B 	 I 	 3 	 Syahid Hidayatulloh 	04-Nov-2024
 B 	 I 	 4 	 Fery Firmansyah 	24 Oct 22
 B 	 I 	 5 	 Ronald Pardomuan Sitinjak 	03-Mei-2025.
 B 	 I 	 6 	 Taufik W 	9 Nov 22
 B 	 I 	 7 	 Dede Femi H 	17 Oct 22
 B 	 I 	 8 	 Juhana K.A 	15 Mar 21
 B 	 I 	 9 	 Benny Irawan 	4 Aug 23
 B 	 I 	 10 	 Urip Setiawan 	9 Aug 23
 B 	 I 	 11 	 Nur Mu'minah 	8 Nov 22
 B 	 I 	 12 	 Indahlia Heryantika 	17 Oct 22
 B 	 II 	 1 	 Dadan Ali Kurnia 	15-Juli-2024
 B 	 II 	 2 	 Melan Suprapto 	16 May 23
 B 	 II 	 3 	 Aci Dian Pertiwi 	1 Nov 19
 B 	 II 	 4 	 Apriyani Setianingsih 	9 Aug 23
 B 	 II 	 5 	 Rusmiyadi 	9 Aug 23
 B 	 II 	 6 	 Siyami 	14 Nov 23
 B 	 II 	 7 	 Purwanti  	16 Feb 23
 B 	 II 	 8 	 Iing Widan Rahim 	3 Nov 23
 B 	 II 	 9 	 Surati 	9 Aug 23
 B 	 II 	 10 	 Hilman Agustian 	4 Jan 22
 B 	 II 	 11 	 Sari Sulastri 	9 Aug 23
 B 	 II 	 12 	 Siti Zaenah 	11 Juli 2024
 B 	 III 	 1 	 Junaedi 	1 Aug 24
 B 	 III 	 2 	 Rohyat 	6 Jul 22
 B 	 III 	 3 	 Sopan Sopian 	5 Nov 24
 B 	 III 	 4 	 Mulyana Mukti 	2 Nov 22
 B 	 III 	 5 	 Darno 	4 Aug 23
 B 	 III 	 6 	 Amat Wahono 	4 Sep 23
 B 	 III 	 7 	 Mustofa 	16 Aug 23
 B 	 III 	 8 	 Lasini Sumiati	10 Nov 21
 B 	 III 	 9 	 Supriyanto 	7 Aug 23
 B 	 III 	 10 	 Sartinah 	20 Oct 22
 B 	 III 	 11 	 Elvan Sopanda 	18 07 2023
 B 	 III 	 12 	 Acep Wahyudin 	20 Oct 22
 B 	 IV 	 1 	 Yussie Rushadiana Noviar 	1 Sep 22
 B 	 IV 	 2 	 Lilis Lina Herlina 	1 Mar 23
 B 	 IV 	 3 	 Muhamad Solihin 	1 Sep 23
 B 	 IV 	 4 	 Tusini 	27 Jan 21
 B 	 IV 	 5 	 Leli Liana 	19 Sep 22
 B 	 IV 	 6 	 Nurdin 	9 Aug 23
 B 	 IV 	 7 	 Wahyudi Irawan 	20 Apr 21
 B 	 IV 	 8 	 Handika Ahmad F 	2 Aug 21
 B 	 IV 	 9 	 Ade Sabarudin 	11 Jan 22
 B 	 IV 	 10 	 Ning Ning Kartini 	17 Mar 23
 B 	 IV 	 11 	 Entang Adirachmat 	19 Oct 22
 B 	 IV 	 12 	 Tati Sumiati 	19 Oct 22
 C 	 I 	 1 	Tuti Qodariah	10 Oct 23
 C 	 I 	 2 	 Hemma 	29 Nov 19
 C 	 I 	 3 	 Nurjanah 	19 Oct 22
 C 	 I 	 4 	 Ujang Maman 	6 Jan 21
 C 	 I 	 5 	 Enung Rusmiati 	6 Jun 23
 C 	 I 	 6 	 Novi Diana 	8 Mar 21
 C 	 I 	 7 	 Elis Solihat 	20 Nov 23
 C 	 I 	 8 	 Riani R 	16 Jan 23
 C 	 I 	 9 	 Badriyah 	24 Oct 22
 C 	 I 	 10 	 Yanti Susilawati 	9 Jun 21
 C 	 I 	 11 	 Suroto 	30 Sep 19
 C 	 I 	 12 	 Maman Hidayat 	11 Jan 22
 C 	 II 	 1 	 Sri Idawati 	22 Aug 23
 C 	 II 	 2 	 Risma Hasna H 	9 Aug 23
 C 	 II 	 3 	 Siti Hajijah 	10 Sep 19
 C 	 II 	 4 	 Falah 	25 Mar 21
 C 	 II 	 5 	 Uniyanto 	27 Dec 19
 C 	 II 	 6 	 Sri Rahayu N 	28 Oct 22
 C 	 II 	 7 	 Hani Hanifah 	19 Oct 23
 C 	 II 	 8 	 Dini Almugni 	24 Jul 23
 C 	 II 	 9 	 Windi Rahmayani 	12 Jun 25
 C 	 II 	 10 	 Maya Utami 	29 Aug 19
 C 	 II 	 11 	 Astri Novalia 	30 Oct 19
 C 	 II 	 12 	 Rini Supartini 	3 Nov 22
 C 	 III 	 1 	 Purwanto 	29 Aug 23
 C 	 III 	 2 	 Iwan Subhan Bagaswara 	2 Mar 21
 C 	 III 	 3 	 Sudarmanto 	8 Aug 23
 C 	 III 	 4 	 Anindya 	25 Oct 22
 C 	 III 	 5 	 Supriatin 	17 Nov 23
 C 	 III 	 6 	 Ervina Luluk 	3 Jun 22
 C 	 III 	 7 	 Nuryanto 	29 Aug 23
 C 	 III 	 8 	 Aas Mintarsih 	11 Oct 23
 C 	 III 	 9 	 Adi Alimin Syaputra 	22 Aug 23
 C 	 III 	 10 	 Sumardi 	19 Oct 23
 C 	 III 	 11 	 Wida 	10 Oct 23
 C 	 III 	 12 	 Opik Permana 	04 Juni 2024
 C 	 IV 	 1 	 Asep Supriatna 	17 Mar 21
 C 	 IV 	 2 	 Yayan Musoali A 	14 Nov 23
 C 	 IV 	 3 	 Sigit Maulana 	02 April 2025
 C 	 IV 	 4 	 Mumu Mulyani 	22 Aug 23
 C 	 IV 	 5 	 Sri Hartani 	9 Aug 23
 C 	 IV 	 6 	 Nurisah 	2 Dec 22
 C 	 IV 	 7 	 Shilvia Dwi Handini 	9 Jul 25
 C 	 IV 	 8 	 Sofiyatun 	19 Oct 22
 C 	 IV 	 10 	 Panji L 	15 Aug 23
 C 	 IV 	 11 	 Galih 	4 May 21
 C 	 IV 	 12 	 Fitri nurlaeni 	9 Aug 23
 D 	 I 	 1 	 Titin Suntini 	6 Dec 21
 D 	 I 	 2 	 Eka Aryanti 	4 Aug 23
 D 	 I 	 3 	 Sunandar 	17 Mar 21
 D 	 I 	 4 	 Azizah albab 	7 Feb 22
 D 	 I 	 5 	 Neni Anggraeni 	30 Sep 22
 D 	 I 	 6 	 Prasetyo Truno Dipo	10 Feb 22
 D 	 I 	 7 	 Subari 	29 Aug 23
 D 	 I 	 8 	 Leni Lemi 	13 Jan 21
 D 	 I 	 9 	 Hendra 	7 Sep 22
 D 	 I 	 10 	 Sriwiyati 	3 Aug 21
 D 	 I 	 11 	 Dede Nurjanah 	14 Nov 22
 D 	 I 	 12 	 Hermawan 	3 Jun 25
 D 	 II 	 1 	 Yoga Nanda Daniel 	11 01 2023
 D 	 II 	 2 	 Satirin 	16 Aug 23
 D 	 II 	 3 	 Maman Supriadi 	14 Jun 24
 D 	 II 	 4 	 Odi Suryana 	6 Mar 23
 D 	 II 	 5 	 Sulastri 	27 Nov 19
 D 	 II 	 6 	 Misna Nursandi 	3 Aug 21
 D 	 II 	 8 	 Yudi Maulana 	23 Nov 23
 D 	 II 	 9 	 Jusuf Christo M 	14 Aug 23
 D 	 II 	 10 	 Sukaesih 	20 Nov 23
 D 	 II 	 11 	 Anik Sunarti 	29 Aug 23
 D 	 II 	 12 	 Ina Rosdiana 	9 Aug 23
 D 	 III 	 1 	 Asep Supriatna 	3 Nov 23
 D 	 III 	 2 	 Riky Maulana 	7 Feb 25
 D 	 III 	 3 	 Sari Yulasmi 	3 Oct 22
 D 	 III 	 4 	 Herna Marlianti 	11 Aug 23
 D 	 III 	 5 	 Sukir 	3 Jan 22
 D 	 III 	 6 	 Riyanto 	22 Dec 22
 D 	 III 	 7 	 Soleh R 	7 Sep 22
 D 	 III 	 8 	 Puput Ayu Lestari 	10 Sep 21
 D 	 III 	 10 	 Ermanu Dharma 	2 Feb 22
 D 	 III 	 11 	 Minar Wahyuni 	2 Sep 19
 D 	 III 	 12 	 Yusbani 	10 Mar 25
 D 	 IV 	 1 	 Hadi Mulyana 	5 Apr 23
 D 	 IV 	 2 	 Megi E 	8 Mar 23
 D 	 IV 	 3 	 Rin Rin 	9 Aug 23
 D 	 IV 	 4 	 Neng Siti Marli J 	18 Nov 19
 D 	 IV 	 5 	 Budi Daryanto 	9 Aug 23
 D 	 IV 	 6 	 Aden Ginanjar 	3 Jul 23
 D 	 IV 	 7 	 Ari Supriyadi Budiman 	15 Dec 25
 D 	 IV 	 8 	 Wawan 	8 Mar 22
 D 	 IV 	 9 	 Didin Ardiansyah 	5 Feb 24
 D 	 IV 	 10 	 Erwin 	3 Jan 24
 D 	 IV 	 11 	 Suryanti 	10 Oct 23
 D 	 IV 	 12 	 Ai Marlina 	9 Aug 23
"""

rows = []
roman_map = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5}

lines = data_text.strip().split('\n')

for i, line in enumerate(lines):
    parts = re.split(r'\t|\s{2,}', line.strip())
    # Format: Gedung, Lantai, Unit, Nama, (Optional Tanggal)
    if len(parts) >= 4:
        nama = parts[3].strip()
        if "KELUAR" in nama.upper() or "KOSONG" in nama.upper() or "PERCONTOHAN" in nama.upper():
            continue
            
        gedung = parts[0].strip()
        lantai_roman = parts[1].strip()
        unit = parts[2].strip()
        tgl_raw = parts[4].strip() if len(parts) > 4 else "2024-01-01"
        
        # Security: Clean unit number (strip non-numeric if any)
        unit_clean = re.sub(r'\D', '', unit)
        if not unit_clean: continue

        # Dummies
        clean_name = re.sub(r'[^a-zA-Z\s]', '', nama).strip().lower()
        clean_nama_id = re.sub(r'\s+', '_', clean_name)
        
        rows.append({
            "nama": nama,
            "nik": f"327101{1000000000 + i}",
            "email": f"{clean_nama_id}_{i}@rusun.com",
            "rusunawa": "Cigugur Tengah",
            "gedung": gedung,
            "lantai": roman_map.get(lantai_roman, 1),
            "unit": int(unit_clean),
            "tgl_mulai": tgl_raw,
            "tgl_selesai": "2026-01-01",
            "jumlah_motor": 1
        })

df = pd.DataFrame(rows)
output_path = "d:/ProjectAI/Sistem-Rusunawa/Data_Penghuni_Cigugur.xlsx"
df.to_excel(output_path, index=False)
print(f"File created successfully at: {output_path}")
print(f"Total valid tenants: {len(rows)}")
