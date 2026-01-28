/**
 * 健康检查模块
 */

/**
 * 检查 Master 服务是否可达
 */
export async function checkMasterHealth(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
