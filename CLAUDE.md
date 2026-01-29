# CLAUDE.md

使用中文回复

此文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

这是一个**统一的 CLI 工具**，用于 Claude Code 远程开发通知系统。系统由两部分组成：

1. **Master 服务**（本地机器）：Fastify HTTP 服务器，接收通知请求并显示系统通知
2. **Agent Hooks**（远程机器）：通过 Claude Code 的 Prompt Hooks 自动发送通知

核心设计理念是**极简优于复杂** - 使用 HTTP + Prompt Hooks 而非 SSH/SFTP + 文件监听。

## 架构

### 项目结构

```
src/
├── cli.ts                 # CLI 入口，使用 commander
├── config.ts              # 环境变量配置（支持 .env）
├── commands/              # CLI 命令实现
│   ├── install.ts         # install 命令路由（master/agent）
│   └── start.ts           # start-master 命令（Fastify 服务器）
├── master/                # Master 服务相关
│   ├── installer.ts       # Master 安装逻辑（交互式配置）
│   ├── config.ts          # Master 配置读写（~/.mac-notify/master.json）
│   ├── notifier.ts        # 通知封装（node-notifier）
│   └── utils.ts           # 图标路径解析
├── agent/                 # Agent hooks 相关
│   ├── installer.ts       # Agent 安装逻辑（健康检查 + hooks 更新）
│   ├── config.ts          # Agent 配置读写（~/.mac-notify/agent.json）
│   ├── hooks.ts           # 生成 Claude hooks 配置
│   └── settings.ts        # Claude settings.json 操作
└── shared/                # 共享代码
    ├── types.ts           # NotifyRequest 等共享类型
    ├── health.ts          # Master 健康检查
    └── utils.ts           # URL 格式化等工具函数
```

### Master 服务（`src/commands/start.ts`）

- Fastify HTTP 服务器，支持 CORS
- **POST /notify**：接收通知请求，通过 Notifier 类发送系统通知
- **GET /health**：健康检查端点
- **Fire-and-forget 策略**：始终立即返回 200，通知失败不阻塞工作流
- **端口自动检测**：使用 `get-port` 包，配置端口被占用时自动查找可用端口

### Agent Hooks（`src/agent/`）

- **安装流程**：交互式获取 Master URL → 健康检查 → 自动更新 `~/.claude/settings.json`
- **Hook 生成**：`generateHookConfig()` 生成标准化的 hook 配置
- **配置合并**：`mergeHookConfig()` 智能合并现有的 hooks 数组
- **备份机制**：自动备份原 settings.json

## 开发命令

```bash
# 开发模式（直接运行 CLI）
npm run dev                    # tsx src/cli.ts
npm run dev:master             # tsx watch src/commands/start.ts（热重载）

# 构建和启动
npm run build                  # tsup 构建
npm run build:prod             # NODE_ENV=production tsup
npm start                      # node dist/cli.js
npm run start:master           # node dist/cli.js start-master

# 安装命令（使用 CLI）
mac-notify install master      # 交互式安装 Master 配置
mac-notify install agent       # 交互式安装 Agent hooks
mac-notify install agent --url http://localhost:8079 --auto  # 非交互式
mac-notify start-master        # 启动 Master 服务

# 代码质量
npm run format                 # Biome 格式化
npm run lint                   # Biome lint
npm run typecheck              # TypeScript 类型检查
npm run check                  # Biome 检查
npm run check:fix              # Biome 自动修复
npm run all                    # format + typecheck + lint
```

## 代码风格

- **格式化工具**：Biome（2 空格缩进、单引号、100 字符行宽）
- **代码检查**：Biome 推荐规则
- **TypeScript**：严格模式、ES2022 目标、ESNext 模块、bundler 解析
- **构建工具**：tsup（打包为单文件 CLI）
- 提交代码前务必运行 `npm run all`

## 核心设计决策

1. **Fire-and-forget**：通知失败绝不阻塞 Claude Code 的工作流。服务记录错误但始终返回 200。
2. **零代码 agent**：利用 Claude Code 的 Prompt Hooks，而非编写独立的 agent 代码。
3. **极简主义**：选择 HTTP 接口而非 SSH/SFTP，易于使用且可靠。
4. **配置即代码**：Agent 行为通过 Claude 的 hook 系统控制，而非编译代码。
5. **跨平台支持**：使用 node-notifier npm 包，自动处理 macOS/Windows/Linux 的通知差异。

## 配置系统

### 配置层级

1. **环境变量**（`.env` 或系统环境变量）- 最低优先级
2. **用户配置文件**（`~/.mac-notify/master.json`）- 中等优先级
3. **CLI 参数**（`--url`, `--host`, `--port`）- 最高优先级

### Master 服务配置

**环境变量**（`.env`）：
```bash
# 服务器配置
HOST=0.0.0.0
PORT=8079

# 日志配置
LOG_LEVEL=info

# 通知声音
NOTIFICATION_SOUND_QUESTION=Ping
NOTIFICATION_SOUND_ERROR=Basso
NOTIFICATION_SOUND_STOP=Glass
NOTIFICATION_SOUND_DEFAULT=default

# 通知图标
# icon: 应用图标（macOS 通知中心通常会强制使用发送应用的图标，此参数可能不生效）
NOTIFICATION_ICON=./assets/icons/claude.png

# contentImage: 通知内容图片（推荐使用，会在通知右侧显示）
NOTIFICATION_CONTENT_IMAGE=./assets/icons/claude.png

# 通知副标题
NOTIFICATION_SUBTITLE=Claude Code

# 通知超时（秒）
NOTIFICATION_TIMEOUT=5

# 是否等待用户交互
NOTIFICATION_WAIT=false
```

