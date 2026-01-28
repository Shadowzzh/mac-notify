import prompts from 'prompts';
import { checkMasterHealth } from '../shared/health';
import { writeAgentConfig } from './config';
import { generateHookConfig } from './hooks';
import {
  backupClaudeSettings,
  getClaudeSettingsPath,
  mergeHookConfig,
  readClaudeSettings,
  writeClaudeSettings,
} from './settings';
import type { AgentConfig, AgentInstallOptions } from './types';

/**
 * 安装 Agent hooks
 */
export async function installAgent(options: AgentInstallOptions): Promise<void> {
  console.log('🚀 开始安装 Agent hooks...\n');

  // 1. 获取 Master URL
  const masterUrl = await getMasterUrl(options);

  // 2. 健康检查
  console.log('🔍 检查 Master 服务连接...');
  const isHealthy = await checkMasterHealth(masterUrl);

  if (!isHealthy) {
    console.log(`⚠️  警告: 无法连接到 Master 服务 (${masterUrl})`);
    console.log('   请确保 Master 服务已启动并且网络可达\n');

    const { shouldContinue } = await prompts({
      type: 'confirm',
      name: 'shouldContinue',
      message: '是否继续安装?',
      initial: false,
    });

    if (!shouldContinue) {
      console.log('❌ 安装已取消');
      process.exit(1);
    }
  } else {
    console.log('✅ Master 服务连接正常\n');
  }

  // 3. 询问是否自动更新配置
  const autoUpdate = await shouldAutoUpdate(options);

  if (autoUpdate) {
    await updateSettingsAutomatically(masterUrl);
  } else {
    showManualInstructions(masterUrl);
  }

  // 4. 保存 Agent 配置
  const agentConfig: AgentConfig = {
    masterUrl,
    autoUpdate,
  };
  await writeAgentConfig(agentConfig);
  console.log('✅ 配置已保存到 ~/.mac-notify/agent.json\n');

  console.log('✅ 安装完成！\n');
  showVerificationSteps(masterUrl);
}

/**
 * 获取 Master URL
 */
async function getMasterUrl(options: AgentInstallOptions): Promise<string> {
  if (options.url) {
    return options.url;
  }

  const { url } = await prompts({
    type: 'text',
    name: 'url',
    message: '请输入 Master 服务地址',
    initial: 'http://100.103.79.86:8079',
  });

  return url;
}

/**
 * 询问是否自动更新配置
 */
async function shouldAutoUpdate(options: AgentInstallOptions): Promise<boolean> {
  if (options.auto !== undefined) {
    return options.auto;
  }

  const { autoUpdate } = await prompts({
    type: 'confirm',
    name: 'autoUpdate',
    message: '是否自动更新 ~/.claude/settings.json?',
    initial: true,
  });

  return autoUpdate;
}

/**
 * 自动更新 settings.json
 */
async function updateSettingsAutomatically(masterUrl: string): Promise<void> {
  try {
    // 1. 备份原文件
    const backupPath = await backupClaudeSettings();
    console.log(`✅ 已备份原文件到: ${backupPath}\n`);

    // 2. 读取现有配置
    const settings = await readClaudeSettings();

    // 3. 生成新的 hook 配置
    const hookConfig = generateHookConfig(masterUrl);

    // 4. 合并配置
    const updatedSettings = await mergeHookConfig(settings, hookConfig);

    // 5. 写入文件
    await writeClaudeSettings(updatedSettings);

    console.log('✅ settings.json 已更新');
    console.log(`   配置文件: ${getClaudeSettingsPath()}\n`);
  } catch (error) {
    console.error('❌ 自动更新失败:', error);
    console.log('   请手动添加配置\n');
    showManualInstructions(masterUrl);
  }
}

/**
 * 显示手动配置说明
 */
function showManualInstructions(masterUrl: string): void {
  const hookConfig = generateHookConfig(masterUrl);
  console.log('📝 请手动添加以下配置到 ~/.claude/settings.json 的 hooks 数组中：\n');
  console.log(JSON.stringify(hookConfig, null, 2));
  console.log('');
}

/**
 * 显示验证步骤
 */
function showVerificationSteps(masterUrl: string): void {
  console.log('📌 验证安装：\n');
  console.log('   1. 检查配置文件:');
  console.log('      $ cat ~/.claude/settings.json\n');
  console.log('   2. 测试 Master 服务连接:');
  console.log(`      $ curl ${masterUrl}/health\n`);
  console.log('   3. 在任意项目中使用 Claude Code，触发 AskUserQuestion 时应收到通知\n');
}
