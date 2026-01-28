import { installAgent } from '../agent/installer';
import type { AgentInstallOptions } from '../agent/types';
import { installMaster } from '../master/installer';
import type { MasterInstallOptions } from '../master/types';

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
