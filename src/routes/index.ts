import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

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
    const dir = path.join("uploads", creator_id, game_id, ...folders);
    fs.mkdirSync(dir, { recursive: true });
    next(null, dir);
  },
  filename: function (req, file, callback) {
    callback(null, path.basename(file.originalname));
  },
});
var upload = multer({
  storage: storage,
  preservePath: true,
  fileFilter: (req, file, cb) => {
    const folders = path.dirname(file.originalname).split("/");

    //隠しフォルダが含まれていないか
    cb(null, !folders.find((f) => f.startsWith(".")));
  },
});
const router = express.Router();
import { onlyIfAuthorized } from "../services/auth";

/* GET home page. */
router.get("/", onlyIfAuthorized, function (req, res, next) {
  res.render("index", { title: "Express" });
});
router.post(
  "/upload",
  onlyIfAuthorized,
  upload.array("game"),
  function (req, res, next) {
    const fileCounts = req.files?.length ?? 0;
    if(fileCounts === 0){
      res.send('アップロードするファイルがありません。');
      return;
    }
    res.send("ゲームのアップロードに成功しました。");
  },
);

module.exports = router;
