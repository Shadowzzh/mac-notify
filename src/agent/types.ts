/**
 * Agent 相关类型定义
 */

/**
 * Agent 配置
 */
export interface AgentConfig {
  masterUrl: string;
  autoUpdate: boolean;
}

/**
 * Agent 安装选项
 */
export interface AgentInstallOptions {
  url?: string;
  auto?: boolean;
}

/**
 * Claude Code Hook 配置
 */
export interface ClaudeHook {
  type: 'prompt';
  prompt: string;
  statusMessage: string;
}

/**
 * Claude Hook Matcher
 */
export interface ClaudeHookMatcher {
  matcher: string;
  hooks: ClaudeHook[];
}

/**
 * Claude Settings 配置
 */
export interface ClaudeSettings {
  hooks?: ClaudeHookMatcher[];
  [key: string]: unknown;
}
