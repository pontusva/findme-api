import { nonNull, stringArg, subscriptionField } from "nexus";
import { ObjectDefinitionBlock } from "nexus/dist/core";
import prisma from "../lib/prisma";
import pubsub from "../lib/pubsub";

export const createNotificationMutation = {
  createNotification: (t: ObjectDefinitionBlock<"Mutation">) =>
    t.nonNull.field("createNotification", {
      type: "Notification",
      args: {
        userId: nonNull(stringArg()),
        name: nonNull(stringArg()),
        email: nonNull(stringArg()),
        phone: nonNull(stringArg()),
        message: nonNull(stringArg()),
        senderId: nonNull(stringArg()),
      },
      resolve: async (
        _,
        { userId, name, email, phone, message, senderId },
        context
      ) => {
        try {
          // Validate inputs
          if (!email.includes("@")) {
            throw new Error("Invalid email format");
          }

          // Create notification in the database
          const notification = await prisma.notification.create({
            data: {
              userId,
              senderId,
              createdAt: new Date(),
              message: `Contact from ${name} (${email}, ${phone}): ${message}`,
              read: false,
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
