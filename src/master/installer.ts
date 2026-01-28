import prompts from 'prompts';
import { formatUrl } from '../shared/utils.js';
import { writeMasterConfig } from './config.js';
import type { MasterConfig, MasterInstallOptions } from './types.js';

/**
 * 安装 Master 服务
 */
export async function installMaster(options: MasterInstallOptions): Promise<void> {
  console.log('🚀 开始安装 Master 服务...\n');

  // 1. 获取配置
  const config = await getMasterConfig(options);

  // 2. 保存配置
  await writeMasterConfig(config);
  console.log('✅ 配置已保存到 ~/.mac-notify/master.json\n');

  // 3. 显示启动说明
  showStartInstructions(config);
}

/**
 * 获取 Master 配置
 */
async function getMasterConfig(options: MasterInstallOptions): Promise<MasterConfig> {
  let host = options.host || process.env.HOST || '0.0.0.0';
  let port = options.port
    ? Number.parseInt(options.port, 10)
    : Number.parseInt(process.env.PORT || '8079', 10);

  // 如果没有提供配置，则交互式询问
  if (!options.host && !process.env.HOST) {
    const response = await prompts([
      {
        type: 'text',
        name: 'host',
        message: '请输入 Master 服务监听地址',
        initial: host,
      },
      {
        type: 'number',
        name: 'port',
        message: '请输入 Master 服务端口',
        initial: port,
      },
    ]);

    host = response.host || host;
    port = response.port || port;
  }

  const url = formatUrl(host, port);

  return { host, port, url };
}

/**
 * 显示启动说明
 */
function showStartInstructions(config: MasterConfig): void {
  console.log('📋 启动 Master 服务：\n');
  console.log('   方式 1：直接启动');
  console.log('   $ mac-notify start-master\n');
  console.log('   方式 2：使用 npm 脚本');
  console.log('   $ npm run start:server\n');
  console.log('   方式 3：开发模式（热重载）');
  console.log('   $ npm run dev:server\n');
  console.log(`📌 服务将运行在: ${config.url}`);
  console.log('📌 配置文件位置: ~/.mac-notify/master.json\n');
}
