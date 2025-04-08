import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  connections,
  invites,
  messages,
  roomMember,
  rooms,
  users,
  type Room,
  type RoomMember,
} from "@/server/db/schema";
import { and, asc, desc, eq, ilike, isNull, lt, not, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const chatRouter = createTRPCRouter({
  getAllRooms: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const cUserRooms = await ctx.db
      .select()
      .from(rooms)
      .innerJoin(
        roomMember,
        and(eq(roomMember.userId, userId), eq(roomMember.roomId, rooms.id)),
      )
      .orderBy(desc(rooms.updatedAt));
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
  checkConnections: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return await ctx.db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.isAccepted, false),
          eq(connections.connectedUserId, userId),
        ),
      )
      .innerJoin(users, eq(users.id, connections.currentuserId));
  }),
  acceptConnections: protectedProcedure
    .input(z.object({ cid: z.string() }))
    .mutation(async ({ ctx, input: { cid } }) => {
      const userId = ctx.session.user.id;

      const [invitation] = await ctx.db
        .select()
        .from(connections)
        .where(
          and(
            eq(connections.isAccepted, false),
            eq(connections.connectedUserId, userId),
          ),
        );
      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "connection invitation not found",
        });
      }

      const [newRoom] = await ctx.db
        .insert(rooms)
        .values({
          adminUserId: invitation.currentuserId,
          rName: invitation.currentuserId,
          rType: "ptp",
        })
        .returning();
      if (!newRoom) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      const addMember = await ctx.db
        .insert(roomMember)
        .values([
          {
            userId: invitation.currentuserId,
            roomId: newRoom.id,
            role: "creator",
          },
          {
            userId: invitation.connectedUserId,
            roomId: newRoom.id,
            role: "creator",
          },
        ])
        .returning();

      return await ctx.db
        .update(connections)
        .set({ isAccepted: true, updatedAt: new Date() })
        .where(
          and(
            eq(connections.connectedUserId, userId),
            eq(connections.currentuserId, cid),
          ),
        );
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
          message: "connection request already sent or already connected",
        });
      }

      return await ctx.db
        .insert(connections)
        .values({ connectedUserId: connectedUser, currentuserId: userId })
        .returning();
    }),
  removeConnection: protectedProcedure
    .input(
      z.object({
        connectedUser: z.string(),
      }),
    )
    .mutation(async ({ ctx, input: { connectedUser } }) => {
      const userId = ctx.session.user.id;

      return await ctx.db
        .delete(connections)
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
    }),
  checkRoomInvite: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return await ctx.db
      .select()
      .from(invites)
      .where(eq(invites.invitedTo, userId));
  }),
  joinRoom: protectedProcedure
    .input(
      z.object({
        role: z
          .enum(["admin", "creator", "member"])
          .default("member")
          .optional(),
        roomId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input: { roomId, role } }) => {
      const userId = ctx.session.user.id;
      const [invitation] = await ctx.db
        .select()
        .from(invites)
        .where(and(eq(invites.roomId, roomId), eq(invites.invitedTo, userId)));

      if (!invitation) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "failed to join room",
        });
      }

      const addMember = await ctx.db
        .insert(roomMember)
        .values({
          userId,
          roomId,
          role,
        })
        .returning();

      const [rinvitation] = await ctx.db
        .delete(invites)
        .where(and(eq(invites.roomId, roomId), eq(invites.invitedTo, userId)));

      return { rinvitation, addMember };
    }),
  searchMember: protectedProcedure
    .input(z.object({ query: z.string().optional() }))
    .query(async ({ ctx, input: { query } }) => {
      const userId = ctx.session.user.id;

      const members = await ctx.db
        .select()
        .from(users)
        .where(
          and(
            not(eq(users.id, userId)),
            or(
              ilike(users.email, `%${query}%`),
              ilike(users.name, `%${query}%`),
            ),
          ),
        )
        .limit(5);

      if (!query) {
        return [];
      }
      return members;
    }),
  removeInvitation: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ ctx, input: { roomId } }) => {
      const userId = ctx.session.user.id;
      const [rinvitation] = await ctx.db
        .delete(invites)
        .where(and(eq(invites.roomId, roomId), eq(invites.invitedTo, userId)));
      return rinvitation;
    }),
  deleteRoom: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ ctx, input: { roomId } }) => {
      const userId = ctx.session.user.id;
      const [memberDetail] = await ctx.db
        .select()
        .from(roomMember)
        .where(
          and(eq(roomMember.roomId, roomId), eq(roomMember.userId, userId)),
        );

      if (!memberDetail || memberDetail.role !== "creator") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "you don't have rights to perform this action",
        });
      }
      const [deleteRoom] = await ctx.db
        .delete(rooms)
        .where(and(eq(rooms.id, roomId), eq(rooms.adminUserId, userId)))
        .returning();
      const deleteRoomMember = await ctx.db
        .delete(roomMember)
        .where(eq(roomMember.roomId, roomId));
      const deleteMessages = await ctx.db
        .delete(messages)
        .where(eq(messages.roomId, roomId));

      return { deleteRoom, deleteRoomMember, deleteMessages };
    }),
  updateRoom: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        rName: z.string().optional(),
        rImage: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input: { roomId, rImage, rName } }) => {
      const userId = ctx.session.user.id;
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .innerJoin(
          roomMember,
          and(eq(roomMember.roomId, roomId), eq(roomMember.userId, userId)),
        );
      if (user && user.room_member.role !== "creator") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "you don't have rights to perform this action",
        });
      }
      return await ctx.db
        .update(rooms)
        .set({ rImage, rName })
        .where(and(eq(rooms.id, roomId)));
    }),
  createRoom: protectedProcedure
    .input(
      z.object({
        memberEmail: z.string().email(),
        rName: z.string(),
        rType: z.enum(["group", "ptp"]),
        rImage: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input: { rImage, rName, rType, memberEmail } }) => {
      const userId = ctx.session.user.id;
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, memberEmail));

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "user not found with the email",
        });
      }

      const [newRoom] = await ctx.db
        .insert(rooms)
        .values({ adminUserId: userId, rName, rType, rImage })
        .returning();
      if (!newRoom) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "faild to create new room",
        });
      }

      return await ctx.db
        .insert(invites)
        .values({ invitedBy: userId, invitedTo: user.id, roomId: newRoom.id })
        .returning();
    }),
  removeMember: protectedProcedure
    .input(z.object({ memberId: z.string(), roomId: z.string() }))
    .mutation(async ({ ctx, input: { memberId, roomId } }) => {
      const userId = ctx.session.user.id;
      const [adminCheck] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .innerJoin(roomMember, eq(roomMember.userId, userId));

      const [isMember] = await ctx.db
        .select()
        .from(roomMember)
        .where(
          and(eq(roomMember.roomId, roomId), eq(roomMember.userId, memberId)),
        );
      if (!isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "no member exist",
        });
      }
      if (!adminCheck || adminCheck.room_member.role === "member") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "you do not have rights to perform this state",
        });
      }
      return await ctx.db
        .delete(roomMember)
        .where(
          and(
            eq(rooms.rType, "group"),
            eq(roomMember.roomId, roomId),
            eq(roomMember.userId, memberId),
          ),
        );
    }),
  inviteMembers: protectedProcedure
    .input(
      z.object({
        memberEmail: z.string().email(),
        roomId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input: { roomId, memberEmail } }) => {
      const userId = ctx.session.user.id;
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, memberEmail));

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "user not found with the email",
        });
      }

      return await ctx.db
        .insert(invites)
        .values({ invitedBy: userId, invitedTo: user.id, roomId })
        .returning();
    }),
  leaveRoom: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ ctx, input: { roomId } }) => {
      const userId = ctx.session.user.id;
      const [isMember] = await ctx.db
        .select()
        .from(roomMember)
        .where(
          and(eq(roomMember.roomId, roomId), eq(roomMember.userId, userId)),
        );
      if (!isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "no member exist",
        });
      }
      if (isMember.role === "creator") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "plesase transfer the ownership first to leave",
        });
      }
      return await ctx.db
        .delete(roomMember)
        .where(
          and(
            eq(rooms.rType, "group"),
            eq(roomMember.roomId, roomId),
            eq(roomMember.userId, userId),
          ),
        );
    }),
  getMessages: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input: { roomId, cursor, limit } }) => {
      const chats = await ctx.db
        .select({
          message: messages,
          user: users,
        })
        .from(messages)
        .where(
          and(
            eq(messages.roomId, roomId),
            cursor ? lt(messages.createdAt, new Date(cursor)) : undefined,
          ),
        )
        .innerJoin(users, eq(users.id, messages.userId))
        .orderBy(desc(messages.createdAt))
        .limit(limit + 1);
      let nextCursor: string | null = null;
      if (chats.length > limit) {
        const nextItem = chats.pop();
        nextCursor = nextItem?.message.createdAt.toISOString() ?? null;
      }

      return {
        items: chats,
        nextCursor,
      };
    }),
  sendMessage: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        text: z.string(),
        type: z.enum(["image", "video", "text"]),
      }),
    )
    .mutation(async ({ ctx, input: { roomId, text, type } }) => {
      const userId = ctx.session.user.id;
      const [isMember] = await ctx.db
        .select()
        .from(roomMember)
        .where(eq(roomMember.userId, userId));
      if (!isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "you don't have rights to perform this action",
        });
      }
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      const [newMessage] = await ctx.db
        .insert(messages)
        .values({ roomId, userId, text, type })
        .returning();
      const [updateRoom] = await ctx.db
        .update(rooms)
        .set({ updatedAt: new Date() })
        .where(eq(rooms.id, roomId));

      if (!newMessage) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "failed to send message",
        });
      }
      return { message: newMessage, user };
    }),
  deleteMessage: protectedProcedure
    .input(z.object({ roomId: z.string(), messageId: z.string() }))
    .mutation(async ({ ctx, input: { messageId, roomId } }) => {
      const userId = ctx.session.user.id;
      const [isMessageOwner] = await ctx.db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.userId, userId),
            eq(messages.id, messageId),
            eq(messages.roomId, roomId),
          ),
        );
      if (!isMessageOwner) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "failed to delete message",
        });
      }
      return await ctx.db
        .delete(messages)
        .where(
          and(
            eq(messages.userId, userId),
            eq(messages.id, messageId),
            eq(messages.roomId, roomId),
          ),
        );
    }),
  updateMessage: protectedProcedure
    .input(
      z.object({ roomId: z.string(), messageId: z.string(), text: z.string() }),
    )
    .mutation(async ({ ctx, input: { messageId, roomId, text } }) => {
      const userId = ctx.session.user.id;
      const [isMessageOwner] = await ctx.db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.type, "text"),
            eq(messages.userId, userId),
            eq(messages.id, messageId),
            eq(messages.roomId, roomId),
          ),
        );
      if (!isMessageOwner) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "failed to delete message",
        });
      }
      return await ctx.db
        .update(messages)
        .set({ text })
        .where(
          and(
            eq(messages.type, "text"),
            eq(messages.userId, userId),
            eq(messages.id, messageId),
            eq(messages.roomId, roomId),
          ),
        );
    }),
});
