---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git diff --cached:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*), Bash(git log:*), Bash(gh pr create:*), Bash(git rev-parse:*)
description: 提交已暂存的代码、推送到远程并创建 PR
---

## 上下文

- 当前 git 状态: !`git status`
- 当前分支: !`git branch --show-current 2>/dev/null || echo "尚无分支"`
- 是否有提交: !`git rev-parse HEAD >/dev/null 2>&1 && echo "是" || echo "否"`

## 你的任务

1. 首先检查是否是新的仓库（尚无提交）
2. 检查是否有已暂存的更改（使用 `git diff --cached`）
3. 如果没有已暂存的更改，告知用户先使用 `git add` 暂存文件
4. 如果有已暂存的更改：
   - 运行 `git diff --cached` 查看暂存的更改
   - 基于这些更改创建一个描述性的提交信息
5. 提交更改（仅提交已暂存的文件）
6. 推送分支到远程（首次推送使用 `git push -u origin <branch>`）
7. 使用 `gh pr create` 创建 Pull Request，包含：
   - 清晰的标题总结更改内容
   - 详细的描述说明更改了什么以及为什么

优雅地处理边界情况：
- 新仓库没有提交：先创建初始提交
- 没有配置远程仓库：告知用户
- 远程不存在该分支：使用 `git push -u origin <branch>`
- 没有已暂存的更改：提示用户先运行 `git add` 暂存文件