import { inferProcedureInput, inferProcedureOutput } from "@trpc/server";
import { preparePassport } from "../../../../src/config/passport";
import { TRPCRouter } from "../../../../src/routes/api/trpc";
import { myId } from "../../../auth";
import { clearDatabase, connectDatabase, wrap } from "../../../common";
import { createTrpcCaller, expectTRPCError } from "../../common";
import { UserModel } from "../../../../src/models/database";
import { TRPC_ERROR_CODE_KEY } from "@trpc/server/dist/rpc";
import { verifyPassword } from "../../../../src/services/auth/password";

type Input = inferProcedureInput<TRPCRouter["account"]["guest"]["create"]>;
type Output = inferProcedureOutput<TRPCRouter["account"]["guest"]["create"]>;

function testGuestCreate({
  userId,
  userType,
  input,
  expectedError,
  onSuccess,
}: {
  userId?: string;
  userType?: "Slack" | "Guest";
  input: unknown;
  expectedError?: {
    code: TRPC_ERROR_CODE_KEY;
    message?: string;
  };
  onSuccess?: (output: Output) => Promise<void>;
}) {
  return wrap(async (done) => {
    const caller = createTrpcCaller(userId, userType ?? "Slack");
    let output: Output;
    try {
      output = await caller.account.guest.create(input as Input);
    } catch (e) {
      if (expectedError === undefined) {
        done(e);
        return;
      }
      expectTRPCError(e, done, expectedError.code, expectedError.message);
      return;
    }
    if (expectedError !== undefined) {
      done(
        new Error(
          `想定していたエラー(${expectedError.code}, ${expectedError.message})が発生しませんでした。`
        )
      );
      return;
    }
    if (onSuccess === undefined) {
      done();
      return;
    }
    onSuccess(output)
      .then(() => done())
      .catch(done);
  });
}

describe("trpc.account.guest.create", () => {
  beforeAll(async () => {
    await preparePassport();
    await connectDatabase("trpc-account-guest-create");
  });
  afterEach(async () => {
    await clearDatabase();
  });
  it(
    "ログインしていなければゲストユーザーを作成できない。",
    testGuestCreate({
      input: undefined,
      expectedError: {
        code: "UNAUTHORIZED",
      },
    })
  );
  it(
    "ゲストユーザーはゲストユーザーを作成できない。",
    testGuestCreate({
      userId: myId,
      userType: "Guest",
      input: undefined,
      expectedError: {
        code: "FORBIDDEN",
      },
    })
  );
  it(
    "条件を満たしていればゲストユーザーの作成に成功する。",
    testGuestCreate({
      userId: myId,
      userType: "Slack",
      input: undefined,
      async onSuccess({ guestId, password }) {
        const users = await UserModel.find({ userId: guestId });
        expect(users).toHaveLength(1);
        const hashedPassword = users[0].guest?.hashedPassword ?? "";
        expect(verifyPassword(password, hashedPassword)).resolves.toBe(true);
      },
    })
  );
});
