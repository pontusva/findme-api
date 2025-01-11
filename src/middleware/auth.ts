import { FastifyRequest } from 'fastify'
import { GraphQLError } from 'graphql'

export async function verifyAuth(request: FastifyRequest) {
  const authHeader = request.headers.authorization

  if (!authHeader) {
    throw new GraphQLError('Not authenticated', {
      extensions: {
        code: 'UNAUTHENTICATED'
      }
    })
  }

  // The token will be in format "Bearer <token>"
  const token = authHeader.split(' ')[1]

  try {
    // Verify the token with Clerk
    const response = await fetch(
      `${process.env.CLERK_API_URL}/tokens/verify`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      }
    )

    if (!response.ok) {
      throw new GraphQLError('Invalid token', {
        extensions: {
          code: 'UNAUTHENTICATED'
        }
      })
    }

    const data = await response.json()
    return data.sub // Returns the user ID
  } catch (error) {
    throw new GraphQLError('Authentication failed', {
      extensions: {
        code: 'UNAUTHENTICATED'
      }
    })
  }
}
