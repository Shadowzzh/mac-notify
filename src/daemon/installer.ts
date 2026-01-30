import { exec } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import prompts from 'prompts';
import { ConfigManager } from '../shared/config-manager';
import type { DaemonConfig, DaemonInstallOptions } from '../shared/types';
import { generatePlist } from './plist-generator';

const execAsync = promisify(exec);

/**
 * 安装 Daemon 服务
 */
export async function installDaemon(options: DaemonInstallOptions): Promise<void> {
  console.log('🚀 开始安装 LaunchAgent 守护进程...\n');

  // 1. 检查是否已安装
  const existingConfig = await ConfigManager.readDaemon();
  if (existingConfig && !options.force) {
    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Daemon 已安装，是否重新安装？',
      initial: false,
    });

    if (!confirm) {
      console.log('❌ 取消安装');
      process.exit(0);
    }
  }

  // 2. 检测 mac-notify 和 node 路径
  const programPath = await detectMacNotifyPath();
  console.log(`✓ 检测到 mac-notify 路径: ${programPath}`);

  const nodePath = await detectNodePath();
  console.log(`✓ 检测到 node 路径: ${nodePath}`);

  // 3. 读取 Master 配置
  const masterConfig = await ConfigManager.readMaster();
  if (!masterConfig) {
    console.error('❌ 未找到 Master 配置，请先运行: mac-notify install master');
    process.exit(1);
  }
  console.log(`✓ 读取 Master 配置: ${masterConfig.server.url}`);

  // 4. 生成配置
  const daemonConfig = await generateDaemonConfig(programPath);

  // 5. 生成 plist 文件
  const nodeDir = nodePath.replace(/\/node$/, '');
  const plistContent = generatePlist({
    label: daemonConfig.label,
    programPath,
    workingDirectory: homedir(),
    logPath: daemonConfig.logPath,
    errorLogPath: daemonConfig.errorLogPath,
    environmentVariables: {
      PATH: `${nodeDir}:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`,
    },
  });
  console.log('✓ 生成 LaunchAgent 配置');

  // 6. 写入 plist 文件
  await writeFile(daemonConfig.plistPath, plistContent, 'utf-8');
  console.log(`✓ 写入 plist 文件: ${daemonConfig.plistPath}`);

  // 7. 加载服务
  await loadLaunchAgent(daemonConfig.plistPath);
  console.log('✓ 加载服务');

  // 8. 验证服务状态
  await verifyService(daemonConfig.label);

  // 9. 保存配置
  await ConfigManager.writeDaemon(daemonConfig);
  console.log('✓ 保存配置');

  // 10. 显示成功信息
  showSuccessMessage(daemonConfig);
}

/**
 * 检测 mac-notify 路径
 */
async function detectMacNotifyPath(): Promise<string> {
  try {
    const { stdout } = await execAsync('which mac-notify');
    return stdout.trim();
  } catch (error) {
    throw new Error('未找到 mac-notify 命令，请确保已全局安装');
  }
}

/**
 * 检测 node 路径
 */
async function detectNodePath(): Promise<string> {
  try {
    const { stdout } = await execAsync('which node');
    const nodePath = stdout.trim();

    // 尝试解析符号链接获取真实路径
    try {
      const { stdout: realPath } = await execAsync(
        `readlink -f "${nodePath}" 2>/dev/null || realpath "${nodePath}" 2>/dev/null || echo "${nodePath}"`,
      );
      return realPath.trim();
    } catch {
      return nodePath;
    }
  } catch (error) {
    throw new Error('未找到 node 命令，请确保已安装 Node.js');
  }
}

/**
 * 生成 Daemon 配置
 */
async function generateDaemonConfig(programPath: string): Promise<DaemonConfig> {
  const homeDir = homedir();
  const configDir = join(homeDir, '.mac-notify');
  const logsDir = join(configDir, 'logs');

  // 确保日志目录存在
  await mkdir(logsDir, { recursive: true });

  return {
    installed: true,
    installedAt: new Date().toISOString(),
    plistPath: join(homeDir, 'Library/LaunchAgents/com.claude.notify.plist'),
    label: 'com.claude.notify',
    logPath: join(logsDir, 'master.log'),
    errorLogPath: join(logsDir, 'master.error.log'),
  };
}

/**
 * 加载 LaunchAgent
 */
async function loadLaunchAgent(plistPath: string): Promise<void> {
  try {
    await execAsync(`launchctl load "${plistPath}"`);
  } catch (error) {
    throw new Error(
      `加载 LaunchAgent 失败: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * 验证服务状态
 */
async function verifyService(label: string): Promise<void> {
  try {
    const { stdout } = await execAsync(`launchctl list | grep ${label}`);
    const parts = stdout.trim().split(/\s+/);
    const pid = parts[0];

    if (pid === '-') {
      throw new Error('服务未运行');
    }

    console.log(`✓ 验证服务状态: 运行中 (PID: ${pid})`);
  } catch (error) {
    console.warn('⚠️  无法验证服务状态，请手动检查');
  }
}

/**
 * 显示成功信息
 */
function showSuccessMessage(config: DaemonConfig): void {
  console.log('\n✅ LaunchAgent 安装成功！\n');
  console.log('📋 服务信息：');
  console.log(`   标签: ${config.label}`);
  console.log(`   日志: ${config.logPath}`);
  console.log(`   配置: ${config.plistPath}\n`);
  console.log('📋 管理命令：');
  console.log('   mac-notify daemon status     # 查看状态');
  console.log('   mac-notify daemon stop       # 停止服务');
  console.log('   mac-notify daemon restart    # 重启服务');
  console.log('   mac-notify daemon logs       # 查看日志');
  console.log('   mac-notify daemon uninstall  # 卸载服务\n');
}
