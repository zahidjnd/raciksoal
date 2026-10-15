CREATE TABLE "materi" (
	"id" serial PRIMARY KEY NOT NULL,
	"guru_id" text NOT NULL,
	"dibuat" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah" timestamp with time zone DEFAULT now() NOT NULL,
	"bab" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hasil_soal" ADD COLUMN "bab" jsonb;--> statement-breakpoint
ALTER TABLE "materi" ADD CONSTRAINT "materi_guru_id_pengguna_id_fk" FOREIGN KEY ("guru_id") REFERENCES "public"."pengguna"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "materi_guru_idx" ON "materi" USING btree ("guru_id");