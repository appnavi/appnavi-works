import path from "path";
import fsExtra from "fs-extra";
import request, { Test } from "supertest";
import { createLogin, myId, theirId } from "./auth";
import {
  clearData,
  clearDatabase,
  connectDatabase,
  ensureUploadFoldersEmpty,
  INVALID_ID,
  mockFileDestinations,
  wrap,
} from "./common";
import { app } from "../src/app";
import { preparePassport } from "../src/config/passport";
import { UserDocument, UserModel, WorkModel } from "../src/models/database";
import {
  calculateCurrentStorageSizeBytes,
  getAbsolutePathOfBackup,
  getAbsolutePathOfWork,
} from "../src/services/works";
import {
  URL_PREFIX_WORK,
  HEADER_CREATOR_ID,
  HEADER_WORK_ID,
} from "../src/common/constants";
import {
  STATUS_CODE_BAD_REQUEST,
  STATUS_CODE_SUCCESS,
  STATUS_CODE_UNAUTHORIZED,
  ERROR_MESSAGE_CREATOR_ID_REQUIRED as CREATOR_ID_REQUIRED,
  ERROR_MESSAGE_CREATOR_ID_INVALID as CREATOR_ID_INVALID,
  ERROR_MESSAGE_CREATOR_ID_USED_BY_OTHER_USER as CREATOR_ID_OTHER_USER,
  ERROR_MESSAGE_WORK_ID_REQUIRED as WORK_ID_REQUIRED,
  ERROR_MESSAGE_WORK_ID_INVALID as WORK_ID_INVALID,
  ERROR_MESSAGE_STORAGE_FULL as STORAGE_FULL,
  ERROR_MESSAGE_WORK_NOT_FOUND as WORK_NOT_FOUND,
  ERROR_MESSAGE_WORK_DIFFERENT_OWNER as WORK_DIFFERENT_OWNER,
  ERROR_MESSAGE_BACKUP_NAME_REQUIRED as BACKUP_NAME_REQUIRED,
  ERROR_MESSAGE_BACKUP_NAME_INVALID as BACKUP_NAME_INVALID,
  UPLOAD_UNITY_FIELD_WINDOWS,
  ERROR_MESSAGE_RENAME_TO_SAME,
  ERROR_MESSAGE_RENAME_TO_EXISTING,
} from "../src/utils/constants";
import { env } from "../src/utils/env";
import { Express } from "express";

const creatorId = "creator-2";
const workId = "work-2";
type UploadFileInfo = {
  fieldname: string;
  foldername: string;
  subfoldername: string;
  filename: string;
};
type UploadFile = UploadFileInfo & {
  sourcePath: string;
  file: Buffer;
};
const uploadFileInfos: UploadFileInfo[] = [
  {
    fieldname: UPLOAD_UNITY_FIELD_WINDOWS,
    foldername: "",
    subfoldername: "",
    filename: "unity-zip.zip",
  },
];
const uploadFiles: UploadFile[] = uploadFileInfos.map((info) => {
  const sourcePath = path.join(
    __dirname,
    "work-files",
    info.foldername,
    info.subfoldername,
    info.filename
  );
  return {
    ...info,
    sourcePath,
    file: fsExtra.readFileSync(sourcePath),
  };
});

async function getMyUserDocument(): Promise<UserDocument> {
  const user = await UserModel.findOne({ userId: myId });
  if (user === null) {
    throw new Error("ユーザー情報が存在しません。");
  }
  return user;
}

async function expectUploadedFilesExists(
  expectExistsToBe: boolean = true
): Promise<void> {
  uploadFiles.forEach(async (uploadFile) => {
    const exists = await fsExtra.pathExists(
      path.join(
        getAbsolutePathOfWork(creatorId, workId),
        uploadFile.fieldname,
        uploadFile.foldername,
        uploadFile.subfoldername,
        uploadFile.filename
      )
    );
    expect(exists).toBe(expectExistsToBe);
  });
}
async function expectUploadSucceeded(res: request.Response): Promise<void> {
  const fields = Array.from(new Set(uploadFiles.map((f) => f.fieldname)));
  expect(res.status).toBe(STATUS_CODE_SUCCESS);
  expect(res.text).toBe(
    JSON.stringify({
      paths: fields.map((field) =>
        path.join(URL_PREFIX_WORK, creatorId, workId, field)
      ),
    })
  );
  await expectUploadedFilesExists();
}
async function expectBackupFilesExists(
  backupName: string,
  exists: boolean = true
): Promise<void> {
  uploadFiles.forEach(async (uploadFile) => {
    const actualExists = await fsExtra.pathExists(
      path.join(
        getAbsolutePathOfBackup(creatorId, workId, backupName),
        uploadFile.fieldname,
        uploadFile.subfoldername,
        uploadFile.filename
      )
    );
    expect(actualExists).toBe(exists);
  });
}
async function expectStorageSizeSameToActualSize(
  backupCount: number
): Promise<void> {
  const size = await calculateCurrentStorageSizeBytes();
  const mockFileSize = uploadFiles.reduce(
    (accumlator, current) => accumlator + current.file.length,
    0
  );
  expect(size).toBe(mockFileSize * (backupCount + 1));
}

