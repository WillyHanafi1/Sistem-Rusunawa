import pandas as pd
import re
from datetime import datetime

data_text = """
 1 	 A 	 I 	1	  Agus Hanafiah 	10 Jul 25
 2 	 A 	 I 	2	 Vira 	3 Mar 21
 3 	 A 	 I 	3	 Diki Suhadi 	14 Mar 23
 4 	 A 	 II 	1	 Yuyun Widaningsih 	8 Aug 23
 5 	 A 	 II 	2	 Liawati 	2 Jul 25
 6 	 A 	 II 	3	 Supriatna 	3 May 24
 7 	 A 	 II 	4	 Dhia Damara 	4 Apr 23
 8 	 A 	 II 	5	 Yadi Kusmayadi 	10 Jul 25
 9 	 A 	 II 	6	 Ana Mariana 	17 Oct 19
 10 	 A 	 II 	7	 Uche R 	11 Dec 24
 11 	 A 	 II 	8	 Betty Komari 	21 Aug 19
 12 	 A 	 II 	9	 Rizki Ahmad Subagja 	22 Jan 26
 13 	 A 	 II 	10	 Endang Ruspendy 	3 Feb 25
 14 	 A 	 II 	11	 Oktavian 	9 May 19
 15 	 A 	 II 	12	 Tri Rahayu 	9 May 18
 16 	 A 	 II 	13	 Sutrisno 	1 Aug 19
 17 	 A 	 II 	14	 Titin Kartinah 	1 Mar 21
 18 	 A 	 II 	15	 Dedeh Nurhayati 	30 Jul 19
 19 	 A 	 II 	16	 Kokon  	6 Dec 23
 20 	 A 	 II 	17	 Muhammad Nuh 	4 Jan 18
 21 	 A 	 II 	18	 Dani Ramdani 	14 Nov 18
 22 	 A 	 II 	19	 Suhendra 	4 Sep 19
 23 	 A 	 II 	20	 Ilan 	15 Sep 23
 24 	 A 	 II 	21	 Agus 	27 Apr 22
 25 	 A 	 II 	22	 Saepudin 	29 Jul 20
 26 	 A 	 II 	23	 Ibrahim  	1 Jul 20
 27 	 A 	 II 	24	 Dian Maulana Yusuf 	8 May 25
 28 	A	III	1	 R Garyanti 	9 Feb 23
 29 	A	III	2	 Rika Praditya 	6 Jul 23
 30 	 A 	 III 	3	 Kusmayanto 	1 Apr 22
 31 	 A 	III	4	 Moh Rizal 	27 Jun 19
 32 	 A 	 III 	5	 Ninik Rohimah 	14 Mar 23
 33 	 A 	III	6	 Ai Jubaedah 	18 Jan 23
 34 	 A 	 III 	7	 Husni Yahya 	27 Nov 19
 35 	 A 	III	8	 KELUAR 	
 36 	 A 	 III 	9	 Upi Karyati 	14 Feb 22
 37 	A	III	10	 Wangki Gunawan 	8 Apr 21
 38 	A	 III 	11	 Rahman 	18 Aug 23
 39 	 A 	III	12	 Iis Juariah 	4 Nov 21
 40 	 A 	 III 	13	 Rifa Hasna Nuraini 	17 Jan 25
 41 	 A 	III	14	 Taufik Rachman 	9 May 18
 42 	 A 	 III 	15	 Tuminah 	26 Aug 19
 43 	A	III	16	 Erna Yusnita 	5 Aug 19
 44 	 A 	 III 	17	 Mianti  	10 Oct 24
 45 	A	III	18	 Nanang  	Desember 2021
 46 	 A 	 III 	19	 Ansya'aha hulu 	11 Sep 23
 47 	A	III	20	 Ponidi  	6 Aug 24
 48 	 A 	 III 	21	 Ria novi 	27 Dec 23
 49 	A	III	22	 Nine Gantine 	7 Jan 26
 50 	 A 	 III 	23	 Fauzi Ahmad  	14 May 25
 51 	A	III	24	 Ronald 	3 May 17
 52 	 A  	 IV 	1	Heri Jaelani	6 Jul 23
 53 	 A 	 IV 	2	 Agung 	20 Dec 24
 54 	 A  	 IV 	3	 Adha Pratama 	11 Oct 19
 55 	 A 	 IV 	4	 Rizky Ahmad 	4 Nov 21
 56 	 A  	 IV 	5	 Deni Aryanto 	5 Dec 19
 57 	 A 	 IV 	6	 Yuda Nanda 	8 Dec 21
 58 	 A 	 IV 	7	 Gilang  	18 Aug 23
 59 	 A 	 IV 	8	 Puji Adi R 	14 Jun 21
 60 	 A  	 IV 	9	Achmad supriatno	20 Sep 23
 61 	 A 	 IV 	10	 Dini 	4 Nov 21
 62 	 A  	 IV 	11	 Cucum Hasanah 	15 Apr 21
 63 	 A 	 IV 	12	 Irwan Indriawan 	5 Aug 25
 64 	 A  	 IV 	13	 Hikmat Nur Sidik 	14 Feb 23
 65 	 A 	 IV 	14	 Winaningsih 	Januari 2018
 66 	 A  	 IV 	15	 Yuda 	2 Mar 22
 67 	 A 	 IV 	16	 Riski Aprianti  	10 Oct 25
 68 	 A  	 IV 	17	 Erni Murningsih 	13 Sep 22
 69 	 A 	 IV 	18	 Bayu Andhika 	6 Mar 24
 70 	 A  	 IV 	19	 Hermansyah  	3 Mar 25
 71 	 A 	 IV 	20	 Cecep Somantri 	06-012-2023
 72 	 A  	 IV 	21	 Adi Herdiansyah 	9 Mar 24
 73 	 A 	 IV 	22	 Rizky Nandika 	10 Mar 24
 74 	 A  	 IV 	23	 Oktavianus Harefa 	11 Mar 24
 75 	 A 	 IV 	24	 Nira Anggraeni 	7 Mar 25
 76 	 A 	 V 	1	 Ahmad Adiyanto 	12 Feb 24
 77 	 A 	 V 	2	 Robert .T.BMT Sitorus 	3 Mar 25
 78 	 A 	 V 	3	 Firman Nur Rochmansyah 	6 Jan 21
 79 	 A 	 V 	4	 Nipan ari 	6 Jun 24
 80 	 A 	 V 	5	 Asep Saefulloh 	14 Feb 23
 81 	 A 	 V 	6	 Wiwit Agustina 	
 82 	 A 	 V 	7	 Deslina telaumbana  	10 Jun 24
 83 	 A 	 V 	8	 Chandra Cardiana 	3 Feb 25
 84 	 A 	 V 	9	 Donikristianus Lase 	10 May 23
 85 	 A 	 V 	10	 Bagus Arie Wibowo 	10 Oct 23
 86 	 A 	 V 	11	 Dedi Iskandar 	17 May 23
 87 	 A 	 V 	12	 Yulianti 	8 Oct 20
 88 	 A 	 V 	13	 Maretinus Telaumbanua 	8 Dec 21
 89 	 A 	 V 	14	 Raga Adiyasa  	4 Jun 25
 90 	 A 	 V 	15	 Indah Siti N  	18 Dec 24
 91 	 A 	 V 	16	 Fidelis Lase 	6 Sep 23
 92 	 A 	 V 	17	 Endah Mustika 	11 Jan 18
 93 	 A 	 V 	18	 Siti Khodijah 	4 Jan 18
 94 	 A 	 V 	19	 Cahsoniman Nitema Gea 	1 jan 2022
 95 	 A 	 V 	20	 Jenita Cupinis Gea 	7 Sep 21
 96 	 A 	 V 	21	 Suhendang 	1 Apr 24
 97 	 A 	 V 	22	 Romlah 	7 Oct 25
 98 	 A 	 V 	23	 David Jaya 	
 99 	 A 	 V 	24	 Taufik Hidayat 	9 Jul 21
 100 	 B 	 I 	1	 Ani Maryani 	24 Dec 25
 101 	 B 	 I 	2	 Rahmawan 	6 Jun 18
 102 	 B 	 I 	3	 Santi Anggraeni 	4 May 21
 103 	 B 	 II 	1	 Dede Ana  	28 Oct 25
 104 	 B 	 II 	2	 Udah Faridah 	11 Jan 24
 105 	 B 	 II 	3	 Ahmad sumpena 	8 06 2023
 106 	 B 	 II 	4	 M Rizky Rachmawan 	14 Jan 25
 107 	 B 	 II 	5	 Dadan Saepudin 	Agustus 2022
 108 	 B 	 II 	6	 Sholtan Muhamad Fikri 	11 Sep 25
 109 	 B 	 II 	7	 Revi Kamaludin 	11 Dec 25
 110 	 B 	 II 	8	 Jantine Suherli 	13 Sep 22
 111 	 B 	 II 	9	 Mega Devi Agustina 	9 Jul 21
 112 	 B 	 II 	10	 Sony Daryanto 	September 2022
 113 	 B 	 II 	11	 Elis Rohaeni 	20 Jun 23
 114 	 B 	 II 	12	 Susanti 	26 Jul 19
 115 	 B 	 II 	13	 Ade Junaedi 	10 Apr 25
 116 	 B 	 II 	14	 Tri Handayani 	7 Sep 21
 117 	 B 	 II 	15	 Nia Kurniasih 	Juni 2022
 118 	 B 	 II 	16	 Arinda W  	14 Jul 22
 119 	 B 	 II 	17	 Ahmad Sidik  	11 Sep 25
 120 	 B 	 II 	18	 Camelia 	14 Mar 23
 121 	 B 	 II 	19	 Dudi Iskandar 	1 Sep 25
 122 	 B 	 II 	20	 Nurgalih 	8 Jun 21
 123 	 B 	 II 	21	 Entin 	1 Mar 22
 124 	 B 	 II 	22	 Asep Nugraha 	13 Feb 23
 125 	 B 	 II 	23	 Muhammad Rizky 	2 Mar 22
 126 	 B 	 II 	24	 Dadan Mulyadi 	25 Feb 25
 127 	 B 	 III 	1	 Nurlianti  	12 Nov 24
 128 	 B 	 III 	2	 Sri Yuniarsih 	15 Aug 24
 129 	 B 	 III 	3	 Sukma wardana 	6 Nov 19
 130 	 B 	 III 	4	 Ana Kartini 	14 Apr 25
 131 	 B 	 III 	5	 Asep Setiawan 	7 Jan 22
 132 	 B 	 III 	6	 Ade Tahudin 	14 Jan 25
 133 	 B 	 III 	7	 Ilham maulana 	2 Jul 25
 134 	 B 	 III 	8	 Dede Sukarlan 	Agustus 2022
 135 	 B 	 III 	9	 Sri Hanah 	5 Mar 21
 136 	 B 	 III 	10	 Sulaeman 	14 Mar 23
 137 	 B 	 III 	11	 Dani Ramdani 	14 Feb 22
 138 	 B 	 III 	12	 Arif Kristian Zai 	6 May 24
 139 	 B 	 III 	13	 Ai Cucu 	15 Aug 24
 140 	 B 	 III 	14	 Cepi sopian 	11 Jun 24
 141 	 B 	 III 	15	 Agus Tuparsa Gani 	9 Jan 23
 142 	 B 	 III 	16	 Syamsuriah 	2 Aug 19
 143 	 B 	 III 	17	 Legi Gustan S 	3 Jan 18
 144 	 B 	 III 	18	 Mimi Karmila 	November 2021
 145 	 B 	 III 	19	 Aminah 	13 Dec 19
 146 	 B 	 III 	20	 Lovieta Fauziah 	16 Oct 19
 147 	 B 	 III 	21	 Irwan setiadi 	14 Jul 23
 148 	 B 	 III 	22	 Habib 	1 Apr 21
 149 	 B 	 III 	23	 KELUAR 	
 150 	 B 	 III 	24	 Erwinyadi Saputra 	14 Feb 23
 151 	 B 	 IV 	1	 Iqbal Ibnu Malik 	4 Jun 24
 152 	 B 	 IV 	2	 Aep  Supriatna  	20/06/2023
 153 	 B 	 IV 	3	 Foatura halawa 	1 Jul 24
 154 	 B 	 IV 	4	 Robi Ferli Gandama 	3 Sep 19
 155 	 B 	 IV 	5	 Dede hasan 	10 Oct 24
 156 	 B 	 IV 	6	 Roni  Irawan 	13 Aug 25
 157 	 B 	 IV 	7	 Anisa 	1 Mar 21
 158 	 B 	 IV 	8	 Dony Elysiana  	10 Mar 20
 159 	 B 	 IV 	9	 Ilyas Hadirman 	10 Jul 25
 160 	 B 	 IV 	10	 Cecep Wan Trigala 	9 Feb 23
 161 	 B 	 IV 	11	 Nery Astra Raharja 	10 Sep 24
 162 	 B 	 IV 	12	 Agnia Afidah 	9 Jul 21
 163 	 B 	 IV 	13	 Sri Nurhayati 	27 Nov 19
 164 	 B 	 IV 	14	 Iros 	2 Jun 25
 165 	 B 	 IV 	15	 Rully esa santosa 	10 Jan 24
 166 	 B 	 IV 	16	 Eef Rismawan 	8 May 25
 167 	 B 	 IV 	17	 Andri 	10 Dec 24
 168 	 B 	 IV 	18	 Agil Wahyu Pratama 	januari 2022
 169 	 B 	 IV 	19	 Yadi Mulyadi  	19 Jun 23
 170 	 B 	 IV 	20	 Rita Rohaeti 	10 Jul 25
 171 	 B 	 IV 	21	 Ahmad  	20 Nov 24
 172 	 B 	 IV 	22	 Dani Sundjani 	11 Jul 24
 173 	 B 	 IV 	23	 Angga Permana Putra 	5 Sep 24
 174 	 B 	 IV 	24	 Kania Maya 	7 Oct 24
 175 	 B 	 V 	1	 KELUAR 	
 176 	 B 	 V 	2	 KELUAR 	
 177 	 B 	 V 	3	 Anang Hidayat 	7 Aug 24
 178 	 B 	 V 	4	 Hendra 	12 Apr 22
 179 	 B 	 V 	5	 Renny Nuraeni 	24 Sep 19
 180 	 B 	 V 	6	 Teteng Rukmana 	14 Jan 25
 181 	 B 	 V 	7	 Hisyam Gusti Arbianto 	11 May 23
 182 	 B 	 V 	8	 Rudi  Wibowo 	1 Mar 14
 183 	 B 	 V 	9	 Nana 	14 Jan 25
 184 	 B 	 V 	10	 Rohana 	1 Jul 20
 185 	 B 	 V 	11	 Fitrianingsih 	5 Aug 19
 186 	 B 	 V 	12	 Asep Iwan Budiawan 	11 Dec 24
 187 	 B 	 V 	13	 Margiyani  	1 Jul 25
 188 	 B 	 V 	14	 Dela Monica F 	1 Feb 19
 189 	 B 	 V 	15	 KELUAR 	
 190 	 B 	 V 	16	 Syahrul Sahrial 	12 May 23
 191 	 B 	 V 	17	 Indra Utami  	14 Jan 25
 192 	 B 	 V 	18	 Sela Setiawati 	7 Sep 23
 193 	 B 	 V 	19	 Elin riyani  	10 Oct 24
 194 	 B 	 V 	20	 Umi Istiqomah 	18 08 2023
 195 	 B 	 V 	21	 Rostiawati 	17 Sep 19
 196 	 B 	 V 	22	 Nita Natalia  	16 Jan 23
 197 	 B 	 V 	23	 Chairudin Nugraha 	1 Mar 22
 198 	 B 	 V 	24	 Febrianti Azhar 	7 Jan 22
 199 	 C 	 I 	1	 Ivan Sofiana 	6 Jan 21
 200 	 C 	 I 	2	 KOSONG 	
 201 	 C 	 I 	3	 Abdul Gani 	28 Jan 21
 202 	 C 	 II 	1	 Saryanto 	4 Jul 25
 203 	 C 	 II 	2	 Ayu Cendrawati 	8 Dec 21
 204 	 C 	 II 	3	 R Darmawan 	16 Jan 20
 205 	 C 	 II 	4	 Meli 	11 Apr 23
 206 	 C 	 II 	5	 Yani Rostiawati 	26 Jul 19
 207 	 C 	 II 	6	 Entar 	1 Aug 19
 208 	 C 	 II 	7	 Dede Kuswati 	5 Apr 23
 209 	 C 	 II 	8	 Gilang Pramuji 	6 Feb 19
 210 	 C 	 II 	9	 Eko Cahyono 	5 Apr 23
 211 	 C 	 II 	10	 Edi Suhendi 	17 Dec 19
 212 	 C 	 II 	11	 Herni Hidayah P 	9 Feb 23
 213 	 C 	 II 	12	 Raden Reynaldi 	Januari 2022
 214 	 C 	 II 	13	 Mulyana  	26 Feb 24
 215 	 C 	 II 	14	 Qori apriani 	3 May 21
 216 	 C 	 II 	15	 Taufik Hamzah 	6 Jan 21
 217 	 C 	 II 	16	 Dede Rahmat 	24 Jan 23
 218 	 C 	 II 	17	 Soni Wahyu Wahyudin 	3 Mar 25
 219 	 C 	 II 	18	 Agus Karpin 	15 Aug 24
 220 	 C 	 II 	19	 Siti Nur Hasanah 	4 Dec 20
 221 	 C 	 II 	20	 Indra Nugraha 	22 Nov 19
 222 	 C 	 II 	21	 Evi 	25 Aug 19
 223 	 C 	 II 	22	 Bernart 	6 Jan 21
 224 	 C 	 II 	23	 Yani Maryani 	26 Jul 19
 225 	 C 	 II 	24	 Rizki Permana Saputra 	05-062025
 226 	 C 	 III 	1	 Tatang 	4 May 21
 227 	 C 	 III 	2	 Asep Sukmana 	11 Dec 24
 228 	 C 	 III 	3	 Dodi   	5 Aug 19
 229 	 C 	 III 	4	 Riki Saputra 	8 Dec 16
 230 	 C 	 III 	5	 Widayati 	11 Dec 19
 231 	 C 	 III 	6	 Herti Mustika  	4 Apr 17
 232 	 C 	 III 	7	 Hadi 	1 Jul 20
 233 	 C 	 III 	8	 KELUAR 	
 234 	 C 	 III 	9	 Desi 	1 10 2020
 235 	 C 	 III 	10	 Sidik Setia Permana 	4 Apr 18
 236 	 C 	 III 	11	 Dudi Rusnadi 	8 Jan 19
 237 	 C 	 III 	12	 Rokhmat  	1 Aug 19
 238 	 C 	 III 	13	 Indra Noverdian 	15 Apr 21
 239 	 C 	 III 	14	 Susi 	10 Nov 23
 240 	 C 	 III 	15	 Hendra Hendrawan 	4 Oct 16
 241 	 C 	 III 	16	 Neng Iceu 	7 Jan 22
 242 	 C 	 III 	17	 Ruhaendi  	11 Oct 23
 243 	 C 	 III 	18	 Dadan 	1 Feb 21
 244 	 C 	 III 	19	 Wandi Kuswandi  	19 Jun 23
 245 	 C 	 III 	20	 Hari Purnawan 	6 Aug 24
 246 	 C 	 III 	21	 Budiyawan 	1 Aug 19
 247 	 C 	 III 	22	  Waslam 	4 Sep 18
 248 	 C 	 III 	23	 Ai Halimah 	28 Aug 19
 249 	 C 	 III 	24	 Ade Suryana 	4 May 21
 250 	 C  	 IV 	1	 Dikdik 	7 Jan 22
 251 	 C 	 IV 	2	 Wulan Aprianti 	1 Apr 20
 252 	 C  	 IV 	3	 Feri Febuandi 	5 Apr 21
 253 	 C 	 IV 	4	 Eli nur imaniyah 	7 Feb 24
 254 	 C  	 IV 	5	 Tri yulianti 	1 Aug 19
 255 	 C 	 IV 	6	 Andri Irawan 	8 Mar 23
 256 	 C  	 IV 	7	 Arpan A 	3 Jan 25
 257 	 C 	 IV 	8	 Ai Karyati 	14 Mar 23
 258 	 C  	 IV 	9	 Agung Wibowo 	11 Dec 20
 259 	 C 	 IV 	10	 Jajang Rochyana 	7 Jun 23
 260 	 C  	 IV 	11	 Tantan Taruna 	24 Jul 23
 261 	 C 	 IV 	12	 Muti  	6 Sep 23
 262 	 C  	 IV 	13	 Teti Setiawati 	14 Feb 23
 263 	 C 	 IV 	14	 Ana Herlina 	5 Sep 16
 264 	 C  	 IV 	15	 Soni Johan  	21 Feb 23
 265 	 C 	 IV 	16	 Ade Ela 	12 Jan 23
 266 	 C 	 IV 	17	 Asep Saepulloh 	30 Sep 19
 267 	 C 	 IV 	18	 Ninah Nani 	14 Feb 23
 268 	 C  	 IV 	19	 Bima Prayoga  	11-092025
 269 	 C 	 IV 	20	 KOSONG 	
 270 	 C  	 IV 	21	 Agus 	7 Feb 23
 271 	 C 	 IV 	22	 Anita Nova 	1 Nov 17
 272 	 C  	 IV 	23	 Elizabeth 	19 Jul 18
 273 	 C 	 IV 	24	 Fikri Irfanudin 	20 Sep 24
 274 	 C 	 V 	1	 Hendi heryadi 	19 May 23
 275 	 C 	 V 	2	 Didi Kusnadi 	
 276 	 C 	 V 	3	 Dadan Hapit 	12 Dec 23
 277 	 C 	 V 	4	 Yadi Kusmayadi 	1 Apr 21
 278 	 C 	 V 	5	 Raden Hendi Rustandi 	16 Feb 23
 279 	 C 	 V 	6	 Neneng Yatini 	26 Aug 19
 280 	 C 	 V 	7	 Tata Kartana 	12 Jan 23
 281 	 C 	 V 	8	 Ibrahim karim 	1 Apr 21
 282 	 C 	 V 	9	 Megi Koswara 	1 Aug 19
 283 	 C 	 V 	10	 Mela 	23 Feb 23
 284 	 C 	 V 	11	 Bubun Setiabudi 	30 Dec 22
 285 	 C 	 V 	12	 Rahmin 	1 Dec 20
 286 	 C 	 V 	13	 Herdi Ronius Gea 	8 Jan 25
 287 	 C 	 V 	14	Nani Marlina	26 Jul 19
 288 	 C 	 V 	15	 Devita Aprilia 	10 02 2023
 289 	 C 	 V 	16	 Angga Prasetya 	4 Jul 23
 290 	 C 	 V 	17	 Diah Herawati 	juli 2022
 291 	 C 	 V 	18	 Yonathan 	5 Apr 24
 292 	 C 	 V 	19	 Sarif Buldansyah 	7 Dec 23
 293 	 C 	 V 	20	 R Roro Novianti 	6 Jan 21
 294 	 C 	 V 	21	 Nur Herawati 	10 May 21
 295 	 C 	 V 	22	 Ratna 	5 Apr 23
 296 	 C 	 V 	23	 Selfi Destriana 	13 Nov 18
 297 	 C 	 V 	24	 Oneng Purwanti 	18 Feb 25
 298 	 D 	 I 	1	 Dessy Aprianti 	18 Jan 19
 299 	 D 	 I 	2	 Emas Rini 	5 Mar 18
 300 	 D 	 I 	3	 Sobri Purnomo 	3 Jan 24
 301 	 D 	 I 	4	 Dude Memed 	14 Apr 20
 302 	 D 	 I 	5	 Gusti Megawati 	8 Aug 23
 303 	 D 	 I 	6	 Rony Yusman 	3 Feb 20
 304 	 D 	 I 	7	 Suwanto 	11 Apr 16
 305 	 D 	 I 	8	 Rizkya Putri 	15 Apr 21
 306 	 D 	 I 	9	 Dwi Fitriani 	30 Aug 19
 307 	 D 	 I 	10	 Elizabeth pua Hedung 	16 Jul 24
 308 	 D 	 I 	11	 Aceng 	1 Dec 19
 309 	 D 	 I 	12	 Isnan Rhamadan 	8 Dec 21
 310 	 D 	 I 	13	 Kusnandar 	9 Oct 20
 311 	 D 	 I 	14	 Asep Efendi 	1 Mar 14
 312 	 D 	 II 	1	 Roni Rohadi 	2 Sep 19
 313 	 D 	 II 	2	 Hj. M. Magdalena 	
 314 	 D 	 II 	3	 Juhana  	1 Sep 22
 315 	 D 	 II 	4	 Wawan Gunawan 	10 Aug 18
 316 	 D 	 II 	5	 Ani Widayani 	5 Jul 21
 317 	 D 	 II 	6	 Ningsih 	21 Feb 23
 318 	 D 	 II 	7	 Ai Dariah  	8 Jun 21
 319 	 D 	 II 	8	 Nitty Ratnawati 	14 Jul 23
 320 	 D 	 II 	9	 Yohanes 	11 Oct 19
 321 	 D 	 II 	10	 Salamun 	5 Mar 21
 322 	 D 	 II 	11	 Irawati 	18 Feb 25
 323 	 D 	 II 	12	 Tohiroh 	7 Mar 23
 324 	 D 	 II 	13	 Fransiskus Feryanto S 	20 Jun 23
 325 	 D 	 II 	14	 Tony Prayogi 	14 Feb 23
 326 	 D 	 II 	15	 Nia Kurniasih 	1 Mar 14
 327 	 D 	 II 	16	 Acep Sudrajat 	1 Apr 20
 328 	 D 	 II 	17	 Faiza Rahma Utami 	14 May 24
 329 	 D 	 II 	18	 Suryana  	24 Jul 23
 330 	 D 	 II 	19	 Ipan 	4 Mar 21
 331 	 D 	 II 	20	 Ines Marcella 	10 Dec 19
 332 	 D 	 III 	1	 B Bulian 	8 Dec 21
 333 	 D 	 III 	2	 Dodi Alfian 	30 Jul 19
 334 	 D 	 III 	3	 Cep Naswari 	10 Dec 19
 335 	 D 	 III 	4	 Ilyas Hendritiono 	10 Dec 19
 336 	 D 	 III 	5	 Febri putri  	18 Feb 25
 337 	 D 	 III 	6	 Tri Ajie 	5 Oct 20
 338 	 D 	 III 	7	 Tio Fahrizal N 	13/04/202
 339 	 D 	 III 	8	 Yanto siswanto 	18 Aug 23
 340 	 D 	 III 	9	 Dhoni Sartika 	1 Feb 18
 341 	 D 	 III 	10	 Kania 	15 Aug 24
 342 	 D 	 III 	11	 Nani heryani 	21 Aug 23
 343 	 D 	 III 	12	 Sandi 	10 Jul 20
 344 	 D 	 III 	13	 Budi Rahayu 	12 Apr 22
 345 	 D 	 III 	14	 Yosef 	6 Jul 20
 346 	 D 	 III 	15	 Sukendar  	18 Aug 23
 347 	 D 	 III 	16	 lilis 	20 Feb 20
 348 	 D 	 III 	17	 Sumarna 	1 Apr 21
 349 	 D 	 III 	18	 Usep Aminudin 	17 Dec 19
 350 	 D 	 III 	19	 Melia Enita  	22 Feb 22
 351 	 D 	 III 	20	 Marisa Stepani 	7 Jan 22
 352 	 D 	 IV  	1	 Ratna sari  	16 Nov 23
 353 	 D 	 IV  	2	 Adit 	16 Jan 20
 354 	 D 	 IV  	3	 Kurniawan 	4 Nov 21
 355 	 D 	 IV  	4	 Yuli Yanti 	7 Feb 25
 356 	 D 	 IV  	5	 Erwin Yadi S 	11 Jul 24
 357 	 D 	 IV  	6	 Lia Irawati 	15 Aug 24
 358 	 D 	 IV  	7	 Wendi Budiman 	27 Nov 19
 359 	 D 	 IV  	8	 KOSONG 	
 360 	 D 	 IV  	9	 Cecep Sobandi 	6 Oct 17
 361 	 D 	 IV  	10	 Momon 	11 Oct 24
 362 	 D 	 IV  	11	 Ajie 	4 Apr 18
 363 	 D 	 IV  	12	 Eva Claudia 	September 2022
 364 	 D 	 IV  	13	  Dewi Rusmiyati 	10 Jul 25
 365 	 D 	 IV  	14	 Sri Wahyuni 	30 Jul 19
 366 	 D 	 IV  	15	 Beni Drajat 	8 May 25
 367 	 D 	 IV  	16	 Ayu 	5 Dec 18
 368 	 D 	 IV  	17	 Rosi Sanjaya 	8 Feb 23
 369 	 D 	 IV  	18	 Fitri Aprianti 	8 Jun 21
 370 	 D 	 IV  	19	 Dian pertiwi (lala) 	12 Jan 23
 371 	 D 	 IV  	20	 Horatio 	1 Aug 19
"""

