import {
  connections,
  roomMember,
  rooms,
  users,
  type Room,
} from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { and, eq, not, or } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const roomsRouter = createTRPCRouter({
  getAllRooms: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const cUserRooms = await ctx.db
      .select()
      .from(rooms)
      .innerJoin(
        roomMember,
        and(eq(roomMember.userId, userId), eq(roomMember.roomId, rooms.id)),
      );
    const refinedRooms: Room[] = [];
    for (let i = 0; i < cUserRooms.length; i++) {
      const croom = cUserRooms[i];
      if (croom && !refinedRooms.includes(croom.room)) {
        if (croom.room.rType === "ptp") {
          const [roomName] = await ctx.db
            .select()
            .from(roomMember)
            .where(
              and(
                eq(roomMember.roomId, croom.room.id),
                not(eq(roomMember.userId, userId)),
              ),
            )
            .innerJoin(users, eq(users.id, roomMember.userId));
          croom.room.rName = roomName?.user.name ?? croom.room.rName;
          croom.room.rImage = roomName?.user.image ?? croom.room.rImage;
        }
        refinedRooms.push(croom.room);
      }
    }
    return refinedRooms;
  }),
  sendConnection: protectedProcedure
    .input(
      z.object({
        connectedUser: z.string(),
      }),
    )
    .mutation(async ({ ctx, input: { connectedUser } }) => {
      const userId = ctx.session.user.id;

      const [connectionr] = await ctx.db
        .select()
        .from(connections)
        .where(
          or(
            and(
              eq(connections.connectedUserId, userId),
              eq(connections.currentuserId, connectedUser),
            ),
            and(
              eq(connections.currentuserId, userId),
              eq(connections.connectedUserId, connectedUser),
            ),
          ),
        );

      if (connectionr) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "connection request already sent",
        });
      }

      return await ctx.db
        .insert(connections)
        .values({ connectedUserId: connectedUser, currentuserId: userId })
        .returning();
    }),
});