function attachUploadFiles(req: Test) {
  uploadFiles.forEach((f) => {
    req.attach(f.fieldname, f.sourcePath);
  });
}

async function testSuccessfulUpload(): Promise<void> {
  return new Promise((resolve) => {
    createLogin(myId).then(({ login }) => {
      const req = login(request(app).post("/api/upload/unity"))
        .set(HEADER_CREATOR_ID, creatorId)
        .set(HEADER_WORK_ID, workId);
      attachUploadFiles(req);
      req.end((err, res) => {
        expect(err).toBeNull();
        expectUploadSucceeded(res).then(resolve);
      });
    });
  });
}
async function testSuccessfulUploadTwice(): Promise<void> {
  return new Promise<void>((resolve) => {
    testSuccessfulUpload()
      .then(() => expectStorageSizeSameToActualSize(0))
      .then(() => testSuccessfulUpload())
      .then(() => expectStorageSizeSameToActualSize(1))
      .then(() => expectBackupFilesExists("1"))
      .then(resolve);
  });
}
mockFileDestinations("workUpload");
describe("作品のアップロードを伴うテスト", () => {
  beforeAll(async () => {
    await preparePassport();
    await connectDatabase("workUpload");
    await ensureUploadFoldersEmpty();
  });
  afterEach(async () => {
    await ensureUploadFoldersEmpty();
    await clearDatabase();
  });
  describe("非ログイン時", () => {
    it("非ログイン時にはアップロードができない", (done) => {
      request(app)
        .post("/api/upload/unity")
        .expect(STATUS_CODE_UNAUTHORIZED, done);
    });
  });
  describe("ログイン時", () => {
    describe.only("Unity作品のアップロード（ファイルあり）", () => {
      it(
        "作者IDが設定されていないとアップロードできない",
        wrap(async (done) => {
          const { login } = await createLogin(myId);
          login(request(app).post("/api/upload/unity"))
            .set(HEADER_WORK_ID, workId)
            .expect(STATUS_CODE_BAD_REQUEST)
            .expect(JSON.stringify({ errors: [CREATOR_ID_REQUIRED] }))
            .end(done);
        })
      );
      it(
        "作者IDが不適切だとアップロードできない",
        wrap(async (done) => {
          const { login } = await createLogin(myId);
          login(request(app).post("/api/upload/unity"))
            .set(HEADER_CREATOR_ID, encodeURI(INVALID_ID))
            .set(HEADER_WORK_ID, workId)
            .expect(STATUS_CODE_BAD_REQUEST)
            .expect(JSON.stringify({ errors: [CREATOR_ID_INVALID] }))
            .end(done);
        })
      );
      it(
        "別人が保有している作者IDを使ってアップロードできない",
        wrap(async (done) => {
          await testSuccessfulUpload();
          const { login } = await createLogin(theirId);
          login(request(app).post("/api/upload/unity"))
            .set(HEADER_CREATOR_ID, creatorId)
            .set(HEADER_WORK_ID, "their-work")
            .expect(STATUS_CODE_BAD_REQUEST)
            .expect(JSON.stringify({ errors: [CREATOR_ID_OTHER_USER] }))
            .end(async () => {
              const works = await WorkModel.find({});
              expect(works.length).toBe(1);
              done();
            });
        })
      );
      it(
        "その作者IDの作品がなかったとしても、別人が保有している作者IDを使ってアップロードできない",
        wrap(async (done) => {
          await UserModel.create({
            userId: theirId,
            creatorIds: [creatorId],
          });
          const { login } = await createLogin(myId);
          login(request(app).post("/api/upload/unity"))
            .set(HEADER_CREATOR_ID, creatorId)
            .set(HEADER_WORK_ID, workId)
            .expect(STATUS_CODE_BAD_REQUEST)
            .expect(JSON.stringify({ errors: [CREATOR_ID_OTHER_USER] }))
            .end(async () => {
              const works = await WorkModel.find({});
              expect(works.length).toBe(0);
              done();
            });
        })
      );
      it(
        "作品IDが設定されていないとアップロードできない",
        wrap(async (done) => {
          const { login } = await createLogin(myId);
          login(request(app).post("/api/upload/unity"))
            .set(HEADER_CREATOR_ID, creatorId)
            .expect(STATUS_CODE_BAD_REQUEST)
            .expect(JSON.stringify({ errors: [WORK_ID_REQUIRED] }))
            .end(done);
        })
      );
      it(
        "作品IDが不適切だとアップロードできない",
        wrap(async (done) => {
          const { login } = await createLogin(myId);
          login(request(app).post("/api/upload/unity"))
            .set(HEADER_CREATOR_ID, creatorId)
            .set(HEADER_WORK_ID, encodeURI(INVALID_ID))
            .expect(STATUS_CODE_BAD_REQUEST)
            .expect(JSON.stringify({ errors: [WORK_ID_INVALID] }))
            .end(done);
        })
      );
      it(
        "ストレージ容量の上限を上回っている場合はアップロードできない",
        wrap(async (done) => {
          await WorkModel.create({
            creatorId: "large-work-creator",
            workId: "large-work",
            owner: theirId,
            fileSize: env.WORK_STORAGE_SIZE_BYTES,
          });
          const { login } = await createLogin(myId);
          login(request(app).post("/api/upload/unity"))
            .set(HEADER_CREATOR_ID, creatorId)
            .set(HEADER_WORK_ID, workId)
            .expect(STATUS_CODE_BAD_REQUEST)
            .expect(JSON.stringify({ errors: [STORAGE_FULL] }))
            .end(done);
        })
      );
      it(
        "条件を満たしていればアップロードできる",
        wrap(async (done) => {
          await testSuccessfulUpload();
          await expectStorageSizeSameToActualSize(0);
          done();
        })
      );
      it(
        "条件を満たしたアップロードを2回すると、2回ともアップロードにも成功しバックアップが作成される。",
        wrap(async (done) => {
          await testSuccessfulUploadTwice();
          done();
        })
      );
    });
    describe("使用していない作者IDの削除", () => {
      it(
        "一つも作品を投稿していない状態では、何も起こらない",
        wrap(async (done) => {
          const { login } = await createLogin(myId);
          login(request(app).post("/api/account/cleanup-creator-ids"))
            .expect(STATUS_CODE_SUCCESS)
            .end(async (err) => {
              expect(err).toBeNull();
              const user = await getMyUserDocument();
              expect(user.creatorIds.length).toBe(0);
              done();
            });
        })
      );
      it(
        "使用中の作者IDは削除されない",
        wrap(async (done) => {
          await testSuccessfulUploadTwice();
          const { login } = await createLogin(myId);
          login(request(app).post("/api/account/cleanup-creator-ids"))
            .expect(STATUS_CODE_SUCCESS)
            .end(async (err) => {
              expect(err).toBeNull();
              const user = await getMyUserDocument();
              expect(user.creatorIds.length).toBe(1);
              done();
            });
        })
      );
      it(
        "使用されていない作者IDが削除される",
        wrap(async (done) => {
          await UserModel.create({
            userId: myId,
            creatorIds: [creatorId],
          });
          const { login } = await createLogin(myId);
          login(request(app).post("/api/account/cleanup-creator-ids"))
            .expect(STATUS_CODE_SUCCESS)
            .end(async (err) => {
              expect(err).toBeNull();
              const user = await getMyUserDocument();
              expect(user.creatorIds.length).toBe(0);
              done();
            });
        })
      );
      it(
        "使用されていない作者IDが複数ある場合、全て削除される",
        wrap(async (done) => {
          await UserModel.create({
            userId: myId,
            creatorIds: [
              `${creatorId}-1`,
              `${creatorId}-2`,
              `${creatorId}-3`,
              `${creatorId}-4`,
              `${creatorId}-5`,
            ],
          });
          const { login } = await createLogin(myId);
          login(request(app).post("/api/account/cleanup-creator-ids"))
            .expect(STATUS_CODE_SUCCESS)
            .end(async (err) => {
              expect(err).toBeNull();
              const user = await getMyUserDocument();
              expect(user.creatorIds.length).toBe(0);
              done();
            });
        })
      );
    });
  });
});
