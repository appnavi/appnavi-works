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
import { clearData, connectDatabase, ensureUploadFoldersExist } from "./common";
import path from "path";
import { WorkModel } from "../src/models/database";
import { calculateCurrentStorageSizeBytes } from "../src/services/works";

const creatorId = "creator-2";
const workId = "work-2";

async function hasUploadSucceeded(res: request.Response): Promise<void> {
  expect(res.status).toBe(STATUS_CODE_SUCCESS);
  expect(res.text).toBe(
    JSON.stringify({
      paths: UPLOAD_UNITY_FIELDS.map((field) =>
        path.join(URL_PREFIX_WORK, creatorId, workId, field.name)
      ),
    })
  );
  await Promise.all(
    mockFiles.map((mockFile) =>
      fsExtra
        .pathExists(mockFileUploadPath(mockFile, creatorId, workId))
        .then((exists) => expect(exists).toBe(true))
    )
  );
}

async function testSuccessfulUpload(): Promise<void> {
  return new Promise((resolve) => {
    request(app)
      .post("/upload/unity")
      .set(HEADER_CREATOR_ID, creatorId)
      .set(HEADER_WORK_ID, workId)
      .end((err, res) => {
        expect(err).toBeNull();
        hasUploadSucceeded(res).then(resolve);
      });
  });
}

