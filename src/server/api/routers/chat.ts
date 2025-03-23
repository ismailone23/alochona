import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { rooms } from "@/server/db/schema";

const chatRouter = createTRPCRouter({
  getAllRooms: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const [crooms] = await ctx.db.select().from(rooms);
  }),
});
