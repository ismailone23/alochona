CREATE TABLE "invite" (
	"room_id" uuid,
	"invited_by" uuid,
	"invited_to" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invite_room_id_invited_by_invited_to_pk" PRIMARY KEY("room_id","invited_by","invited_to")
);
--> statement-breakpoint
ALTER TABLE "message" DROP CONSTRAINT "message_room_id_room_id_fk";
--> statement-breakpoint
ALTER TABLE "room_member" DROP CONSTRAINT "room_member_room_id_room_id_fk";
--> statement-breakpoint
ALTER TABLE "room_member" DROP CONSTRAINT "room_member_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "chat_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "room_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "room_member" ALTER COLUMN "role" SET DEFAULT 'member';--> statement-breakpoint
ALTER TABLE "room_member" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "room" ALTER COLUMN "r_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "view" ALTER COLUMN "room_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "view" ALTER COLUMN "message_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_invited_to_user_id_fk" FOREIGN KEY ("invited_to") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_member" ADD CONSTRAINT "room_member_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_member" ADD CONSTRAINT "room_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE("email");