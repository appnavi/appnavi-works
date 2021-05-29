import express from "express";
import * as multer from "multer";
jest.mock("multer");
import { Readable } from "stream";
import fsExtra from "fs-extra";
import {
  URL_PREFIX_WORK,
  DIRECTORY_NAME_UPLOADS,
  STATUS_CODE_BAD_REQUEST,
  STATUS_CODE_SUCCESS,
  STATUS_CODE_UNAUTHORIZED,
  ERROR_MESSAGE_CREATOR_ID_REQUIRED as CREATOR_ID_REQUIRED,
  ERROR_MESSAGE_CREATOR_ID_INVALID as CREATOR_ID_INVALID,
  ERROR_MESSAGE_WORK_ID_REQUIRED as WORK_ID_REQUIRED,
  ERROR_MESSAGE_WORK_ID_INVALID as WORK_ID_INVALID,
  ERROR_MESSAGE_DIFFERENT_USER as DIFFERENT_USER,
  ERROR_MESSAGE_STORAGE_FULL as STORAGE_FULL,
  ERROR_MESSAGE_WORK_NOT_FOUND as WORK_NOT_FOUND,
  ERROR_MESSAGE_WORK_DIFFERENT_OWNER as WORK_DIFFERENT_OWNER,
  ERROR_MESSAGE_BACKUP_NAME_REQUIRED as BACKUP_NAME_REQUIRED,
  ERROR_MESSAGE_BACKUP_NAME_INVALID as BACKUP_NAME_INVALID,
  HEADER_CREATOR_ID,
  HEADER_WORK_ID,
  UPLOAD_UNITY_FIELD_WEBGL,
  UPLOAD_UNITY_FIELD_WINDOWS,
  UPLOAD_UNITY_FIELDS,
  DIRECTORY_NAME_BACKUPS,
  ERROR_MESSAGE_RENAME_TO_SAME,
  ERROR_MESSAGE_RENAME_TO_EXISTING,
} from "../src/utils/constants";

type MockFile = {
  fieldname: string;
  foldername: string;
  subfoldername: string;
  filename: string;
  mimetype: string;
  file: Buffer;
};
function mockFileDestination(
  mockFile: MockFile,
  creatorId: string,
  workId: string
): string {
  return path.join(
    DIRECTORY_NAME_UPLOADS,
    creatorId,
    workId,
    mockFile.fieldname
  );
}
function mockFileUploadPath(
  mockFile: MockFile,
  creatorId: string,
  workId: string
): string {
  return path.join(
    mockFileDestination(mockFile, creatorId, workId),
    mockFile.subfoldername,
    mockFile.filename
  );
}
const mockFiles: MockFile[] = [
  {
    fieldname: UPLOAD_UNITY_FIELD_WEBGL,
    foldername: "unity-webgl",
    subfoldername: "",
    filename: "index.html",
    mimetype: "text/html",
    file: fsExtra.readFileSync("test/mock-files/index.html"),
  },
  {
    fieldname: UPLOAD_UNITY_FIELD_WEBGL,
    foldername: "unity-webgl",
    subfoldername: "subfolder",
    filename: "script.js",
    mimetype: "text/javascript",
    file: fsExtra.readFileSync("test/mock-files/script.js"),
  },
  {
    fieldname: UPLOAD_UNITY_FIELD_WINDOWS,
    foldername: "",
    subfoldername: "",
    filename: "unity-zip.zip",
    mimetype: "application/zip",
    file: fsExtra.readFileSync("test/mock-files/unity-zip.zip"),
  },
];
async function uploadMockFile(
  mockFile: MockFile,
  creatorId: string,
  workId: string
): Promise<Express.Multer.File> {
  const uploadPath = mockFileUploadPath(mockFile, creatorId, workId);
  await fsExtra.ensureDir(path.dirname(uploadPath));
  await fsExtra.writeFile(uploadPath, mockFile.file);
  return {
    fieldname: mockFile.fieldname,
    filename: mockFile.filename,
    mimetype: mockFile.mimetype,
    destination: mockFileDestination(mockFile, creatorId, workId),
    originalname: path.join(
      mockFile.foldername,
      mockFile.subfoldername,
      mockFile.filename
    ),
    encoding: "7bit",
    path: uploadPath,
    buffer: Buffer.from([]),
    stream: Readable.from([]),
    size: mockFile.file.length,
  };
}
async function uploadAllMockFiles(
  creatorId: string,
  workId: string
): Promise<{
  [fieldname: string]: Express.Multer.File[];
}> {
  return {
    [UPLOAD_UNITY_FIELD_WEBGL]: await Promise.all(
      mockFiles
        .filter((it) => it.fieldname === UPLOAD_UNITY_FIELD_WEBGL)
        .map((it) => uploadMockFile(it, creatorId, workId))
    ),
    [UPLOAD_UNITY_FIELD_WINDOWS]: await Promise.all(
      mockFiles
        .filter((it) => it.fieldname === UPLOAD_UNITY_FIELD_WINDOWS)
        .map((it) => uploadMockFile(it, creatorId, workId))
    ),
  };
}

