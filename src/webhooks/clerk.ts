import { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma'

export default async function clerkWebhookRoutes(
  fastify: FastifyInstance
) {
  fastify.post(
    '/webhooks/clerk',
    async (request, reply) => {
      const event = request.body as any
      console.log(event)
      if (event.type === 'user.created') {
        const user = event.data
        await prisma.user.create({
          data: {
            id: user.id,
            email: user.email_addresses[0]?.email_address,
            name: `${user.first_name} ${user.last_name}`,
            createdAt: new Date()
          }
        })
      }

      return reply.code(200).send('Webhook processed')
    }
  )
}
