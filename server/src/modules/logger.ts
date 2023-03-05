import log4js from "log4js";
import { env } from "../utils/env";
const maxFileSize = 5 * 1024 * 1024; //5MB
log4js.configure({
  appenders: {
    console: { type: "console" },
    file: {
      type: "file",
      filename: "logs/system.log",
      backups: 5,
      maxLogSize: maxFileSize,
      compress: true,
    },
    accessFile: {
      type: "file",
      filename: "logs/access.log",
      backups: 5,
      maxLogSize: maxFileSize,
      compress: true,
    },
  },
  categories: {
    default: { appenders: ["console"], level: "all" },
    system: {
      appenders: env.NODE_ENV === "test" ? ["file"] : ["console", "file"],
      level: "all",
    },
    access: {
      appenders:
        env.NODE_ENV === "test" ? ["accessFile"] : ["console", "accessFile"],
      level: "all",
    },
  },
});
export const access = log4js.getLogger("access");
export const system = log4js.getLogger("system");
export const connectLogger = log4js.connectLogger;