**用户配置文件**（`~/.mac-notify/master.json`）：
```json
{
  "host": "0.0.0.0",
  "port": 8079,
  "url": "http://100.103.79.86:8079"
}
```

### Agent Hooks 配置

**用户配置文件**（`~/.mac-notify/agent.json`）：
```json
{
  "masterUrl": "http://100.103.79.86:8079",
  "autoUpdate": true
}
```

**Claude Hooks**（`~/.claude/settings.json`）：
通过 `mac-notify install agent --auto` 自动添加，或手动添加：

```json
{
  "hooks": [
    {
      "matcher": "AskUserQuestion",
      "hooks": [
        {
          "type": "prompt",
          "prompt": "BEFORE asking the user a question, send a notification to http://YOUR_URL/notify with project details...",
          "statusMessage": "正在通知用户..."
        }
      ]
    }
  ]
}
```

## 核心实现细节

### Notifier 类（`src/master/notifier.ts`）

- 封装 `node-notifier`，支持自定义声音、图标、超时
- **声音映射**：`question → Ping`, `error → Basso`, `stop → Glass`, `success/info → default`
- **图标解析**：`resolveIconPath()` 处理相对路径（项目根目录）、绝对路径、URL
- **错误处理**：Fire-and-forget 策略，记录错误但不抛出异常

### 安装流程（`src/agent/installer.ts`）

1. 获取 Master URL（CLI 参数或交互式输入）
2. 健康检查（`checkMasterHealth()`）
3. 询问是否自动更新配置（`--auto` 可跳过）
4. 自动更新：
   - 备份 `~/.claude/settings.json`
   - 读取现有配置
   - 生成 hook 配置（`generateHookConfig()`）
   - 智能合并 hooks（`mergeHookConfig()`）
   - 写入更新后的配置
5. 保存 Agent 配置到 `~/.mac-notify/agent.json`

### 通信流程

```
远程机器 (Claude Code)
  ↓ 触发 AskUserQuestion
Prompt Hook 告诉 AI 发送通知
  ↓ AI 提取项目信息并构造 HTTP 请求
HTTP POST → Master 服务 (/notify)
  ↓ Notifier.send()（异步，不等待结果）
node-notifier 发送系统通知
  ↓ 立即返回 200（fire-and-forget）
```

## 通知 API

### POST /notify

**请求体：**
```json
{
  "title": "项目名称",
  "message": "通知消息",
  "type": "question | success | error | info | stop",
  "cwd": "项目目录名（可选，用作 subtitle 后备）",
  "subtitle": "副标题（可选，覆盖配置和 cwd）",
  "sound": "声音名称（可选，覆盖类型默认声音）",
  "icon": "图标路径（可选，覆盖配置）",
  "contentImage": "内容图片路径（可选，覆盖配置）",
  "timeout": 5,
  "wait": false,
  "open": "点击时打开的 URL（可选）",
  "closeLabel": "关闭按钮标签（可选）",
  "actions": ["操作1", "操作2"],
  "dropdownLabel": "下拉菜单标签（可选）",
  "reply": false
}
```

**参数说明：**
- **必需字段**：`title`, `message`, `type`
- **可选字段**：所有其他字段都是可选的，会覆盖配置文件中的默认值
- **参数优先级**：请求参数 > 配置文件默认值 > 内置默认值

**响应：**
```json
{
  "success": true,
  "message": "通知已发送"
}
```

**按类型区分的通知声音：**
- `error`：Basso
- `question`：Ping
- `stop`：Glass
- `success`/`info`：default

## 工具脚本

项目包含几个辅助脚本（位于 `scripts/` 目录）：

- **fix-notification-style.sh**：修改 macOS 通知样式为"横幅"以支持 contentImage
- **replace-notifier-icon.sh**：替换 terminal-notifier.app 的应用图标为 Claude 图标
- **test-notify.sh**：快速测试通知功能

详见 `scripts/README.md`。

## 测试

```bash
# 使用测试脚本
./scripts/test-notify.sh

# 或手动测试
curl http://localhost:8079/health

curl -X POST http://localhost:8079/notify \
  -H "Content-Type: application/json" \
  -d '{"title":"测试","message":"测试消息","project":"/test","cwd":"test","type":"question"}'
```

## 部署

### Master 服务（本地机器）

**方式 1：使用 CLI**
```bash
mac-notify install master      # 交互式配置
mac-notify start-master        # 启动服务
```

**方式 2：使用 LaunchAgent**（开机自启动）
创建 `~/Library/LaunchAgents/com.claude.notify.plist`：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claude.notify</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/YOUR_USERNAME/path/to/mac-notify/dist/cli.js</string>
        <string>start-master</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/Users/YOUR_USERNAME/path/to/mac-notify</string>
    <key>StandardOutPath</key>
    <string>/tmp/claude-notify.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/claude-notify.error.log</string>
</dict>
</plist>
```

加载服务：
```bash
launchctl load ~/Library/LaunchAgents/com.claude.notify.plist
launchctl unload ~/Library/LaunchAgents/com.claude.notify.plist  # 停止
```

### Agent Hooks（远程机器）

```bash
mac-notify install agent --url http://MASTER_URL:PORT --auto
```

或交互式：
```bash
mac-notify install agent
```

## 重要提示

- IP 地址 `100.103.79.86` 是 Tailscale 地址 - 请根据你的网络环境修改
- 必须为终端/Script Editor 启用 macOS 通知权限
- 系统设计用于内网环境 - 未实现身份验证
- 所有错误都会被记录，但绝不会传递给客户端（fire-and-forget）

## 文档

- `README.md`：完整的安装和部署指南
- `docs/REQUIREMENTS.md`：详细的需求文档和设计理由
- `docs/TESTING.md`：全面的测试指南和故障排查
- `scripts/README.md`：工具脚本说明
