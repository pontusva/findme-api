import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma";
import { encrypt } from "../encryption";
import dotenv from "dotenv";

dotenv.config();

export default async function clerkWebhookRoutes(fastify: FastifyInstance) {
  fastify.post("/webhooks/clerk", async (request, reply) => {
    const event = request.body as any;
    console.log(event);
    if (event.type === "user.created") {
      const secretKey = process.env.ENCRYPTION_KEY;

      const user = event.data;
      const encryptedEmail = encrypt(
        user.email_addresses[0]?.email_address,
        secretKey!
      );
      await prisma.user.create({
        data: {
          id: user.id,
          email: encryptedEmail,
          name: `${user.first_name} ${user.last_name}`,
          createdAt: new Date(),
        },
      });
    }

    return reply.code(200).send("Webhook processed");
  });
}
