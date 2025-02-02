import { nonNull, stringArg } from "nexus";
import { booleanArg, ObjectDefinitionBlock } from "nexus/dist/core";
import prisma from "../lib/prisma";
import pubsub from "../lib/pubsub";

export const createNotificationMutation = {
  createNotification: (t: ObjectDefinitionBlock<"Mutation">) =>
    t.nonNull.field("createNotification", {
      type: "Notification",
      args: {
        userId: nonNull(stringArg()),
        message: nonNull(stringArg()),
        senderId: nonNull(stringArg()),
        showEmail: nonNull(booleanArg()),
      },
      resolve: async (_, { userId, message, senderId, showEmail }, context) => {
        try {
          const notification = await prisma.notification.create({
            data: {
              userId,
              senderId,
              createdAt: new Date(),
              message: message,
              read: false,
              showEmail,
            },
          });

          // Publish the notification to all subscribers of this user
          pubsub.publish(`notifications-${userId}`, {
            notificationsSubscription: notification,
          });
          console.log("notification", notification, userId);
          // Return the created notification
          return notification;
        } catch (error) {
          // Log the error for debugging
          console.error("Notification creation error:", error);

          // Throw a user-friendly error
          throw new Error(
            error instanceof Error
              ? error.message
              : "Failed to create notification. Please try again."
          );
        }
      },
    }),
};

export const notificationQueries = {
  notifications: (t: ObjectDefinitionBlock<"Query">) =>
    t.nonNull.list.nonNull.field("notifications", {
      type: "Notification",
      args: {
        userId: nonNull(stringArg()),
      },
      resolve: async (_, { userId }) => {
        return prisma.notification.findMany({
          where: {
            userId: userId,
          },
          include: {
            sender: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      },
    }),
};
