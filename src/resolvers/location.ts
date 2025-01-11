import { nonNull } from 'nexus'
import { floatArg } from 'nexus'
import {
  ObjectDefinitionBlock,
  stringArg
} from 'nexus/dist/core'
import { Context } from '../context'

export const locationMutations = {
  createLocation: (
    t: ObjectDefinitionBlock<'Mutation'>
  ) => {
    t.nonNull.field('createLocation', {
      type: 'Location',
      args: {
        latitude: nonNull(floatArg()),
        longitude: nonNull(floatArg()),
        address: stringArg(),
        foundPetId: stringArg(),
        lostReportId: stringArg()
      },
      resolve: async (_root, args, ctx: Context) => {
        return ctx.prisma.location.create({
          data: {
            latitude: args.latitude,
            longitude: args.longitude,
            address: args.address,
            foundPetId: args.foundPetId,
            lostReportId: args.lostReportId
          }
        })
      }
    })
  }
}
