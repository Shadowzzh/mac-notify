# Claude Code 通知系统

一个极简的通知系统，用于在远程机器使用 Claude Code 时，将重要事件（如需要用户回答问题）通知到本地机器。

## 核心特性

- **极简架构** - HTTP 接口 + Prompt Hooks，无需复杂的状态管理
- **零代码 Agent** - 利用 Claude Code 的 Prompt Hooks，让 AI 自己调用通知接口
- **自动配置** - 安装脚本自动更新 settings.json，支持备份和恢复
- **健康检查** - 安装时自动验证 Master 服务连接
- **Fire-and-forget** - 通知失败不影响 Claude Code 工作流

## 架构设计

```
┌─────────────────┐                    ┌─────────────────┐
│  远程机器        │                    │  本地机器        │
│                 │                    │                 │
│  Claude Code    │                    │  Master 服务    │
│  ↓              │                    │  ↓              │
│  AskUserQuestion│  ──HTTP POST──→   │  /notify        │
│  (Prompt Hook)  │                    │  ↓              │
│                 │                    │  node-notifier  │
│                 │                    │  ↓              │
│                 │                    │  系统通知       │
└─────────────────┘                    └─────────────────┘
```

## 快速开始

### 1. 部署 Master 服务（本地机器）

```bash
npm install
npm run dev
```

验证服务:
```bash
curl http://100.103.79.86:8079/health
```

### 2. 安装 Agent（远程机器）

```bash
bash agent/install.sh
```

按提示操作:
1. 输入 Master 服务地址（或使用默认值）
2. 等待健康检查
3. 选择 `y` 自动更新配置

### 3. 测试

在远程机器上使用 Claude Code，当触发 AskUserQuestion 时，本地机器应该收到通知。

## 项目结构

```
claude-hook-notify/
├── src/                   # Master 服务源代码
│   └── server.ts          # Fastify HTTP 服务
├── agent/                 # Agent 工具
│   ├── install.sh         # 安装脚本
│   └── example.json       # 请求格式示例
├── docs/                  # 文档
│   ├── REQUIREMENTS.md    # 需求文档
│   └── TESTING.md         # 测试指南
├── package.json           # 依赖和脚本
├── tsconfig.json          # TypeScript 配置
├── biome.json             # Biome 配置
└── README.md              # 项目说明
```

## 接口文档

### POST /notify

发送通知请求。

**请求体:**
```json
{
  "title": "项目名称",
  "message": "通知消息",
  "project": "/完整/项目/路径",
  "cwd": "项目目录名",
  "type": "question | success | error | info",
  "timestamp": "2026-01-27T10:30:00Z",
  "action": "focus | none"
}
```

**响应:**
```json
{
  "success": true,
  "message": "通知已发送"
}
```

### GET /health

健康检查。

**响应:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-27T10:30:00Z"
}
```

## 配置说明

### 开发脚本

```bash
npm run dev          # 开发模式（热重载）
npm run build        # 构建生产版本
npm start            # 启动生产版本
npm run check        # 运行 Biome 检查
npm run check:fix    # 自动修复 Biome 问题
npm run lint         # 运行 Biome lint
npm run format       # 格式化代码
npm run typecheck    # TypeScript 类型检查
```

### Master 服务配置

默认配置:
- 监听地址: `100.103.79.86`
- 端口: `8079`

修改配置请编辑 `src/server.ts`:
```typescript
const host = '100.103.79.86';  // 修改为你的 IP
const port = 8079;              // 修改端口
```

#### 自定义通知图标

通知系统使用 `node-notifier`，支持自定义图标。在创建 `Notifier` 实例时传入配置：

```typescript
import { Notifier } from './master/notifier';

const notifier = new Notifier({
  // 自定义应用图标（macOS 通知中心通常会强制使用发送应用的图标，此参数可能不生效）
  icon: '/path/to/icon.png',

  // 自定义通知内容图片（推荐使用此参数，会在通知右侧显示图片）
  contentImage: '/path/to/icon.png',
  // 或使用 URL
  // contentImage: 'https://example.com/icon.png',

  // 自定义副标题（默认显示项目目录）
  subtitle: 'Claude Code',

  // 通知超时时间（秒，默认 5）
  timeout: 10,

  // 是否等待用户交互（默认 false）
  wait: false,

  // 自定义声音
  soundQuestion: 'Ping',
  soundError: 'Basso',
  soundDefault: 'default',
});
```

**图标格式支持：**
- **macOS**: PNG, ICNS
- **Windows**: PNG, ICO (< 1024x1024, < 200KB)
- **Linux**: PNG, JPG

**路径格式：**
- 相对路径（推荐）：`./assets/icons/claude.png`（相对于项目根目录）
- 绝对路径：`/Users/username/icon.png`
- HTTP/HTTPS URL：`https://example.com/icon.png`（自动下载缓存）
- 推荐尺寸：256x256 或 512x512 像素

### Agent 配置

配置文件位置: `~/.claude/settings.json`

Hook 配置示例:
```json
{
  "hooks": [
    {
      "matcher": "AskUserQuestion",
      "hooks": [
        {
          "type": "prompt",
          "prompt": "BEFORE asking the user a question, send a notification...",
          "statusMessage": "正在通知用户..."
        }
      ]
    }
  ]
}
```

## 生产部署

### 使用 LaunchAgent（推荐）

创建 `~/Library/LaunchAgents/com.claude.notify.plist`:

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
        <string>/Users/YOUR_USERNAME/path/to/master/dist/server.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

加载服务:
```bash
launchctl load ~/Library/LaunchAgents/com.claude.notify.plist
```

## 常见问题

### Q: 为什么选择 HTTP 接口而不是 SSH/SFTP？

A: HTTP 接口更简单、更可靠。不需要处理 SSH 连接、文件监听、状态同步等复杂问题。

### Q: 通知失败会影响 Claude Code 工作吗？

A: 不会。系统采用 fire-and-forget 策略，即使通知失败，Master 服务也返回 200，不会中断 Claude Code 的工作流。

### Q: 可以添加其他通知场景吗？

A: 可以。在 `~/.claude/settings.json` 中添加更多 hooks，例如 Task 工具完成、git push 等。

### Q: 如何查看 Master 服务日志？

A: 开发模式下日志直接输出到终端。生产模式使用 LaunchAgent 时，日志在 `/tmp/claude-notify.log`。

### Q: 支持其他操作系统吗？

A: 支持！使用 node-notifier 自动适配 macOS、Windows 和 Linux 的系统通知。

## 相关文档

- [docs/REQUIREMENTS.md](./docs/REQUIREMENTS.md) - 详细需求文档
- [docs/TESTING.md](./docs/TESTING.md) - 完整测试指南
- [agent/install.sh](./agent/install.sh) - Agent 安装脚本
- [agent/example.json](./agent/example.json) - 通知请求格式示例

## 技术栈

- **Master 服务**: Fastify + TypeScript + node-notifier
- **Agent 端**: Bash + Python 3 + Claude Code Hooks
- **网络**: Tailscale (内网穿透)

## 许可证

MIT

