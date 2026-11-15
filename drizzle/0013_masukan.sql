CREATE TABLE "masukan" (
	"id" serial PRIMARY KEY NOT NULL,
	"guru_id" text NOT NULL,
	"dibuat" timestamp with time zone DEFAULT now() NOT NULL,
	"nilai" integer,
	"isi" text,
	"set_id" integer,
	"otomatis" boolean DEFAULT false NOT NULL,
	"versi" text
);
--> statement-breakpoint
ALTER TABLE "masukan" ADD CONSTRAINT "masukan_guru_id_pengguna_id_fk" FOREIGN KEY ("guru_id") REFERENCES "public"."pengguna"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "masukan" ADD CONSTRAINT "masukan_set_id_hasil_soal_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."hasil_soal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "masukan_dibuat_idx" ON "masukan" USING btree ("dibuat");