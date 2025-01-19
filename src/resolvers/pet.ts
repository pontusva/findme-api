import { nonNull, stringArg, intArg, arg } from "nexus";
import { ObjectDefinitionBlock } from "nexus/dist/core";
import { decrypt } from "../encryption";

export const petQueries = {
  getPet: (t: ObjectDefinitionBlock<"Query">) => {
    t.nonNull.field("getPet", {
      type: "Pet",
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_root, args, ctx) => {
        const pet = await ctx.prisma.pet.findUnique({
          where: { id: args.id },
        });
        console.log(pet);
        return pet ?? null;
      },
    });
  },
  getPets: (t: ObjectDefinitionBlock<"Query">) => {
    t.nonNull.list.field("getPets", {
      type: "Pet",
      resolve: async (_root, args, ctx) => {
        const pets = await ctx.prisma.pet.findMany();
        return pets;
      },
    });
  },
  getFilteredPets: (t: ObjectDefinitionBlock<"Query">) => {
    t.nonNull.list.field("getFilteredPets", {
      type: "LostPetReport",
      args: {
        searchTerm: stringArg(),
      },
      resolve: async (_root, args, ctx) => {
        const normalizedSearch = args.searchTerm?.toLowerCase().trim() || "";

        // If search is empty, don't apply any filters
        if (!normalizedSearch) {
          return ctx.prisma.lostPetReport.findMany({
            include: {
              pet: true,
              location: true,
            },
          });
        }

        return ctx.prisma.lostPetReport.findMany({
          where: {
            OR: [
              {
                pet: {
                  name: {
                    contains: normalizedSearch,
                    mode: "insensitive",
                  },
                },
              },
              {
                pet: {
                  type: {
                    contains: normalizedSearch,
                    mode: "insensitive",
                  },
                },
              },
              {
                pet: {
                  breed: {
                    contains: normalizedSearch,
                    mode: "insensitive",
                  },
                },
              },
              {
                location: {
                  address: {
                    contains: normalizedSearch,
                    mode: "insensitive",
                  },
                },
              },
            ],
          },
          include: {
            pet: true,
            location: true,
          },
        });
      },
    });
  },
};

export const petMutations = {
  createPet: (t: ObjectDefinitionBlock<"Mutation">) => {
    t.field("createPet", {
      type: "Pet",
      args: {
        name: nonNull(stringArg()),
        type: nonNull(stringArg()),
        breed: stringArg(),
        age: intArg(),
        gender: stringArg(),
        description: stringArg(),
        microchipId: stringArg(),
        photoUrl: stringArg(),
        ownerId: nonNull(stringArg()),
      },
      resolve: async (_root, args, ctx) => {
        try {
          const pet = await ctx?.prisma?.pet.create({
            data: {
              name: args.name,
              type: args.type,
              breed: args.breed || null,
              age: args.age || null,
              gender: args.gender || null,
              description: args.description || null,
              microchipId: args.microchipId || null,
              photoUrl: args.photoUrl,
              owner: {
                connect: {
                  id: args.ownerId,
                },
              },
            },
          });

          return pet;
        } catch (error: any) {
          console.error("Error creating pet:", error);
          throw new Error(`Failed to create pet: ${error.message}`);
        }
      },
    });
  },
};

const streamToBuffer = async (stream: any): Promise<Buffer> => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};
