import { installAgent } from '../agent/installer.js';
import type { AgentInstallOptions } from '../agent/types.js';
import { installMaster } from '../master/installer.js';
import type { MasterInstallOptions } from '../master/types.js';

/**
 * 处理 install 命令
 */
export async function handleInstall(
  type: string,
  options: MasterInstallOptions | AgentInstallOptions,
): Promise<void> {
  if (type === 'master') {
    await installMaster(options as MasterInstallOptions);
  } else if (type === 'agent') {
    await installAgent(options as AgentInstallOptions);
  } else {
    console.error('❌ 无效的类型，请使用 master 或 agent');
    process.exit(1);
  }
}
