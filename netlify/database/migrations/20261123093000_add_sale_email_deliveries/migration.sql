CREATE TABLE IF NOT EXISTS "sale_email_deliveries" (
  "id" serial PRIMARY KEY NOT NULL,
  "sale_id" integer NOT NULL REFERENCES "sales"("id"),
  "recipient_email" text NOT NULL,
  "normalized_email" text NOT NULL,
  "recipient_name" text NOT NULL,
  "status" text DEFAULT 'pendiente' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_attempt_at" timestamp,
  "sent_at" timestamp,
  "provider_message_id" text,
  "last_error" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "sale_email_delivery_sale_recipient_idx"
  ON "sale_email_deliveries" ("sale_id", "normalized_email");
