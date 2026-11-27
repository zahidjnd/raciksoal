CREATE TABLE "gambar" (
	"id" serial PRIMARY KEY NOT NULL,
	"guru_id" text NOT NULL,
	"dibuat" timestamp with time zone DEFAULT now() NOT NULL,
	"lebar" integer NOT NULL,
	"tinggi" integer NOT NULL,
	"data" "bytea" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gambar" ADD CONSTRAINT "gambar_guru_id_pengguna_id_fk" FOREIGN KEY ("guru_id") REFERENCES "public"."pengguna"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gambar_guru_idx" ON "gambar" USING btree ("guru_id");