# 图标替换指南

## 概述

本项目提供两个辅助脚本来优化 macOS 通知的视觉体验，使其具有统一的 Claude 品牌形象：

- **`fix-notification-style.sh`** - 修改通知样式为"横幅"，支持右侧图片显示
- **`replace-notifier-icon.sh`** - 替换 terminal-notifier.app 的应用图标为 Claude 图标

---

## macOS 应用图标原理

### 1. 应用包结构

macOS 应用（`.app`）实际上是一个目录（包），内部结构如下：

```
terminal-notifier.app/
└── Contents/
    ├── Info.plist              # 应用配置文件
    ├── MacOS/
    │   └── terminal-notifier    # 可执行文件
    └── Resources/
        └── Terminal.icns        # ← 应用图标文件
```

**关键点**：`Info.plist` 中通过 `CFBundleIconFile` 键指定图标文件：

```xml
<key>CFBundleIconFile</key>
<string>Terminal</string>
```

系统会自动在 `Contents/Resources/` 目录下查找 `Terminal.icns` 文件作为应用图标。

---

### 2. `.icns` 文件格式

`.icns` 是 macOS 的专用图标格式，**包含多个尺寸**的同一张图片：

| 尺寸 | 用途 |
|------|------|
| 16x16, 32x32 | Dock 最小尺寸 |
| 128x128 | Finder 列表视图 |
| 256x256 | Finder 图标视图 |
| 512x512, 1024x1024 | Retina 显示、通知中心 |

macOS 系统会根据显示场景自动选择合适的尺寸，确保在不同设备上都有清晰的显示效果。

---

### 3. 图标替换原理

```
用户看到的图标
      ↓
系统读取 Info.plist，找到 CFBundleIconFile = "Terminal"
      ↓
系统加载 Contents/Resources/Terminal.icns
      ↓
从 .icns 中提取合适尺寸的图片显示
      ↓
【替换原理】直接替换 Terminal.icns 文件内容 → 系统自动加载新图标
```

**核心思路**：因为系统只关心文件名（`Terminal.icns`），所以我们可以直接替换文件内容，保持文件名不变。

---

## 脚本说明

### 脚本 1: `fix-notification-style.sh`

#### 功能

将 terminal-notifier 的通知样式从"提醒"改为"横幅"。

#### 为什么需要这个？

- **"提醒"样式**：
  - 通知会保留在通知中心
  - **不支持 `contentImage` 参数**
  - 用户需要手动关闭

- **"横幅"样式**：
  - 通知临时显示，自动消失
  - **支持 `contentImage` 参数**（可在通知右侧显示 Claude 图标）
  - 更适合即时通知场景

#### 实现原理

macOS 将通知配置存储在 `~/Library/Preferences/com.apple.ncprefs.plist` 中。

1. **备份原配置**：
   ```bash
   cp ~/Library/Preferences/com.apple.ncprefs.plist \
      ~/Library/Preferences/com.apple.ncprefs.plist.backup
   ```

2. **查找 terminal-notifier 配置索引**：
   ```bash
   plutil -p "$PLIST" | grep -B 5 "terminal-notifier"
   ```

3. **修改 flags 值**：
   - 当前 flags: `41951310` (0x280204e)
   - 添加 bit 5 (32) 启用横幅样式
   - 新 flags: `41951342` (0x280206e)
   ```bash
   /usr/libexec/PlistBuddy -c "Set :apps:$INDEX:flags 41951342" "$PLIST"
   ```

4. **重启通知中心**：
   ```bash
   killall NotificationCenter
   ```

#### 使用方法

```bash
cd /path/to/mac-notify
bash scripts/fix-notification-style.sh
```

**预期输出**：
```
正在修改 terminal-notifier 的通知样式...
找到 terminal-notifier 配置，索引: 12
✓ 成功修改通知样式
✓ 新 flags: 41951342

请执行以下命令重启通知中心：
killall NotificationCenter
```

