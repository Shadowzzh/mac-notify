# 统一 CLI 工具重构计划

## 目标

将 mac-notify 项目重构为统一的 CLI 工具，支持：
- `mac-notify install master` - 在本地机器安装 master 服务
- `mac-notify install agent` - 在远程机器安装 agent hooks

## 项目结构

```
mac-notify/
├── package.json              # 更新为 CLI 工具配置
├── tsconfig.json             # TypeScript 配置
├── biome.json                # Biome 配置
├── src/
│   ├── cli.ts               # CLI 入口（使用 commander）
│   ├── types.ts             # 共享类型定义
│   ├── commands/
│   │   ├── install.ts       # install 命令主逻辑
│   │   ├── uninstall.ts     # uninstall 命令
│   │   └── status.ts        # status 命令
│   ├── master/
│   │   ├── server.ts        # Fastify 服务器（现有代码）
│   │   ├── installer.ts     # master 安装逻辑
│   │   └── launchd.ts       # LaunchAgent 配置生成
│   ├── agent/
│   │   ├── installer.ts     # agent 安装逻辑
│   │   ├── hooks.ts         # hooks 配置生成
│   │   └── settings.ts      # settings.json 操作
│   └── shared/
│       ├── config.ts        # 配置管理
│       ├── health.ts        # 健康检查
│       └── utils.ts         # 工具函数
├── bin/
│   └── mac-notify.js        # 可执行文件入口
└── README.md                # 更新文档
```

## 实现步骤

### 阶段 1：项目基础设置

1. **更新 package.json**
   - 修改包名为 `mac-notify`
   - 添加 `bin` 字段指向 CLI 入口
   - 添加新依赖：`commander`、`prompts`
   - 更新构建脚本

2. **创建目录结构**
   - 创建 `src/commands/`、`src/master/`、`src/agent/`、`src/shared/` 目录
   - 创建 `bin/` 目录

3. **创建类型定义**
   - 创建 `src/types.ts` 定义共享类型

### 阶段 2：重构 Master 服务

4. **移动现有 server.ts**
   - 将 `src/server.ts` 移动到 `src/master/server.ts`
   - 重构为可导出的函数而非立即执行

5. **创建 Master 安装器**
   - 创建 `src/master/installer.ts`
   - 实现安装逻辑：配置生成、服务启动、健康检查

6. **创建 LaunchAgent 生成器**
   - 创建 `src/master/launchd.ts`
   - 生成 macOS LaunchAgent plist 文件

### 阶段 3：重构 Agent 安装

7. **创建 Agent 安装器**
   - 创建 `src/agent/installer.ts`
   - 将 `agent/install.sh` 的逻辑用 TypeScript 重写

8. **创建 Hooks 配置生成器**
   - 创建 `src/agent/hooks.ts`
   - 生成 Claude Code hooks 配置

9. **创建 Settings 操作模块**
   - 创建 `src/agent/settings.ts`
   - 实现读取、合并、写入 `~/.claude/settings.json` 的逻辑

### 阶段 4：共享模块

10. **创建配置管理模块**
    - 创建 `src/shared/config.ts`
    - 实现配置文件读写（`~/.mac-notify/config.json`）

11. **创建健康检查模块**
    - 创建 `src/shared/health.ts`
    - 实现 HTTP 健康检查逻辑

12. **创建工具函数模块**
    - 创建 `src/shared/utils.ts`
    - 实现通用工具函数（文件操作、提示等）

### 阶段 5：CLI 命令

13. **创建 CLI 入口**
    - 创建 `src/cli.ts`
    - 使用 `commander` 定义命令结构

14. **实现 install 命令**
    - 创建 `src/commands/install.ts`
    - 实现 `install master` 和 `install agent` 逻辑

15. **实现 uninstall 命令**
    - 创建 `src/commands/uninstall.ts`
    - 实现卸载逻辑

16. **实现 status 命令**
    - 创建 `src/commands/status.ts`
    - 实现状态检查逻辑

### 阶段 6：构建和测试

17. **创建可执行文件入口**
    - 创建 `bin/mac-notify.js`
    - 添加 shebang 和入口代码

18. **更新构建配置**
    - 更新 `tsconfig.json`
    - 配置多入口构建（CLI + Server）

19. **本地测试**
    - 使用 `npm link` 测试 CLI
    - 测试 `install master` 命令
    - 测试 `install agent` 命令

### 阶段 7：文档更新

20. **更新 README.md**
    - 更新安装说明
    - 更新使用示例
    - 添加 CLI 命令文档

21. **更新 CLAUDE.md**
    - 更新项目概述
    - 更新开发命令
    - 更新架构说明

## 关键技术决策

### 1. CLI 框架
- 使用 `commander` - 成熟、轻量、API 清晰

### 2. 交互式提示
- 使用 `prompts` - 轻量、现代、TypeScript 友好

### 3. 构建策略
- 使用 `tsup` 替代 `tsc` - 更快、支持多入口、自动生成 shebang

### 4. 配置存储
- Master 配置：`~/.mac-notify/master.json`
- Agent 配置：`~/.mac-notify/agent.json`
- 全局配置：`~/.mac-notify/config.json`

### 5. 向后兼容
- 保留 `agent/install.sh` 作为备用方案
- 在文档中说明两种安装方式

## 依赖变更

### 新增依赖
```json
{
  "commander": "^12.0.0",
  "prompts": "^2.4.2",
  "tsup": "^8.3.5"
}
```

### 新增 devDependencies
```json
{
  "@types/prompts": "^2.4.9"
}
```

## 测试计划

### 单元测试（可选，后续添加）
- 配置管理模块测试
- Hooks 生成逻辑测试
- Settings 合并逻辑测试

### 集成测试
1. 本地测试 `install master`
2. 本地测试 `install agent`
3. 测试 `uninstall` 命令
4. 测试 `status` 命令
5. 端到端测试：完整的通知流程

## 风险和缓解

### 风险 1：破坏现有功能
- **缓解**：保留原有 Bash 脚本作为备用
- **缓解**：充分测试后再发布

### 风险 2：跨平台兼容性
- **缓解**：先专注 macOS，后续扩展 Linux/Windows
- **缓解**：使用 Node.js 内置 API 而非系统命令

### 风险 3：用户迁移成本
- **缓解**：提供详细的迁移指南
- **缓解**：保持 API 兼容性

## 成功标准

1. ✅ CLI 工具可以全局安装
2. ✅ `mac-notify install master` 成功安装并启动服务
3. ✅ `mac-notify install agent` 成功配置 hooks
4. ✅ 端到端通知流程正常工作
5. ✅ 文档完整且清晰
6. ✅ 代码通过所有检查（format、typecheck、lint）

## 时间线（仅供参考）

- 阶段 1-2：基础设置和 Master 重构
- 阶段 3-4：Agent 重构和共享模块
- 阶段 5-6：CLI 命令和构建
- 阶段 7：文档更新和发布

## 下一步

开始实现阶段 1：项目基础设置
