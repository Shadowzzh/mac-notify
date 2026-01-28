import { installAgent } from '../agent/installer.js';
import { installMaster } from '../master/installer.js';
import type { InstallOptions } from '../types.js';

/**
 * 处理 install 命令
 */
export async function handleInstall(type: string, options: InstallOptions): Promise<void> {
  if (type === 'master') {
    await installMaster(options);
  } else if (type === 'agent') {
    await installAgent(options);
  } else {
    console.error('❌ 无效的类型，请使用 master 或 agent');
    process.exit(1);
  }
}
