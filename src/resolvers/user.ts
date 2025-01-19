import { ObjectDefinitionBlock } from "nexus/dist/core";
import { stringArg, nonNull } from "nexus";
import prisma from "../lib/prisma";
import { clerkClient } from "@clerk/express";
import { decrypt } from "../encryption";
import dotenv from "dotenv";

dotenv.config();

export const userMutations = {
  createUser: (t: ObjectDefinitionBlock<"Mutation">) =>
    t.nonNull.field("createUser", {
      type: "User",
      args: {
        email: nonNull(stringArg()),
        name: stringArg(),
      },
      resolve: async (_, args) => {
        return prisma.user.create({
          data: {
            email: args.email,
            name: args.name || "",
          },
        });
      },
    }),

  login: (t: ObjectDefinitionBlock<"Mutation">) =>
    t.nonNull.field("login", {
      type: "AuthResponse",
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      resolve: async (_, { email, password }) => {
        try {
          // First verify if the user exists
          const user = await clerkClient.users.getUserList({
            emailAddress: [email],
          });

          if (!user || user.data.length === 0) {
            throw new Error("Invalid email or password");
          }

          // Create sign-in token for the existing user
          const signInAttempt =
            await clerkClient.signInTokens.createSignInToken({
              userId: user.data[0].id,
              expiresInSeconds: 3600, // 1 hour
            });

          if (signInAttempt.status === "complete") {
            return {
              token: signInAttempt.token,
              userId: signInAttempt.userId,
            };
          }
          throw new Error("Invalid email or password");
        } catch (error) {
          throw new Error("Invalid email or password");
        }
      },
    }),

  logout: (t: ObjectDefinitionBlock<"Mutation">) =>
    t.nonNull.field("logout", {
      type: "Logout",
      resolve: async (_, __, { userId }) => {
        try {
          if (!userId) {
            throw new Error("Not authenticated");
          }

          console.log("Attempting to logout user:", userId);

          // Revoke the current session using the token
          const session = await clerkClient.sessions.getSession(userId);
          if (session) {
            await clerkClient.sessions.revokeSession(session.id);
          }

          console.log("Session ended successfully");
          return { logout: true };
        } catch (error) {
          console.error("Logout error:", error);
          // Return the actual error message
          throw new Error(
            error instanceof Error ? error.message : "Logout failed"
          );
        }
      },
    }),
};

export const userQueries = {
  getUser: (t: ObjectDefinitionBlock<"Query">) =>
    t.nonNull.field("getUser", {
      type: "User",
      args: { id: nonNull(stringArg()) },
      resolve: async (_, args) => {
        const user = await prisma.user.findUnique({
          where: { id: args.id },
        });
        if (!user) {
          throw new Error("User not found");
        }
        const secretKey = process.env.ENCRYPTION_KEY;
        user.email = decrypt(user.email, secretKey!);
        return user;
      },
    }),
  getAllUsers: (t: ObjectDefinitionBlock<"Query">) =>
    t.nonNull.list.nonNull.field("getAllUsers", {
      type: "User",
      resolve: async () => {
        return prisma.user.findMany();
      },
    }),
  getUserPets: (t: ObjectDefinitionBlock<"Query">) =>
    t.nonNull.list.nonNull.field("getUserPets", {
      type: "Pet",
      args: { userId: nonNull(stringArg()) },
      resolve: async (_, args) => {
        return prisma.pet.findMany({
          where: { ownerId: args.userId },
        });
      },
    }),
  getAllLostPets: (t: ObjectDefinitionBlock<"Query">) =>
    t.nonNull.list.nonNull.field("getAllLostPets", {
      type: "LostPetReport",
      resolve: async () => {
        return prisma.lostPetReport.findMany();
      },
    }),
};
