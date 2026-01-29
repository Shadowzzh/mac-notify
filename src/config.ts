import { config as loadEnv } from 'dotenv';
import { LogLevel } from './shared/types.js';

// 加载 .env 文件
loadEnv();

/**
 * 验证日志级别
 */
function validateLogLevel(level: string): LogLevel {
  if (Object.values(LogLevel).includes(level as LogLevel)) {
    return level as LogLevel;
  }
  console.warn(`Invalid LOG_LEVEL: ${level}, using default: info`);
  return LogLevel.Info;
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
   * 通知配置
   */
  notification: {
    /** question 类型通知的声音 */
    soundQuestion: process.env.NOTIFICATION_SOUND_QUESTION,
    /** error 类型通知的声音 */
    soundError: process.env.NOTIFICATION_SOUND_ERROR,
    /** success/info 类型通知的声音 */
    soundDefault: process.env.NOTIFICATION_SOUND_DEFAULT,
    /** 自定义通知图标（应用图标，本地路径或 URL） */
    icon: process.env.NOTIFICATION_ICON,
    /** 自定义通知内容图片（通知右侧显示的图片，本地路径或 URL） */
    contentImage: process.env.NOTIFICATION_CONTENT_IMAGE,
    /** 通知副标题 */
    subtitle: process.env.NOTIFICATION_SUBTITLE,
    /** 通知超时时间（秒） */
    timeout: process.env.NOTIFICATION_TIMEOUT
      ? Number.parseInt(process.env.NOTIFICATION_TIMEOUT, 10)
      : undefined,
    /** 是否等待用户交互 */
    wait: process.env.NOTIFICATION_WAIT === 'true',
  },
} as const;
