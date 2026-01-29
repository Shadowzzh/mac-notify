# Claude Code 通知系统需求文档

## 项目背景

在远程机器上使用 Claude Code 工作时，需要一个通知系统来及时告知本地机器任务状态（如需要用户回答问题、任务完成等）。

## 核心理念

**极简化架构** - 相比原方案（SSH/SFTP + 文件监听 + 状态管理），新方案采用 HTTP 接口 + Prompt Hooks 的方式，大幅简化实现。

---

## 架构设计

### Master 端（本地机器）

**职责：** 接收通知请求并发送系统通知

**实现方式：**
- Fastify HTTP 服务
- 监听地址：`http://100.103.79.86:8079`
- 不关心通知内容的业务逻辑，只负责展示

**核心接口：**
- `POST /notify` - 接收通知请求，发送 macOS 系统通知
- `GET /health` - 健康检查（可选）

### Agent 端（远程机器）

**职责：** 在特定事件发生时触发通知

**实现方式：**
- **零代码** - 不需要编写 Agent 程序
- 使用 Claude Code 的 **Prompt Hooks** 机制
- 让 AI 自己根据 prompt 指令调用 HTTP 接口

**工作原理：**
1. Claude Code 触发 hook（如 `AskUserQuestion`）
2. Prompt hook 告诉 AI 需要调用通知接口
3. AI 从上下文中提取项目信息（工作目录等）
4. AI 构造 HTTP 请求并调用 Master 接口

---

## 通知触发场景

### 1. 用户提问（AskUserQuestion）
- **触发时机：** Claude 需要向用户提问时
- **通知类型：** `question`
- **消息示例：** "有问题需要回答"

### 2. 其他场景（待讨论）
- 任务完成（长时间任务）
- 错误发生
- 特定工具调用（git push、部署等）

---

## 接口格式设计

### 请求格式

```json
{
  "title": "项目名称",
  "message": "通知消息内容",
  "type": "question | success | error | info | stop",
  "cwd": "项目目录名（可选）",
  "subtitle": "副标题（可选，覆盖配置）",
  "sound": "声音名称（可选，覆盖类型默认）",
  "timeout": 5,
  "wait": false
}
```

### 字段说明

#### 必需字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| title | string | 通知标题 | "claude-hook-notify" |
| message | string | 通知消息内容 | "有问题需要回答" |
| type | string | 通知类型 | "question" / "success" / "error" / "info" / "stop" |

#### 可选字段（覆盖配置默认值）

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| cwd | string | 当前工作目录名（用作 subtitle 后备） | "claude-hook-notify" |
| subtitle | string | 副标题（覆盖配置） | "重要通知" |
| sound | string | 声音名称（覆盖类型默认） | "Ping" / "Basso" / "Glass" |
| icon | string | 图标路径（覆盖配置） | "/path/to/icon.png" |
| contentImage | string | 内容图片路径（覆盖配置） | "/path/to/image.png" |
| timeout | number | 通知超时时间（秒） | 5 |
| wait | boolean | 是否等待用户交互 | false |
| open | string | 点击时打开的 URL | "https://example.com" |
| actions | array | 操作按钮列表 | ["查看", "忽略"] |
| reply | boolean | 是否允许用户回复 | true |

### 响应格式

```json
{
  "success": true,
  "message": "通知已发送"
}
```

---

## Prompt 设计

### 核心要求

Prompt 需要让 AI 能够：
1. 理解需要调用 HTTP 接口
2. 从上下文中提取项目信息（工作目录）
3. 构造符合格式的 JSON 请求
4. 发送 POST 请求到 Master 服务

### Prompt 示例（AskUserQuestion）

```
立即调用 HTTP 接口通知用户有问题需要回答。

接口信息：
- URL: http://100.103.79.86:8079/notify
- 方法: POST
- Content-Type: application/json

请求体格式参考: ~/.claude/hooks/notify/example.json

重要：你需要从当前工作目录中提取项目信息：
- cwd: 当前工作目录的最后一级目录名
- title: 项目名称
- message: 描述具体问题
- type: 设置为 'question'
```

---

## 部署方案

### Master 部署（本地机器）

**方式一：系统服务（推荐）**
- 使用 macOS LaunchAgent
- 开机自启动
- 后台运行

**方式二：手动启动**
- 需要时运行 `npm start`
- 适合临时使用

### Agent 部署（远程机器）

**安装步骤：**
1. 运行安装脚本 `agent-install.sh`
2. 脚本自动创建 `~/.claude/hooks/notify/example.json`
3. 脚本输出 hooks 配置
4. 手动将配置添加到 `~/.claude/settings.json`

---

## 待讨论问题

### 1. 通知场景
- 除了 AskUserQuestion，还需要哪些场景？
- 如何判断"长时间任务"（需要通知任务完成）？

### 2. 接口格式
- 当前字段是否足够？
- 是否需要时间戳、优先级、声音等字段？

### 3. 安全性
- 是否需要鉴权（Token/IP 白名单）？
- 内网使用是否可以不鉴权？

### 4. Master 功能
- 是否需要通知历史记录？
- 是否需要日志功能？
- 是否需要配置文件（通知声音、样式等）？

### 5. 项目结构
- 是否需要 monorepo 结构？
- 还是简化为单个 Master 服务 + 安装脚本？

---

## 技术栈

### Master
- **框架：** Fastify
- **通知：** node-notifier (跨平台)
- **语言：** TypeScript / Node.js

### Agent
- **实现：** Bash 安装脚本
- **配置：** JSON (Claude Code hooks)

---

## 下一步

1. 确认需求和待讨论问题
2. 设计最终的接口格式
3. 实现 Master HTTP 服务
4. 完善 Agent 安装脚本
5. 测试完整流程
