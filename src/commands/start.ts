import cors from '@fastify/cors';
import Fastify from 'fastify';
import getPort from 'get-port';
import { config } from '../config';
import { Notifier } from '../master/notifier';
import { ConfigManager } from '../shared/config-manager';
import type { NotifyRequest } from '../shared/types';

/**
 * 启动 Master 服务
 */
export async function startMaster(): Promise<void> {
  const fastify = Fastify({
    logger: {
      level: config.logging.level,
    },
  });

  // 创建 ConfigManager 实例
  const masterConfig = await ConfigManager.readMaster();
  const fileConfig = masterConfig?.notification || {};
  const configManager = new ConfigManager(fileConfig, config.notification);

  // 创建无状态 Notifier 实例
  const notifierInstance = new Notifier();

  // 注册 CORS
  await fastify.register(cors, {
    origin: true,
  });

  // POST /notify - 接收通知请求
  fastify.post<{ Body: NotifyRequest }>('/notify', async (request, reply) => {
    const data = request.body;

    // 验证必需字段
    if (!data.title || !data.message || !data.type) {
      return reply.code(400).send({
        success: false,
        message: 'Missing required fields: title, message, type',
      });
    }

    // 合并配置
    const options = configManager.merge(data);

    // 异步发送通知(不等待结果)
    notifierInstance.send(options, fastify.log).catch(() => {
      // 错误已在 notifier 中记录
    });

    // 立即返回成功(fire-and-forget)
    return {
      success: true,
      message: '通知已发送',
    };
  });

  // GET /health - 健康检查
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  });

  // 启动服务器
  try {
    // 尝试从配置文件读取
    const masterConfig = await ConfigManager.readMaster();
    const host = masterConfig?.server?.host || config.server.host;
    const preferredPort = masterConfig?.server?.port || config.server.port;

    // 查找可用端口
    const port = await getPort({ port: preferredPort });

    // 如果端口被占用，提示用户
    if (port !== preferredPort) {
      console.log(`端口 ${preferredPort} 已被占用，使用端口 ${port} 代替\n`);
    }

    await fastify.listen({ host, port });
    console.log(`Master service running at http://${host}:${port}`);
    console.log('可通过以下地址访问：');
    console.log(`http://127.0.0.1:${port}`);

    if (masterConfig?.server?.url) {
      console.log(`   - ${masterConfig.server.url}`);
    }

    // 如果端口变化，提示用户更新 agent 配置
    if (port !== preferredPort) {
      console.log('\n安装 agent 时请使用以下地址：');
      console.log(`   mac-notify install agent --url http://${host}:${port}`);
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// 如果直接运行此文件（开发模式），则启动服务
if (import.meta.url === `file://${process.argv[1]}` && process.env.NODE_ENV !== 'production') {
  startMaster();
}
