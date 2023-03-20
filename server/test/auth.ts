import request from "supertest";

import { app } from "../src/app";
import { STATUS_CODE_REDIRECT_TEMPORARY } from "../src/utils/constants";
import supertest from "supertest";

export const myId = "userABC";
export const theirId = "userDEF";

export async function createLogin(userId: string, type: string = "Slack") {
  return new Promise<{ login: (req: supertest.Test) => supertest.Test }>(
    (resolve, reject) => {
      request(app)
        .post("/api/auth/test")
        .send({
          id: userId,
          name: "",
          avatar_url: "https://example.com",
          type,
        })
        .expect(STATUS_CODE_REDIRECT_TEMPORARY)
        .expect("set-cookie", /connect.sid/)
        .end((err, res) => {
          if (err) reject(err);
          resolve({
            login(req) {
              req.set("Cookie", res.headers["set-cookie"]);
              return req;
            },
          });
        });
    }
  );
}
