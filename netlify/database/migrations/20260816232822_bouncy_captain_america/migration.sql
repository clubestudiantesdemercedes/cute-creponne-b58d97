ALTER TABLE "entries" ADD COLUMN "entry_type" text DEFAULT 'campo_deportes' NOT NULL;--> statement-breakpoint
ALTER TABLE "entries" ALTER COLUMN "permit_id" DROP NOT NULL;