#!/bin/bash

# 替换 terminal-notifier.app 的图标为 Claude 图标
# 这样通知左侧的应用图标也会显示为 Claude 图标

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

# 路径配置
ICON_PNG="$PROJECT_ROOT/assets/icons/claude.png"
NOTIFIER_APP="$PROJECT_ROOT/node_modules/.pnpm/node-notifier@10.0.1/node_modules/node-notifier/vendor/mac.noindex/terminal-notifier.app"
TEMP_DIR=$(mktemp -d)

echo "========================================="
echo "替换 terminal-notifier.app 图标"
echo "========================================="
echo ""

# 检查源图标文件
if [ ! -f "$ICON_PNG" ]; then
    echo "❌ 错误：找不到源图标文件: $ICON_PNG"
    exit 1
fi

echo "✓ 找到源图标: $ICON_PNG"

# 检查 terminal-notifier.app
if [ ! -d "$NOTIFIER_APP" ]; then
    echo "❌ 错误：找不到 terminal-notifier.app: $NOTIFIER_APP"
    exit 1
fi

echo "✓ 找到 terminal-notifier.app"
echo ""

# 备份原始图标
ORIGINAL_ICON="$NOTIFIER_APP/Contents/Resources/Terminal.icns"
BACKUP_ICON="$NOTIFIER_APP/Contents/Resources/Terminal.icns.backup"

if [ -f "$ORIGINAL_ICON" ] && [ ! -f "$BACKUP_ICON" ]; then
    echo "📦 备份原始图标..."
    cp "$ORIGINAL_ICON" "$BACKUP_ICON"
    echo "✓ 备份完成: Terminal.icns.backup"
    echo ""
fi

# 创建 iconset 目录
ICONSET="$TEMP_DIR/claude.iconset"
mkdir -p "$ICONSET"

echo "🎨 生成不同尺寸的图标..."

# 生成各种尺寸的图标（macOS .icns 格式需要）
sips -z 16 16     "$ICON_PNG" --out "$ICONSET/icon_16x16.png" > /dev/null 2>&1
sips -z 32 32     "$ICON_PNG" --out "$ICONSET/icon_16x16@2x.png" > /dev/null 2>&1
sips -z 32 32     "$ICON_PNG" --out "$ICONSET/icon_32x32.png" > /dev/null 2>&1
sips -z 64 64     "$ICON_PNG" --out "$ICONSET/icon_32x32@2x.png" > /dev/null 2>&1
sips -z 128 128   "$ICON_PNG" --out "$ICONSET/icon_128x128.png" > /dev/null 2>&1
sips -z 256 256   "$ICON_PNG" --out "$ICONSET/icon_128x128@2x.png" > /dev/null 2>&1
sips -z 256 256   "$ICON_PNG" --out "$ICONSET/icon_256x256.png" > /dev/null 2>&1
sips -z 512 512   "$ICON_PNG" --out "$ICONSET/icon_256x256@2x.png" > /dev/null 2>&1
sips -z 512 512   "$ICON_PNG" --out "$ICONSET/icon_512x512.png" > /dev/null 2>&1
cp "$ICON_PNG" "$ICONSET/icon_512x512@2x.png"

echo "✓ 图标尺寸生成完成"
echo ""

# 转换为 .icns 格式
echo "🔄 转换为 .icns 格式..."
iconutil -c icns "$ICONSET" -o "$TEMP_DIR/claude.icns"

if [ ! -f "$TEMP_DIR/claude.icns" ]; then
    echo "❌ 错误：.icns 文件生成失败"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "✓ .icns 文件生成成功"
echo ""

# 替换图标
echo "🔧 替换 terminal-notifier.app 的图标..."
cp "$TEMP_DIR/claude.icns" "$ORIGINAL_ICON"

if [ $? -eq 0 ]; then
    echo "✓ 图标替换成功"
else
    echo "❌ 图标替换失败"
    rm -rf "$TEMP_DIR"
    exit 1
fi
echo ""

# 清理临时文件
echo "🧹 清理临时文件..."
rm -rf "$TEMP_DIR"
echo "✓ 清理完成"
echo ""

# 刷新图标缓存
echo "🔄 刷新系统图标缓存..."
touch "$NOTIFIER_APP"
killall Dock 2>/dev/null || true
killall NotificationCenter 2>/dev/null || true

echo "✓ 图标缓存已刷新"
echo ""

echo "========================================="
echo "✅ 图标替换完成！"
echo "========================================="
echo ""
echo "说明："
echo "- 原始图标已备份为: Terminal.icns.backup"
echo "- 新图标已应用到 terminal-notifier.app"
echo "- 通知中心和 Dock 已重启"
echo ""
echo "现在发送通知时，左侧的应用图标也会显示为 Claude 图标"
echo ""