---

### 脚本 2: `replace-notifier-icon.sh`

#### 功能

将 terminal-notifier.app 的默认 Terminal 图标替换为 Claude 图标。

#### 为什么需要这个？

- macOS 通知左侧会显示**发送通知的应用图标**
- 默认是终端的黑色图标，与 Claude 品牌不符
- 替换成 Claude 图标后，通知具有统一的品牌形象，更易于识别

#### 实现步骤

##### Step 1: 生成多尺寸图标

使用 `sips`（Scriptable Image Processing System）将单张 Claude.png 缩放到不同尺寸：

```bash
sips -z 16 16     "$ICON_PNG" --out "$ICONSET/icon_16x16.png"
sips -z 32 32     "$ICON_PNG" --out "$ICONSET/icon_16x16@2x.png"
sips -z 128 128   "$ICON_PNG" --out "$ICONSET/icon_128x128.png"
# ... 生成 8 种不同尺寸
```

##### Step 2: 转换为 .icns 格式

使用 `iconutil`（Apple 官方工具）将图标集打包成 `.icns` 文件：

```bash
iconutil -c icns "$ICONSET" -o "$TEMP_DIR/claude.icns"
```

##### Step 3: 备份并替换图标

```bash
# 备份原始图标
cp "$ORIGINAL_ICON" "$BACKUP_ICON"

# 替换为新图标
cp "$TEMP_DIR/claude.icns" "$ORIGINAL_ICON"
```

##### Step 4: 刷新系统缓存

```bash
touch "$NOTIFIER_APP"           # 更新应用修改时间
killall Dock                    # 重启 Dock
killall NotificationCenter      # 重启通知中心
```

**为什么需要这步？**
- macOS 会缓存应用图标以提高性能
- `touch` 更新文件时间戳，告诉系统"这个应用变了"
- `killall` 强制相关进程重新加载图标

#### 使用方法

```bash
cd /path/to/mac-notify
bash scripts/replace-notifier-icon.sh
```

**预期输出**：
```
=========================================
替换 terminal-notifier.app 图标
=========================================

✓ 找到源图标: /path/to/mac-notify/assets/icons/claude.png
✓ 找到 terminal-notifier.app

备份原始图标...
✓ 备份完成: Terminal.icns.backup

生成不同尺寸的图标...
✓ 图标尺寸生成完成

转换为 .icns 格式...
✓ .icns 文件生成成功

替换 terminal-notifier.app 的图标...
✓ 图标替换成功

清理临时文件...
✓ 清理完成

刷新系统图标缓存...
✓ 图标缓存已刷新

=========================================
✓ 图标替换完成
=========================================

说明：
- 原始图标已备份为: Terminal.icns.backup
- 新图标已应用到 terminal-notifier.app
- 通知中心和 Dock 已重启

现在发送通知时，左侧的应用图标也会显示为 Claude 图标
```

---

## 使用场景

### 首次安装

```bash
# 1. 安装依赖
npm install

# 2. 替换应用图标（左侧 Claude 图标）
bash scripts/replace-notifier-icon.sh

# 3. 修改通知样式（支持右侧图片）
bash scripts/fix-notification-style.sh

# 4. 启动 Master 服务
npm run dev
```

### npm 升级后

```bash
# 每次 npm install 后，terminal-notifier.app 可能被重新安装
# 需要重新运行图标替换脚本

bash scripts/replace-notifier-icon.sh
```

**提示**：原始图标已备份为 `Terminal.icns.backup`，如果需要恢复：

```bash
# 恢复原始图标
cp node_modules/.pnpm/node-notifier@*/node_modules/node-notifier/vendor/mac.noindex/terminal-notifier.app/Contents/Resources/Terminal.icns.backup \
   node_modules/.pnpm/node-notifier@*/node_modules/node-notifier/vendor/mac.noindex/terminal-notifier.app/Contents/Resources/Terminal.icns

# 重启 Dock 和通知中心
killall Dock NotificationCenter
```

