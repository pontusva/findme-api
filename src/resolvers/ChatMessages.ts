import { nonNull } from "nexus";
import { stringArg } from "nexus/dist/core";
import { ObjectDefinitionBlock } from "nexus/dist/core";
import { Context } from "../context";

export const chatMessagesQueries = {
  getChatMessages: (t: ObjectDefinitionBlock<"Query">) => {
    t.nonNull.list.nonNull.field("getChatMessages", {
      type: "Message",
      args: {
        chatId: nonNull(stringArg()), // Expect chatId as input
      },
      resolve: async (_root, { chatId }, ctx: Context) => {
        const messages = await ctx.prisma.message.findMany({
          where: { chatId },
          orderBy: { createdAt: "asc" }, // Ensure messages are ordered by creation time
        });
        return messages;
      },
    });
  },
};
