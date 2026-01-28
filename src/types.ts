// 通知请求接口
export interface NotifyRequest {
  title: string;
  message: string;
  project: string;
  cwd: string;
  type: 'question' | 'success' | 'error' | 'info';
  timestamp?: string;
  action?: 'focus' | 'none';
}

// Master 配置
export interface MasterConfig {
  host: string;
  port: number;
  url: string;
}

// Agent 配置
export interface AgentConfig {
  masterUrl: string;
  autoUpdate: boolean;
}

// 安装选项
export interface InstallOptions {
  url?: string;
  host?: string;
  port?: string;
  auto?: boolean;
}

// Claude Code Hook 配置
export interface ClaudeHook {
  type: 'prompt';
  prompt: string;
  statusMessage: string;
}

export interface ClaudeHookMatcher {
  matcher: string;
  hooks: ClaudeHook[];
}

export interface ClaudeSettings {
  hooks?: ClaudeHookMatcher[];
  [key: string]: unknown;
}
