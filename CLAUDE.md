# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

这是一个**极简的 HTTP 通知服务**，用于 Claude Code 远程开发场景。系统由两部分组成：

1. **Master 服务**（本地机器）：Fastify HTTP 服务器，接收通知请求并显示 macOS 系统通知
2. **Agent**（远程机器）：零代码实现，利用 Claude Code 的 Prompt Hooks 自动发送通知

核心设计理念是**极简优于复杂** - 使用 HTTP + Prompt Hooks 而非 SSH/SFTP + 文件监听。

## 架构

### Master 服务 (`src/server.ts`)

- 单文件 Fastify 服务器，监听 `http://100.103.79.86:8079`
- **POST /notify**：接收通知请求，通过 osascript 发送 macOS 通知
- **GET /health**：健康检查端点
- **Fire-and-forget 策略**：始终立即返回 200，通知失败不阻塞工作流

### Agent（远程机器）

- **零代码实现**：使用 Claude Code 的 Prompt Hooks 机制
- 通过 `agent/install.sh` 脚本安装配置
- Hooks 存储在远程机器的 `~/.claude/settings.json`
- 特定事件发生时（如 AskUserQuestion），AI 自动调用 HTTP 端点

### 通信流程

```
远程机器 (Claude Code)
  ↓ 触发 AskUserQuestion
Prompt Hook 告诉 AI 发送通知
  ↓ AI 提取项目信息并构造 HTTP 请求
HTTP POST → Master 服务 (/notify)
  ↓ 通过 osascript 发送
macOS 系统通知
```

## 开发命令

```bash
# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码质量
npm run format       # 使用 Biome 格式化代码
npm run lint         # 代码检查
npm run typecheck    # TypeScript 类型检查
npm run check        # 运行 Biome 检查
npm run check:fix    # 自动修复 Biome 问题
npm run all          # 运行 format + typecheck + lint
```

## 代码风格

- **格式化工具**：Biome（2 空格缩进、单引号、100 字符行宽）
- **代码检查**：Biome 推荐规则
- **TypeScript**：严格模式、ES2022 目标、Node16 模块
- 提交代码前务必运行 `npm run all`

## 核心设计决策

1. **Fire-and-forget**：通知失败绝不阻塞 Claude Code 的工作流。服务记录错误但始终返回 200。
2. **零代码 agent**：利用 Claude Code 的 Prompt Hooks，而非编写独立的 agent 代码。
3. **极简主义**：选择 HTTP 接口而非 SSH/SFTP，易于使用且可靠。
4. **配置即代码**：Agent 行为通过 Claude 的 hook 系统控制，而非编译代码。
5. **macOS 优先**：使用 osascript 发送通知；可扩展到 Linux（notify-send）或 Windows（PowerShell）。

## 配置

### Master 服务

编辑 `src/server.ts:93-94` 修改主机/端口：
```typescript
const host = '100.103.79.86';  // 你的 IP
const port = 8079;              // 你的端口
```

### Agent Hooks

Hooks 配置在远程机器的 `~/.claude/settings.json`。`agent/install.sh` 脚本可自动完成此设置。

Hook 配置示例：
```json
{
  "hooks": [
    {
      "matcher": "AskUserQuestion",
      "hooks": [
        {
          "type": "prompt",
          "prompt": "提问前先发送通知到 http://100.103.79.86:8079/notify...",
          "statusMessage": "正在通知用户..."
        }
      ]
    }
  ]
}
```

## 通知 API

### POST /notify

**请求体：**
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
- `success`/`info`：默认

## 测试

```bash
# 健康检查
curl http://100.103.79.86:8079/health

# 手动通知测试
curl -X POST http://100.103.79.86:8079/notify \
  -H "Content-Type: application/json" \
  -d '{"title":"测试","message":"测试消息","project":"/test","cwd":"test","type":"question"}'
```

## 部署

### 本地机器（Master）

使用 LaunchAgent 实现开机自启动。创建 `~/Library/LaunchAgents/com.claude.notify.plist`（完整示例见 README.md）。

### 远程机器（Agent）

```bash
bash agent/install.sh
```

脚本将：
1. 提示输入 Master 服务地址
2. 运行健康检查验证连接
3. 提供自动更新 `~/.claude/settings.json` 选项
4. 自动更新失败时创建备份

## 文档

- `README.md`：完整的安装和部署指南
- `docs/REQUIREMENTS.md`：详细的需求文档和设计理由
- `docs/TESTING.md`：全面的测试指南和故障排查

## 重要提示

- IP 地址 `100.103.79.86` 是 Tailscale 地址 - 请根据你的网络环境修改
- 必须为 Script Editor 启用 macOS 通知权限
- 系统设计用于内网环境 - 未实现身份验证
- 所有错误都会被记录，但绝不会传递给客户端（fire-and-forget）