// @ts-ignore
multer.mockImplementation((options) => {
  const actual = jest.requireActual("multer")(options);
  actual.fields = function fields(_fields: string) {
    return (
      req: express.Request,
      _res: express.Response,
      next: express.NextFunction
    ) => {
      uploadAllMockFiles(creatorId, workId).then((files) => {
        req.files = files;
        next();
      });
    };
  };
  return actual;
});

import request from "supertest";
import { app } from "../src/app";

import { getEnvNumber } from "../src/utils/helpers";
import { login, logout, myId, theirId } from "./auth";
import {
  clearData,
  connectDatabase,
  ensureUploadFoldersExist,
  INVALID_ID,
} from "./common";
import path from "path";
import { WorkModel } from "../src/models/database";
import { calculateCurrentStorageSizeBytes } from "../src/services/works";

const creatorId = "creator-2";
const workId = "work-2";

async function expectUploadedFilesExists(): Promise<void> {
  mockFiles.forEach(async (mockFile) => {
    const exists = await fsExtra.pathExists(
      mockFileUploadPath(mockFile, creatorId, workId)
    );
    expect(exists).toBe(true);
  });
}
async function expectUploadSucceeded(res: request.Response): Promise<void> {
  expect(res.status).toBe(STATUS_CODE_SUCCESS);
  expect(res.text).toBe(
    JSON.stringify({
      paths: UPLOAD_UNITY_FIELDS.map((field) =>
        path.join(URL_PREFIX_WORK, creatorId, workId, field.name)
      ),
    })
  );
  await expectUploadedFilesExists();
}
async function expectBackupFilesExists(backupName: string): Promise<void> {
  mockFiles.forEach(async (mockFile) => {
    const exists = await fsExtra.pathExists(
      path.join(
        DIRECTORY_NAME_BACKUPS,
        DIRECTORY_NAME_UPLOADS,
        creatorId,
        workId,
        backupName,
        mockFile.fieldname,
        mockFile.subfoldername,
        mockFile.filename
      )
    );
    expect(exists).toBe(true);
  });
}
async function expectStorageSizeSameToActualSize(
  backupCount: number
): Promise<void> {
  const size = await calculateCurrentStorageSizeBytes();
  const mockFileSize = mockFiles.reduce(
    (accumlator, current) => accumlator + current.file.length,
    0
  );
  expect(size).toBe(mockFileSize * (backupCount + 1));
}

