import { Request } from "express";
import passport from "passport";
import passportCustom from "passport-custom";
import { z } from "zod";
import { User } from "../../common/types";
import * as logger from "../../modules/logger";
import { findUserOrThrow } from "../../services/auth";
import { env } from "../../utils/env";
import { createGuestStrategy } from "./guest";
import { createSlackStrategy } from "./slack";

const expressUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["Slack", "Guest"]),
  avatar_url: z.string().optional(),
});

export function isUser(x: unknown): x is Express.User {
  return expressUserSchema.safeParse(x).success;
}

async function validateUserForDeserialize(user: unknown) {
  const parsed = User.safeParse(user);
  if (!parsed.success) throw new Error("User型として認識できませんでした。");
  const userDocument = await findUserOrThrow(parsed.data.id);
  if (parsed.data.type == "Slack" && userDocument.guest !== undefined)
    throw new Error("Slackユーザーとしては不適切なユーザーです。");
  if (parsed.data.type == "Guest" && userDocument.guest === undefined)
    throw new Error("Guestユーザーとしては不適切なユーザーです。");
  return parsed.data;
}
export const STRATEGY_NAME_GUEST = "guest";
export const STRATEGY_NAME_SLACK = "slack";
export const STRATEGY_NAME_TEST = "test";

async function preparePassport() {
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (
    req: Request,
    user: unknown,
    done: (err: unknown, user?: Express.User | false | null) => void,
  ) {
    validateUserForDeserialize(user)
      .then((validatedUser) => {
        done(null, validatedUser);
      })
      .catch((err) => {
        logger.system.error("deserializeUserに失敗しました。", user, err);
        req.session.destroy(() => {
          done(
            new Error("認証に問題が発生しました。再度ログインしてください。"),
            null,
          );
        });
      });
  });
  const [slackStrategy, guestStrategy] = await Promise.all([
    createSlackStrategy(),
    createGuestStrategy(),
  ]);
  passport.use(STRATEGY_NAME_GUEST, guestStrategy);
  passport.use(STRATEGY_NAME_SLACK, slackStrategy);
  if (env.NODE_ENV === "test") {
    const testStrategyInput = z.object({
      id: z.string(),
      name: z.string(),
      avatar_url: z.string(),
      type: z.enum(["Slack", "Guest"]),
    });
    const testStrategy = new passportCustom.Strategy((req, callback) => {
      const parsed = testStrategyInput.safeParse(req.body);
      if (parsed.success) {
        callback(null, parsed.data);
      } else {
        callback(parsed.error);
      }
    });
    passport.use(STRATEGY_NAME_TEST, testStrategy);
  }
}

export { preparePassport };
