CREATE TABLE "app_config" (
	"key" text PRIMARY KEY,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY,
	"user_id" integer,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_closures" (
	"id" serial PRIMARY KEY,
	"closure_date" date NOT NULL,
	"closed_by_user_id" integer,
	"totals" jsonb,
	"sales_count" integer DEFAULT 0 NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'abierta' NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "convention_beneficiaries" (
	"id" serial PRIMARY KEY,
	"convention_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"employee_code" text,
	"status" text DEFAULT 'activo' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conventions" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"start_date" date,
	"end_date" date,
	"status" text DEFAULT 'activo' NOT NULL,
	"max_beneficiaries" integer,
	"benefit" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" serial PRIMARY KEY,
	"person_id" integer NOT NULL,
	"permit_id" integer NOT NULL,
	"checked_in_by_user_id" integer NOT NULL,
	"method" text NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_members" (
	"id" serial PRIMARY KEY,
	"family_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"relationship" text
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY,
	"person_id" integer NOT NULL,
	"member_number" text NOT NULL,
	"member_status" text DEFAULT 'activo' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY,
	"sale_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"method" text NOT NULL,
	"status" text DEFAULT 'confirmado' NOT NULL,
	"created_by_user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" serial PRIMARY KEY,
	"dni" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"birth_date" date,
	"phone" text,
	"email" text,
	"address" text,
	"notes" text,
	"status" text DEFAULT 'activo' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permits" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"person_id" integer NOT NULL,
	"sale_item_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"condition_type" text NOT NULL,
	"convention_id" integer,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" text DEFAULT 'activo' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"duration_value" integer DEFAULT 1 NOT NULL,
	"duration_unit" text DEFAULT 'dia' NOT NULL,
	"season_start" date,
	"season_end" date,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" serial PRIMARY KEY,
	"plan_id" integer NOT NULL,
	"condition_type" text NOT NULL,
	"convention_id" integer,
	"amount" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" serial PRIMARY KEY,
	"sale_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"condition_type" text NOT NULL,
	"convention_id" integer,
	"plan_id" integer NOT NULL,
	"unit_price" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY,
	"sale_number" text NOT NULL UNIQUE,
	"created_by_user_id" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"payment_method" text NOT NULL,
	"status" text DEFAULT 'pagada' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"username" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "cash_closure_date_idx" ON "cash_closures" ("closure_date");--> statement-breakpoint
CREATE UNIQUE INDEX "convention_person_idx" ON "convention_beneficiaries" ("convention_id","person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "family_member_idx" ON "family_members" ("family_id","person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "members_number_idx" ON "members" ("member_number");--> statement-breakpoint
CREATE UNIQUE INDEX "members_person_idx" ON "members" ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "people_dni_idx" ON "people" ("dni");--> statement-breakpoint
CREATE UNIQUE INDEX "permits_code_idx" ON "permits" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "price_unique_idx" ON "prices" ("plan_id","condition_type","convention_id");--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "cash_closures" ADD CONSTRAINT "cash_closures_closed_by_user_id_users_id_fkey" FOREIGN KEY ("closed_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "convention_beneficiaries" ADD CONSTRAINT "convention_beneficiaries_convention_id_conventions_id_fkey" FOREIGN KEY ("convention_id") REFERENCES "conventions"("id");--> statement-breakpoint
ALTER TABLE "convention_beneficiaries" ADD CONSTRAINT "convention_beneficiaries_person_id_people_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id");--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_person_id_people_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id");--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_permit_id_permits_id_fkey" FOREIGN KEY ("permit_id") REFERENCES "permits"("id");--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_checked_in_by_user_id_users_id_fkey" FOREIGN KEY ("checked_in_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_id_families_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id");--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_person_id_people_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id");--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_person_id_people_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_sale_id_sales_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "permits" ADD CONSTRAINT "permits_person_id_people_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id");--> statement-breakpoint
ALTER TABLE "permits" ADD CONSTRAINT "permits_sale_item_id_sale_items_id_fkey" FOREIGN KEY ("sale_item_id") REFERENCES "sale_items"("id");--> statement-breakpoint
ALTER TABLE "permits" ADD CONSTRAINT "permits_plan_id_plans_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id");--> statement-breakpoint
ALTER TABLE "permits" ADD CONSTRAINT "permits_convention_id_conventions_id_fkey" FOREIGN KEY ("convention_id") REFERENCES "conventions"("id");--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_plan_id_plans_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id");--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_convention_id_conventions_id_fkey" FOREIGN KEY ("convention_id") REFERENCES "conventions"("id");--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id");--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_person_id_people_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id");--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_convention_id_conventions_id_fkey" FOREIGN KEY ("convention_id") REFERENCES "conventions"("id");--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_plan_id_plans_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id");--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");