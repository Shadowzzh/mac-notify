import { join } from 'node:path';
import type { AgentConfig, MasterConfig } from '../types.js';
import { ensureConfigDir, getConfigDir, readJsonFile, writeJsonFile } from './utils.js';

/**
 * 获取 Master 配置文件路径
 */
export function getMasterConfigPath(): string {
  return join(getConfigDir(), 'master.json');
}

/**
 * 获取 Agent 配置文件路径
 */
export function getAgentConfigPath(): string {
  return join(getConfigDir(), 'agent.json');
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

/**
 * 读取 Agent 配置
 */
export async function readAgentConfig(): Promise<AgentConfig | null> {
  return readJsonFile<AgentConfig>(getAgentConfigPath());
}

/**
 * 写入 Agent 配置
 */
export async function writeAgentConfig(config: AgentConfig): Promise<void> {
  await ensureConfigDir();
  await writeJsonFile(getAgentConfigPath(), config);
}
