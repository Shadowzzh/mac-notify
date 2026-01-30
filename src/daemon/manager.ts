import { exec } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { ConfigManager } from '../shared/config-manager';
import type { DaemonStatus } from '../shared/types';

const execAsync = promisify(exec);

/**
 * 启动服务
 */
export async function startDaemon(): Promise<void> {
  const config = await ConfigManager.readDaemon();
  if (!config) {
    throw new Error('Daemon 未安装，请先运行: mac-notify install daemon');
  }

  try {
    await execAsync(`launchctl start ${config.label}`);
    console.log('✓ 服务已启动');
  } catch (error) {
    throw new Error(`启动服务失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 停止服务
 */
export async function stopDaemon(): Promise<void> {
  const config = await ConfigManager.readDaemon();
  if (!config) {
    throw new Error('Daemon 未安装');
  }

  try {
    await execAsync(`launchctl stop ${config.label}`);
    console.log('✓ 服务已停止');
  } catch (error) {
    throw new Error(`停止服务失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 重启服务
 */
export async function restartDaemon(): Promise<void> {
  console.log('正在重启服务...');
  await stopDaemon();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await startDaemon();
}

/**
 * 查询服务状态
 */
export async function getDaemonStatus(): Promise<DaemonStatus> {
  const config = await ConfigManager.readDaemon();
  if (!config) {
    throw new Error('Daemon 未安装，请先运行: mac-notify install daemon');
  }

  try {
    const { stdout } = await execAsync(`launchctl list | grep ${config.label}`);
    const parts = stdout.trim().split(/\s+/);
    const pid = parts[0] !== '-' ? Number.parseInt(parts[0], 10) : undefined;

    return {
      running: pid !== undefined,
      pid,
      label: config.label,
      plistPath: config.plistPath,
      logPath: config.logPath,
    };
  } catch (error) {
    // grep 没找到结果会抛出错误，说明服务未运行
    return {
      running: false,
      label: config.label,
      plistPath: config.plistPath,
      logPath: config.logPath,
    };
  }
}

/**
 * 查看日志
 */
export async function getDaemonLogs(lines = 50): Promise<string> {
  const config = await ConfigManager.readDaemon();
  if (!config) {
    throw new Error('Daemon 未安装，请先运行: mac-notify install daemon');
  }

  try {
    const content = await readFile(config.logPath, 'utf-8');
    const allLines = content.split('\n');
    const lastLines = allLines.slice(-lines);
    return lastLines.join('\n');
  } catch (error) {
    throw new Error(`读取日志失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 卸载服务
 */
export async function uninstallDaemon(): Promise<void> {
  const config = await ConfigManager.readDaemon();
  if (!config) {
    throw new Error('Daemon 未安装');
  }

  try {
    // 1. 卸载 LaunchAgent
    try {
      await execAsync(`launchctl unload "${config.plistPath}"`);
      console.log('✓ 已卸载 LaunchAgent');
    } catch (error) {
      // 如果服务未加载，忽略错误
      console.log('LaunchAgent 未加载或已卸载');
    }

    // 2. 删除 plist 文件
    await execAsync(`rm -f "${config.plistPath}"`);
    console.log('✓ 已删除 plist 文件');

    // 3. 删除配置文件
    await execAsync(`rm -f "${ConfigManager.getDaemonConfigPath()}"`);
    console.log('✓ 已删除配置文件');

    console.log('\n✓ Daemon 卸载完成');
  } catch (error) {
    throw new Error(`卸载失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}