async function testSuccessfulUpload(): Promise<void> {
  return new Promise((resolve) => {
    request(app)
      .post("/upload/unity")
      .set(HEADER_CREATOR_ID, creatorId)
      .set(HEADER_WORK_ID, workId)
      .end((err, res) => {
        expect(err).toBeNull();
        expectUploadSucceeded(res).then(resolve);
      });
  });
}
async function testSuccessfulUploadTwice(): Promise<void> {
  return new Promise<void>((resolve) => {
    testSuccessfulUpload()
      .then(() => expectStorageSizeSameToActualSize(0))
      .then(testSuccessfulUpload)
      .then(() => expectStorageSizeSameToActualSize(1))
      .then(() => expectBackupFilesExists("1"))
      .then(resolve);
  });
}
describe("Unity作品関連(非ログイン時)", () => {
  beforeAll(async () => {
    await connectDatabase("2");
    await ensureUploadFoldersExist();
  });
  it("非ログイン時にはアップロードができない", (done) => {
    request(app).post("/upload/unity").expect(STATUS_CODE_UNAUTHORIZED, done);
  });
  it("非ログイン時にはリネームできない", (done) => {
    request(app)
      .post("/account/work/rename")
      .expect(STATUS_CODE_UNAUTHORIZED, done);
  });
});
describe("Unity作品のアップロード（ファイルあり）", () => {
  beforeAll(async () => {
    await connectDatabase("2");
    await ensureUploadFoldersExist();
    login(app, myId);
  });
  afterEach(async () => {
    await clearData(creatorId, workId);
  });
  afterAll(() => logout(app));
  it("作者IDが設定されていないとアップロードできない", (done) => {
    request(app)
      .post("/upload/unity")
      .set(HEADER_WORK_ID, workId)
      .expect(STATUS_CODE_BAD_REQUEST)
      .expect(JSON.stringify({ errors: [CREATOR_ID_REQUIRED] }))
      .end(done);
  });
  it("作者IDが不適切だとアップロードできない", (done) => {
    request(app)
      .post("/upload/unity")
      .set(HEADER_CREATOR_ID, encodeURI(INVALID_ID))
      .set(HEADER_WORK_ID, workId)
      .expect(STATUS_CODE_BAD_REQUEST)
      .expect(JSON.stringify({ errors: [CREATOR_ID_INVALID] }))
      .end(done);
  });
  it("作品IDが設定されていないとアップロードできない", (done) => {
    request(app)
      .post("/upload/unity")
      .set(HEADER_CREATOR_ID, creatorId)
      .expect(STATUS_CODE_BAD_REQUEST)
      .expect(JSON.stringify({ errors: [WORK_ID_REQUIRED] }))
      .end(done);
  });
  it("作品IDが不適切だとアップロードできない", (done) => {
    request(app)
      .post("/upload/unity")
      .set(HEADER_CREATOR_ID, creatorId)
      .set(HEADER_WORK_ID, encodeURI(INVALID_ID))
      .expect(STATUS_CODE_BAD_REQUEST)
      .expect(JSON.stringify({ errors: [WORK_ID_INVALID] }))
      .end(done);
  });
  it("別人の投稿した作品は上書きアップロードできない", (done) => {
    WorkModel.create({
      creatorId: creatorId,
      workId: workId,
      owner: theirId,
      fileSize: 100,
    }).then(() => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, creatorId)
        .set(HEADER_WORK_ID, workId)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [DIFFERENT_USER] }))
        .end(done);
    });
  });
  it("ストレージ容量の上限を上回っている場合はアップロードできない", (done) => {
    WorkModel.create({
      creatorId: "large-work-creator",
      workId: "large-work",
      owner: theirId,
      fileSize: getEnvNumber("WORK_STORAGE_SIZE_BYTES"),
    }).then(() => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, creatorId)
        .set(HEADER_WORK_ID, workId)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [STORAGE_FULL] }))
        .end(done);
    });
  });
  it("条件を満たしていればアップロードできる", (done) => {
    testSuccessfulUpload()
      .then(() => expectStorageSizeSameToActualSize(0))
      .then(done);
  });
  it("条件を満たしたアップロードを2回すると、2回ともアップロードにも成功しバックアップが作成される。", (done) => {
    testSuccessfulUploadTwice().then(done);
  });
});
describe("Unity作品のリネーム", () => {
  beforeAll(async () => {
    await connectDatabase("2");
    await ensureUploadFoldersExist();
    login(app, myId);
  });
  afterEach(async () => {
    await clearData(creatorId, workId);
  });
  afterAll(() => logout(app));
  it("作者IDが設定されていないとリネームできない", (done) => {
    request(app)
      .post("/account/work/rename")
      .type("form")
      .field("workId", workId)
      .field("renamedCreatorId", creatorId + "-2")
      .field("renamedWorkId", workId + "-2")
      .expect(STATUS_CODE_BAD_REQUEST)
      .expect(JSON.stringify({ errors: [CREATOR_ID_REQUIRED] }))
      .end(done);
  });
  it("作者IDが不適切だとリネームできない", (done) => {
    request(app)
      .post("/account/work/rename")
      .type("form")
      .field("creatorId", INVALID_ID)
      .field("workId", workId)
      .field("renamedCreatorId", creatorId + "-2")
      .field("renamedWorkId", workId + "-2")
      .expect(STATUS_CODE_BAD_REQUEST)
      .expect(JSON.stringify({ errors: [CREATOR_ID_INVALID] }))
      .end(done);
  });
  it("作品IDが設定されていないとリネームできない", (done) => {
    request(app)
      .post("/account/work/rename")
      .type("form")
      .field("creatorId", creatorId)
      .field("renamedCreatorId", creatorId + "-2")
      .field("renamedWorkId", workId + "-2")
      .expect(STATUS_CODE_BAD_REQUEST)
      .expect(JSON.stringify({ errors: [WORK_ID_REQUIRED] }))
      .end(done);
  });
  it("作品IDが不適切だとリネームできない", (done) => {
    request(app)
      .post("/account/work/rename")
      .type("form")
      .field("creatorId", creatorId)
      .field("workId", INVALID_ID)
      .field("renamedCreatorId", creatorId + "-2")
      .field("renamedWorkId", workId + "-2")
      .expect(STATUS_CODE_BAD_REQUEST)
      .expect(JSON.stringify({ errors: [WORK_ID_INVALID] }))
      .end(done);
  });
  it("リネーム後の作者IDが設定されていないとリネームできない", (done) => {
    request(app)
      .post("/account/work/rename")
      .type("form")
      .field("creatorId", creatorId)
      .field("workId", workId)
      .field("renamedWorkId", workId + "-2")
      .expect(STATUS_CODE_BAD_REQUEST)
      .expect(JSON.stringify({ errors: [CREATOR_ID_REQUIRED] }))
      .end(done);
  });
  it("リネーム後の作者IDが不適切だとリネームできない", (done) => {
    request(app)
      .post("/account/work/rename")
      .type("form")
      .field("creatorId", creatorId + "-2")
      .field("workId", workId)
      .field("renamedCreatorId", INVALID_ID)
      .field("renamedWorkId", workId + "-2")
      .expect(STATUS_CODE_BAD_REQUEST)
      .expect(JSON.stringify({ errors: [CREATOR_ID_INVALID] }))
      .end(done);
  });
  it("リネーム後の作品IDが設定されていないとリネームできない", (done) => {
    request(app)
      .post("/account/work/rename")
      .type("form")
      .field("creatorId", creatorId)
      .field("workId", workId)
      .field("renamedCreatorId", creatorId + "-2")
      .expect(STATUS_CODE_BAD_REQUEST)
      .expect(JSON.stringify({ errors: [WORK_ID_REQUIRED] }))
      .end(done);
  });
  it("リネーム後の作品IDが不適切だとリネームできない", (done) => {
    request(app)
      .post("/account/work/rename")
      .type("form")
      .field("creatorId", creatorId)
      .field("workId", workId + "-2")
      .field("renamedCreatorId", creatorId + "-2")
      .field("renamedWorkId", INVALID_ID)
      .expect(STATUS_CODE_BAD_REQUEST)
      .expect(JSON.stringify({ errors: [WORK_ID_INVALID] }))
      .end(done);
  });
  it("リネーム前とリネーム後が同じだとはリネームできない", (done) => {
    request(app)
      .post("/account/work/rename")
      .type("form")
      .field("creatorId", creatorId)
      .field("workId", workId)
      .field("renamedCreatorId", creatorId)
      .field("renamedWorkId", workId)
      .expect(STATUS_CODE_BAD_REQUEST)
      .expect(JSON.stringify({ errors: [ERROR_MESSAGE_RENAME_TO_SAME] }))
      .end(done);
  });
  it("存在しない作品はリネームできない", (done) => {
    request(app)
      .post("/account/work/rename")
      .type("form")
      .field("creatorId", creatorId)
      .field("workId", workId)
      .field("renamedCreatorId", creatorId + "-2")
      .field("renamedWorkId", workId + "-2")
      .expect(STATUS_CODE_BAD_REQUEST)
      .expect(JSON.stringify({ errors: [WORK_NOT_FOUND] }))
      .end(done);
  });
  it("別人の投稿した作品はリネームできない", (done) => {
    testSuccessfulUpload()
      .then(() => expectStorageSizeSameToActualSize(0))
      .then(async () => {
        const works = await WorkModel.find({
          creatorId: creatorId,
          workId: workId,
        });
        expect(works.length).toBe(1);
        const work = works[0];
        work.owner = theirId;
        work.save();
      })
      .then(() => {
        request(app)
          .post("/account/work/rename")
          .type("form")
          .field("creatorId", creatorId)
          .field("workId", workId)
          .field("renamedCreatorId", creatorId + "-2")
          .field("renamedWorkId", workId + "-2")
          .expect(STATUS_CODE_BAD_REQUEST)
          .expect(JSON.stringify({ errors: [WORK_DIFFERENT_OWNER] }))
          .end(done);
      });
  });
  it("既に存在する作品を上書きするようなリネームはできない", (done) => {
    testSuccessfulUpload()
      .then(() => expectStorageSizeSameToActualSize(0))
      .then(() =>
        WorkModel.create({
          creatorId: creatorId + "2",
          workId: workId + "2",
          owner: theirId,
          fileSize: 100,
        })
      )
      .then(() => {
        request(app)
          .post("/account/work/rename")
          .type("form")
          .field("creatorId", creatorId)
          .field("workId", workId)
          .field("renamedCreatorId", creatorId + "2")
          .field("renamedWorkId", workId + "2")
          .expect(STATUS_CODE_BAD_REQUEST)
          .expect(
            JSON.stringify({ errors: [ERROR_MESSAGE_RENAME_TO_EXISTING] })
          )
          .end(done);
      });
  });
  it("条件を満たしていれば作者IDのリネームに成功する", (done) => {
    testSuccessfulUpload()
      .then(() => expectStorageSizeSameToActualSize(0))
      .then(() => {
        request(app)
          .post("/account/work/rename")
          .type("form")
          .field("creatorId", creatorId)
          .field("workId", workId)
          .field("renamedCreatorId", creatorId + "-2")
          .field("renamedWorkId", workId)
          .expect(STATUS_CODE_SUCCESS)
          .end(done);
      });
  });
  it("条件を満たしていれば作品IDのリネームに成功する", (done) => {
    testSuccessfulUpload()
      .then(() => expectStorageSizeSameToActualSize(0))
      .then(() => {
        request(app)
          .post("/account/work/rename")
          .type("form")
          .field("creatorId", creatorId)
          .field("workId", workId)
          .field("renamedCreatorId", creatorId)
          .field("renamedWorkId", workId + "-2")
          .expect(STATUS_CODE_SUCCESS)
          .end(done);
      });
  });
  it("条件を満たしていれば作者IDと作品ID両方のリネームに成功する", (done) => {
    testSuccessfulUpload()
      .then(() => expectStorageSizeSameToActualSize(0))
      .then(() => {
        request(app)
          .post("/account/work/rename")
          .type("form")
          .field("creatorId", creatorId)
          .field("workId", workId)
          .field("renamedCreatorId", creatorId + "-2")
          .field("renamedWorkId", workId + "-2")
          .expect(STATUS_CODE_SUCCESS)
          .end(done);
      });
  });
});
describe("Unity作品のバックアップ", () => {
  beforeAll(async () => {
    await connectDatabase("2");
    await ensureUploadFoldersExist();
    login(app, myId);
  });
  afterEach(async () => {
    await clearData(creatorId, workId);
  });
  describe("バックアップ復元", () => {
    it("作者IDが設定されていないとバックアップを復元できない", (done) => {
      request(app)
        .post("/account/backup/restore")
        .type("form")
        .field("workId", workId)
        .field("backupName", "1")
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [CREATOR_ID_REQUIRED] }))
        .end(done);
    });
    it("作者IDが不適切だとバックアップを復元できない", (done) => {
      request(app)
        .post("/account/backup/restore")
        .type("form")
        .field("creatorId", INVALID_ID)
        .field("workId", workId)
        .field("backupName", "1")
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [CREATOR_ID_INVALID] }))
        .end(done);
    });
    it("作品IDが設定されていないとバックアップを復元できない", (done) => {
      request(app)
        .post("/account/backup/restore")
        .type("form")
        .field("creatorId", creatorId)
        .field("backupName", "1")
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [WORK_ID_REQUIRED] }))
        .end(done);
    });
    it("作品IDが不適切だとバックアップを復元できない", (done) => {
      request(app)
        .post("/account/backup/restore")
        .type("form")
        .field("creatorId", creatorId)
        .field("workId", INVALID_ID)
        .field("backupName", "1")
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [WORK_ID_INVALID] }))
        .end(done);
    });
    it("バックアップ名が設定されていないとバックアップを復元できない", (done) => {
      request(app)
        .post("/account/backup/restore")
        .type("form")
        .field("creatorId", creatorId)
        .field("workId", workId)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [BACKUP_NAME_REQUIRED] }))
        .end(done);
    });
    it("バックアップ名が不適切だとバックアップを復元できない", (done) => {
      request(app)
        .post("/account/backup/restore")
        .type("form")
        .field("creatorId", creatorId)
        .field("workId", workId)
        .field("backupName", INVALID_ID)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [BACKUP_NAME_INVALID] }))
        .end(done);
    });
    it("条件を満たしているとバックアップを復元できる", (done) => {
      testSuccessfulUploadTwice()
        .then(
          () =>
            new Promise<void>((resolve) => {
              request(app)
                .post("/account/backup/restore")
                .type("form")
                .field("creatorId", creatorId)
                .field("workId", workId)
                .field("backupName", "1")
                .expect(STATUS_CODE_SUCCESS)
                .end((err) => {
                  expect(err).toBeNull();
                  resolve();
                });
            })
        )
        .then(() => expectStorageSizeSameToActualSize(1))
        .then(expectUploadedFilesExists)
        .then(() => expectBackupFilesExists("2"))
        .then(done);
    });
  });
  describe("バックアップ削除", () => {
    it("作者IDが設定されていないとバックアップを削除できない", (done) => {
      request(app)
        .post("/account/backup/delete")
        .type("form")
        .field("workId", workId)
        .field("backupName", "1")
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [CREATOR_ID_REQUIRED] }))
        .end(done);
    });
    it("作者IDが不適切だとバックアップを削除できない", (done) => {
      request(app)
        .post("/account/backup/delete")
        .type("form")
        .field("creatorId", INVALID_ID)
        .field("workId", workId)
        .field("backupName", "1")
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [CREATOR_ID_INVALID] }))
        .end(done);
    });
    it("作品IDが設定されていないとバックアップを削除できない", (done) => {
      request(app)
        .post("/account/backup/delete")
        .type("form")
        .field("creatorId", creatorId)
        .field("backupName", "1")
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [WORK_ID_REQUIRED] }))
        .end(done);
    });
    it("作品IDが不適切だとバックアップを削除できない", (done) => {
      request(app)
        .post("/account/backup/delete")
        .type("form")
        .field("creatorId", creatorId)
        .field("workId", INVALID_ID)
        .field("backupName", "1")
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [WORK_ID_INVALID] }))
        .end(done);
    });
    it("バックアップ名が設定されていないとバックアップを削除できない", (done) => {
      request(app)
        .post("/account/backup/delete")
        .type("form")
        .field("creatorId", creatorId)
        .field("workId", workId)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [BACKUP_NAME_REQUIRED] }))
        .end(done);
    });
    it("バックアップ名が不適切だとバックアップを削除できない", (done) => {
      request(app)
        .post("/account/backup/delete")
        .type("form")
        .field("creatorId", creatorId)
        .field("workId", workId)
        .field("backupName", INVALID_ID)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [BACKUP_NAME_INVALID] }))
        .end(done);
    });
    it("条件を満たしているとバックアップを削除できる", (done) => {
      testSuccessfulUploadTwice()
        .then(
          () =>
            new Promise<void>((resolve) => {
              request(app)
                .post("/account/backup/delete")
                .type("form")
                .field("creatorId", creatorId)
                .field("workId", workId)
                .field("backupName", "1")
                .expect(STATUS_CODE_SUCCESS)
                .end((err) => {
                  expect(err).toBeNull();
                  resolve();
                });
            })
        )
        .then(() => expectStorageSizeSameToActualSize(0))
        .then(expectUploadedFilesExists)
        .then(async () => {
          mockFiles.forEach(async (mockFile) => {
            const exists = await fsExtra.pathExists(
              path.join(
                DIRECTORY_NAME_BACKUPS,
                DIRECTORY_NAME_UPLOADS,
                creatorId,
                workId,
                "1",
                mockFile.fieldname,
                mockFile.subfoldername,
                mockFile.filename
              )
            );
            expect(exists).toBe(false);
          });
        })
        .then(done);
    });
  });
});
