import { z } from 'zod';

// ============================================================
// 0. node-notifier 类型
// ============================================================

/**
 * 通知选项类型
 * 兼容 node-notifier 的所有平台通知选项
 */
export interface NotificationOptions {
  /** 必需字段 */
  title: string;
  message: string;

  /** 可选字段 - 通用 */
  /** 应用图标路径（macOS 可能不生效） */
  icon?: string;
  /** 是否等待用户交互 */
  wait?: boolean;

  /** 可选字段 - macOS NotificationCenter */
  /** 通知声音 */
  sound?: string | boolean;
  /** 通知副标题 */
  subtitle?: string;
  /** 通知内容图片路径 */
  contentImage?: string;
  /** 点击通知时打开的 URL */
  open?: string;
  /** 通知超时时间（秒），false 表示立即关闭 */
  timeout?: number | false;
  /** 关闭按钮的标签文本 */
  closeLabel?: string;
  /** 操作按钮，可以是字符串或字符串数组 */
  actions?: string | string[];
  /** 下拉菜单的标签文本 */
  dropdownLabel?: string;
  /** 是否允许用户回复 */
  reply?: boolean;
}

// ============================================================
// 1. 枚举类型
// ============================================================

/**
 * 通知类型枚举
 * 用于标识不同场景的通知，每种类型对应不同的默认声音
 */
export enum NotificationType {
  Question = 'question',
  Success = 'success',
  Error = 'error',
  Info = 'info',
  Stop = 'stop',
}

/**
 * 日志级别枚举
 * 用于控制日志输出的详细程度
 */
export enum LogLevel {
  Trace = 'trace',
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Fatal = 'fatal',
}

/**
 * macOS 系统声音枚举
 * 预定义的 macOS 系统通知声音
 */
export enum NotificationSound {
  Default = 'default',
  Ping = 'Ping', // question 类型
  Basso = 'Basso', // error 类型
  Glass = 'Glass', // stop 类型
}

/**
 * Claude Hook 匹配器类型枚举
 * 定义 Claude Code 可以触发 Hook 的时机
 */
export enum HookMatcherType {
  AskUserQuestion = 'AskUserQuestion',
}

// ============================================================
// 2. 工具类型
// ============================================================

/**
 * 深度可选类型
 * 将对象的所有字段（包括嵌套对象）变为可选
 *
 * @example
 * type PartialConfig = DeepPartial<MasterConfig>;
 * // { host?: string; port?: number; url?: string; }
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 指定字段可选类型
 * 让对象的特定字段变为可选
 *
 * @example
 * type ConfigWithoutUrl = Optional<MasterConfig, 'url'>;
 * // { host: string; port: number; url?: string; }
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * JSON 可序列化类型
 * 定义可以安全序列化为 JSON 的值类型
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// ============================================================
// 3. 错误类型
// ============================================================

/**
 * 错误码枚举
 * 统一的应用错误码，按类别分组
 */
export enum ErrorCode {
  // 配置错误 (1xxx)
  ConfigNotFound = 'CONFIG_NOT_FOUND',
  ConfigInvalid = 'CONFIG_INVALID',
  ConfigReadFailed = 'CONFIG_READ_FAILED',
  ConfigWriteFailed = 'CONFIG_WRITE_FAILED',

  // 网络错误 (2xxx)
  MasterUnreachable = 'MASTER_UNREACHABLE',
  HealthCheckFailed = 'HEALTH_CHECK_FAILED',

  // 通知错误 (3xxx)
  NotificationFailed = 'NOTIFICATION_FAILED',
  NotificationTimeout = 'NOTIFICATION_TIMEOUT',

  // 安装错误 (4xxx)
  InstallationFailed = 'INSTALLATION_FAILED',
  SettingsUpdateFailed = 'SETTINGS_UPDATE_FAILED',

  // 通用错误 (9xxx)
  Unknown = 'UNKNOWN',
}

/**
 * 应用错误基类
 * 统一的错误类，包含错误码和详细信息
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace?.(this, AppError);
  }
}

/**
 * 配置错误类
 */
export class ConfigError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.ConfigInvalid, message, details);
    this.name = 'ConfigError';
  }
}

/**
 * 网络错误类
 */
export class NetworkError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.MasterUnreachable, message, details);
    this.name = 'NetworkError';
  }
}

/**
 * 通知错误类
 */
export class NotificationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.NotificationFailed, message, details);
    this.name = 'NotificationError';
  }
}

/**
 * API 错误响应接口
 * 统一的 API 错误响应格式
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

// ============================================================
// 4. 通知相关类型
// ============================================================

/**
 * 通知请求接口
 * 发送通知所需的请求数据结构
 */
