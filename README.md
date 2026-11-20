# SQL Medulu (Supabase) — urutan menjalankan

Jalankan di **Supabase > SQL Editor > New query**, **satu file per query**, sesuai nomor (01 → 17).
Semua file aman dijalankan ulang (idempoten), jadi pada database yang sudah berjalan Anda boleh menjalankan ulang seluruhnya berurutan tanpa menghapus data.

## Daftar file

| No | File | Isi | Bergantung pada |
|----|------|-----|-----------------|
| 01 | `01_master_data_warga.sql` | Tabel warga (lengkap), view `v_warga`, input/tambah warga, verifikasi NKK, bucket privat `kk` | tidak ada |
| 02 | `02_login_sesi.sql` | **Admin** (admin_rt, admin_cadangan, `_is_admin`), **identitas RT** (`identitas_rt`, `ref_kecamatan`, `_format_nomor`), sesi login, login/cek sesi/logout | 01 |
| 03 | `03_korespondensi_arsip.sql` | Surat masuk/keluar, undangan, notula, penomoran otomatis, bucket `arsip_surat`, Agenda RT, ubah data | 02 |
| 04 | `04_surat_pengantar.sql` | Pengajuan & persetujuan Surat Pengantar, notifikasi lonceng (sudah memuat 04b: input manual data lama) | 03 |
| 05 | `05_mydata.sql` | MyData: profil, keluarga, arsip SP se-NKK, tambah anggota | 04 |
| 06 | `06_dashboard_statistik.sql` | Beranda: `get_statistik`, Data Statistik, tabel `pengaturan` & `info_aktual` | 04 |
| 07 | `07_info_aktual.sql` | Kartu Pelayanan Surat Pengantar di Info Aktual | 04 |
| 08 | `08_absensi_ronda.sql` | Absensi Ronda Malam + rekap + kelola Petugas Ronda (gabungan 08, 18, 19) | 02 |
| 09 | `09_polling.sql` | Polling warga (satu suara per NKK) | 02 |
| 10 | `10_pengaduan_inventaris.sql` | Pengaduan & Inventaris (khusus Admin) | 09 |
| 11 | `11_info_arsip_aset.sql` | Info Arsip & Aset: korespondensi, SP, inventaris | 03, 04, 10 |
| 12 | `12_database_warga.sql` | Database Warga (khusus Admin) | 01 |
| 13 | `13_laporan_kondusifitas.sql` | Laporan Kondusifitas Wilayah: input, cetak PDF, arsip | 02, 03 |
| 14 | `14_kerentanan.sql` | Disabilitas, Bumil, Bantuan (PKH dst.) | 06 |
| 15 | `15_statistik_balita.sql` | Jumlah balita untuk kartu Data Warga Prioritas | 01, 02 |
| 16 | `16_profil_rt.sql` | Profil RT + bucket `profil_rt` | 02 |
| 17 | `17_edit_warga.sql` | Ambil semua kolom warga & edit data warga (Admin) | 16 |

## Cara kerja Admin (tanpa nama admin di kode)

Nama admin tidak lagi tertulis di index.html maupun SQL. Admin ditetapkan lewat aplikasi:

1. **Pertama kali dibuka**, bila belum ada admin, halaman login menampilkan modal **Buat Admin RT**: pilih **Kecamatan**, isi **Kelurahan**, **RW**, **RT**, lalu **No. HP** (nama pengguna) dan **kata sandi** (minimal 8 karakter, tidak boleh 16 digit angka, diulang dua kali). Wilayah dan akun admin disimpan bersamaan. Setelah satu admin ada, modal tidak pernah muncul lagi dan server menolak pembuatan admin kedua.
2. **Login**: No. HP + kata sandi admin = **Admin utama**. No. HP + NIK = pengguna biasa, termasuk bila No. HP-nya sama dengan No. HP admin.
3. **Admin Cadangan**: dari Admin utama, buka Administrasi > **Admin Cadangan**, isi No. HP + NIK (1 orang saja; bisa diubah/dihapus). Orangnya harus sudah terdaftar di data warga dengan No. HP yang sama. Ia masuk lewat login biasa (No. HP + NIK) dan mendapat hak admin yang sama. Hanya Admin utama yang melihat tombol ini.
4. Semua pemeriksaan hak admin di SQL (Korespondensi, Database Warga, Laporan, Polling, Ronda, Profil RT, dst.) kini memakai satu fungsi: `_is_admin(token)` di file 02.
5. Admin utama tidak punya baris di tabel `warga`, jadi menu **MyData** dan **Pengajuan Surat Pengantar** (data pribadi) tidak tersedia baginya; untuk keperluan pribadi ia masuk dengan No. HP + NIK. Admin utama tidak ikut memberi suara polling dan bukan petugas ronda.
6. Kolom `warga.peran = 'Admin'` **tidak lagi memberi hak admin**. Peran `Pengurus` (kolom `warga.peran`) dan nama yang tercantum di Profil RT > Pengurus RT **juga tidak memberi hak admin**. Memproses Surat Pengantar dan hak admin lainnya hanya untuk Admin utama dan Admin Cadangan.

