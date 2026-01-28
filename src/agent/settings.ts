import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ClaudeHookMatcher, ClaudeSettings } from './types';

/**
 * 获取 Claude settings.json 路径
 */
export function getClaudeSettingsPath(): string {
  return join(homedir(), '.claude', 'settings.json');
}

/**
 * 确保 .claude 目录存在
 */
async function ensureClaudeDir(): Promise<void> {
  const claudeDir = join(homedir(), '.claude');
  if (!existsSync(claudeDir)) {
    await mkdir(claudeDir, { recursive: true });
  }
}

/**
 * 读取 Claude settings.json
 */
export async function readClaudeSettings(): Promise<ClaudeSettings> {
  const settingsPath = getClaudeSettingsPath();

  if (!existsSync(settingsPath)) {
    await ensureClaudeDir();
    const defaultSettings: ClaudeSettings = { hooks: [] };
    await writeFile(settingsPath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
    return defaultSettings;
  }

  const content = await readFile(settingsPath, 'utf-8');
  return JSON.parse(content) as ClaudeSettings;
}

/**
 * 写入 Claude settings.json
 */
export async function writeClaudeSettings(settings: ClaudeSettings): Promise<void> {
  const settingsPath = getClaudeSettingsPath();
  await ensureClaudeDir();
  const content = JSON.stringify(settings, null, 2);
  await writeFile(settingsPath, content, 'utf-8');
}

/**
 * 备份 settings.json
 */
export async function backupClaudeSettings(): Promise<string> {
  const settingsPath = getClaudeSettingsPath();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${settingsPath}.backup.${timestamp}`;
  await copyFile(settingsPath, backupPath);
  return backupPath;
}

/**
 * 合并 hook 配置到 settings.json
 */
export async function mergeHookConfig(
  settings: ClaudeSettings,
  newHook: ClaudeHookMatcher,
): Promise<ClaudeSettings> {
  if (!settings.hooks) {
    settings.hooks = [];
  }

  // 查找是否已存在相同的 matcher
  const existingIndex = settings.hooks.findIndex((hook) => hook.matcher === newHook.matcher);

  if (existingIndex >= 0) {
    // 替换现有配置
    settings.hooks[existingIndex] = newHook;
  } else {
    // 追加新配置
    settings.hooks.push(newHook);
  }

  return settings;
}
