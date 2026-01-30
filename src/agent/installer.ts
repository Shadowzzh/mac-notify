import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import prompts from 'prompts';
import { ConfigManager } from '../shared/config-manager';
import { checkMasterHealth } from '../shared/health';
import type { AgentConfig, AgentInstallOptions } from '../shared/types';

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
    console.log('请确 Master 服务已启动并且网络可达\n');
  } else {
    console.log('✅ Master 服务连接正常\n');
  }

  // 3. 生成 Shell 脚本
  await generateHookScripts(masterUrl);

  // 4. 保存 Agent 配置（只保存 URL）
  const agentConfig: AgentConfig = { masterUrl };
  await ConfigManager.writeAgent(agentConfig);
  console.log('✅ 配置已保存到 ~/.mac-notify/agent.json\n');

  // 5. 输出 Hook 配置
  showHookConfigInstructions();

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
    initial: 'http://localhost:8079',
  });

  return url;
}

/**
 * 生成 Hook 脚本
 */
async function generateHookScripts(masterUrl: string): Promise<void> {
  const hooksDir = join(homedir(), '.claude/hooks');

  // 确保目录存在
  mkdirSync(hooksDir, { recursive: true });

  // 生成提问通知脚本
  const askScriptPath = join(hooksDir, 'pre-askuserquestion.sh');
  const askScript = generateAskScript(masterUrl);
  writeFileSync(askScriptPath, askScript, { mode: 0o755 });
  console.log(`✅ 已生成脚本: ${askScriptPath}`);

  // 生成任务完成通知脚本
  const stopScriptPath = join(hooksDir, 'stop.sh');
  const stopScript = generateStopScript(masterUrl);
  writeFileSync(stopScriptPath, stopScript, { mode: 0o755 });
  console.log(`✅ 已生成脚本: ${stopScriptPath}\n`);
}

/**
 * 生成提问通知脚本
 */
function generateAskScript(masterUrl: string): string {
  return `#!/bin/bash
# 发送"提问时"通知到 Master 服务

MASTER_URL="\${MAC_NOTIFY_MASTER_URL:-${masterUrl}}"
PROJECT_NAME="\${PWD##*/}"
DEVICE_NAME=$(hostname)
LOG_FILE="\${MAC_NOTIFY_LOG_FILE:-/tmp/mac-notify.log}"

curl -X POST "\${MASTER_URL}/notify" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "\${PROJECT_NAME}",
    "message": "Claude Code 正在提问",
    "subtitle": "\${DEVICE_NAME}",
    "cwd": "\${PROJECT_NAME}",
    "type": "question"
  }' 2>&1 | tee -a "$LOG_FILE"
`;
}

/**
 * 生成任务完成通知脚本
 */
function generateStopScript(masterUrl: string): string {
  return `#!/bin/bash
# 发送"任务完成时"通知到 Master 服务

MASTER_URL="\${MAC_NOTIFY_MASTER_URL:-${masterUrl}}"
PROJECT_NAME="\${PWD##*/}"
DEVICE_NAME=$(hostname)
LOG_FILE="\${MAC_NOTIFY_LOG_FILE:-/tmp/mac-notify.log}"

curl -X POST "\${MASTER_URL}/notify" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "\${PROJECT_NAME}",
    "message": "Claude Code 任务完成",
    "subtitle": "\${DEVICE_NAME}",
    "cwd": "\${PROJECT_NAME}",
    "type": "stop"
  }' 2>&1 | tee -a "$LOG_FILE"
`;
}

/**
 * 显示 Hook 配置说明
 */
function showHookConfigInstructions(): void {
  console.log('📝 请手动添加以下配置到 ~/.claude/settings.json 的 hooks 数组中：\n');

  const askUserQuestionHook = {
    matcher: 'AskUserQuestion',
    hooks: [
      {
        type: 'command',
        command: join(homedir(), '.claude/hooks/pre-askuserquestion.sh'),
        statusMessage: '检测到 AskUserQuestion 调用...',
      },
    ],
  };

  const stopHook = {
    matcher: 'Stop',
    hooks: [
      {
        type: 'command',
        command: join(homedir(), '.claude/hooks/stop.sh'),
        statusMessage: '执行 Stop Hook...',
      },
    ],
  };

  // 输出两个独立的对象
  console.log(JSON.stringify(askUserQuestionHook, null, 2));
  console.log(',\n');
  console.log(JSON.stringify(stopHook, null, 2));
  console.log('\n');
}

/**
 * 显示验证步骤
 */
function showVerificationSteps(masterUrl: string): void {
  console.log('📌 验证安装：\n');
  console.log('1.检查生成的脚本:');
  console.log('  $ ls -la ~/.claude/hooks/\n');

  console.log('2.手动测试脚本执行:');
  console.log('  $ ~/.claude/hooks/pre-askuserquestion.sh\n');

  console.log('3.添加 Hook 配置到 settings.json:');
  console.log('  $ nano ~/.claude/settings.json');
  console.log('  (复制上面输出的两个配置对象到 hooks 数组)\n');

  console.log('4.验证 settings.json 格式:');
  console.log('  $ cat ~/.claude/settings.json | jq .\n');

  console.log('5.测试 Master 服务连接:');
  console.log(`      $ curl ${masterUrl}/health\n`);

  console.log('6.在任意项目中使用 Claude Code，触发 AskUserQuestion 或完成任务时应收到通知\n');
}
