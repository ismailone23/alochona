import { sessions, users } from "@/server/db/schema";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { eq } from "drizzle-orm";

export const authRouter = createTRPCRouter({
    getSession:publicProcedure.query(async({ctx:{db}})=>{
        return await db.select().from(users).innerJoin(sessions,eq(sessions.userId,users.id))
    })
})