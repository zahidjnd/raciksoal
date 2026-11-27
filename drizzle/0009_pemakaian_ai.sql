CREATE TABLE "pemakaian_ai" (
	"id" serial PRIMARY KEY NOT NULL,
	"guru_id" text NOT NULL,
	"jenis" text NOT NULL,
	"waktu" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pemakaian_ai" ADD CONSTRAINT "pemakaian_ai_guru_id_pengguna_id_fk" FOREIGN KEY ("guru_id") REFERENCES "public"."pengguna"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pemakaian_ai_guru_idx" ON "pemakaian_ai" USING btree ("guru_id","waktu");