export interface NotifyRequest {
  // 必需字段
  /** 通知标题 */
  title: string;
  /** 通知内容 */
  message: string;
  /** 通知类型，决定默认声音和行为 */
  type: NotificationType;

  // 可选字段 - 覆盖配置默认值
  /** 当前工作目录，用作 subtitle 的后备值 */
  cwd?: string;
  /** 通知副标题，优先级高于 cwd 和配置默认值 */
  subtitle?: string;
  /** 通知声音，优先级高于类型映射声音 */
  sound?: string;
  /** 应用图标路径（macOS 可能不生效） */
  icon?: string;
  /** 通知内容图片路径（推荐使用，在通知右侧显示） */
  contentImage?: string;
  /** 通知超时时间（秒） */
  timeout?: number;
  /** 是否等待用户交互 */
  wait?: boolean;

  // node-notifier 高级选项
  /** 点击通知时打开的 URL */
  open?: string;
  /** 关闭按钮的标签文本 */
  closeLabel?: string;
  /** 操作按钮，可以是字符串或字符串数组 */
  actions?: string | string[];
  /** 下拉菜单的标签文本 */
  dropdownLabel?: string;
  /** 是否允许用户回复 */
  reply?: boolean;
}

/**
 * 通知响应接口
 * 通知发送成功后的响应数据结构
 */
export interface NotifyResponse {
  /** 是否成功 */
  success: boolean;
  /** 响应消息 */
  message: string;
}

/**
 * 通知器配置接口
 * Notifier 类的默认配置
 */
export interface NotifierConfig {
  /** question 类型通知的声音 */
  soundQuestion?: string;
  /** error 类型通知的声音 */
  soundError?: string;
  /** stop 类型通知的声音 */
  soundStop?: string;
  /** success/info 类型通知的默认声音 */
  soundDefault?: string;
  /** 自定义通知图标路径（本地路径或 URL） */
  icon?: string;
  /** 自定义通知内容图片路径（本地路径或 URL） */
  contentImage?: string;
  /** 通知副标题 */
  subtitle?: string;
  /** 通知超时时间（秒） */
  timeout?: number;
  /** 是否等待用户交互 */
  wait?: boolean;
}

/**
 * Logger 接口
 * 定义日志记录器的基本方法
 */
export interface Logger {
  /** 记录 info 级别日志 */
  info: (obj: unknown, msg: string) => void;
  /** 记录 error 级别日志 */
  error: (obj: unknown, msg: string) => void;
}

// ============================================================
// 5. 配置相关类型
// ============================================================

/**
 * 环境变量配置接口
 * 从 .env 文件或系统环境变量读取的配置
 */
export interface EnvConfig {
  /** 服务器配置 */
  server: {
    /** 监听地址 */
    host: string;
    /** 监听端口 */
    port: number;
  };
  /** 日志配置 */
  logging: {
    /** 日志级别 */
    level: LogLevel;
  };
  /** 通知配置 */
  notification: {
    /** question 类型通知的声音 */
    soundQuestion?: string;
    /** error 类型通知的声音 */
    soundError?: string;
    /** success/info 类型通知的声音 */
    soundDefault?: string;
    /** 自定义通知图标路径 */
    icon?: string;
    /** 自定义通知内容图片路径 */
    contentImage?: string;
    /** 通知副标题 */
    subtitle?: string;
    /** 通知超时时间（秒） */
    timeout?: number;
    /** 是否等待用户交互 */
    wait?: boolean;
  };
}

/**
 * Zod Schema: 环境变量配置验证
 */
export const EnvConfigSchema = z.object({
  server: z.object({
    host: z.string(),
    port: z.number().min(1).max(65535),
  }),
  logging: z.object({
    level: z.nativeEnum(LogLevel),
  }),
  notification: z.object({
    soundQuestion: z.string().optional(),
    soundError: z.string().optional(),
    soundDefault: z.string().optional(),
    icon: z.string().optional(),
    contentImage: z.string().optional(),
    subtitle: z.string().optional(),
    timeout: z.number().optional(),
    wait: z.boolean().optional(),
  }),
});

/**
 * Master 配置文件接口
 * 存储在 ~/.mac-notify/master.json 的配置
 */
export interface MasterConfig {
  /** 服务器配置 */
  server: {
    /** 监听地址 */
    host: string;
    /** 监听端口 */
    port: number;
    /** 完整的服务 URL（自动计算） */
    url: string;
  };
  /** 通知配置（可选，覆盖环境变量默认值） */
  notification?: NotifierConfig;
}

