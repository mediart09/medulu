# SQL Medulu (Supabase) — urutan menjalankan

Jalankan di **Supabase > SQL Editor > New query**, **satu file per query**, sesuai nomor (01 → 17).
Semua file aman dijalankan ulang (idempoten), jadi pada database yang sudah berjalan Anda boleh menjalankan ulang seluruhnya berurutan tanpa menghapus data.

## Daftar file

| No | File | Isi | Bergantung pada |
|----|------|-----|-----------------|
| 01 | `01_master_data_warga.sql` | Tabel warga, input/tambah warga, verifikasi NKK, bucket privat `kk` | prasyarat "update warga" (lihat catatan 1) |
| 02 | `02_login_sesi.sql` | **Admin** (admin_rt, admin_cadangan, `_is_admin`), sesi login, login/cek sesi/logout, validasi token | 01 |
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

1. **Pertama kali dibuka**, bila belum ada admin, halaman login menampilkan modal **Buat Admin RT**: isi No. HP (nama pengguna) dan kata sandi (minimal 8 karakter, tidak boleh 16 digit angka). Setelah satu admin ada, modal tidak pernah muncul lagi dan server menolak pembuatan admin kedua.
2. **Login**: No. HP + kata sandi admin = **Admin utama**. No. HP + NIK = pengguna biasa, termasuk bila No. HP-nya sama dengan No. HP admin.
3. **Admin Cadangan**: dari Admin utama, buka Administrasi > **Admin Cadangan**, isi No. HP + NIK (1 orang saja; bisa diubah/dihapus). Orangnya harus sudah terdaftar di data warga dengan No. HP yang sama. Ia masuk lewat login biasa (No. HP + NIK) dan mendapat hak admin yang sama. Hanya Admin utama yang melihat tombol ini.
4. Semua pemeriksaan hak admin di SQL (Korespondensi, Database Warga, Laporan, Polling, Ronda, Profil RT, dst.) kini memakai satu fungsi: `_is_admin(token)` di file 02.
5. Admin utama tidak punya baris di tabel `warga`, jadi menu **MyData** dan **Pengajuan Surat Pengantar** (data pribadi) tidak tersedia baginya; untuk keperluan pribadi ia masuk dengan No. HP + NIK. Admin utama tidak ikut memberi suara polling dan bukan petugas ronda.
6. Kolom `warga.peran = 'Admin'` **tidak lagi memberi hak admin**. Peran `Pengurus` tetap boleh memproses Surat Pengantar seperti sebelumnya.

### Lupa kata sandi admin / mengulang pembuatan admin
Jalankan di Supabase > SQL Editor:
```sql
-- ganti kata sandi admin utama
update public.admin_rt set sandi_hash = extensions.crypt('SandiBaru123', extensions.gen_salt('bf', 10));
-- ATAU hapus admin supaya modal "Buat Admin RT" muncul lagi di aplikasi
delete from public.admin_rt;
```
**Penting:** modal Buat Admin bisa diisi siapa pun yang pertama membuka aplikasi. Setelah memasang database dan situs, **segera buka aplikasi dan buat admin Anda** sebelum alamatnya dibagikan.

## Pasang untuk RT baru
1. Buat project Supabase baru. Jalankan file SQL 01 sampai 17 berurutan (lihat catatan 1 di bawah untuk prasyarat "update warga").
2. Buka `index.html`, cari `KONFIGURASI SUPABASE`, tempel **Project URL** pada `SUPABASE_URL` dan **anon/publishable key** pada `SUPABASE_ANON_KEY`. Jangan pernah memakai service_role key di berkas ini.
3. Unggah ke GitHub Pages / hosting, buka aplikasinya, lalu buat admin lewat modal.
4. Masih bersifat khusus RT 09 dan perlu disesuaikan per RT: teks "RT 09" / "RT.09" dan nama kelurahan di index.html, format nomor surat (`RT09`, `RT.09`) di SQL 03, 04, 13, nama/logo aplikasi, serta gambar Cloudinary.

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

1. **Bagian "update warga" tidak ada di zip.** File 01 mensyaratkan kolom tambahan tabel `warga` (`status_kawin`, `no_urut`, `hubungan`, `email`, `link_kk`, `status_tinggal`, dst.), view `v_warga`, dan fungsi `_tgl_aman`. Di database Anda yang sekarang semuanya sudah ada, jadi aman. Untuk membangun database dari nol, file itu harus disediakan dan dijalankan sebelum 01.
2. **`kode.txt` dan `kode anon dan api PILEI.txt` tidak ikut dikemas.** `kode.txt` berisi kunci rahasia (*service key*) Supabase. Jika file zip itu pernah dikirim ke pihak lain, sebaiknya kunci tersebut diganti (rotate) di Supabase > Project Settings > API.
3. Tabel `petugas_ronda` dimulai **kosong**. Tambahkan petugas lewat Administrasi > Petugas Ronda; sebelum itu tidak ada yang bisa absen ronda.
4. File 12 dan 13 membaca kolom `nama_asli` langsung dari tabel `warga` (bukan dari `v_warga`). Pastikan kolom itu ada di tabel Anda.

## Pengujian

Seluruh 17 file dijalankan berurutan **dua kali** (database kosong, lalu ulang) di PostgreSQL 16 lokal dengan tiruan skema Supabase dan prasyarat "update warga" buatan sendiri. Hasilnya tanpa galat, dan daftar fungsi/tabel/view identik dengan seri sumber. Uji fungsi singkat juga lolos: login, pengajuan SP (biasa dan manual Admin), persetujuan, Info Aktual, ronda, polling, arsip, kerentanan. Pengujian ini belum dilakukan pada project Supabase Anda sendiri.

**Catatan perubahan Admin (file 02, 03, 04, 06, 08, 09, 10, 12, 13, 16):** bagian ini ditulis kemudian dan belum dijalankan pada PostgreSQL/Supabase sungguhan. Alur antarmukanya sudah diuji dengan server tiruan, tetapi SQL-nya belum. Jalankan 02 lalu 03 sampai 17 pada project uji dahulu, dan periksa hasilnya sebelum dipakai warga.