describe("Unity作品のアップロード（ファイルあり）", () => {
  beforeAll(async () => {
    await connectDatabase("2");
    await ensureUploadFoldersExist();
  });
  afterEach(async () => {
    await clearData(creatorId, workId);
  });
  it("非ログイン時にはアップロードができない", (done) => {
    request(app).post("/upload/unity").expect(STATUS_CODE_UNAUTHORIZED, done);
  });
  describe("ログイン時", () => {
    beforeAll(() => login(app, myId));
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
        .set(HEADER_CREATOR_ID, encodeURI("テスト"))
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
        .set(HEADER_WORK_ID, encodeURI("テスト"))
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
        .then(async () => {
          const size = await calculateCurrentStorageSizeBytes();
          const actualSize = mockFiles.reduce(
            (accumlator, current) => accumlator + current.file.length,
            0
          );
          expect(size).toBe(actualSize);
        })
        .then(done);
    });
    it("条件を満たしたアップロードを2回すると、2回ともアップロードにも成功しバックアップが作成される。", (done) => {
      testSuccessfulUpload()
        .then(async () => {
          const size = await calculateCurrentStorageSizeBytes();
          const actualSize = mockFiles.reduce(
            (accumlator, current) => accumlator + current.file.length,
            0
          );
          expect(size).toBe(actualSize);
        })
        .then(testSuccessfulUpload)
        .then(async () => {
          const size = await calculateCurrentStorageSizeBytes();
          const actualSize = mockFiles.reduce(
            (accumlator, current) => accumlator + current.file.length,
            0
          );
          expect(size).toBe(actualSize * 2);
        })
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
            expect(exists).toBe(true);
          });
        })
        .then(done);
    });
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
    testSuccessfulUpload()
      .then(async () => {
        const size = await calculateCurrentStorageSizeBytes();
        const actualSize = mockFiles.reduce(
          (accumlator, current) => accumlator + current.file.length,
          0
        );
        expect(size).toBe(actualSize);
      })
      .then(() => {
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
  });
  it("作者IDが不適切だとリネームできない", (done) => {
    testSuccessfulUpload()
      .then(async () => {
        const size = await calculateCurrentStorageSizeBytes();
        const actualSize = mockFiles.reduce(
          (accumlator, current) => accumlator + current.file.length,
          0
        );
        expect(size).toBe(actualSize);
      })
      .then(() => {
        request(app)
          .post("/account/work/rename")
          .type("form")
          .field("creatorId", "テスト")
          .field("workId", workId)
          .field("renamedCreatorId", creatorId + "-2")
          .field("renamedWorkId", workId + "-2")
          .expect(STATUS_CODE_BAD_REQUEST)
          .expect(JSON.stringify({ errors: [CREATOR_ID_INVALID] }))
          .end(done);
      });
  });
  it("作品IDが設定されていないとリネームできない", (done) => {
    testSuccessfulUpload()
      .then(async () => {
        const size = await calculateCurrentStorageSizeBytes();
        const actualSize = mockFiles.reduce(
          (accumlator, current) => accumlator + current.file.length,
          0
        );
        expect(size).toBe(actualSize);
      })
      .then(() => {
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
  });
  it("作品IDが不適切だとアップロードできない", (done) => {
    testSuccessfulUpload()
      .then(async () => {
        const size = await calculateCurrentStorageSizeBytes();
        const actualSize = mockFiles.reduce(
          (accumlator, current) => accumlator + current.file.length,
          0
        );
        expect(size).toBe(actualSize);
      })
      .then(() => {
        request(app)
          .post("/account/work/rename")
          .type("form")
          .field("creatorId", creatorId)
          .field("workId", "テスト")
          .field("renamedCreatorId", creatorId + "-2")
          .field("renamedWorkId", workId + "-2")
          .expect(STATUS_CODE_BAD_REQUEST)
          .expect(JSON.stringify({ errors: [WORK_ID_INVALID] }))
          .end(done);
      });
  });
  it("リネーム後の作者IDが設定されていないとリネームできない", (done) => {
    testSuccessfulUpload()
      .then(async () => {
        const size = await calculateCurrentStorageSizeBytes();
        const actualSize = mockFiles.reduce(
          (accumlator, current) => accumlator + current.file.length,
          0
        );
        expect(size).toBe(actualSize);
      })
      .then(() => {
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
  });
  it("リネーム後の作者IDが不適切だとリネームできない", (done) => {
    testSuccessfulUpload()
      .then(async () => {
        const size = await calculateCurrentStorageSizeBytes();
        const actualSize = mockFiles.reduce(
          (accumlator, current) => accumlator + current.file.length,
          0
        );
        expect(size).toBe(actualSize);
      })
      .then(() => {
        request(app)
          .post("/account/work/rename")
          .type("form")
          .field("creatorId", creatorId + "-2")
          .field("workId", workId)
          .field("renamedCreatorId", "テスト")
          .field("renamedWorkId", workId + "-2")
          .expect(STATUS_CODE_BAD_REQUEST)
          .expect(JSON.stringify({ errors: [CREATOR_ID_INVALID] }))
          .end(done);
      });
  });
  it("リネーム後の作品IDが設定されていないとリネームできない", (done) => {
    testSuccessfulUpload()
      .then(async () => {
        const size = await calculateCurrentStorageSizeBytes();
        const actualSize = mockFiles.reduce(
          (accumlator, current) => accumlator + current.file.length,
          0
        );
        expect(size).toBe(actualSize);
      })
      .then(() => {
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
  });
  it("リネーム後の作品IDが不適切だとアップロードできない", (done) => {
    testSuccessfulUpload()
      .then(async () => {
        const size = await calculateCurrentStorageSizeBytes();
        const actualSize = mockFiles.reduce(
          (accumlator, current) => accumlator + current.file.length,
          0
        );
        expect(size).toBe(actualSize);
      })
      .then(() => {
        request(app)
          .post("/account/work/rename")
          .type("form")
          .field("creatorId", creatorId)
          .field("workId", workId + "-2")
          .field("renamedCreatorId", creatorId + "-2")
          .field("renamedWorkId", "テスト")
          .expect(STATUS_CODE_BAD_REQUEST)
          .expect(JSON.stringify({ errors: [WORK_ID_INVALID] }))
          .end(done);
      });
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
      .then(async () => {
        const size = await calculateCurrentStorageSizeBytes();
        const actualSize = mockFiles.reduce(
          (accumlator, current) => accumlator + current.file.length,
          0
        );
        expect(size).toBe(actualSize);
      })
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
  it("リネーム前とリネーム後が同じだとはリネームできない", (done) => {
    testSuccessfulUpload()
      .then(async () => {
        const size = await calculateCurrentStorageSizeBytes();
        const actualSize = mockFiles.reduce(
          (accumlator, current) => accumlator + current.file.length,
          0
        );
        expect(size).toBe(actualSize);
      })
      .then(() => {
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
  });
  it("既に存在する作品を上書きするようなリネームはできない", (done) => {
    testSuccessfulUpload()
      .then(async () => {
        const size = await calculateCurrentStorageSizeBytes();
        const actualSize = mockFiles.reduce(
          (accumlator, current) => accumlator + current.file.length,
          0
        );
        expect(size).toBe(actualSize);
      })
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
      .then(async () => {
        const size = await calculateCurrentStorageSizeBytes();
        const actualSize = mockFiles.reduce(
          (accumlator, current) => accumlator + current.file.length,
          0
        );
        expect(size).toBe(actualSize);
      })
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
      .then(async () => {
        const size = await calculateCurrentStorageSizeBytes();
        const actualSize = mockFiles.reduce(
          (accumlator, current) => accumlator + current.file.length,
          0
        );
        expect(size).toBe(actualSize);
      })
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
      .then(async () => {
        const size = await calculateCurrentStorageSizeBytes();
        const actualSize = mockFiles.reduce(
          (accumlator, current) => accumlator + current.file.length,
          0
        );
        expect(size).toBe(actualSize);
      })
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
