CREATE TABLE "preferensi_guru" (
	"guru_id" text PRIMARY KEY NOT NULL,
	"nilai" jsonb NOT NULL,
	"diubah" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "preferensi_guru" ADD CONSTRAINT "preferensi_guru_guru_id_pengguna_id_fk" FOREIGN KEY ("guru_id") REFERENCES "public"."pengguna"("id") ON DELETE no action ON UPDATE no action;