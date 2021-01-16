import log4js from "log4js";
log4js.configure({
  appenders: {
    console: { type: "console" },
    file: { type: "dateFile", filename: "logs/system.log" },
    accessFile: { type: "dateFile", filename: "logs/access.log" },
  },
  categories: {
    default: { appenders: ["console"], level: "all" },
    system: { appenders: ["console", "file"], level: "all" },
    access: { appenders: ["console", "accessFile"], level: "all" },
  },
});
const access = log4js.getLogger("access");
const system = log4js.getLogger("system");
const connectLogger = log4js.connectLogger;

export { access, system, connectLogger };
