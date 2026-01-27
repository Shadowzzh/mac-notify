#!/bin/bash

# Claude Code Agent 安装脚本
# 用于在远程机器上配置 hooks

set -e

HOOKS_DIR="$HOME/.claude/hooks"
NOTIFY_DIR="$HOOKS_DIR/notify"

echo "🚀 开始安装 Claude Code Agent Hooks..."

# 创建目录
mkdir -p "$NOTIFY_DIR"

# 写入 example.json
cat > "$NOTIFY_DIR/example.json" << 'EOF'
{
  "title": "项目名称",
  "message": "通知消息",
  "project": "/完整/项目/路径",
  "cwd": "项目目录名",
  "type": "question"
}
EOF

echo "✅ example.json 已创建: $NOTIFY_DIR/example.json"

# 提示用户输入 Master 服务地址
read -p "请输入 Master 服务地址 (默认: http://100.103.79.86:8079): " MASTER_URL
MASTER_URL=${MASTER_URL:-http://100.103.79.86:8079}

# 健康检查
echo ""
echo "🔍 检查 Master 服务连接..."
if curl -f -s --connect-timeout 5 "${MASTER_URL}/health" > /dev/null 2>&1; then
  echo "✅ Master 服务连接正常"
else
  echo "⚠️  警告: 无法连接到 Master 服务 (${MASTER_URL})"
  echo "   请确保 Master 服务已启动并且网络可达"
  read -p "是否继续安装? (y/n): " CONTINUE
  if [ "$CONTINUE" != "y" ]; then
    echo "❌ 安装已取消"
    exit 1
  fi
fi

# 生成 hook 配置
HOOK_CONFIG=$(cat << EOF
{
  "matcher": "AskUserQuestion",
  "hooks": [
    {
      "type": "prompt",
      "prompt": "BEFORE asking the user a question, send a notification to the Master service. Use curl to POST to: ${MASTER_URL}/notify with Content-Type: application/json. Request body format: {\\\"title\\\":\\\"<project name from cwd>\\\",\\\"message\\\":\\\"<brief description of question>\\\",\\\"project\\\":\\\"<full working directory path>\\\",\\\"cwd\\\":\\\"<last component of working directory>\\\",\\\"type\\\":\\\"question\\\",\\\"timestamp\\\":\\\"<current ISO 8601 timestamp>\\\",\\\"action\\\":\\\"focus\\\"}. Example: If working in /home/user/my-project, set cwd=\\\"my-project\\\", project=\\\"/home/user/my-project\\\", title=\\\"my-project\\\". This notification is critical - send it immediately before calling AskUserQuestion.",
      "statusMessage": "正在通知用户..."
    }
  ]
}
EOF
)

echo ""
read -p "是否自动更新 ~/.claude/settings.json? (y/n): " AUTO_UPDATE

if [ "$AUTO_UPDATE" = "y" ]; then
  SETTINGS_FILE="$HOME/.claude/settings.json"

  # 检查文件是否存在
  if [ ! -f "$SETTINGS_FILE" ]; then
    echo "⚠️  settings.json 不存在，创建新文件..."
    mkdir -p "$HOME/.claude"
    echo '{"hooks":[]}' > "$SETTINGS_FILE"
  fi

  # 备份原文件
  BACKUP_FILE="${SETTINGS_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
  cp "$SETTINGS_FILE" "$BACKUP_FILE"
  echo "✅ 已备份原文件到: $BACKUP_FILE"

  # 使用 Python 合并 JSON (更可靠)
  python3 << PYTHON_SCRIPT
import json
import sys

try:
    # 读取现有配置
    with open('$SETTINGS_FILE', 'r') as f:
        settings = json.load(f)

    # 确保 hooks 数组存在
    if 'hooks' not in settings:
        settings['hooks'] = []

    # 解析新的 hook 配置
    new_hook = json.loads('''$HOOK_CONFIG''')

    # 检查是否已存在相同的 matcher
    existing_index = -1
    for i, hook in enumerate(settings['hooks']):
        if hook.get('matcher') == 'AskUserQuestion':
            existing_index = i
            break

    if existing_index >= 0:
        print('⚠️  检测到已存在 AskUserQuestion hook，将替换为新配置')
        settings['hooks'][existing_index] = new_hook
    else:
        settings['hooks'].append(new_hook)

    # 写回文件
    with open('$SETTINGS_FILE', 'w') as f:
        json.dump(settings, f, indent=2, ensure_ascii=False)

    print('✅ settings.json 已更新')
    sys.exit(0)

except Exception as e:
    print(f'❌ 更新失败: {e}', file=sys.stderr)
    print(f'   已恢复备份文件', file=sys.stderr)
    import shutil
    shutil.copy('$BACKUP_FILE', '$SETTINGS_FILE')
    sys.exit(1)
PYTHON_SCRIPT

  if [ $? -eq 0 ]; then
    echo "✅ 配置已自动添加到 settings.json"
  else
    echo "❌ 自动配置失败，请手动添加"
    echo ""
    echo "📝 请手动添加以下配置到 ~/.claude/settings.json 的 hooks 数组中："
    echo "$HOOK_CONFIG"
  fi
else
  echo ""
  echo "📝 请手动添加以下配置到 ~/.claude/settings.json 的 hooks 数组中："
  echo ""
  echo "$HOOK_CONFIG"
fi

echo ""
echo "✅ 安装完成！"
echo ""
echo "📌 验证安装："
echo "   1. 检查 ~/.claude/settings.json 中的 hooks 配置"
echo "   2. 确保 Master 服务运行在 ${MASTER_URL}"
echo "   3. 在任意项目中使用 Claude Code，触发 AskUserQuestion 时应收到通知"
