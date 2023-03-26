import express from "express";
import { absolutePathOfWorkFolder } from "../services/works";
const worksRouter = express.Router();
worksRouter.use(
  (_req, res, next) => {
    res.removeHeader("x-frame-options");
    next();
  },
  express.static(absolutePathOfWorkFolder, {
    setHeaders: (res, path) => {
      // Brotli
      if (path.endsWith(".br")) {
        res.set("Content-Encoding", "br");
        if (path.endsWith(".js.br")) res.type("application/javascript");
        else if (path.endsWith(".wasm.br")) res.type("application/wasm");
        else res.type("application/octet-stream");
        return;
      }

      // Gzip
      if (path.endsWith(".gz")) {
        res.set("Content-Encoding", "gzip");
        if (path.endsWith(".js.gz")) res.type("application/javascript");
        else if (path.endsWith(".wasm.gz")) res.type("application/wasm");
        else res.type("application/octet-stream");
      }
    },
  })
);

export { worksRouter };
