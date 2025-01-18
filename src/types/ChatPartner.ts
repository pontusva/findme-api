import { objectType } from "nexus";
import { User } from "../schema";

export const ChatPartner = objectType({
  name: "ChatPartner",
  definition(t) {
    t.nonNull.string("userId");
    t.nonNull.string("partnerId");
    t.nonNull.field("user", { type: User });
    t.nonNull.field("partner", { type: User });
  },
});
