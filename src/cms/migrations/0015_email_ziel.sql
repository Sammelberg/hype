ALTER TABLE "cms"."email_log" ADD COLUMN "target_type" text;--> statement-breakpoint
ALTER TABLE "cms"."email_log" ADD COLUMN "target_id" text;--> statement-breakpoint
CREATE INDEX "email_log_target_idx" ON "cms"."email_log" USING btree ("target_type","target_id");