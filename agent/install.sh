#!/bin/bash

# Claude Code Agent 安装脚本
# 用于在远程机器上配置 hooks

# 设置 "exit on error" 模式：任何命令失败（返回非零退出码）时立即终止脚本
# 这可以防止在错误状态下继续执行，避免产生不可预期的结果
set -e

# 定义 hooks 目录路径
# $HOME 会展开为当前用户的主目录（如 /home/username）
HOOKS_DIR="$HOME/.claude/hooks"
NOTIFY_DIR="$HOOKS_DIR/notify"

echo "🚀 开始安装 Claude Code Agent Hooks..."

# 创建目录结构
# -p 参数：如果父目录不存在则自动创建，目录已存在时不报错
mkdir -p "$NOTIFY_DIR"

# 使用 heredoc 写入示例配置文件
# cat > file << 'EOF' 表示将后续内容写入文件，直到遇到 EOF
# 单引号 'EOF' 表示内容中的变量不会被展开（原样输出）
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
# read -p 显示提示信息并读取用户输入到变量 MASTER_URL
read -p "请输入 Master 服务地址 (默认: http://100.103.79.86:8079): " MASTER_URL
# 参数展开：${VAR:-default} 表示如果 VAR 为空或未设置，则使用默认值
MASTER_URL=${MASTER_URL:-http://100.103.79.86:8079}

# 健康检查：测试 Master 服务是否可达
echo ""
echo "🔍 检查 Master 服务连接..."
# curl 参数说明：
#   -f: 失败时返回非零退出码（HTTP 错误状态码）
#   -s: 静默模式，不显示进度条和错误信息
#   --connect-timeout 5: 连接超时时间为 5 秒
#   > /dev/null 2>&1: 将标准输出和标准错误都重定向到 /dev/null（丢弃）
if curl -f -s --connect-timeout 5 "${MASTER_URL}/health" > /dev/null 2>&1; then
  echo "✅ Master 服务连接正常"
else
  # 连接失败时警告用户，但允许继续安装
  echo "⚠️  警告: 无法连接到 Master 服务 (${MASTER_URL})"
  echo "   请确保 Master 服务已启动并且网络可达"
  read -p "是否继续安装? (y/n): " CONTINUE
  # [ "$VAR" != "y" ] 是条件测试，检查变量是否不等于 "y"
  if [ "$CONTINUE" != "y" ]; then
    echo "❌ 安装已取消"
    exit 1  # 退出码 1 表示异常退出
  fi
fi

# 生成 hook 配置
# $(...) 是命令替换，将命令的输出赋值给变量
# cat << EOF 是 heredoc，但这里没有单引号，所以 ${MASTER_URL} 会被展开
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

# 如果用户选择自动更新，则使用 Python 脚本合并 JSON 配置
if [ "$AUTO_UPDATE" = "y" ]; then
  SETTINGS_FILE="$HOME/.claude/settings.json"

  # 检查 settings.json 文件是否存在
  # -f 测试文件是否存在且为普通文件，! 表示逻辑非
  if [ ! -f "$SETTINGS_FILE" ]; then
    echo "⚠️  settings.json 不存在，创建新文件..."
    mkdir -p "$HOME/.claude"
    echo '{"hooks":[]}' > "$SETTINGS_FILE"
  fi

  # 备份原文件，防止更新失败时丢失数据
  # $(date +%Y%m%d_%H%M%S) 生成时间戳，如 20260127_143025
  BACKUP_FILE="${SETTINGS_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
  cp "$SETTINGS_FILE" "$BACKUP_FILE"
  echo "✅ 已备份原文件到: $BACKUP_FILE"

  # 使用 Python 合并 JSON (比纯 Bash 操作 JSON 更可靠)
  # python3 << PYTHON_SCRIPT 是 heredoc，将后续内容作为 Python 脚本执行
  python3 << PYTHON_SCRIPT
import json
import sys

try:
    # 读取现有的 settings.json 配置文件
    # '$SETTINGS_FILE' 会被 Bash 展开为实际路径
    with open('$SETTINGS_FILE', 'r') as f:
        settings = json.load(f)

    # 确保 hooks 数组存在（如果不存在则创建空数组）
    if 'hooks' not in settings:
        settings['hooks'] = []

    # 解析新的 hook 配置（从 Bash 变量传入）
    # '''$HOOK_CONFIG''' 会被 Bash 展开为实际的 JSON 字符串
    new_hook = json.loads('''$HOOK_CONFIG''')

    # 检查是否已存在相同的 matcher（避免重复添加）
    # 遍历现有 hooks，查找 matcher 为 'AskUserQuestion' 的配置
    existing_index = -1
    for i, hook in enumerate(settings['hooks']):
        if hook.get('matcher') == 'AskUserQuestion':
            existing_index = i
            break

    # 如果找到已存在的配置，则替换；否则追加到数组末尾
    if existing_index >= 0:
        print('⚠️  检测到已存在 AskUserQuestion hook，将替换为新配置')
        settings['hooks'][existing_index] = new_hook
    else:
        settings['hooks'].append(new_hook)

    # 写回文件
    # indent=2: 使用 2 空格缩进格式化 JSON
    # ensure_ascii=False: 允许输出非 ASCII 字符（如中文）
    with open('$SETTINGS_FILE', 'w') as f:
        json.dump(settings, f, indent=2, ensure_ascii=False)

    print('✅ settings.json 已更新')
    sys.exit(0)  # 退出码 0 表示成功

except Exception as e:
    # 捕获所有异常，打印错误信息并恢复备份
    print(f'❌ 更新失败: {e}', file=sys.stderr)
    print(f'   已恢复备份文件', file=sys.stderr)
    import shutil
    shutil.copy('$BACKUP_FILE', '$SETTINGS_FILE')
    sys.exit(1)  # 退出码 1 表示失败
PYTHON_SCRIPT

  # 检查 Python 脚本的退出码
  # $? 是特殊变量，保存上一个命令的退出码
  # -eq 0 表示等于 0（成功）
  if [ $? -eq 0 ]; then
    echo "✅ 配置已自动添加到 settings.json"
  else
    # Python 脚本执行失败，提示用户手动添加配置
    echo "❌ 自动配置失败，请手动添加"
    echo ""
    echo "📝 请手动添加以下配置到 ~/.claude/settings.json 的 hooks 数组中："
    echo "$HOOK_CONFIG"
  fi
else
  # 用户选择不自动更新，显示配置内容供手动添加
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
