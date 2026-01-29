#!/usr/bin/env node

import './config';
import { Command } from 'commander';
import { handleInstall } from './commands/install';
import { startMaster } from './commands/start';
import { handleDaemon } from './commands/daemon';

const program = new Command();

program.name('mac-notify').description('Claude Code 远程开发通知系统').version('1.0.0');

program
  .command('install <type>')
  .description('安装 master 服务、agent hooks 或 daemon')
  .option('-u, --url <url>', 'Master 服务地址')
  .option('-h, --host <host>', 'Master 服务主机')
  .option('-p, --port <port>', 'Master 服务端口')
  .option('--auto', '自动更新配置文件', false)
  .option('--force', '强制重新安装', false)
  .action(async (type: string, options: Record<string, unknown>) => {
    if (type === 'daemon') {
      await handleDaemon('install', options);
    } else {
      await handleInstall(type, options);
    }
  });

program.command('start-master').description('启动 Master 服务').action(startMaster);

program
  .command('daemon <action>')
  .description('管理 LaunchAgent 守护进程')
  .action(async (action: string) => {
    await handleDaemon(action, {});
  });

program.parse();
