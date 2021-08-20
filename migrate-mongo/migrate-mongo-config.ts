import { config as Config } from "migrate-mongo";
import { getSecret } from "../src/utils/helpers";

const url = getSecret("DATABASE_URL");
const urlSegments = url.split("/");
const databaseName = urlSegments[urlSegments.length - 1];

// In this file you can configure migrate-mongo
const config: Config.Config & {
  migrationFileExtension?: string;
  useFileHash?: boolean;
} = {
  mongodb: {
    url,
    databaseName,
    options: {
      useNewUrlParser: true, // removes a deprecation warning when connecting
      useUnifiedTopology: true, // removes a deprecating warning when connecting
      //   connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      //   socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    },
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: "migrate-mongo/migrations",

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "migrations-changelog",

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: ".ts",

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determin
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false,
};

// Return the config as a promise
module.exports = config;
