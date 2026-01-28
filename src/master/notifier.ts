import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { NotifyRequest } from '../shared/types';

const execAsync = promisify(exec);

/**
 * 通知配置
 */
export interface NotifierConfig {
  soundQuestion?: string;
  soundError?: string;
  soundDefault?: string;
}

/**
 * Logger 接口
 */
export interface Logger {
  info: (obj: unknown, msg: string) => void;
  error: (obj: unknown, msg: string) => void;
}

/**
 * 通知类型到声音的映射
 */
const SOUND_MAP = {
  question: 'Ping',
  error: 'Basso',
  success: 'default',
  info: 'default',
} as const;

/**
 * Notifier 类 - 负责发送系统通知
 */
export class Notifier {
  private config: Required<NotifierConfig>;

  constructor(config: NotifierConfig = {}) {
    this.config = {
      soundQuestion: config.soundQuestion || SOUND_MAP.question,
      soundError: config.soundError || SOUND_MAP.error,
      soundDefault: config.soundDefault || SOUND_MAP.success,
    };
  }

  /**
   * 根据通知类型获取声音
   */
  private getSound(type: NotifyRequest['type']): string {
    switch (type) {
      case 'error':
        return this.config.soundError;
      case 'question':
        return this.config.soundQuestion;
      default:
        return this.config.soundDefault;
    }
  }

  /**
   * 转义 AppleScript 字符串中的特殊字符
   */
  private escapeAppleScript(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  /**
   * 生成 AppleScript 脚本
   */
  private generateScript(title: string, message: string, sound: string): string {
    const escapedTitle = this.escapeAppleScript(title);
    const escapedMessage = this.escapeAppleScript(message);

    return `display notification "${escapedMessage}" with title "${escapedTitle}" sound name "${sound}"`;
  }

  /**
   * 发送 macOS 通知
   */
  async send(data: NotifyRequest, logger?: Logger): Promise<void> {
    const { title, message, type } = data;
    const sound = this.getSound(type);
    const script = this.generateScript(title, message, sound);

    try {
      await execAsync(`osascript -e '${script}'`);
      logger?.info({ data }, 'Notification sent successfully');
    } catch (error) {
      // Fire-and-forget 策略：记录错误但不抛出异常
      logger?.error({ error, data }, 'Failed to send notification');
    }
  }
}
