import * as winston from 'winston';
import * as path from 'path';

const logDir = path.join(process.cwd(), 'logs');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => {
    const { timestamp, level, message, context, ...metadata } = info;
    const contextStr =
      context && typeof context === 'string' ? `[${context}]` : '';
    const metadataStr =
      Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';
    const timestampStr =
      typeof timestamp === 'string' ? timestamp : String(timestamp);
    const levelStr = typeof level === 'string' ? level : String(level);
    const messageStr = typeof message === 'string' ? message : String(message);
    return `${timestampStr} ${levelStr} ${contextStr} ${messageStr}${metadataStr}`;
  }),
);

export const winstonConfig: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'better-jobs-backend' },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),

    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
      format: logFormat,
    }),

    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
      format: logFormat,
    }),
  ],

  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: logFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: logFormat,
    }),
  ],
};