---

## 视觉效果对比

### 替换前

```
┌─────────────────────────────────────┐
│  [终端黑色图标]  测试项目            │
│                  这是一条测试通知    │
│                  [无右侧图片]         │
└─────────────────────────────────────┘
```

### 替换后

```
┌─────────────────────────────────────┐
│  [Claude 图标]  测试项目    [Claude] │
│                  这是一条测试通知    │
└─────────────────────────────────────┘
```

**改进点**：
- ✓ 左侧应用图标：Terminal → Claude
- ✓ 右侧内容图片：无 → Claude logo（仅在横幅样式下显示）
- ✓ 整体风格：统一 Claude 品牌形象

---

## 故障排查

### 问题 1: 通知右侧不显示 Claude 图片

**症状**：通知左侧显示 Claude 图标，但右侧没有图片

**原因**：通知样式为"提醒"而非"横幅"

**解决方案**：
```bash
# 运行通知样式修复脚本
bash scripts/fix-notification-style.sh

# 重启通知中心
killall NotificationCenter
```

**手动验证**：
```
系统设置 -> 通知 -> terminal-notifier
确保通知样式为 "横幅" 而非 "提醒"
```

---

### 问题 2: 图标替换后仍显示 Terminal 图标

**症状**：脚本执行成功，但通知仍显示黑色终端图标

**排查步骤**：

1. **验证图标文件是否替换成功**：
   ```bash
   ls -lh node_modules/.pnpm/node-notifier@*/node_modules/node-notifier/vendor/mac.noindex/terminal-notifier.app/Contents/Resources/Terminal.icns
   ```

2. **检查 .icns 文件是否有效**：
   ```bash
   # 使用 iconutil 验证
   iconutil -l node_modules/.pnpm/node-notifier@*/node_modules/node-notifier/vendor/mac.noindex/terminal-notifier.app/Contents/Resources/
   ```

3. **强制刷新图标缓存**：
   ```bash
   # 清理图标缓存
   sudo rm -rf /Library/Caches/com.apple.iconservices*
   rm -rf ~/Library/Caches/com.apple.iconservices*

   # 重启相关进程
   killall Dock
   killall NotificationCenter
   killall Finder
   ```

4. **检查通知权限设置**：
   ```
   系统设置 -> 通知 -> terminal-notifier
   确保允许通知且通知样式为 "横幅"
   ```

---

### 问题 3: npm install 后图标丢失

**症状**：每次运行 `npm install` 后，图标恢复为 Terminal 默认图标

**原因**：npm 重新安装了 `node-notifier` 包，覆盖了图标文件

**解决方案**：

**方式 1：手动重新运行脚本（推荐）**
```bash
npm install
bash scripts/replace-notifier-icon.sh
```

**方式 2：使用 postinstall 脚本（自动）**

在 `package.json` 中添加：
```json
{
  "scripts": {
    "postinstall": "bash scripts/replace-notifier-icon.sh"
  }
}
```

**注意**：自动运行会增加安装时间，建议仅在需要时手动运行。

---

### 问题 4: 脚本报错 "找不到 terminal-notifier.app"

**症状**：
```
错误: 找不到 terminal-notifier.app: /path/to/node_modules/...
```

**原因**：
- `node-notifier` 包未安装
- 使用了不同的包管理器（npm vs pnpm）

**解决方案**：

1. **确认包管理器**：
   ```bash
   # 检查使用的包管理器
   ls node_modules | grep node-notifier
   ```

2. **查找正确路径**：
   ```bash
   # 查找 terminal-notifier.app
   find node_modules -name "terminal-notifier.app" -type d
   ```

3. **修改脚本路径**（如果使用不同的包管理器）：
   ```bash
   # 编辑 scripts/replace-notifier-icon.sh
   # 修改 NOTIFIER_APP 变量为实际路径
   ```

