import { resolve } from 'node:path';

/**
 * 将路径转换为 file:// URL 格式
 * macOS terminal-notifier 需要此格式来显示图标
 */
export function resolveIconPath(iconPath?: string): string | undefined {
  if (!iconPath) return undefined;

  // 如果已经是 HTTP/HTTPS URL，直接返回
  if (iconPath.startsWith('http://') || iconPath.startsWith('https://')) {
    return iconPath;
  }

  // 如果已经是 file:// URL，直接返回
  if (iconPath.startsWith('file://')) {
    return iconPath;
  }

  // 将相对路径转换为绝对路径
  let absolutePath: string;
  if (iconPath.startsWith('/')) {
    absolutePath = iconPath;
  } else {
    absolutePath = resolve(process.cwd(), iconPath);
  }

  // 转换为 file:// URL（macOS terminal-notifier 需要此格式）
  return `file://${absolutePath}`;
}
