import { myId } from "../auth";
import { createTrpcCaller } from "./common";

describe("trpc.me", () => {
  it("非ログイン時は null を返す。", () => {
    const caller = createTrpcCaller();
    expect(caller.me()).resolves.toBeNull();
  });
  it("ゲストログイン時は ゲストユーザーの情報 を返す。", async () => {
    const caller = createTrpcCaller(myId, "Guest");
    const user = await caller.me();
    expect(user).not.toBeNull();
    expect(user?.id).toBe(myId);
    expect(user?.type).toBe("Guest");
  });
  it("Slackログイン時は Slackユーザーの情報 を返す。", async () => {
    const caller = createTrpcCaller(myId, "Slack");
    const user = await caller.me();
    expect(user).not.toBeNull();
    expect(user?.id).toBe(myId);
    expect(user?.type).toBe("Slack");
  });
});
