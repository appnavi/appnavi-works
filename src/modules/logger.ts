import log4js from "log4js";
log4js.configure({
  appenders: {
    console: { type: "console" },
    file: { type: "file", filename: "system.log" },
    accessFile: { type: "file", filename: "access.log" },
  },
  categories: {
    default: { appenders: ["console"], level: "info" },
    system: { appenders: ["console", "file"], level: "info" },
    access: { appenders: ["console", "accessFile"], level: "info" },
  },
});
const access = log4js.getLogger("access");
const system = log4js.getLogger("system");
const connectLogger = log4js.connectLogger;

export { access, system, connectLogger };
