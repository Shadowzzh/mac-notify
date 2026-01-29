---
allowed-tools: Bash(git init:*), Bash(git remote:*), Bash(git add:*), Bash(git commit:*), Bash(ls:*), Bash(cat:*)
argument-hint: [远程仓库 URL]
description: 初始化 git 仓库并可选添加远程仓库
---

## 任务

1. 使用 `git init` 初始化新的 git 仓库
2. 如果提供了远程 URL ($ARGUMENTS)，将其添加为 origin：`git remote add origin <url>`
3. 如果有文件需要提交，创建初始提交：
   - 使用 `git add -A` 暂存所有文件
   - 创建初始提交，提交消息为 "Initial commit"
4. 报告完成的工作