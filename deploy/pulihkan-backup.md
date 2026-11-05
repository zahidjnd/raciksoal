# Memulihkan backup database

Backup dibuat tiap malam pukul 02.00 WIB oleh `backup.sh` (salinan: `deploy/backup.sh`).
Isinya dikunci dengan `BACKUP_PASSPHRASE` dan dikirim ke repo privat
https://github.com/zahidjnd/raciksoal-backup (satu file `raciksoal.sql.gz.enc`; tiap malam satu commit).
Di hosting juga ada 7 salinan terakhir di `~/raciksoal-backup/lokal/`.

## 1. Ambil file backup
- Terbaru: buka repo di GitHub → `raciksoal.sql.gz.enc` → tombol Download.
- Versi lama: repo → *Commits* → pilih tanggal → *Browse files* → Download.

## 2. Buka kuncinya (di laptop, lewat Git Bash)
```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in raciksoal.sql.gz.enc | gunzip > raciksoal.sql
```
openssl akan menanyakan sandi: masukkan `BACKUP_PASSPHRASE`. Hasilnya `raciksoal.sql` (isi database lengkap).

## 3a. Coba pulihkan ke database laptop (Docker, aman untuk latihan)
```bash
docker exec raciksoal-db psql -U raciksoal -d postgres -c "DROP DATABASE IF EXISTS pulih" -c "CREATE DATABASE pulih"
docker exec -i raciksoal-db psql -q -v ON_ERROR_STOP=1 -U raciksoal -d pulih < raciksoal.sql
docker exec raciksoal-db psql -U raciksoal -d pulih -c "select count(*) from hasil_soal"
```

## 3c. Uji pulih lengkap (latihan berkala, tanpa menyentuh data laptop)
1. Picu backup baru: cPanel → File Manager → `raciksoal-app` → buat file kosong `jalankan-backup` (≤ 7 menit).
2. Unduh `raciksoal.sql.gz.enc` terbaru ke folder sementara, buka kuncinya (langkah 2; sandi diketik pemilik).
3. Database uji terpisah (port 5434, hapus setelah selesai):
   `docker run -d --name raciksoal-uji-pulih -e POSTGRES_USER=pulih -e POSTGRES_PASSWORD=pulih-lokal-sementara -e POSTGRES_DB=pulih -p 127.0.0.1:5434:5432 postgres:16-alpine`
   lalu `docker exec -i raciksoal-uji-pulih psql -q -v ON_ERROR_STOP=1 -U pulih -d pulih < raciksoal.sql`.
4. Cek: jumlah baris `__drizzle_migrations` = jumlah file `drizzle/*.sql`; akun, set, materi per guru cocok dengan Kelola guru.
5. Jalankan aplikasi di atasnya: konfigurasi `uji-pulih` di `.claude/launch.json` (port 3003). Pemilik masuk dengan akunnya,
   membuka set, mengunduh Word. JANGAN membuat set (kunci AI asli).
6. Bereskan: `docker rm -f raciksoal-uji-pulih`, hapus `raciksoal.sql` dan file `.enc` yang diunduh.

## 3b. Pulihkan di hosting (kalau database hosting rusak/hilang)
1. Matikan aplikasi dulu: hapus sementara cron `jalan.sh`, lalu `kill $(cat ~/raciksoal-app/app.pid)`.
2. Di cPanel → PostgreSQL Databases: hapus lalu buat ulang database kosong (nama dan user sama), beri user hak penuh.
3. Unggah `raciksoal.sql` ke hosting, lalu lewat SSH/Terminal cPanel:
   `psql -v ON_ERROR_STOP=1 "postgres://USER:SANDI@localhost/NAMA_DB" < raciksoal.sql`
   (USER/SANDI/NAMA_DB sesuai `DATABASE_URL` di `~/raciksoal-app/.env`).
4. Pasang lagi cron `jalan.sh`. Hapus `raciksoal.sql` dari hosting dan laptop setelah selesai (isinya tidak terkunci).
