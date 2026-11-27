CREATE TABLE "tes_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"isi" text NOT NULL,
	"dibuat" timestamp DEFAULT now() NOT NULL
);
