// src/routes/upload.ts
import { FastifyInstance } from 'fastify'
import { uploadImage } from '../lib/uploadImages'
import fastifyMultipart from '@fastify/multipart'

export async function uploadRoutes(
  fastify: FastifyInstance
) {
  // Register multipart support
  await fastify.register(fastifyMultipart)

  fastify.post('/upload', async (request, reply) => {
    try {
      const data = await request.file()

      if (!data) {
        throw new Error('No file uploaded')
      }

      const buffer = await data.toBuffer()

      const imageUrl = await uploadImage({
        file: {
          buffer,
          mimetype: data.mimetype,
          originalname: data.filename
        },
        acl: 'public-read'
      })

      return { success: true, url: imageUrl }
    } catch (error) {
      reply.code(500).send({ error: 'Upload failed' })
    }
  })
}
