CREATE TABLE "akun_login" (
	"id" text PRIMARY KEY NOT NULL,
	"akun_id" text NOT NULL,
	"penyedia" text NOT NULL,
	"pengguna_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_berakhir" timestamp with time zone,
	"refresh_token_berakhir" timestamp with time zone,
	"scope" text,
	"kata_sandi" text,
	"dibuat" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengguna" (
	"id" text PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"email" text NOT NULL,
	"email_terverifikasi" boolean DEFAULT false NOT NULL,
	"gambar" text,
	"dibuat" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah" timestamp with time zone DEFAULT now() NOT NULL,
	"username" text,
	"username_tampil" text,
	"peran" text,
	"nonaktif" boolean DEFAULT false,
	"alasan_nonaktif" text,
	"nonaktif_sampai" timestamp with time zone,
	CONSTRAINT "pengguna_email_unique" UNIQUE("email"),
	CONSTRAINT "pengguna_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "sesi" (
	"id" text PRIMARY KEY NOT NULL,
	"berakhir" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"dibuat" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah" timestamp with time zone NOT NULL,
	"ip" text,
	"perangkat" text,
	"pengguna_id" text NOT NULL,
	"diwakili_oleh" text,
	CONSTRAINT "sesi_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verifikasi" (
	"id" text PRIMARY KEY NOT NULL,
	"identitas" text NOT NULL,
	"nilai" text NOT NULL,
	"berakhir" timestamp with time zone NOT NULL,
	"dibuat" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hasil_soal" ADD COLUMN "guru_id" text;--> statement-breakpoint
ALTER TABLE "akun_login" ADD CONSTRAINT "akun_login_pengguna_id_pengguna_id_fk" FOREIGN KEY ("pengguna_id") REFERENCES "public"."pengguna"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sesi" ADD CONSTRAINT "sesi_pengguna_id_pengguna_id_fk" FOREIGN KEY ("pengguna_id") REFERENCES "public"."pengguna"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "akun_login_pengguna_idx" ON "akun_login" USING btree ("pengguna_id");--> statement-breakpoint
CREATE INDEX "sesi_pengguna_idx" ON "sesi" USING btree ("pengguna_id");--> statement-breakpoint
CREATE INDEX "verifikasi_identitas_idx" ON "verifikasi" USING btree ("identitas");--> statement-breakpoint
ALTER TABLE "hasil_soal" ADD CONSTRAINT "hasil_soal_guru_id_pengguna_id_fk" FOREIGN KEY ("guru_id") REFERENCES "public"."pengguna"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hasil_soal_guru_idx" ON "hasil_soal" USING btree ("guru_id","dibuat");