## Format nomor surat (semua dokumen)

```
(no_urut)/(kd_surat)-RT(no_rt)/(kd_kec)(kd_kel)(kd_rw)/bulan romawi/tahun
contoh Kec. Wua-Wua, Kel. Bonggoeya, RW 05, RT 09:  001/UND-RT09/070105/XI/2026
```

- Satu fungsi pembentuk: `_format_nomor(urut, kode, tanggal)` di file 02. Dipakai oleh Undangan (UND), Notula (NTL), Surat Keluar (HIM, SPY, PMB, PEN, SED, SP1, SP2, SPK, LL) di 03, Surat Pengantar (SP, SPN, SPW, SPL, SPDP, SPC, SPU, SPI, SPAW) di 04, dan Laporan Kondusifitas (LP) di 13.
- Nomor urut 3 digit, dihitung per kode per tahun (tidak berubah dari sebelumnya).
- Kode kecamatan (tabel `ref_kecamatan`): 01 Mandonga, 02 Kendari, 03 Baruga, 04 Poasia, 05 Kendari Barat, 06 Abeli, 07 Wua-Wua, 08 Kadia, 09 Puuwatu, 10 Kambu, 11 Nambo.
- Kode kelurahan = urutan penginputan (01 untuk kelurahan pertama). Kode RW = nomor RW (2 digit), RT = nomor RT (2 digit).
- Tersimpan di tabel `identitas_rt` (satu baris). Aplikasi membacanya lewat `get_identitas_rt()` untuk kop/judul laporan dan label RT.
- Nomor lama yang sudah tersimpan **tidak diubah**; hanya nomor baru yang memakai format ini.
- **Database yang sudah punya admin**: file 02 mengisi `identitas_rt` otomatis dengan Kec. Wua-Wua (07), Kel. Bonggoeya (01), RW 05, RT 09. Ubah nilainya di bagian 3 file 02 sebelum dijalankan bila bukan itu. Mengoreksi identitas sesudahnya:
  ```sql
  update public.identitas_rt set kd_kec='07', nama_kec='Wua-Wua', nama_kel='Bonggoeya', no_rw='05', no_rt='09';
  ```
- **Nama Ketua RT** diisi pada modal Buat Admin (kolom `identitas_rt.nama_ketua`). Dipakai sebagai placeholder `{{ketua_rt}}` di template Google Docs, nama pada tanda tangan laporan, dan isi kode QR: laporan `<nama> | Ketua RT.09 | <nomor>`, surat pengantar `<nama> | Ketua RT09 | <nomor> | <tanggal>` (nama tanpa gelar). Database yang admin-nya sudah dibuat sebelum item ini ada, isi manual:
  ```sql
  update public.identitas_rt set nama_ketua = 'Nama Ketua RT, gelar';
  ```
- Kop dan tanda tangan pada PDF yang dibuat Apps Script dari template Google Docs (Surat Keluar, Undangan, Notula, Surat Pengantar) tidak berasal dari index.html. Nomornya otomatis mengikuti format baru karena diambil dari database; tulisan "RT 09 / Kelurahan / Kecamatan" di template Docs diubah manual di templatenya.

## Persetujuan penggunaan data

- **Warga:** setelah masuk, bila belum menyetujui versi teks yang berlaku, muncul layar "Persetujuan Penggunaan Data" (tombol Keluar atau Saya mengerti dan setuju). Dicatat di tabel `persetujuan_data` (waktu, versi, sumber `warga`). Admin utama tidak diminta, karena tidak punya data warga.
- **Pendataan:** Admin wajib mencentang pernyataan bahwa data diinput dengan sepengetahuan dan persetujuan pemilik data (atau orang tua/wali bagi anak). Dicatat dengan sumber `admin` dan id admin yang menginput. Warga tetap melihat layar persetujuan saat masuk pertama.
- **Teks** ada di `TEKS_PERSETUJUAN` pada index.html, dipakai juga pada Bantuan butir 2. **Bila isinya diubah**, naikkan angka di fungsi `_versi_persetujuan()` (file 02) dan jalankan ulang file 02 supaya semua warga diminta setuju lagi.
- Cek catatan: `select w.nama, p.sumber, p.versi, p.disetujui_pada from persetujuan_data p join warga w on w.id = p.warga_id order by p.disetujui_pada desc;`
- Kalimat persetujuan ini disusun sebagai pemberitahuan umum, bukan nasihat hukum. Sebaiknya diperiksa pihak yang berwenang (misalnya kelurahan) sebelum dipakai resmi.

