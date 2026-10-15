#!/bin/bash
# Salinan dari ~/raciksoal-app/backup.sh di hosting (langkah 7). Dipanggil cron tiap 02.00 WIB,
# atau manual dengan membuat file kosong "jalankan-backup" di ~/raciksoal-app (diproses jalan.sh).
#   1) salin database (pg_dump) → mampatkan (gzip) → kunci dengan sandi backup (openssl AES-256)
#   2) simpan 7 salinan terakhir di ~/raciksoal-backup/lokal
#   3) kirim ke repo GitHub privat zahidjnd/raciksoal-backup (kunci tulis khusus: kunci/backup)
#   4) catat hasil di backup-status.txt (dibaca halaman admin)
# Butuh di .env: DATABASE_URL dan BACKUP_PASSPHRASE (min. 12 karakter; simpan juga di luar hosting!).
set -uo pipefail
cd "$(dirname "$0")"
STATUS=$PWD/backup-status.txt
gagal() { echo "GAGAL $(date '+%F %T') $1" > "$STATUS"; echo "== $(date '+%F %T') GAGAL: $1"; exit 1; }

# Kunci tulis untuk repo backup (dibuat sekali). Bagian .pub didaftarkan ke repo backup saja.
KUNCI=$PWD/kunci/backup
[ -f "$KUNCI" ] || ssh-keygen -q -t ed25519 -N "" -C raciksoal-backup -f "$KUNCI"
export GIT_SSH_COMMAND="ssh -i $KUNCI -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

# Ambil dua nilai dari .env tanpa menjalankan isi .env sebagai perintah.
ambil() { grep -E "^$1=" .env 2>/dev/null | tail -1 | cut -d= -f2- | sed -e "s/^['\"]//" -e "s/['\"]$//"; }
DATABASE_URL="$(ambil DATABASE_URL)"
export BACKUP_PASSPHRASE="$(ambil BACKUP_PASSPHRASE)"
[ -n "$DATABASE_URL" ] || gagal "DATABASE_URL tidak ada di .env"
[ ${#BACKUP_PASSPHRASE} -ge 12 ] || gagal "BACKUP_PASSPHRASE belum diisi di .env (minimal 12 karakter)"

DIR=$HOME/raciksoal-backup
mkdir -p "$DIR/lokal" && chmod 700 "$DIR"
NAMA="raciksoal-$(date +%F-%H%M).sql.gz.enc"
pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip -9 |
  openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_PASSPHRASE > "$DIR/lokal/$NAMA" ||
  gagal "pg_dump atau penguncian gagal"
UKURAN=$(stat -c %s "$DIR/lokal/$NAMA")
[ "$UKURAN" -gt 100 ] || gagal "file backup kosong"
# Simpan 7 salinan terakhir di hosting; yang lebih lama dihapus otomatis (salinan lengkap ada di GitHub).
ls -1t "$DIR"/lokal/*.sql.gz.enc | tail -n +8 | xargs -r rm -f

# Kirim ke GitHub: satu nama file tetap, tiap malam satu commit (riwayat git = semua versi).
REPO=$DIR/repo
if [ ! -d "$REPO/.git" ]; then
  git init -q -b main "$REPO" &&
    git -C "$REPO" remote add origin git@github.com:zahidjnd/raciksoal-backup.git &&
    git -C "$REPO" config user.name "raciksoal-hosting" &&
    git -C "$REPO" config user.email "backup@raciksoal.local" || gagal "menyiapkan repo lokal gagal"
fi
cp "$DIR/lokal/$NAMA" "$REPO/raciksoal.sql.gz.enc"
git -C "$REPO" add raciksoal.sql.gz.enc
git -C "$REPO" commit -q -m "backup $(date '+%F %T') ($UKURAN byte)" || true
git -C "$REPO" push -q origin main 2>>backup-git.log || gagal "kirim ke GitHub gagal (lihat backup-git.log)"

echo "OK $(date '+%F %T') $UKURAN byte $NAMA" > "$STATUS"
echo "== $(date '+%F %T') OK: $NAMA ($UKURAN byte)"