/**
 * Zod Schema: Master 配置验证
 */
export const MasterConfigSchema = z.object({
  server: z.object({
    host: z.string(),
    port: z.number().min(1).max(65535),
    url: z.string().url(),
  }),
  notification: z
    .object({
      soundQuestion: z.string().optional(),
      soundError: z.string().optional(),
      soundStop: z.string().optional(),
      soundDefault: z.string().optional(),
      icon: z.string().optional(),
      contentImage: z.string().optional(),
      subtitle: z.string().optional(),
      timeout: z.number().optional(),
      wait: z.boolean().optional(),
    })
    .optional(),
});

/**
 * Agent 配置文件接口
 * 存储在 ~/.mac-notify/agent.json 的配置
 */
export interface AgentConfig {
  /** Master 服务 URL */
  masterUrl: string;
}

/**
 * Zod Schema: Agent 配置验证
 */
export const AgentConfigSchema = z.object({
  masterUrl: z.string().url(),
});

// ============================================================
// 6. 安装选项类型
// ============================================================

/**
 * Master 安装选项接口
 * CLI 安装 Master 命令的参数
 */
export interface MasterInstallOptions {
  /** 监听地址 */
  host?: string;
  /** 监听端口（字符串，因为来自 CLI 参数） */
  port?: string;
}

/**
 * Agent 安装选项接口
 * CLI 安装 Agent 命令的参数
 */
export interface AgentInstallOptions {
  /** Master 服务 URL */
  url?: string;
}

/**
 * Daemon 安装选项接口
 * CLI 安装 Daemon 命令的参数
 */
export interface DaemonInstallOptions {
  /** 强制重新安装 */
  force?: boolean;
}

// ============================================================
// 7. Agent Hooks 类型
// ============================================================

/**
 * Claude Hook 配置接口
 * 定义单个 Hook 的结构和行为
 */
export interface ClaudeHook {
  /** Hook 类型 */
  type: 'prompt';
  /** 发送给 AI 的提示内容 */
  prompt: string;
  /** 显示给用户的状态消息 */
  statusMessage: string;
}

/**
 * Claude Hook 匹配器接口
 * 定义触发 Hook 的条件和对应的 Hook 列表
 */
export interface ClaudeHookMatcher {
  /** 匹配器类型，决定何时触发 Hook */
  matcher: HookMatcherType;
  /** Hook 数组，当匹配器触发时执行 */
  hooks: ClaudeHook[];
}

/**
 * Claude Settings 接口
 * Claude Code settings.json 文件的结构
 */
export interface ClaudeSettings {
  /** Hooks 配置数组 */
  hooks?: ClaudeHookMatcher[];
  /** 允许其他未知字段 */
  [key: string]: unknown;
}

// ============================================================
// 8. Daemon 相关类型
// ============================================================

/**
 * Daemon 配置文件接口
 * 存储在 ~/.mac-notify/daemon.json 的配置
 */
export interface DaemonConfig {
  /** 是否已安装 */
  installed: boolean;
  /** 安装时间 */
  installedAt: string;
  /** plist 文件路径 */
  plistPath: string;
  /** LaunchAgent 标签 */
  label: string;
  /** 日志文件路径 */
  logPath: string;
  /** 错误日志文件路径 */
  errorLogPath: string;
}

/**
 * Daemon 状态接口
 */
export interface DaemonStatus {
  /** 是否正在运行 */
  running: boolean;
  /** 进程 ID */
  pid?: number;
  /** 运行时长（秒） */
  uptime?: number;
  /** LaunchAgent 标签 */
  label: string;
  /** plist 文件路径 */
  plistPath: string;
  /** 日志文件路径 */
  logPath: string;
}

/**
 * LaunchAgent 配置接口
 */
export interface LaunchAgentConfig {
  /** LaunchAgent 标签 */
  label: string;
  /** 程序路径 */
  programPath: string;
  /** 工作目录 */
  workingDirectory: string;
  /** 日志文件路径 */
  logPath: string;
  /** 错误日志文件路径 */
  errorLogPath: string;
  /** 环境变量 */
  environmentVariables?: Record<string, string>;
}

// ============================================================
// 9. 健康检查类型
// ============================================================

/**
 * 健康检查响应接口
 * Master 服务健康检查端点的响应数据结构
 */
export interface HealthResponse {
  /** 服务状态 */
  status: 'ok' | 'error';
  /** ISO 8601 格式的时间戳 */
  timestamp: string;
  /** 服务版本号 */
  version?: string;
  /** 服务运行时长（秒） */
  uptime?: number;
}
