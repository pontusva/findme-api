import { mutationField, nonNull, stringArg, subscriptionField } from "nexus";
import pubsub from "../lib/pubsub";
import prisma from "../lib/prisma";
import { objectType } from "nexus";
import { Message } from "@prisma/client";

const Message = objectType({
  name: "Message",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("content");
    t.nonNull.string("senderId");
    t.nonNull.string("receiverId");
  },
});

const getChatId = (userId1: string, userId2: string) => {
  return userId1 < userId2 ? `${userId1}-${userId2}` : `${userId2}-${userId1}`;
};

export const MessageSubscription = {
  message: subscriptionField("message", {
    type: Message,
    args: {
      chatId: nonNull(stringArg()), // Expect chatId
    },
    subscribe: (_, { chatId }) => {
      console.log({ chatId }, "subscribe to chatId");
      return pubsub.subscribe(`message-${chatId}`);
    },
    resolve: (payload) => {
      return payload;
    },
  }),
};

export const SendMessage = mutationField("sendMessage", {
  type: "Message",
  args: {
    content: nonNull(stringArg()),
    senderId: nonNull(stringArg()),
    receiverId: nonNull(stringArg()),
  },
  resolve: async (_, { content, senderId, receiverId }) => {
    // Pre-compute chatId from senderId and receiverId
    const chatId = getChatId(senderId, receiverId);
    console.log({ chatId }, "chatId");
    // Check if the chat already exists
    const existingChat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        participants: {
          some: {
            userId: senderId,
          },
        },
      },
    });

    let createdChatId;

    if (!existingChat) {
      // If no chat exists, create a new chat and add both participants
      const newChat = await prisma.chat.create({
        data: {
          id: chatId, // Use the pre-computed chatId
          name: `Chat between ${senderId} and ${receiverId}`,
          isGroup: false, // This is a one-on-one chat
          participants: {
            create: [{ userId: senderId }, { userId: receiverId }],
          },
        },
      });
      createdChatId = newChat.id;
    } else {
      // If the chat exists, use the existing chatId
      createdChatId = existingChat.id;
    }

    // Create the message with the determined chatId
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        chatId: createdChatId, // Use the created chatId
      },
    });

    // Publish the message to the chatId topic
    pubsub.publish(`message-${createdChatId}`, message);

    return message; // Return the created message
  },
});
