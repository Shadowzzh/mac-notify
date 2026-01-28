/**
 * 共享类型定义
 * 这些类型在 Master 和 Agent 之间共享
 */

/**
 * 通知请求接口
 */
export interface NotifyRequest {
  title: string;
  message: string;
  project: string;
  cwd: string;
  type: 'question' | 'success' | 'error' | 'info';
  timestamp?: string;
  action?: 'focus' | 'none';
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