## Verifikasi dokumen (QR), email pemohon, dan pemantauan

- **QR bisa diverifikasi.** Isi `APP_URL` di `Persetujuan.gs` dengan alamat aplikasi (mis. `https://nama.github.io/medulu/`). QR pada surat pengantar lalu berisi `<alamat>?cek=<nomor surat>`; QR pada PDF laporan memakai alamat halaman tempat laporan dicetak. Memindainya membuka halaman "Verifikasi Dokumen" (fungsi `verifikasi_dokumen` di file 13): jenis dokumen, nomor, tanggal, nama pemohon yang disamarkan, dan penandatangan. Tanpa NIK, alamat, atau isi surat. `APP_URL` kosong = QR surat pengantar tetap berupa teks lama.
- **Email pemohon.** Saat surat pengantar disetujui, `Persetujuan.gs` mengirim email berisi tautan PDF ke email warga (bila terisi). Gratis lewat Gmail, batas 100 penerima per hari untuk akun Gmail biasa dan 1.500 untuk Google Workspace. Matikan dengan `KIRIM_EMAIL_PEMOHON = false`. Setelah menempel skrip baru, jalankan fungsi apa saja sekali dari editor dan setujui izin tambahan "mengirim email", lalu deploy versi baru.
- **Pemantauan.** `Korespondensi.gs` mengirim email ke pemilik script (atau `PANTAU.EMAIL`) bila PDF arsip gagal dibuat atau tertunda lebih dari 30 menit; `Persetujuan.gs` bila persetujuan atau pengiriman email gagal. Paling banyak satu email per jenis galat per 3 sampai 6 jam. Tambahkan juga di Apps Script > Triggers > ikon pemicu > Failure notification settings > Notify me immediately.
- **Pendataan hanya untuk Admin.** `cari_keluarga` kini wajib token Admin, dan `tambah_warga` menjadi fungsi internal (dipakai `tambah_anggota_keluarga` di MyData); Pendataan memakai `tambah_warga_admin`. Batasan yang tersisa: unggah berkas KK ke Storage masih dibatasi oleh aturan bucket (nama folder NKK, jenis dan ukuran berkas), bukan oleh token, sehingga belum bisa dibatasi hanya untuk Admin tanpa mengubah cara login.

### Lupa kata sandi admin / mengulang pembuatan admin
Jalankan di Supabase > SQL Editor:
```sql
-- ganti kata sandi admin utama
update public.admin_rt set sandi_hash = extensions.crypt('SandiBaru123', extensions.gen_salt('bf', 10));
-- ATAU hapus admin supaya modal "Buat Admin RT" muncul lagi di aplikasi (hapus juga identitasnya)
delete from public.admin_rt;
delete from public.identitas_rt;
```
**Penting:** modal Buat Admin bisa diisi siapa pun yang pertama membuka aplikasi. Setelah memasang database dan situs, **segera buka aplikasi dan buat admin Anda** sebelum alamatnya dibagikan.

## Pasang untuk RT baru
1. Buat project Supabase baru. Jalankan file SQL 01 sampai 17 berurutan (lihat catatan 1 di bawah untuk prasyarat "update warga").
2. Buka `index.html`, cari `KONFIGURASI SUPABASE`, tempel **Project URL** pada `SUPABASE_URL` dan **anon/publishable key** pada `SUPABASE_ANON_KEY`. Jangan pernah memakai service_role key di berkas ini.
3. Unggah ke GitHub Pages / hosting, buka aplikasinya, lalu buat admin lewat modal.
4. Nomor surat, kop laporan, dan label RT kini mengikuti wilayah yang diisi pada modal Buat Admin, jadi tidak perlu diedit di index.html atau SQL. Yang masih khusus RT 09 dan perlu disesuaikan per RT: nama Ketua RT pada tanda tangan laporan (`LAP.nama` di index.html), teks Visi, template Google Docs, nama/logo aplikasi, serta gambar Cloudinary.

## Apa yang digabung atau diubah

