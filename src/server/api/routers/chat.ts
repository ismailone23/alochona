import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  invites,
  messages,
  roomMember,
  rooms,
  users,
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const chatRouter = createTRPCRouter({
  getAllRooms: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return await ctx.db
      .select()
      .from(rooms)
      .innerJoin(
        roomMember,
        and(eq(rooms.id, roomMember.roomId), eq(roomMember.userId, userId)),
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
    .input(z.object({ roomId: z.string() }))
    .query(async ({ ctx, input: { roomId } }) => {
      const chats = await ctx.db
        .select()
        .from(messages)
        .where(eq(messages.roomId, roomId))
        .innerJoin(users, eq(users.id, messages.id));
      return chats;
    }),
  sendMessage: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        text: z.string(),
        type: z.enum(["image", "video", "text"]),
      }),
    )
    .query(async ({ ctx, input: { roomId, text, type } }) => {
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
      const [newMessage] = await ctx.db
        .insert(messages)
        .values({ roomId, userId, text, type })
        .returning();

      if (!newMessage) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "failed to send message",
        });
      }
      return newMessage;
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
