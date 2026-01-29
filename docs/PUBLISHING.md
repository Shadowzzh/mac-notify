# NPM 发布指南

本文档介绍如何将 `mac-notify` 发布到 NPM。

## 前置准备

### 1. 注册 NPM 账号

如果还没有 NPM 账号，请访问 [npmjs.com](https://www.npmjs.com/) 注册。

### 2. 登录 NPM

```bash
npm login
```

输入你的用户名、密码和邮箱。

### 3. 验证登录状态

```bash
npm whoami
```

## 发布前检查

### 1. 更新版本号

根据语义化版本规范更新 `package.json` 中的版本号：

```bash
# 补丁版本（bug 修复）：1.0.0 -> 1.0.1
npm version patch

# 次版本（新功能，向后兼容）：1.0.0 -> 1.1.0
npm version minor

# 主版本（破坏性变更）：1.0.0 -> 2.0.0
npm version major
```

或手动编辑 `package.json` 中的 `version` 字段。

### 2. 更新 GitHub 仓库地址

编辑 `package.json`，将以下内容中的 `YOUR_USERNAME` 替换为你的 GitHub 用户名：

```json
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/YOUR_USERNAME/mac-notify.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/mac-notify/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/mac-notify#readme"
}
```

### 3. 检查包名可用性

```bash
npm view mac-notify
```

如果包名已被占用，需要修改 `package.json` 中的 `name` 字段，例如：
- `@your-username/mac-notify`（作用域包）
- `mac-notify-cli`
- `claude-mac-notify`

### 4. 运行测试和检查

```bash
npm run all
```

这会运行格式化、类型检查和 lint。

### 5. 构建生产版本

```bash
npm run build:prod
```

### 6. 测试本地安装

```bash
# 在项目目录外测试
cd /tmp
npm pack /path/to/mac-notify
npm install -g mac-notify-1.0.0.tgz
mac-notify --help
```

