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

## 3b. Pulihkan di hosting (kalau database hosting rusak/hilang)
1. Matikan aplikasi dulu: hapus sementara cron `jalan.sh`, lalu `kill $(cat ~/raciksoal-app/app.pid)`.
2. Di cPanel → PostgreSQL Databases: hapus lalu buat ulang database kosong (nama dan user sama), beri user hak penuh.
3. Unggah `raciksoal.sql` ke hosting, lalu lewat SSH/Terminal cPanel:
   `psql -v ON_ERROR_STOP=1 "postgres://USER:SANDI@localhost/NAMA_DB" < raciksoal.sql`
   (USER/SANDI/NAMA_DB sesuai `DATABASE_URL` di `~/raciksoal-app/.env`).
4. Pasang lagi cron `jalan.sh`. Hapus `raciksoal.sql` dari hosting dan laptop setelah selesai (isinya tidak terkunci).
