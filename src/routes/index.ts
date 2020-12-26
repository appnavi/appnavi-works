import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ensureAuthenticated } from "../services/auth";
function getGameDir(req: express.Request): string{
  const creator_id = req.body["creator_id"];
  const game_id = req.body["game_id"];
  return path.join("uploads", creator_id, game_id );
}
const storage = multer.diskStorage({
  destination: (req, file, next) => {
    const folders = path.dirname(file.originalname).split("/");
    folders.shift();
    const creator_id = req.body["creator_id"];
    const game_id = req.body["game_id"];
    if (
      typeof creator_id !== "string" ||
      creator_id.length == 0 ||
      typeof game_id !== "string" ||
      game_id.length == 0
    ) {
      next(new Error("作者IDまたはゲームIDが指定されていません。"), "");
      return;
    }
    const dir = path.join(getGameDir(req), ...folders);
    fs.mkdirSync(dir, { recursive: true });
    next(null, dir);
  },
  filename: function (req, file, callback) {
    callback(null, path.basename(file.originalname));
  },
});
const upload = multer({
  storage: storage,
  preservePath: true,
  fileFilter: (req, file, cb) => {
    const folders = path.dirname(file.originalname).split("/");

    //隠しフォルダが含まれていないか
    cb(null, !folders.find((f) => f.startsWith(".")));
  },
});
const router = express.Router();

/* GET home page. */
router.get("/", ensureAuthenticated, function (req, res, next) {
  res.render("index", { title: "Express" });
});
router.post(
  "/upload",
  ensureAuthenticated,
  upload.array("game"),
  function (req, res, next) {
    const files = req.files;
    if(!(files instanceof Array)){
      res.status(400).end();
      return;
    }
    const fileCounts = files.length;
    if(fileCounts === 0){
      res.status(500).send('アップロードするファイルがありません。');
      return;
    }
    res.send("ゲームのアップロードに成功しました。");
  },
);

module.exports = router;
