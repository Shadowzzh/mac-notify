import { config as loadEnv } from 'dotenv';

// 加载 .env 文件
loadEnv();

/**
 * 日志级别枚举
 */
const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * 验证日志级别
 */
function validateLogLevel(level: string): LogLevel {
  if (LOG_LEVELS.includes(level as LogLevel)) {
    return level as LogLevel;
  }
  console.warn(`Invalid LOG_LEVEL: ${level}, using default: info`);
  return 'info';
}

/**
 * 验证端口号
 */
function validatePort(port: number): number {
  if (port >= 1 && port <= 65535) {
    return port;
  }
  console.warn(`Invalid PORT: ${port}, using default: 8079`);
  return 8079;
}

/**
 * 应用配置
 */
export const config = {
  /**
   * 服务器配置
   */
  server: {
    /** 监听地址 */
    host: process.env.HOST || '0.0.0.0',
    /** 监听端口 */
    port: validatePort(Number.parseInt(process.env.PORT || '8079', 10)),
  },

  /**
   * 日志配置
   */
  logging: {
    /** 日志级别 */
    level: validateLogLevel(process.env.LOG_LEVEL || 'info'),
  },

  /**
   * 通知声音配置
   */
  notification: {
    /** question 类型通知的声音 */
    soundQuestion: process.env.NOTIFICATION_SOUND_QUESTION,
    /** error 类型通知的声音 */
    soundError: process.env.NOTIFICATION_SOUND_ERROR,
    /** success/info 类型通知的声音 */
    soundDefault: process.env.NOTIFICATION_SOUND_DEFAULT,
  },
} as const;
