import * as winston from 'winston';
import { LogstashTransport } from 'winston-logstash-transport';
import { WinstonModule, WinstonModuleOptions } from 'nest-winston';

export const getWinstonConfig = (serviceName: string): WinstonModuleOptions => {
  // 1. Define Transports
  const transports: winston.transport[] = [
    // Always output cleanly to local console for devs
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          return `[${timestamp}] ${level} [${context || serviceName}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
    }),
  ];

  // 2. Add Remote Logstash connection if desired/configured
  const logstashHost = process.env.LOGSTASH_HOST || 'localhost';
  const logstashPort = parseInt(process.env.LOGSTASH_PORT || '5044', 10);

  transports.push(
    new LogstashTransport({
      host: logstashHost,
      port: logstashPort,
      node_name: serviceName,
      // Metadata sent to Logstash with every message
      meta: {
        service: serviceName,
        environment: process.env.NODE_ENV || 'development',
      },
      // Avoid throwing process fatal crashes if logstash is briefly unavailable
      handleExceptions: true,
    })
  );

  // 3. Construct unified config
  return {
    transports,
    // Global format logic wrapping raw objects into standard searchable primitives
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(), // Logstash highly prefers structured JSON
    ),
  };
};

/**
 * Convenience helper to replace standard Nest Factory logger in main.ts
 */
export const createGlobalLogger = (serviceName: string) => {
  return WinstonModule.createLogger(getWinstonConfig(serviceName));
};
