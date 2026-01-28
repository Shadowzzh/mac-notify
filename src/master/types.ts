/**
 * Master 服务相关类型定义
 */

/**
 * Master 配置
 */
export interface MasterConfig {
  host: string;
  port: number;
  url: string;
}

/**
 * Master 安装选项
 */
export interface MasterInstallOptions {
  host?: string;
  port?: string;
}
