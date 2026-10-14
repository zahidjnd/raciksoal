# Racik Soal

## Menjalankan di laptop
1. Nyalakan Docker Desktop, lalu database lokal (sekali saja):
   `docker start raciksoal-db`
2. Salin `.env.example` menjadi `.env`, isi `AI_API_KEY`.
3. `npm run dev` lalu buka http://localhost:3000

## Mengubah tabel database
1. Ubah `src/db/schema.ts`
2. `npm run db:generate` → file SQL baru muncul di folder `drizzle/`
3. Jalankan file SQL itu di database lokal dan di hosting.
