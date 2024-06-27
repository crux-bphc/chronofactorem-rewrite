import { Logger as PinoLogger, LoggerOptions, pino } from "pino";
import { pinoHttp } from "pino-http";
import { Logger, QueryRunner } from "typeorm";
import { env } from "../config/server.js";

const devOptions: LoggerOptions = {
  // this sets the overall log level
  level: env.LOG_LEVEL,
  transport: {
    target: "pino-pretty",
    options: {
      // disable terminal colour escape sequences in the logs
      colorize: false,
      colorizeObjects: false,
      singleLine: true,
      // remove pid and hostname
      ignore: "pid,hostname",
      // make timestamps human readable
      translateTime: "SYS:standard",
      destination: "logs/app.log",
      // create logs if it doesn't exist
      mkdir: true,
      // NOTE: this will clear logs every time the server hot-reloads, set this to true if you want logs to persist
      append: false,
    },
  },
};

const prodOptions: LoggerOptions = {
  level: env.LOG_LEVEL,
  // this removes the pid and hostname
  base: undefined,
  // by default, `level` shows the level number instead of the label, which isn't very nice
  formatters: {
    level(label: string, number: number) {
      return { level: label };
    },
  },
  transport: {
    target: "pino/file",
    options: {
      destination: "logs/app.log",
      mkdir: true,
      append: true,
    },
  },
};

const baseLogger = pino(
  (env.LOG_MODE ?? env.NODE_ENV) === "development" ? devOptions : prodOptions,
);

export const httpLogger = pinoHttp({
  logger: baseLogger,
  // change this to modify the HTTP request log level
  level: "debug",
  // disables automatic request logging (our debug logs are more detailed)
  autoLogging: false,
});

export const databaseLogger = baseLogger.child(
  // every database log will have `module` set to "database", which is useful for filtering
  { module: "database" },
  // change this to modify the database log level
  { level: "debug" },
);

export class DatabaseLogger implements Logger {
  constructor(private readonly logger: PinoLogger) {}

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    this.logger.debug({ query, parameters });
  }

  logQueryError(
    error: string,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    this.logger.error({ query, parameters, msg: `Query error: ${error}` });
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    this.logger.warn({ query, parameters, msg: `Query slow: ${time}` });
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    this.logger.warn(`Schema Build: ${message}`);
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    this.logger.warn(`Migration: ${message}`);
  }

  log(level: "log" | "info" | "warn", message: any, queryRunner?: QueryRunner) {
    switch (level) {
      case "log":
        this.logger.debug(message);
        break;
      case "info":
        this.logger.info(message);
        break;
      case "warn":
        this.logger.warn(message);
        break;
    }
  }
}
