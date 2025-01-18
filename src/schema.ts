import {
  makeSchema,
  objectType,
  asNexusMethod,
  subscriptionField,
  nonNull,
  stringArg,
} from "nexus";
import { PetOwner } from "./types/PetOwner";
import { ChatPartner } from "./types/ChatPartner";
import { Mutation, Query } from "./resolvers/index";
import {
  MessageSubscription,
  SendMessage,
} from "./resolvers/MessageSubsription";
import prisma from "./lib/prisma";
import { GraphQLUpload } from "graphql-upload-minimal";
import pubsub from "./lib/pubsub";

export const Upload = asNexusMethod(GraphQLUpload, "Upload");

export const User = objectType({
  name: "User",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("name");
    t.nonNull.string("email");
    t.string("phoneNumber");
    t.string("address");
    t.nonNull.list.nonNull.field("pets", {
      type: "Pet",
      resolve: async (parent) => {
        const pets = await prisma.user
          .findUnique({ where: { id: parent.id } })
          .pets();
        return pets ?? [];
      },
    });
    t.nonNull.list.nonNull.field("reports", {
      type: "LostPetReport",
      resolve: async (parent) => {
        const reports = await prisma.user
          .findUnique({ where: { id: parent.id } })
          .reports();
        return reports ?? [];
      },
    });
    t.nonNull.list.nonNull.field("foundPets", {
      type: "FoundPet",
      resolve: async (parent) => {
        const foundPets = await prisma.user
          .findUnique({ where: { id: parent.id } })
          .foundPets();
        return foundPets ?? [];
      },
    });
    t.nonNull.list.nonNull.field("statusUpdates", {
      type: "ReportStatus",
      resolve: async (parent) => {
        const statusUpdates = await prisma.user
          .findUnique({ where: { id: parent.id } })
          .statusUpdates();
        return statusUpdates ?? [];
      },
    });
    t.nonNull.list.nonNull.field("notifications", {
      type: "Notification",
      resolve: async (parent) => {
        const notifications = await prisma.user
          .findUnique({ where: { id: parent.id } })
          .receivedNotifications();
        return notifications ?? [];
      },
    });
  },
});

const Pet = objectType({
  name: "Pet",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("name");
    t.nonNull.string("type");
    t.string("breed");
    t.int("age");
    t.string("gender");
    t.string("description");
    t.string("microchipId");
    t.string("photoUrl");
    t.nonNull.string("ownerId");
    t.field("owner", {
      type: PetOwner,
      resolve: async (parent) => {
        const owner = await prisma.pet
          .findUnique({ where: { id: parent.id } })
          .owner();
        return owner ?? null;
      },
    });
    t.field("microchip", {
      type: "Microchip",
      resolve: (parent) =>
        prisma.pet.findUnique({ where: { id: parent.id } }).microchip(),
    });
    t.nonNull.list.nonNull.field("lostReports", {
      type: "LostPetReport",
      resolve: async (parent) => {
        const lostReports = await prisma.pet
          .findUnique({ where: { id: parent.id } })
          .LostPetReport();
        return lostReports ?? [];
      },
    });
  },
});

const LostPetReport = objectType({
  name: "LostPetReport",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("petId");
    t.string("locationId");
    t.string("description");
    t.nonNull.string("status");
    t.nonNull.string("reportedBy");
    t.field("location", {
      type: "Location",
      resolve: async (parent) => {
        const location = await prisma.lostPetReport
          .findUnique({ where: { id: parent.id } })
          .location();
        return location ?? null;
      },
    });
    t.nonNull.field("pet", {
      type: "Pet",
      resolve: async (parent) => {
        const pet = await prisma.lostPetReport
          .findUnique({ where: { id: parent.id } })
          .pet();
        return pet ?? null;
      },
    });
    t.nonNull.field("reporter", {
      type: "User",
      resolve: async (parent) => {
        const reporter = await prisma.lostPetReport
          .findUnique({ where: { id: parent.id } })
          .reporter();
        return reporter ?? null;
      },
    });
    t.nonNull.list.nonNull.field("statuses", {
      type: "ReportStatus",
      resolve: async (parent) =>
        (await prisma.lostPetReport
          .findUnique({ where: { id: parent.id } })
          .statuses()) ?? [],
    });
    t.nonNull.list.nonNull.field("photoMatches", {
      type: "PhotoMatch",
      resolve: async (parent) =>
        (await prisma.lostPetReport
          .findUnique({ where: { id: parent.id } })
          .photoMatches()) ?? [],
    });
  },
});

const FoundPet = objectType({
  name: "FoundPet",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("finderId");
    t.string("locationId");
    t.string("photoUrl");
    t.string("description");
    t.nonNull.string("status");
    t.nonNull.field("finder", {
      type: "User",
      resolve: async (parent) => {
        const finder = await prisma.foundPet
          .findUnique({ where: { id: parent.id } })
          .finder();
        return finder ?? null;
      },
    });
    t.field("location", {
      type: "Location",
      resolve: (parent) =>
        prisma.foundPet.findUnique({ where: { id: parent.id } }).location(),
    });
    t.nonNull.list.nonNull.field("photoMatches", {
      type: "PhotoMatch",
      resolve: async (parent) =>
        (await prisma.foundPet
          .findUnique({ where: { id: parent.id } })
          .photoMatches()) ?? [],
    });
  },
});

