#!/bin/bash

# 修复 terminal-notifier 的通知样式
# 将"提醒"改为"横幅"以支持 contentImage

echo "正在修改 terminal-notifier 的通知样式..."

# 备份当前配置
cp ~/Library/Preferences/com.apple.ncprefs.plist ~/Library/Preferences/com.apple.ncprefs.plist.backup

# 使用 PlistBuddy 修改配置
PLIST=~/Library/Preferences/com.apple.ncprefs.plist

# 查找 terminal-notifier 的索引
INDEX=$(plutil -p "$PLIST" | grep -B 5 "terminal-notifier" | grep "=>" | head -1 | awk '{print $1}')

if [ -z "$INDEX" ]; then
    echo "错误：未找到 terminal-notifier 的配置"
    exit 1
fi

echo "找到 terminal-notifier 配置，索引: $INDEX"

# 当前 flags: 41951310 (0x280204e)
# 需要添加 bit 5 (32) 来启用横幅
# 新 flags: 41951310 | 32 = 41951342 (0x280206e)

NEW_FLAGS=41951342

/usr/libexec/PlistBuddy -c "Set :apps:$INDEX:flags $NEW_FLAGS" "$PLIST"

if [ $? -eq 0 ]; then
    echo "✓ 成功修改通知样式"
    echo "✓ 新 flags: $NEW_FLAGS"
    echo ""
    echo "请执行以下命令重启通知中心："
    echo "killall NotificationCenter"
else
    echo "✗ 修改失败，请手动在系统偏好设置中修改"
    echo ""
    echo "手动步骤："
    echo "1. 打开 系统偏好设置 → 通知"
    echo "2. 找到 terminal-notifier"
    echo "3. 将通知样式改为 '横幅'"
fi