- **08** = `08 absensi ronda` + `18 rekap ronda` + `19 petugas ronda`. Hanya versi terbaru tiap fungsi yang dipertahankan. File 18 tidak lagi dipakai (jika dijalankan sesudah 19, ia menimpa versi yang benar).
- **04** = `04 pengajuan sp` + `04 pengajuan sp tgl manual` (04b). Fungsi `ajukan_surat` dan `setujui_surat` kini hanya punya satu definisi (versi 04b). Fungsi `_nomor_sp` versi 1 argumen dihapus karena diganti versi `(text, date)`. Bagian input manual tetap bertanda **SEMENTARA**; menonaktifkannya cukup lewat `TGL_MANUAL_ADMIN = false` di index.html.
- **07** memakai versi terbaru `get_info_pelayanan_surat` (dari 04b: data manual tidak ditampilkan, label lewat `_label_surat`).
- **11**: `arsip_korespondensi` memakai versi terbaru dari 03 (memuat notula dan `arsip_path`). Versi lama di 11 (tanpa notula) dibuang, begitu juga kebijakan opsional `arsip_surat_baca` karena bucket `arsip_surat` sekarang publik.
- **04**: fungsi bantu (`_tgl_indo`, dll.) dipindah ke atas bagian migrasi. Sebelumnya dipakai sebelum didefinisikan, sehingga gagal pada database kosong.
- **01**: ditambah `revoke all on public.warga from anon, authenticated` (ada di skema dasar lama, tetapi tidak terbawa ke 01).
- Penomoran komentar di dalam file dirapikan, dan semua rujukan antarfile memakai nama baru. Isi fungsi tidak diubah.

## File lama yang tidak dipakai lagi

Semua objek di file-file ini sudah tercakup di 01–17, jadi **jangan dijalankan**:
`master data`, `mysapa`, `korespondensi`, `mydata`, `dashboard`, `update beranda`, `surat pengantar`, `surat pengantar v2`, `persetujuan sp`, `04 pengajuan sp tgl manual`, `18 rekap ronda`, `19 petugas ronda`.

Tabel lama yang mungkin masih ada di database dan sudah tidak dipakai (boleh di-drop manual bila kosong): `pengajuan_surat`, `absensi_ronda`, `polling`.

## Catatan penting

1. **"update warga" dan "update v. warga" sudah digabung ke file 01**: tabel `warga` lengkap (semua kolom tambahan, `no_urut` identity, trigger `warga_rapikan`) dan view `v_warga` (usia dan status pemilu). Fungsi `hitung_status_pemilu` (definisi asli Anda) ikut ditulis di file 01 dengan `create or replace`, dan `_tgl_aman` dibuat otomatis hanya bila belum ada. Jadi file 01 bisa dijalankan pada database kosong.
2. **`kode.txt` dan `kode anon dan api PILEI.txt` tidak ikut dikemas.** `kode.txt` berisi kunci rahasia (*service key*) Supabase. Jika file zip itu pernah dikirim ke pihak lain, sebaiknya kunci tersebut diganti (rotate) di Supabase > Project Settings > API.
3. Tabel `petugas_ronda` dimulai **kosong**. Tambahkan petugas lewat Administrasi > Petugas Ronda; sebelum itu tidak ada yang bisa absen ronda.
4. File 12 dan 13 membaca kolom `nama_asli` langsung dari tabel `warga` (bukan dari `v_warga`). Pastikan kolom itu ada di tabel Anda.

## Pengujian

Seluruh 17 file dijalankan berurutan **dua kali** (database kosong, lalu ulang) di PostgreSQL 16 lokal dengan tiruan skema Supabase dan prasyarat "update warga" buatan sendiri. Hasilnya tanpa galat, dan daftar fungsi/tabel/view identik dengan seri sumber. Uji fungsi singkat juga lolos: login, pengajuan SP (biasa dan manual Admin), persetujuan, Info Aktual, ronda, polling, arsip, kerentanan. Pengujian ini belum dilakukan pada project Supabase Anda sendiri.

**Catatan perubahan Identitas RT & format nomor (file 01, 02, 03, 04, 13):** ditulis tanpa dijalankan pada PostgreSQL/Supabase sungguhan. Jalankan 01 sampai 17 pada project uji dahulu. File 02 mengganti `status_admin()` dan `buat_admin_awal(...)` (tanda tangan baru dengan 6 parameter); index.html versi ini wajib dipakai bersama file 02 ini.

**Catatan perubahan Admin (file 02, 03, 04, 06, 08, 09, 10, 12, 13, 16):** bagian ini ditulis kemudian dan belum dijalankan pada PostgreSQL/Supabase sungguhan. Alur antarmukanya sudah diuji dengan server tiruan, tetapi SQL-nya belum. Jalankan 02 lalu 03 sampai 17 pada project uji dahulu, dan periksa hasilnya sebelum dipakai warga.
