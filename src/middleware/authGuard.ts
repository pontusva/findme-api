import { GraphQLError } from 'graphql'
import { Context } from '../context'

export function requireAuth<T>(
  resolver: (root: any, args: any, ctx: Context) => T
) {
  return (root: any, args: any, ctx: Context) => {
    if (!ctx.userId) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      })
    }
    return resolver(root, args, ctx)
  }
}
