#!/usr/bin/env node

import { Command } from 'commander';
import { handleInstall } from './commands/install.js';
import { startMaster } from './commands/start.js';

const program = new Command();

program.name('mac-notify').description('Claude Code 远程开发通知系统').version('1.0.0');

program
  .command('install <type>')
  .description('安装 master 服务或 agent hooks')
  .option('-u, --url <url>', 'Master 服务地址')
  .option('-h, --host <host>', 'Master 服务主机')
  .option('-p, --port <port>', 'Master 服务端口')
  .option('--auto', '自动更新配置文件', false)
  .action(handleInstall);

program.command('start-master').description('启动 Master 服务').action(startMaster);

program.parse();
