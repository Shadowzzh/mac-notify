import { join } from 'node:path';
import { resolveIconPath } from '../master/utils';
import type {
  AgentConfig,
  DaemonConfig,
  MasterConfig,
  NotificationOptions,
  NotifierConfig,
  NotifyRequest,
} from './types';
import { ensureConfigDir, getConfigDir, readJsonFile, writeJsonFile } from './utils';

/**
 * 通知类型到声音的映射
 */
const SOUND_MAP = {
  question: 'Ping',
  error: 'Basso',
  success: 'default',
  info: 'default',
  stop: 'Glass',
} as const;

/**
 * 默认配置
 */
const DEFAULTS = {
  soundQuestion: SOUND_MAP.question,
  soundError: SOUND_MAP.error,
  soundDefault: SOUND_MAP.success,
  soundStop: SOUND_MAP.stop,
  timeout: 5,
  wait: false,
} as const;

/**
 * ConfigManager - 统一的配置管理器
 *
 * 职责：
 * 1. 配置文件的读写（master.json, agent.json）
 * 2. 运行时配置的优先级合并（文件 < 环境变量 < 请求参数）
 */
export class ConfigManager {
  // ============================================================
  // 静态方法：配置文件读写
  // ============================================================

  /**
   * 获取 Master 配置文件路径
   */
  static getMasterConfigPath(): string {
    return join(getConfigDir(), 'master.json');
  }

  /**
   * 读取 Master 配置
   */
  static async readMaster(): Promise<MasterConfig | null> {
    return readJsonFile<MasterConfig>(ConfigManager.getMasterConfigPath());
  }

  /**
   * 写入 Master 配置
   */
  static async writeMaster(config: MasterConfig): Promise<void> {
    await ensureConfigDir();
    await writeJsonFile(ConfigManager.getMasterConfigPath(), config);
  }

  /**
   * 获取 Agent 配置文件路径
   */
  static getAgentConfigPath(): string {
    return join(getConfigDir(), 'agent.json');
  }

  /**
   * 读取 Agent 配置
   */
  static async readAgent(): Promise<AgentConfig | null> {
    return readJsonFile<AgentConfig>(ConfigManager.getAgentConfigPath());
  }

  /**
   * 写入 Agent 配置
   */
  static async writeAgent(config: AgentConfig): Promise<void> {
    await ensureConfigDir();
    await writeJsonFile(ConfigManager.getAgentConfigPath(), config);
  }

  /**
   * 获取 Daemon 配置文件路径
   */
  static getDaemonConfigPath(): string {
    return join(getConfigDir(), 'daemon.json');
  }

  /**
   * 读取 Daemon 配置
   */
  static async readDaemon(): Promise<DaemonConfig | null> {
    return readJsonFile<DaemonConfig>(ConfigManager.getDaemonConfigPath());
  }

  /**
   * 写入 Daemon 配置
   */
  static async writeDaemon(config: DaemonConfig): Promise<void> {
    await ensureConfigDir();
    await writeJsonFile(ConfigManager.getDaemonConfigPath(), config);
  }

  // ============================================================
  // 实例方法：运行时配置合并
  // ============================================================

  constructor(
    private fileConfig: NotifierConfig = {},
    private envConfig: NotifierConfig = {},
  ) {}

  /**
   * 合并配置，返回最终可用的 NotificationOptions
   *
   * 优先级: 默认值 < 文件配置 < 环境变量 < 请求参数
   */
  merge(requestData: NotifyRequest): NotificationOptions {
    const { title, message, type, cwd, open, closeLabel, actions, dropdownLabel, reply } =
      requestData;

    // 根据类型获取声音
    const getSound = (): string => {
      // 请求参数中的 sound 优先级最高
      if (requestData.sound) {
        return requestData.sound;
      }

      // 根据类型从环境变量或配置文件获取
      switch (type) {
        case 'error':
          return this.envConfig.soundError || this.fileConfig.soundError || SOUND_MAP.error;
        case 'question':
          return (
            this.envConfig.soundQuestion || this.fileConfig.soundQuestion || SOUND_MAP.question
          );
        case 'stop':
          return this.envConfig.soundStop || this.fileConfig.soundStop || SOUND_MAP.stop;
        default:
          return this.envConfig.soundDefault || this.fileConfig.soundDefault || SOUND_MAP.success;
      }
    };

    return {
      title,
      message,
      sound: getSound(),
      subtitle: requestData.subtitle || this.envConfig.subtitle || this.fileConfig.subtitle || cwd,
      timeout:
        requestData.timeout ??
        this.envConfig.timeout ??
        this.fileConfig.timeout ??
        DEFAULTS.timeout,
      wait: requestData.wait ?? this.envConfig.wait ?? this.fileConfig.wait ?? DEFAULTS.wait,
      // 图标路径解析
      icon: resolveIconPath(requestData.icon || this.envConfig.icon || this.fileConfig.icon),
      contentImage: resolveIconPath(
        requestData.contentImage || this.envConfig.contentImage || this.fileConfig.contentImage,
      ),
      // 高级选项直接传递
      open,
      closeLabel,
      actions,
      dropdownLabel,
      reply,
    };
  }
}
