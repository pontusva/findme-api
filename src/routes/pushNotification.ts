import { FastifyInstance } from "fastify";
import webpush from "web-push";
import prisma from "../lib/prisma";

interface PushSubscriptionWithUser {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

webpush.setVapidDetails(
  "mailto:ponabr123@gmail.com", // Contact info
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export default async function pushNotificationRoutes(fastify: FastifyInstance) {
  fastify.get("/push/vapidPublicKey", async () => {
    return { publicKey: process.env.VAPID_PUBLIC_KEY };
  });

  // Get subscription for specific user
  fastify.get("/push/subscription/:userId", async (request, reply) => {
    const { userId } = request.params as {
      userId: string;
    };

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (!subscriptions.length) {
      return reply.status(404).send({
        status: "error",
        message: "No subscription found for user",
      });
    }

    return subscriptions;
  });

  // Subscribe
  fastify.post("/push/subscribe", async (request, reply) => {
    const subscription = request.body as PushSubscriptionWithUser;

    try {
      await prisma.pushSubscription.upsert({
        where: {
          endpoint: subscription.endpoint,
        },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userId: subscription.userId,
        },
        create: {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userId: subscription.userId,
        },
      });

      return {
        status: "success",
        message: "Subscription stored successfully",
      };
    } catch (error) {
      console.error("Error storing subscription:", error);
      return reply.status(500).send({
        status: "error",
        message: "Failed to store subscription",
      });
    }
  });

  // Unsubscribe
  fastify.post("/push/unsubscribe", async (request, reply) => {
    const { userId, endpoint } = request.body as {
      userId: string;
      endpoint?: string;
    };

    try {
      if (endpoint) {
        // Delete specific subscription
        await prisma.pushSubscription.deleteMany({
          where: {
            userId,
            endpoint,
          },
        });
      } else {
        // Delete all user's subscriptions
        await prisma.pushSubscription.deleteMany({
          where: { userId },
        });
      }

      return {
        status: "success",
        message: "Subscription(s) removed successfully",
      };
    } catch (error) {
      console.error("Error removing subscription:", error);
      return reply.status(500).send({
        status: "error",
        message: "Failed to remove subscription",
      });
    }
  });

  // Send notification
  fastify.post("/push/send", async (request, reply) => {
    const { userId, title, body } = request.body as {
      userId: string;
      title: string;
      body: string;
    };

    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
      });

      if (!subscriptions.length) {
        return reply.status(404).send({
          status: "error",
          message: "No subscriptions found for user",
        });
      }

      const payload = JSON.stringify({ title, body });

      const errors: Error[] = [];

      await Promise.all(
        subscriptions.map(async (subscription) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh,
                  auth: subscription.auth,
                },
              },
              payload
            );
          } catch (error) {
            errors.push(error as Error);
            console.error(
              "Error sending notification to endpoint:",
              subscription.endpoint,
              error
            );

            if (
              error instanceof Error &&
              (error.name === "WebPushError" || error.message.includes("410"))
            ) {
              console.warn(
                `Removing subscription for endpoint: ${subscription.endpoint} due to error: ${error.message}`
              );
              await prisma.pushSubscription.delete({
                where: { endpoint: subscription.endpoint },
              });
            }
          }
        })
      );

      return {
        status: "success",
        message: "Notifications sent successfully",
        errors: errors.length ? errors.map((e) => e.message) : undefined,
      };
    } catch (error) {
      console.error("Error sending notifications:", error);
      return reply.status(500).send({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to send notifications",
      });
    }
  });

  // Get stats
  //   fastify.get('/push/stats', async () => {
  //     const stats = await prisma.$transaction([
  //       prisma.pushSubscription.count(),
  //       prisma.pushSubscription.groupBy({
  //         by: ['userId'],
  //         _count: {
  //           _all: true
  //         }
  //       })
  //     ])

  //     return {
  //       totalSubscriptions: stats[0],
  //       subscriptionsByUser: stats[1].reduce((acc, curr) => {
  //         acc[curr.userId] = curr._count._all
  //         return acc
  //       }, {} as Record<string, number>)
  //     }
  //   })
}
