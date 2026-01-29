# 工具脚本

本目录包含用于配置和测试通知系统的实用脚本。

## 脚本列表

### fix-notification-style.sh

修复 terminal-notifier 的通知样式，将"提醒"改为"横幅"以支持 contentImage。

**用途：**
- 启用通知右侧的内容图片显示
- 修改系统通知中心配置

**使用方法：**
```bash
./scripts/fix-notification-style.sh
```

**说明：**
- 会自动备份原始配置
- 需要重启通知中心生效
- 只需运行一次

---

### replace-notifier-icon.sh

替换 terminal-notifier.app 的应用图标为 Claude 图标。

**用途：**
- 将通知左侧的应用图标替换为 Claude 图标
- 提供更好的视觉识别

**使用方法：**
```bash
./scripts/replace-notifier-icon.sh
```

**说明：**
- 会自动备份原始图标为 Terminal.icns.backup
- 将 PNG 转换为 .icns 格式
- 自动刷新系统图标缓存
- 只需运行一次

---

### test-notify.sh

测试通知功能的脚本。

**用途：**
- 快速测试通知系统是否正常工作
- 验证图标显示效果

**使用方法：**
```bash
./scripts/test-notify.sh
```

## 注意事项

1. **首次使用建议顺序：**
   - 先运行 `fix-notification-style.sh` 修复通知样式
   - 再运行 `replace-notifier-icon.sh` 替换应用图标
   - 最后运行 `test-notify.sh` 测试效果

2. **权限要求：**
   - 所有脚本都需要执行权限
   - 修改系统配置可能需要管理员权限

3. **恢复原始状态：**
   - 通知样式：手动在系统偏好设置中修改
   - 应用图标：使用备份的 Terminal.icns.backup 文件恢复

