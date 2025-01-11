import { FastifyRequest } from 'fastify'
import { PrismaClient } from '@prisma/client'
import prisma from './lib/prisma'

export interface Context {
  prisma: PrismaClient
  request: FastifyRequest
  userId?: string
}

export async function createContext({
  req
}: {
  req: FastifyRequest
}): Promise<Context> {
  // Skip auth for GraphiQL
  if (req.url === '/graphql' && req.method === 'GET') {
    return { prisma, request: req }
  }

  // Get the session token from the headers
  const sessionToken =
    req.headers.authorization?.split(' ')[1]

  let userId: string | undefined

  if (sessionToken) {
    try {
      // Verify with Clerk
      const response = await fetch(
        'https://api.clerk.dev/v1/sessions/verify',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sessionId: sessionToken })
        }
      )

      if (response.ok) {
        const session = await response.json()
        userId = session.userId
      }
    } catch (error) {
      console.error('Auth error:', error)
    }
  }

  return {
    prisma,
    request: req,
    userId
  }
}
