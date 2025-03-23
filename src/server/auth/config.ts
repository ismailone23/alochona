import { DrizzleAdapter } from "@auth/drizzle-adapter";

import type {
  DefaultSession,
  NextAuthConfig,
  Session as NextAuthSession,
} from "next-auth";
import type { Adapter } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import type { OAuthConfig } from "next-auth/providers";
import Google from "next-auth/providers/google";
import { db } from "../db";
import {
  accounts,
  authenticators,
  sessions,
  users,
  verificationTokens,
} from "../db/schema";
export type { Adapter, JWT, OAuthConfig };

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      lastWorkspaceId?: string | null;
    } & DefaultSession["user"];
  }
}

const adapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  authenticatorsTable: authenticators,
  verificationTokensTable: verificationTokens,
});

export const authConfig = {
  adapter,
  secret: process.env.AUTH_SECRET,
  providers: [Google({ allowDangerousEmailAccountLinking: true })],
  callbacks: {
    session: (opts) => {
      if (!("user" in opts))
        throw new Error("unreachable with session strategy");

      return {
        ...opts.session,
        user: {
          ...opts.session.user,
          id: opts.user.id,
        },
      };
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login",
    error: "/login",
  },
} satisfies NextAuthConfig;
