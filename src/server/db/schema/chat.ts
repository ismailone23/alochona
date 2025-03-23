import { pgTable, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { relations } from "drizzle-orm";

export const rooms = pgTable("room", (t) => ({
  id: t.uuid("id").defaultRandom().primaryKey().notNull(),
  rName: t.varchar("r_name").notNull(),
  rType: t.text("r_type", { enum: ["group", "ptp"] }),
  adminUserId: t
    .uuid("admin_user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: t
    .timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: t
    .timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  rImage: t.varchar("r_image"),
}));
export type Room = typeof rooms.$inferSelect;

export const roomRelations = relations(rooms, ({ one, many }) => ({
  user: one(users, {
    fields: [rooms.adminUserId],
    references: [users.id],
  }),
  members: many(roomMember),
  chats: many(chats),
}));

export const roomMember = pgTable(
  "room_member",
  (t) => ({
    roomId: t.uuid("room_id").references(() => rooms.id),
    userId: t.uuid("user_id").references(() => users.id),
    role: t.text("role", { enum: ["member", "admin", "creator"] }),
    joindAt: t
      .timestamp("joind_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (table) => [
    primaryKey({
      columns: [table.roomId, table.userId],
    }),
  ],
);
export const roomMemberRelations = relations(roomMember, ({ one }) => ({
  room: one(rooms, {
    fields: [roomMember.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [roomMember.userId],
    references: [users.id],
  }),
}));

export const chats = pgTable("chat", (t) => ({
  id: t.uuid("id").defaultRandom().primaryKey().notNull(),
  text: t.varchar("text").notNull(),
  type: t.text("chat_type", { enum: ["image", "video", "text"] }),
  userId: t
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  roomId: t.uuid("room_id").references(() => rooms.id),
  createdAt: t
    .timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: t
    .timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
}));
export const chatsRelations = relations(chats, ({ one }) => ({
  room: one(rooms, {
    fields: [chats.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
}));
