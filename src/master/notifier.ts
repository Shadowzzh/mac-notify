import notifier from 'node-notifier';
import type { Logger, NotificationOptions } from '../shared/types';

/**
 * Notifier 类 - 负责发送系统通知（无状态工具类）
 */
export class Notifier {
  /**
   * 发送系统通知（使用 node-notifier）
   */
  async send(options: NotificationOptions, logger?: Logger): Promise<void> {
    try {
      // 使用 Promise 包装 node-notifier 的回调
      await new Promise<void>((resolve, reject) => {
        notifier.notify(options, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      logger?.info({ options }, 'Notification sent successfully');
    } catch (error) {
      // Fire-and-forget 策略：记录错误但不抛出异常
      logger?.error({ error, options }, 'Failed to send notification');
    }
  }
}