---

### 问题 5: sips 或 iconutil 命令不存在

**症状**：
```
sips: command not found
iconutil: command not found
```

**原因**：脚本依赖 macOS 系统工具，这些工具在标准 macOS 安装中都应该存在

**解决方案**：

1. **检查工具是否在 PATH 中**：
   ```bash
   which sips
   which iconutil
   ```

2. **使用完整路径**：
   ```bash
   /usr/bin/sips -z 16 16 ...
   /usr/bin/iconutil -c icns ...
   ```

3. **如果工具确实不存在**：
   - 确保 macOS 系统完整
   - 尝试安装 Xcode Command Line Tools：
     ```bash
     xcode-select --install
     ```

---

## 技术细节

### .icns 文件结构

使用 `iconutil` 可以查看 .icns 文件的内部结构：

```bash
# 将 .icns 转换回 iconset
iconutil -c iconset claude.icns

# 查看生成的文件
ls claude.iconset/
# icon_16x16.png
# icon_16x16@2x.png
# icon_32x32.png
# icon_32x32@2x.png
# icon_128x128.png
# icon_128x128@2x.png
# icon_256x256.png
# icon_256x256@2x.png
# icon_512x512.png
# icon_512x512@2x.png
```

### 通知 flags 解析

macOS 通知配置中的 flags 是一个位掩码（bitmask）：

```python
flags = 41951310  # 0x280204e

# 各位的含义：
# bit 0 (1):    允许通知
# bit 1 (2):    允许声音
# bit 2 (4):    横幅样式
# bit 3 (8):    提醒样式
# bit 5 (32):   显示预览
# ...
```

脚本通过添加 bit 5 (32) 来启用横幅样式：
```python
new_flags = 41951310 | 32  # = 41951342 (0x280206e)
```

---

## 最佳实践

### 1. 开发环境配置

首次设置项目时，按以下顺序执行：

```bash
# 1. 克隆项目并安装依赖
git clone <repo-url>
cd mac-notify
npm install

# 2. 替换应用图标
bash scripts/replace-notifier-icon.sh

# 3. 修改通知样式
bash scripts/fix-notification-style.sh

# 4. 测试通知功能
npm run dev
curl http://localhost:8079/health
./scripts/test-notify.sh
```

### 2. 图标资源管理

自定义图标时，遵循以下规范：

- **文件格式**：PNG（支持透明通道）
- **推荐尺寸**：1024x1024（高分辨率）
- **文件位置**：`assets/icons/claude.png`
- **命名规范**：使用有意义的文件名

创建自定义图标的命令：

```bash
# 1. 将自定义图标放到项目目录
cp /path/to/your-icon.png assets/icons/claude.png

# 2. 重新运行替换脚本
bash scripts/replace-notifier-icon.sh
```

### 3. 版本控制

**应该提交**：
- ✓ 脚本文件（`scripts/*.sh`）
- ✓ 图标源文件（`assets/icons/*.png`）
- ✓ 本文档（`docs/ICON-GUIDE.md`）

**不应该提交**：
- ✗ `node_modules/`（包括 terminal-notifier.app）
- ✗ 临时文件和缓存

---

## 相关文档

- [README.md](../README.md) - 项目总览和快速开始
- [TESTING.md](./TESTING.md) - 测试指南
- [REQUIREMENTS.md](./REQUIREMENTS.md) - 需求文档
- [scripts/README.md](../scripts/README.md) - 脚本使用说明

---

## 总结

这两个脚本通过直接修改 macOS 应用包内的资源文件，实现了通知的视觉优化：

- **`fix-notification-style.sh`**：修改系统通知配置，启用横幅样式
- **`replace-notifier-icon.sh`**：替换应用图标文件，统一品牌形象

核心原理是利用 macOS 应用的包结构，通过文件替换实现定制化，无需修改应用源代码。这种方法简单、可靠，且易于维护。
