import { nonNull } from "nexus";
import { stringArg } from "nexus/dist/core";
import { ObjectDefinitionBlock } from "nexus/dist/core";
import { Context } from "../context";

export const chatPartnerMutations = {
  createChatPartner: (t: ObjectDefinitionBlock<"Mutation">) => {
    t.nonNull.field("createChatPartner", {
      type: "ChatPartner",
      args: {
        userId: nonNull(stringArg()),
        partnerId: nonNull(stringArg()),
      },
      resolve: async (_root, args, ctx: Context) => {
        const chatPartner = await ctx.prisma.chatPartner.create({
          data: {
            userId: args.userId,
            partnerId: args.partnerId,
          },
          include: {
            user: true,
            partner: true,
          },
        });
        return chatPartner;
      },
    });

    t.nonNull.field("deleteChatPartner", {
      type: "ChatPartner",
      args: {
        userId: nonNull(stringArg()),
        partnerId: nonNull(stringArg()),
      },
      resolve: async (_root, args, ctx: Context) => {
        const chatPartner = await ctx.prisma.chatPartner.findUnique({
          where: {
            userId_partnerId: {
              userId: args.userId,
              partnerId: args.partnerId,
            },
          },
        });

        if (chatPartner) {
          await ctx.prisma.chatPartner.delete({
            where: {
              userId_partnerId: {
                userId: args.userId,
                partnerId: args.partnerId,
              },
            },
          });
          return chatPartner;
        }

        throw new Error("Chat partner not found");
      },
    });
  },
};

export const chatPartnerQueries = {
  getChatPartners: (t: ObjectDefinitionBlock<"Query">) => {
    t.nonNull.list.nonNull.field("getChatPartners", {
      type: "ChatPartner",
      args: {
        userId: nonNull(stringArg()),
      },
      resolve: async (_root, { userId }, ctx: Context) => {
        const chatPartners = await ctx.prisma.chatPartner.findMany({
          where: { userId: userId },
          include: {
            user: true,
            partner: true,
          },
        });
        return chatPartners;
      },
    });
  },
};
