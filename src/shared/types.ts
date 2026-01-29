/**
 * 共享类型定义
 * 这些类型在 Master 和 Agent 之间共享
 */

/**
 * 通知请求接口
 * 扩展自 node-notifier 的选项，支持覆盖默认配置
 */
export interface NotifyRequest {
  // 必需字段
  title: string;
  message: string;
  type: 'question' | 'success' | 'error' | 'info' | 'stop';

  // 可选字段 - 覆盖配置默认值
  cwd?: string;
  subtitle?: string;
  sound?: string;
  icon?: string;
  contentImage?: string;
  timeout?: number;
  wait?: boolean;

  // node-notifier 高级选项
  open?: string;
  closeLabel?: string;
  actions?: string | string[];
  dropdownLabel?: string;
  reply?: boolean;
}

/**
 * 通知响应接口
 */
export interface NotifyResponse {
  success: boolean;
  message: string;
}

/**
 * 健康检查响应接口
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
}
