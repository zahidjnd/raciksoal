CREATE TABLE "nilai_ljk" (
	"id" serial PRIMARY KEY NOT NULL,
	"ujian_id" integer NOT NULL,
	"siswa_id" integer NOT NULL,
	"jawab" jsonb,
	"objektif" real,
	"esai" real,
	"potong_nama" "bytea",
	"diubah" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "siswa" (
	"id" serial PRIMARY KEY NOT NULL,
	"kelas" text NOT NULL,
	"nomor" integer NOT NULL,
	"nama" text NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"diubah" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ujian_ljk" (
	"id" serial PRIMARY KEY NOT NULL,
	"guru_id" text NOT NULL,
	"dibuat" timestamp with time zone DEFAULT now() NOT NULL,
	"nama" text NOT NULL,
	"kelas" text NOT NULL,
	"set_id" integer,
	"kunci" jsonb NOT NULL,
	"esai_maks" real NOT NULL,
	"dihapus" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "nilai_ljk" ADD CONSTRAINT "nilai_ljk_ujian_id_ujian_ljk_id_fk" FOREIGN KEY ("ujian_id") REFERENCES "public"."ujian_ljk"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nilai_ljk" ADD CONSTRAINT "nilai_ljk_siswa_id_siswa_id_fk" FOREIGN KEY ("siswa_id") REFERENCES "public"."siswa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ujian_ljk" ADD CONSTRAINT "ujian_ljk_guru_id_pengguna_id_fk" FOREIGN KEY ("guru_id") REFERENCES "public"."pengguna"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ujian_ljk" ADD CONSTRAINT "ujian_ljk_set_id_hasil_soal_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."hasil_soal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "nilai_ljk_ujian_siswa_idx" ON "nilai_ljk" USING btree ("ujian_id","siswa_id");--> statement-breakpoint
CREATE UNIQUE INDEX "siswa_kelas_nama_idx" ON "siswa" USING btree ("kelas","nama");--> statement-breakpoint
CREATE INDEX "ujian_ljk_guru_idx" ON "ujian_ljk" USING btree ("guru_id","dibuat");