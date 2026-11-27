CREATE TABLE "hasil_soal" (
	"id" serial PRIMARY KEY NOT NULL,
	"dibuat" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"bab_id" text NOT NULL,
	"pengaturan" jsonb NOT NULL,
	"model" text,
	"prompt" text,
	"jawaban_ai" text,
	"soal" jsonb,
	"pesan" text
);
