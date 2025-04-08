CREATE TABLE "connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"currentuser_id" uuid NOT NULL,
	"connected_user_id" uuid NOT NULL,
	"is_accepted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "connection" ADD CONSTRAINT "connection_currentuser_id_user_id_fk" FOREIGN KEY ("currentuser_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection" ADD CONSTRAINT "connection_connected_user_id_user_id_fk" FOREIGN KEY ("connected_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;