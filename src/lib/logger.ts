import winston from 'winston';

export function getLogger(name: string, level: string = 'info') {
  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message }) => {
        return `[${name}] ${level}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.Console(),
    ],
  });
} 