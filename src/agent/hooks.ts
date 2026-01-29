import { HookMatcherType } from '../shared/types';
import type { ClaudeHookMatcher } from '../shared/types';

/**
 * 生成 Claude Code Hook 配置
 */
export function generateHookConfig(masterUrl: string): ClaudeHookMatcher {
  return {
    matcher: HookMatcherType.AskUserQuestion,
    hooks: [
      {
        type: 'prompt',
        prompt: `在向用户提问之前，先发送通知到 Master 服务。使用 curl POST 请求到: ${masterUrl}/notify，请求头: Content-Type: application/json。请求体格式: {"title":"<项目名称，从 cwd 获取>","message":"<问题的简短描述>","cwd":"<工作目录的最后一部分>","type":"question"}。示例：如果工作目录是 /home/user/my-project，则设置 cwd="my-project", title="my-project"。这个通知非常重要 - 必须在调用 AskUserQuestion 之前立即发送。`,
        statusMessage: '正在通知用户...',
      },
    ],
  };
}
