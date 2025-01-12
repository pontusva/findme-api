import { objectType } from "nexus";
import { lostPetReportMutations, lostPetReportQueries } from "./lostPetReport";
import { userMutations, userQueries } from "./user";
import { petMutations, petQueries } from "./pet";
import { locationMutations } from "./location";
import { createNotificationMutation } from "./Notifications";
import { notificationQueries } from "./Notifications";

export const Mutation = objectType({
  name: "Mutation",
  definition(t) {
    Object.entries(lostPetReportMutations).forEach(([_, mutation]) => {
      mutation(t);
    });

    Object.entries(userMutations).forEach(([_, mutation]) => {
      mutation(t);
    });

    Object.entries(petMutations).forEach(([_, mutation]) => {
      mutation(t);
    });

    Object.entries(locationMutations).forEach(([_, mutation]) => {
      mutation(t);
    });

    Object.entries(createNotificationMutation).forEach(([_, mutation]) => {
      mutation(t);
    });
  },
});

export const Query = objectType({
  name: "Query",
  definition(t) {
    Object.entries(userQueries).forEach(([_, query]) => {
      query(t);
    });

    Object.entries(petQueries).forEach(([_, query]) => {
      query(t);
    });

    Object.entries(lostPetReportQueries).forEach(([_, query]) => {
      query(t);
    });

    Object.entries(notificationQueries).forEach(([_, query]) => {
      query(t);
    });
  },
});
