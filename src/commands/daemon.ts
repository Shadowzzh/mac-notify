import { installDaemon } from '../daemon/installer';
import {
  getDaemonLogs,
  getDaemonStatus,
  restartDaemon,
  startDaemon,
  stopDaemon,
  uninstallDaemon,
} from '../daemon/manager';
import type { DaemonInstallOptions } from '../shared/types';

/**
 * 处理 daemon 命令
 */
export async function handleDaemon(action: string, options: DaemonInstallOptions): Promise<void> {
  try {
    switch (action) {
      case 'install':
        await installDaemon(options);
        break;

      case 'start':
        await startDaemon();
        break;

      case 'stop':
        await stopDaemon();
        break;

      case 'restart':
        await restartDaemon();
        break;

      case 'status':
        await showStatus();
        break;

      case 'logs':
        await showLogs();
        break;

      case 'uninstall':
        await uninstallDaemon();
        break;

      default:
        console.error(`错误: 未知的操作: ${action}`);
        console.log('可用操作: install, start, stop, restart, status, logs, uninstall');
        process.exit(1);
    }
  } catch (error) {
    console.error(`错误: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * 显示服务状态
 */
async function showStatus(): Promise<void> {
  const status = await getDaemonStatus();

  console.log('\nLaunchAgent 状态：\n');
  console.log(`服务标签: ${status.label}`);
  console.log(`运行状态: ${status.running ? '✓ 运行中' : '✗ 未运行'}`);
  if (status.pid) {
    console.log(`进程 PID: ${status.pid}`);
  }
  console.log(`配置文件: ${status.plistPath}`);
  console.log(`日志文件: ${status.logPath}\n`);
}

/**
 * 显示日志
 */
async function showLogs(): Promise<void> {
  const logs = await getDaemonLogs(50);
  console.log('\n最近 50 行日志：\n');
  console.log(logs);
}
