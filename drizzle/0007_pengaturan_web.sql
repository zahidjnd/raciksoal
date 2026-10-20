CREATE TABLE "pengaturan_web" (
	"kunci" text PRIMARY KEY NOT NULL,
	"nilai" jsonb NOT NULL,
	"diubah" timestamp with time zone DEFAULT now() NOT NULL
);
