# Claude Code 通知系统测试指南

## 测试环境准备

### 1. Master 端部署（本地机器）

```bash
npm install
npm run dev
```

验证服务启动:
```bash
curl http://100.103.79.86:8079/health
```

预期响应:
```json
{
  "status": "ok",
  "timestamp": "2026-01-27T10:30:00.000Z"
}
```

### 2. Agent 端安装（远程机器）

```bash
# 复制安装脚本到远程机器
scp agent/install.sh user@remote:/tmp/

# SSH 到远程机器
ssh user@remote

# 运行安装脚本
bash /tmp/install.sh
```

安装过程中:
1. 输入 Master 服务地址（或使用默认值）
2. 等待健康检查完成
3. 选择 `y` 自动更新 settings.json

## 手动测试

### 测试 1: 健康检查

**目的:** 验证 Master 服务可达

```bash
curl http://100.103.79.86:8079/health
```

**预期结果:**
- HTTP 状态码: 200
- 返回 JSON 包含 `status: "ok"`

### 测试 2: 手动发送通知

**目的:** 验证通知功能正常工作

```bash
curl -X POST http://100.103.79.86:8079/notify \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试项目",
    "message": "这是一条测试通知",
    "cwd": "project",
    "type": "question"
  }'
```

**预期结果:**
- HTTP 状态码: 200
- macOS 显示系统通知
- 通知标题: "测试项目"
- 通知内容: "这是一条测试通知"
- 通知声音: Ping

### 测试 3: 测试不同通知类型

**目的:** 验证不同类型的通知使用不同的声音

```bash
# 错误通知 (Basso 声音)
curl -X POST http://100.103.79.86:8079/notify \
  -H "Content-Type: application/json" \
  -d '{"title":"错误测试","message":"发生错误","project":"/test","cwd":"test","type":"error"}'

# 成功通知 (default 声音)
curl -X POST http://100.103.79.86:8079/notify \
  -H "Content-Type: application/json" \
  -d '{"title":"成功测试","message":"操作成功","project":"/test","cwd":"test","type":"success"}'

# 信息通知 (default 声音)
curl -X POST http://100.103.79.86:8079/notify \
  -H "Content-Type: application/json" \
  -d '{"title":"信息测试","message":"普通信息","project":"/test","cwd":"test","type":"info"}'
```

**预期结果:**
- 每个请求都返回 200
- 错误通知使用 Basso 声音
- 其他通知使用默认声音

## 集成测试

### 测试 4: Claude Code 集成测试

**目的:** 验证 Claude Code 触发 AskUserQuestion 时自动发送通知

**步骤:**

1. 在远程机器上进入任意项目目录:
```bash
cd ~/my-project
claude
```

2. 向 Claude 提出一个需要提问的任务:
```
请帮我重构这个函数,但先问我想用什么设计模式
```

3. 观察本地机器是否收到通知

**预期结果:**
- Claude 调用 AskUserQuestion 之前发送通知
- 本地机器显示系统通知
- 通知标题为项目名称 (如 "my-project")
- 通知消息描述了问题内容
- Master 服务日志显示收到请求

## 故障排查

### 问题 1: 无法连接到 Master 服务

**症状:** agent-install.sh 健康检查失败

**排查步骤:**

1. 检查 Master 服务是否运行:
```bash
# 在本地机器上
curl http://100.103.79.86:8079/health
```

2. 检查防火墙设置:
```bash
# macOS 检查防火墙
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

3. 检查 Tailscale 连接:
```bash
# 在远程机器上
ping 100.103.79.86
```

**解决方案:**
- 确保 Master 服务已启动 (`npm run dev`)
- 确保 Tailscale 连接正常
- 检查 IP 地址是否正确

### 问题 2: Claude 没有发送通知

**症状:** 使用 Claude Code 时,AskUserQuestion 触发但没有收到通知

**排查步骤:**

1. 检查 hooks 配置是否正确:
```bash
# 在远程机器上
cat ~/.claude/settings.json | grep -A 10 "AskUserQuestion"
```

2. 检查 Claude Code 是否加载了 hooks:
```bash
# 查看 Claude Code 启动日志
# 应该看到 "Loading hooks..." 相关信息
```

3. 手动测试通知接口:
```bash
curl -X POST http://100.103.79.86:8079/notify \
  -H "Content-Type: application/json" \
  -d '{"title":"test","message":"test","project":"/test","cwd":"test","type":"question"}'
