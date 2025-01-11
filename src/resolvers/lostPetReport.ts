import { nonNull, stringArg } from 'nexus'
import { ObjectDefinitionBlock } from 'nexus/dist/core'
import prisma from '../lib/prisma'

export const lostPetReportQueries = {
  getLostPetReport: (t: ObjectDefinitionBlock<'Query'>) =>
    t.nonNull.field('getLostPetReport', {
      type: 'LostPetReport',
      args: {
        id: nonNull(stringArg())
      },
      resolve: async (_, { id }) => {
        const report =
          await prisma.lostPetReport.findUnique({
            where: { id },
            include: {
              location: true,
              pet: true,
              reporter: true,
              statuses: true,
              photoMatches: true
            }
          })
        if (!report)
          throw new Error(
            `Lost pet report with ID ${id} not found`
          )
        return report
      }
    }),

  getAllLostPetReports: (
    t: ObjectDefinitionBlock<'Query'>
  ) =>
    t.nonNull.list.nonNull.field('getAllLostPetReports', {
      type: 'LostPetReport',
      resolve: async () => {
        return prisma.lostPetReport.findMany()
      }
    })
}

export const lostPetReportMutations = {
  createLostPetReport: (
    t: ObjectDefinitionBlock<'Mutation'>
  ) =>
    t.nonNull.field('createLostPetReport', {
      type: 'LostPetReport',
      args: {
        petId: nonNull(stringArg()),
        description: stringArg(),
        locationId: stringArg(),
        reportedBy: nonNull(stringArg()),
        status: stringArg()
      },
      resolve: async (_, args) => {
        return prisma.lostPetReport.create({
          data: {
            petId: args.petId,
            description: args.description,
            locationId: args.locationId,
            reportedBy: args.reportedBy,
            status: args.status || 'OPEN'
          }
        })
      }
    }),

  updateLostPetReport: (
    t: ObjectDefinitionBlock<'Mutation'>
  ) =>
    t.nonNull.field('updateLostPetReport', {
      type: 'LostPetReport',
      args: {
        id: nonNull(stringArg()),
        description: stringArg(),
        locationId: stringArg(),
        status: stringArg()
      },
      resolve: async (_, args) => {
        const { id, ...rest } = args
        const updateData = Object.fromEntries(
          Object.entries(rest).filter(
            ([_, v]) => v !== null
          )
        )
        return prisma.lostPetReport.update({
          where: { id },
          data: updateData
        })
      }
    })
}
