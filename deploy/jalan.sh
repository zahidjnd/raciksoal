#!/bin/bash
# Salinan dari ~/raciksoal-app/jalan.sh di hosting. Dipanggil cron tiap 7 menit (hosting membatasi frekuensi cron):
#   1) ambil build baru dari branch `deploy` di GitHub (kalau ada),
#   2) pastikan aplikasi menyala.
# File .env hosting ada di ~/raciksoal-app/.env (diisi pemilik, bukan di Git).
cd "$(dirname "$0")"
ps -u "$USER" -o pid,etime,args > status.txt 2>&1   # untuk dicek tanpa SSH
exec 9>jalan.lock; flock -n 9 || exit 0   # cron sebelumnya masih jalan
NODE=$HOME/.local/share/mise/installs/node/24.21.0/bin/node
KUNCI=$PWD/kunci/deploy
export GIT_SSH_COMMAND="ssh -i $KUNCI -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

# Sekali saja: buat deploy key. Bagian .pub didaftarkan ke GitHub (hanya-baca).
if [ ! -f "$KUNCI" ]; then
  mkdir -p kunci && chmod 700 kunci
  ssh-keygen -q -t ed25519 -N "" -C raciksoal-hosting -f "$KUNCI"
fi

BARU=
if [ ! -d app/.git ]; then
  git clone -q --branch deploy --depth 1 git@github.com:zahidjnd/raciksoal.git app 2>>git.log && BARU=1
elif git -C app fetch -q --depth 1 origin deploy 2>>git.log &&
     [ "$(git -C app rev-parse HEAD)" != "$(git -C app rev-parse origin/deploy)" ]; then
  git -C app reset -q --hard origin/deploy && BARU=1
fi
# .env diubah pemilik -> nyalakan ulang supaya isinya terbaca (isi .env tidak dibaca skrip ini).
if [ -f .env ] && [ .env -nt .env.dipakai ]; then
  touch .env.dipakai && BARU=1
fi
# Restart manual: buat file kosong bernama "restart" di folder ini.
[ -f restart ] && rm -f restart && BARU=1
if [ -n "$BARU" ]; then
  echo "== $(date '+%F %T') nyalakan ulang: $(git -C app log -1 --format=%s)"
  # Next.js mengganti nama prosesnya jadi "next-server", jadi matikan lewat nomor proses (app.pid).
  if [ -f app.pid ]; then kill "$(cat app.pid)" 2>/dev/null; else pkill -u "$USER" -f "^next-server|hello.js"; fi
  sleep 2
fi

[ -f app/server.js ] || exit 0
curl -s -o /dev/null -m 5 http://127.0.0.1:3101 && exit 0
echo "== $(date '+%F %T') menyalakan aplikasi"
cd app
PORT=3101 HOSTNAME=127.0.0.1 nohup $NODE --max-old-space-size=256 --env-file-if-exists=../.env server.js >> ../app.log 2>&1 9>&- &
echo $! > ../app.pid
