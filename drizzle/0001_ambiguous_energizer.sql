CREATE TABLE "view" (
	"user_id" uuid NOT NULL,
	"room_id" uuid,
	"message_id" uuid
);
--> statement-breakpoint
ALTER TABLE "chat" RENAME TO "message";--> statement-breakpoint
ALTER TABLE "message" DROP CONSTRAINT "chat_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "message" DROP CONSTRAINT "chat_room_id_room_id_fk";
--> statement-breakpoint
ALTER TABLE "view" ADD CONSTRAINT "view_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view" ADD CONSTRAINT "view_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view" ADD CONSTRAINT "view_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE no action ON UPDATE no action;