# Parsing logic
rows = []
roman_map = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5}

# Split by newline first
lines = data_text.strip().split('\n')

for i, line in enumerate(lines):
    # Regex to split multiple tabs or spaces
    parts = re.split(r'\t|\s{2,}', line.strip())
    
    if len(parts) >= 5:
        # Check if it's a valid tenant
        nama = parts[4].strip()
        if "KELUAR" in nama.upper() or "KOSONG" in nama.upper():
            continue
            
        gedung = parts[1].strip()
        lantai_roman = parts[2].strip()
        unit = parts[3].strip()
        
        # Date processing (very basic)
        tgl_raw = parts[5].strip() if len(parts) > 5 else ""
        
        # Generate Dummies
        clean_name = re.sub(r'[^a-zA-Z\s]', '', nama).strip().lower()
        clean_nama_id = re.sub(r'\s+', '_', clean_name)
        
        rows.append({
            "nama": nama,
            "nik": f"327100{1000000000 + i}",
            "email": f"{clean_nama_id}_{i}@rusun.com",
            "rusunawa": "Cibeureum",
            "gedung": gedung,
            "lantai": roman_map.get(lantai_roman, 1),
            "unit": int(unit),
            "tgl_mulai": tgl_raw if tgl_raw else "2024-01-01",
            "tgl_selesai": "2026-01-01",
            "jumlah_motor": 1
        })

df = pd.DataFrame(rows)
output_path = "d:/ProjectAI/Sistem-Rusunawa/Data_Penghuni_Cibeureum.xlsx"
df.to_excel(output_path, index=False)
print(f"File created successfully at: {output_path}")
print(f"Total valid tenants: {len(rows)}")
