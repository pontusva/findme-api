import { objectType } from 'nexus'

export const PetOwner = objectType({
  name: 'PetOwner',
  definition(t) {
    t.nonNull.string('id')
    t.nonNull.string('name')
    t.nonNull.string('email')
  }
})
