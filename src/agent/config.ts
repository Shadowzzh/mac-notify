import { join } from 'node:path';
import { ensureConfigDir, getConfigDir, readJsonFile, writeJsonFile } from '../shared/utils';
import type { AgentConfig } from '../shared/types';

/**
 * 获取 Agent 配置文件路径
 */
export function getAgentConfigPath(): string {
  return join(getConfigDir(), 'agent.json');
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
