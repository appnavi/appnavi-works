import { inferProcedureInput, inferProcedureOutput } from "@trpc/server";
import { preparePassport } from "../../../../src/config/passport";
import { TRPCRouter } from "../../../../src/routes/api/trpc";
import { myId, theirId } from "../../../auth";
import {
  clearDatabase,
  connectDatabase,
  INVALID_ID,
  wrap,
} from "../../../common";
import { createTrpcCaller, expectTRPCError } from "../../common";
import { UserModel, WorkModel } from "../../../../src/models/database";
import { TRPC_ERROR_CODE_KEY } from "@trpc/server/dist/rpc";
import { verifyPassword } from "../../../../src/services/auth/password";
import {
  ERROR_MESSAGE_GUEST_DIFFERENT_CREATOR,
  ERROR_MESSAGE_GUEST_ID_INVALID,
  ERROR_MESSAGE_GUEST_ID_REQUIRED,
  ERROR_MESSAGE_GUEST_NOT_FOUND,
  ERROR_MESSAGE_GUEST_WORKS_NOT_EMPTY,
  ERROR_MESSAGE_NOT_GUEST_USER,
} from "../../../../src/utils/constants";

const creatorId = "creator-trpc-account-guest-delete";
const workId = "work-trpc-account-guest-delete";
const guestId = "guest-abcde";

type Input = inferProcedureInput<TRPCRouter["account"]["guest"]["delete"]>;
type Output = inferProcedureOutput<TRPCRouter["account"]["guest"]["delete"]>;

function testGuestDelete({
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
      output = await caller.account.guest.delete(input as Input);
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

describe("trpc.account.guest.delete", () => {
  beforeAll(async () => {
    await preparePassport();
    await connectDatabase("trpc-account-guest-delete");
  });
  afterEach(async () => {
    await clearDatabase();
  });
  it(
    "ログインしていなければゲストユーザーを削除できない。",
    testGuestDelete({
      input: undefined,
      expectedError: {
        code: "UNAUTHORIZED",
      },
    })
  );
  it(
    "ゲストユーザーはゲストユーザーを削除できない。",
    testGuestDelete({
      userId: myId,
      userType: "Guest",
      input: {
        guestId: INVALID_ID,
      },
      expectedError: {
        code: "FORBIDDEN",
      },
    })
  );
  it(
    "IDを指定しないとゲストユーザーを削除できない。",
    testGuestDelete({
      userId: myId,
      userType: "Slack",
      input: {},
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_GUEST_ID_REQUIRED,
      },
    })
  );
  it(
    "指定したIDが不適切だとゲストユーザーを削除できない。",
    testGuestDelete({
      userId: myId,
      userType: "Slack",
      input: {
        guestId: INVALID_ID,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_GUEST_ID_INVALID,
      },
    })
  );
  it(
    "存在しないゲストユーザーを削除できない。",
    testGuestDelete({
      userId: myId,
      userType: "Slack",
      input: {
        guestId,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_GUEST_NOT_FOUND,
      },
    })
  );
  it(
    "Slackユーザーを削除できない。",
    wrap(async (done) => {
      await UserModel.create({
        userId: guestId,
      });
      testGuestDelete({
        userId: myId,
        userType: "Slack",
        input: {
          guestId,
        },
        expectedError: {
          code: "BAD_REQUEST",
          message: ERROR_MESSAGE_NOT_GUEST_USER,
        },
      })(done);
    })
  );
  it(
    "別のユーザーが作成したゲストユーザーを削除できない。",
    wrap(async (done) => {
      await UserModel.create({
        userId: guestId,
        guest: {
          createdBy: theirId,
        },
      });
      testGuestDelete({
        userId: myId,
        userType: "Slack",
        input: {
          guestId,
        },
        expectedError: {
          code: "BAD_REQUEST",
          message: ERROR_MESSAGE_GUEST_DIFFERENT_CREATOR,
        },
      })(done);
    })
  );
  it(
    "作品が存在するゲストユーザーを削除できない。",
    wrap(async (done) => {
      await UserModel.create({
        userId: guestId,
        guest: {
          createdBy: myId,
        },
      });
      await WorkModel.create({
        creatorId,
        workId,
        fileSize: 0,
        owner: guestId,
        uploadedAt: new Date(),
      });
      testGuestDelete({
        userId: myId,
        userType: "Slack",
        input: {
          guestId,
        },
        expectedError: {
          code: "BAD_REQUEST",
          message: ERROR_MESSAGE_GUEST_WORKS_NOT_EMPTY,
        },
      })(done);
    })
  );
  it(
    "作品が存在するゲストユーザーを削除できない。",
    wrap(async (done) => {
      await UserModel.create({
        userId: guestId,
        guest: {
          createdBy: myId,
        },
      });
      testGuestDelete({
        userId: myId,
        userType: "Slack",
        input: {
          guestId,
        },
        async onSuccess() {
          expect(UserModel.find({ userId: guestId })).resolves.toHaveLength(0);
        },
      })(done);
    })
  );
  // it("条件を満たしていればゲストユーザーの削除に成功する。",
  //   testGuestDelete({
  //     userId: myId,
  //     userType: "Slack",
  //     async onSuccess({ guestId, password }) {
  //       const users = await UserModel.find({ userId: guestId });
  //       expect(users).toHaveLength(1);
  //       const hashedPassword = users[0].guest?.hashedPassword ?? "";
  //       expect(verifyPassword(password, hashedPassword)).resolves.toBe(true);
  //     }
  //   })
  // )
});
