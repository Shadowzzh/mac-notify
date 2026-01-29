import notifier from 'node-notifier';
import type { NotifyRequest } from '../shared/types';
import { resolveIconPath } from './utils';

/**
 * 通知配置
 */
export interface NotifierConfig {
  soundQuestion?: string;
  soundError?: string;
  soundDefault?: string;
  icon?: string;
  contentImage?: string;
  subtitle?: string;
  timeout?: number;
  wait?: boolean;
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
  stop: 'Glass',
} as const;

/**
 * Notifier 类 - 负责发送系统通知（使用 node-notifier）
 */
export class Notifier {
  private config: NotifierConfig;

  constructor(config: NotifierConfig = {}) {
    this.config = {
      soundQuestion: config.soundQuestion || SOUND_MAP.question,
      soundError: config.soundError || SOUND_MAP.error,
      soundDefault: config.soundDefault || SOUND_MAP.success,
      icon: config.icon,
      contentImage: config.contentImage,
      subtitle: config.subtitle,
      timeout: config.timeout || 5,
      wait: config.wait ?? false,
    };
  }

  /**
   * 根据通知类型获取声音
   */
  private getSound(type: NotifyRequest['type']): string {
    switch (type) {
      case 'error':
        return this.config.soundError || SOUND_MAP.error;
      case 'question':
        return this.config.soundQuestion || SOUND_MAP.question;
      default:
        return this.config.soundDefault || SOUND_MAP.success;
    }
  }

  /**
   * 发送系统通知（使用 node-notifier）
   */
  async send(data: NotifyRequest, logger?: Logger): Promise<void> {
    const { title, message, type, cwd, ...advancedOptions } = data;

    // 优先使用请求参数，回退到配置默认值
    const notifyOptions = {
      title,
      message,
      // subtitle: 请求参数 > 配置 > cwd
      subtitle: advancedOptions.subtitle || this.config.subtitle || cwd,
      // sound: 请求参数 > 类型映射 > 配置默认值
      sound: advancedOptions.sound || this.getSound(type),
      // icon: 请求参数 > 配置
      icon: advancedOptions.icon
        ? resolveIconPath(advancedOptions.icon)
        : resolveIconPath(this.config.icon),
      // contentImage: 请求参数 > 配置
      contentImage: advancedOptions.contentImage
        ? resolveIconPath(advancedOptions.contentImage)
        : resolveIconPath(this.config.contentImage),
      // timeout: 请求参数 > 配置
      timeout: advancedOptions.timeout ?? this.config.timeout,
      // wait: 请求参数 > 配置
      wait: advancedOptions.wait ?? this.config.wait,
      // 高级选项直接传递
      open: advancedOptions.open,
      closeLabel: advancedOptions.closeLabel,
      actions: advancedOptions.actions,
      dropdownLabel: advancedOptions.dropdownLabel,
      reply: advancedOptions.reply,
    };

    try {
      // 使用 Promise 包装 node-notifier 的回调
      await new Promise<void>((resolve, reject) => {
        notifier.notify(notifyOptions, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      logger?.info({ data }, 'Notification sent successfully');
    } catch (error) {
      // Fire-and-forget 策略：记录错误但不抛出异常
      logger?.error({ error, data }, 'Failed to send notification');
    }
  }
}
