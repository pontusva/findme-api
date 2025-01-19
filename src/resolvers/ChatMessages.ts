import { nonNull } from "nexus";
import { stringArg } from "nexus/dist/core";
import { ObjectDefinitionBlock } from "nexus/dist/core";
import { Context } from "../context";
import { decrypt } from "../encryption"; // Import your decrypt function

export const chatMessagesQueries = {
  getChatMessages: (t: ObjectDefinitionBlock<"Query">) => {
    t.nonNull.list.nonNull.field("getChatMessages", {
      type: "Message",
      args: {
        chatId: nonNull(stringArg()), // Expect chatId as input
      },
      resolve: async (_root, { chatId }, ctx: Context) => {
        // Fetch messages from the database
        const messages = await ctx.prisma.message.findMany({
          where: { chatId },
          orderBy: { createdAt: "asc" }, // Ensure messages are ordered by creation time
        });

        // Decrypt each message's content synchronously
        const decryptedMessages = messages.map((message) => {
          try {
            // Decrypt the message content (assumes the key is stored in an environment variable or config)
            const decryptedContent = decrypt(
              message.content,
              process.env.ENCRYPTION_KEY || "your-default-secret-key"
            );
            return { ...message, content: decryptedContent }; // Return the message with decrypted content
          } catch (error) {
            console.error(`Error decrypting message ${message.id}:`, error);
            return message; // If decryption fails, return the message as is (or handle the error accordingly)
          }
        });

        // All messages are decrypted, return them
        return decryptedMessages;
      },
    });
  },
};