const ReportStatus = objectType({
  name: "ReportStatus",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("reportId");
    t.nonNull.string("reportType");
    t.nonNull.string("status");
    t.nonNull.string("updatedBy");
    t.string("note");
    t.nonNull.field("updater", {
      type: "User",
      resolve: async (parent) => {
        const updater = await prisma.reportStatus
          .findUnique({ where: { id: parent.id } })
          .updater();
        return updater ?? null;
      },
    });
    t.field("lostPetReport", {
      type: "LostPetReport",
      resolve: (parent) =>
        prisma.reportStatus
          .findUnique({ where: { id: parent.id } })
          .LostPetReport(),
    });
  },
});

const Notification = objectType({
  name: "Notification",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("message");
    t.nonNull.string("userId");
    t.string("senderId");
    t.nonNull.boolean("read");
    t.field("recipient", {
      type: "User",
      resolve: (parent) => {
        return prisma.notification.findUnique({
          where: { id: parent.id },
        });
      },
    });
    t.field("sender", {
      type: "User",
      resolve: (parent) => {
        if (!parent.senderId) return null;
        return prisma.notification
          .findUnique({ where: { id: parent.id } })
          .sender();
      },
    });
  },
});

const Location = objectType({
  name: "Location",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.float("latitude");
    t.nonNull.float("longitude");
    t.string("address");
    t.string("lostReportId");
    t.string("foundPetId");
    t.field("lostReport", {
      type: "LostPetReport",
      resolve: (parent) =>
        prisma.location.findUnique({ where: { id: parent.id } }).lostReport(),
    });
    t.field("foundPet", {
      type: "FoundPet",
      resolve: async (parent) => {
        const foundPet = await prisma.location
          .findUnique({ where: { id: parent.id } })
          .foundPet();
        return foundPet ?? null;
      },
    });
  },
});

const Microchip = objectType({
  name: "Microchip",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("chipNumber");
    t.nonNull.string("petId");
    t.nonNull.field("pet", {
      type: "Pet",
      resolve: async (parent) => {
        const pet = await prisma.microchip
          .findUnique({ where: { id: parent.id } })
          .pet();
        return pet ?? null;
      },
    });
  },
});

const PhotoMatch = objectType({
  name: "PhotoMatch",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("lostReportId");
    t.nonNull.string("foundPetId");
    t.nonNull.float("similarity");
    t.nonNull.field("lostReport", {
      type: "LostPetReport",
      resolve: async (parent) => {
        const lostReport = await prisma.photoMatch
          .findUnique({ where: { id: parent.id } })
          .lostReport();
        return lostReport ?? null;
      },
    });
    t.nonNull.field("foundPet", {
      type: "FoundPet",
      resolve: async (parent) => {
        const foundPet = await prisma.photoMatch
          .findUnique({ where: { id: parent.id } })
          .foundPet();
        return foundPet ?? null;
      },
    });
  },
});

const PushSubscription = objectType({
  name: "PushSubscription",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("endpoint");
    t.nonNull.string("p256dh");
    t.nonNull.string("auth");
    t.nonNull.string("userId");
    t.nonNull.field("user", {
      type: "User",
      resolve: (parent) =>
        prisma.pushSubscription.findUnique({ where: { id: parent.id } }).user(),
    });
  },
});

const AuthResponse = objectType({
  name: "AuthResponse",
  definition(t) {
    t.nonNull.string("token");
    t.nonNull.string("userId");
  },
});

const Logout = objectType({
  name: "Logout",
  definition(t) {
    t.nonNull.boolean("logout");
  },
});

const NotificationsPayload = objectType({
  name: "NotificationsPayload",
  definition(t) {
    t.nonNull.field("newNotification", { type: "Notification" });
    t.nonNull.list.nonNull.field("latestNotifications", {
      type: "Notification",
    });
  },
});

const NotificationsSubscription = subscriptionField("notifications", {
  type: NotificationsPayload,
  args: {
    userId: nonNull(stringArg()),
  },
  subscribe: (_, { userId }) => {
    return pubsub.subscribe(`notifications-${userId}`);
  },
  resolve: async (payload) => {
    // Return the payload as-is
    const latestNotifications = await prisma.notification.findMany({
      where: { userId: payload.notificationsSubscription.userId }, // Ensure to filter by userId
      orderBy: { createdAt: "desc" }, // Order by creation date, most recent first
    });

    // Return both the new notification and the latest notifications
    return {
      newNotification: payload.notificationsSubscription,
      latestNotifications,
    };
  },
});

export const schema = makeSchema({
  types: [
    Upload,
    Query,
    Mutation,
    User,
    Pet,
    LostPetReport,
    FoundPet,
    ReportStatus,
    Notification,
    Location,
    Microchip,
    PhotoMatch,
    PushSubscription,
    AuthResponse,
    Logout,
    NotificationsSubscription,
    NotificationsPayload,
    MessageSubscription,
    SendMessage,
    ChatPartner,
  ],
  outputs: {
    schema: __dirname + "/../schema.graphql",
    typegen: __dirname + "/generated/nexus.ts",
  },
  contextType: {
    module: require.resolve("./context"),
    export: "Context",
  },
  sourceTypes: {
    modules: [
      {
        module: "@prisma/client",
        alias: "prisma",
      },
    ],
  },
});
