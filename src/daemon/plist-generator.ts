import plist from 'plist';
import type { LaunchAgentConfig } from '../shared/types';

/**
 * 生成 LaunchAgent plist 配置
 */
export function generatePlist(config: LaunchAgentConfig): string {
  const plistObject = {
    Label: config.label,
    ProgramArguments: [config.programPath, 'start-master'],
    RunAtLoad: true,
    KeepAlive: true,
    WorkingDirectory: config.workingDirectory,
    StandardOutPath: config.logPath,
    StandardErrorPath: config.errorLogPath,
    EnvironmentVariables: {
      PATH: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
      NODE_ENV: 'production',
      ...config.environmentVariables,
    },
  };

  return plist.build(plistObject);
}

/**
 * 解析 plist 文件内容
 */
export function parsePlist(content: string): Record<string, unknown> {
  return plist.parse(content) as Record<string, unknown>;
}
