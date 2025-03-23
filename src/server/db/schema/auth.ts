import { relations } from "drizzle-orm";
import { pgTable, primaryKey } from "drizzle-orm/pg-core";
import { invites, messages, roomMember, rooms, views } from "./chat";

export const users = pgTable("user", (t) => ({
  id: t.uuid("id").notNull().primaryKey().defaultRandom(),
  createdAt: t
    .timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  name: t.varchar("name", { length: 255 }),
  email: t.varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: t.timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }),
  image: t.varchar("image", { length: 255 }),
}));

export type User = typeof users.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  authenticators: many(authenticators),
  rooms: many(rooms),
  memberof: many(roomMember),
  messages: many(messages),
  view: many(views),
  invitation: many(invites, { relationName: "invitor" }),
  reciever: many(invites, { relationName: "reciever" }),
}));

export const accounts = pgTable(
  "account",
  (t) => ({
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: t
      .timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    type: t
      .varchar("type", { length: 255 })
      .$type<"email" | "oauth" | "oidc" | "webauthn">()
      .notNull(),
    provider: t.varchar("provider", { length: 255 }).notNull(),
    providerAccountId: t
      .varchar("provider_account_id", { length: 255 })
      .notNull(),
    refresh_token: t.varchar("refresh_token", { length: 255 }),
    access_token: t.text("access_token"),
    expires_at: t.integer("expires_at"),
    token_type: t.varchar("token_type", { length: 255 }),
    scope: t.varchar("scope", { length: 255 }),
    id_token: t.text("id_token"),
    session_state: t.varchar("session_state", { length: 255 }),
  }),
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ],
);

export type Account = typeof accounts.$inferSelect;

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = pgTable("session", (t) => ({
  createdAt: t
    .timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  sessionToken: t
    .varchar("session_token", { length: 255 })
    .notNull()
    .primaryKey(),
  userId: t
    .uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: t
    .timestamp("expires", { mode: "date", withTimezone: true })
    .notNull(),
}));

export type Session = typeof sessions.$inferSelect;

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = pgTable(
  "verification_tokens",
  (t) => ({
    createdAt: t
      .timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    identifier: t.text("identifier").notNull(),
    token: t.text("token").notNull(),
    expires: t.timestamp("expires", { mode: "date" }).notNull(),
  }),
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ],
);

export const authenticators = pgTable(
  "authenticators",
  (t) => ({
    createdAt: t
      .timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    credentialID: t.text("credential_id").notNull().unique(),
    providerAccountId: t.text("provider_account_id").notNull(),
    credentialPublicKey: t.text("credential_public_key").notNull(),
    counter: t.integer("counter").notNull(),
    credentialDeviceType: t.text("credential_device_type").notNull(),
    credentialBackedUp: t.boolean("credential_backed_up").notNull(),
    transports: t.text("transports"),
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  }),
  (authenticator) => [
    {
      compositePK: primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
    },
  ],
);

export const authenticatorsRelations = relations(authenticators, ({ one }) => ({
  user: one(users, { fields: [authenticators.userId], references: [users.id] }),
}));
