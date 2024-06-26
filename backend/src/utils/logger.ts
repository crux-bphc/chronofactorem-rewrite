import { Logger as PinoLogger, LoggerOptions, pino } from "pino";
import { pinoHttp } from "pino-http";
import { Logger, QueryRunner } from "typeorm";
import { env } from "../config/server.js";

const devOptions: LoggerOptions = {
  // NOTE: this level setting is for database logging only and is independent of the HTTP logging level
  level: "debug",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: false,
      colorizeObjects: false,
      singleLine: true,
      ignore: "pid,hostname",
      translateTime: "SYS:standard",
      destination: "logs/app.log",
      // NOTE: this will clear logs every time the server hot-reloads
      append: false,
    },
  },
};

const prodOptions: LoggerOptions = {
  level: "debug",
  base: undefined,
  formatters: {
    level(label: string, number: number) {
      return { level: label };
    },
  },
  transport: {
    target: "pino/file",
    options: {
      destination: "logs/app.log",
      append: true,
    },
  },
};

const baseLogger = pino(
  env.NODE_ENV === "development" ? devOptions : prodOptions,
);

export const httpLogger = pinoHttp({
  logger: baseLogger,
  // NOTE: this level setting is for HTTP logging only and is independent of the base logger's level
  level: "debug",
  autoLogging: false,
});

export const databaseLogger = baseLogger.child({ module: "database" });

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
