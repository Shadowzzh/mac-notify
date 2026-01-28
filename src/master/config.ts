import { join } from 'node:path';
import { ensureConfigDir, getConfigDir, readJsonFile, writeJsonFile } from '../shared/utils.js';
import type { MasterConfig } from './types.js';

/**
 * 获取 Master 配置文件路径
 */
export function getMasterConfigPath(): string {
  return join(getConfigDir(), 'master.json');
}

/**
 * 读取 Master 配置
 */
export async function readMasterConfig(): Promise<MasterConfig | null> {
  return readJsonFile<MasterConfig>(getMasterConfigPath());
}

/**
 * 写入 Master 配置
 */
export async function writeMasterConfig(config: MasterConfig): Promise<void> {
  await ensureConfigDir();
  await writeJsonFile(getMasterConfigPath(), config);
}
