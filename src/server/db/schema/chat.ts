import { pgTable, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { relations } from "drizzle-orm";

export const rooms = pgTable("room", (t) => ({
  id: t.uuid("id").defaultRandom().primaryKey().notNull(),
  rName: t.varchar("r_name").notNull(),
  rType: t.text("r_type", { enum: ["group", "ptp"] }).notNull(),
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
  message: many(messages),
  view: many(views),
  invitation: many(invites),
}));

export const roomMember = pgTable(
  "room_member",
  (t) => ({
    roomId: t
      .uuid("room_id")
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" }),

    role: t
      .text("role", { enum: ["member", "admin", "creator"] })
      .notNull()
      .default("member"),
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

export type RoomMember = typeof roomMember.$inferSelect;

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

export const invites = pgTable(
  "invite",
  (t) => ({
    roomId: t
      .uuid("room_id")
      .references(() => rooms.id, { onDelete: "cascade" }),
    invitedBy: t
      .uuid("invited_by")
      .references(() => users.id, { onDelete: "cascade" }),
    invitedTo: t
      .uuid("invited_to")
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: t
      .timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  }),
  (table) => [
    primaryKey({
      columns: [table.roomId, table.invitedBy, table.invitedTo],
    }),
  ],
);

export const invitationRelation = relations(invites, ({ one }) => ({
  invitor: one(users, {
    fields: [invites.invitedBy],
    references: [users.id],
    relationName: "invitor",
  }),
  reciever: one(users, {
    fields: [invites.invitedTo],
    references: [users.id],
    relationName: "reciever",
  }),
  room: one(rooms, {
    fields: [invites.roomId],
    references: [rooms.id],
  }),
}));

export const messages = pgTable("message", (t) => ({
  id: t.uuid("id").defaultRandom().primaryKey().notNull(),
  text: t.varchar("text").notNull(),
  type: t.text("chat_type", { enum: ["image", "video", "text"] }).notNull(),
  userId: t
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  roomId: t
    .uuid("room_id")
    .references(() => rooms.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: t
    .timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: t
    .timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
}));
export type Message = typeof messages.$inferSelect;

export const messageRelations = relations(messages, ({ one, many }) => ({
  room: one(rooms, {
    fields: [messages.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  view: many(views),
}));

export const views = pgTable(
  "view",
  (t) => ({
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    roomId: t
      .uuid("room_id")
      .references(() => rooms.id)
      .notNull(),
    messagesId: t
      .uuid("message_id")
      .references(() => messages.id)
      .notNull(),
  }),
  (table) => [
    primaryKey({ columns: [table.messagesId, table.roomId, table.userId] }),
  ],
);
export const viewsRelation = relations(views, ({ one, many }) => ({
  room: one(rooms, {
    fields: [views.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [views.userId],
    references: [users.id],
  }),
  message: one(messages, {
    fields: [views.messagesId],
    references: [messages.id],
  }),
}));

export const connections = pgTable("connection", (t) => ({
  id: t.uuid("id").defaultRandom().primaryKey().notNull(),
  currentuserId: t
    .uuid("currentuser_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  connectedUserId: t
    .uuid("connected_user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  isAccepted: t.boolean("is_accepted").notNull().default(false),
  createdAt: t
    .timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: t
    .timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
}));
export type Connection = typeof connections.$inferSelect;

export const connnectionRelation = relations(connections, ({ one, many }) => ({
  currentuser: one(users, {
    fields: [connections.currentuserId],
    references: [users.id],
    relationName: "currentuser",
  }),
  connecteduser: one(users, {
    fields: [connections.connectedUserId],
    references: [users.id],
    relationName: "connecteduser",
  }),
}));