```

**解决方案:**
- 重新运行 `agent-install.sh` 并选择自动更新配置
- 检查 settings.json 格式是否正确(有效的 JSON)
- 重启 Claude Code 会话

### 问题 3: macOS 不显示通知

**症状:** Master 服务收到请求但系统不显示通知

**排查步骤:**

1. 检查 macOS 通知权限:
```
系统设置 -> 通知 -> Node
确保允许通知
```

2. 测试 node-notifier 是否正常:
```bash
# 发送测试通知
curl -X POST http://127.0.0.1:8079/notify \
  -H "Content-Type: application/json" \
  -d '{"title":"测试","message":"测试消息","project":"/test","cwd":"test","type":"info"}'
```

3. 检查 Master 服务日志:
```bash
# 查看是否有通知发送错误
```

**解决方案:**
- 启用 Node 的通知权限
- 检查"勿扰模式"是否开启
- 重启 Master 服务
- 确保 node-notifier 已正确安装: `npm install`

### 问题 4: settings.json 自动更新失败

**症状:** agent-install.sh 报告更新失败

**排查步骤:**

1. 检查 Python 是否安装:
```bash
python3 --version
```

2. 手动验证 JSON 格式:
```bash
cat ~/.claude/settings.json | python3 -m json.tool
```

3. 检查文件权限:
```bash
ls -la ~/.claude/settings.json
```

**解决方案:**
- 安装 Python 3
- 修复 settings.json 的 JSON 格式错误
- 调整文件权限: `chmod 644 ~/.claude/settings.json`
- 使用手动配置方式

## 性能测试

### 测试 5: 通知延迟测试

**目的:** 验证通知的响应时间

```bash
time curl -X POST http://100.103.79.86:8079/notify \
  -H "Content-Type: application/json" \
  -d '{"title":"延迟测试","message":"测试消息","project":"/test","cwd":"test","type":"info"}'
```

**预期结果:**
- 请求响应时间 < 100ms
- 通知显示延迟 < 500ms

### 测试 6: 并发通知测试

**目的:** 验证系统处理多个并发通知的能力

```bash
for i in {1..5}; do
  curl -X POST http://100.103.79.86:8079/notify \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"并发测试 $i\",\"message\":\"消息 $i\",\"project\":\"/test\",\"cwd\":\"test\",\"type\":\"info\"}" &
done
wait
```

**预期结果:**
- 所有请求都成功返回 200
- 所有通知都正常显示
- 无请求丢失或错误

## 验收标准

系统通过验收需要满足以下所有条件:

### 功能性
- ✅ Master 服务能够正常启动并监听指定端口
- ✅ `/health` 端点返回正确的健康状态
- ✅ `/notify` 端点能够接收并处理通知请求
- ✅ macOS 系统通知能够正常显示
- ✅ 不同类型的通知使用不同的声音

### 集成性
- ✅ agent-install.sh 能够成功安装并配置 hooks
- ✅ 健康检查能够正确验证 Master 服务连接
- ✅ 自动配置功能能够正确更新 settings.json
- ✅ Claude Code 触发 AskUserQuestion 时自动发送通知

### 可靠性
- ✅ Master 服务即使通知失败也返回 200 (fire-and-forget)
- ✅ 配置更新失败时能够恢复备份
- ✅ 网络异常时有明确的错误提示

### 性能
- ✅ 通知请求响应时间 < 100ms
- ✅ 能够处理并发通知请求
- ✅ 系统资源占用合理

## 部署检查清单

### Master 端（本地机器）

- [ ] Node.js 已安装（v18+）
- [ ] 依赖已安装（`npm install`）
- [ ] 服务能够启动（`npm run dev`）
- [ ] 健康检查通过（`curl http://100.103.79.86:8079/health`）
- [ ] macOS 通知权限已启用
- [ ] 防火墙配置正确

### Agent 端（远程机器）

- [ ] Python 3 已安装
- [ ] curl 已安装
- [ ] Tailscale 连接正常
- [ ] agent-install.sh 执行成功
- [ ] ~/.claude/settings.json 配置正确
- [ ] 健康检查通过

### 验证步骤

1. 手动测试通知接口
2. 在远程机器上启动 Claude Code
3. 触发 AskUserQuestion 场景
4. 确认本地机器收到通知

