import Fastify from 'fastify';
import cors from '@fastify/cors';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// 注册 CORS
await fastify.register(cors, {
  origin: true,
});

// 通知请求接口
interface NotifyRequest {
  title: string;
  message: string;
  project: string;
  cwd: string;
  type: 'question' | 'success' | 'error' | 'info';
  timestamp?: string;
  action?: 'focus' | 'none';
}

// 发送 macOS 通知
async function sendNotification(data: NotifyRequest): Promise<void> {
  const { title, message, type } = data;

  // 根据类型选择通知声音
  const sound = type === 'error' ? 'Basso' : type === 'question' ? 'Ping' : 'default';

  const script = `
    display notification "${message.replace(/"/g, '\\"')}" ¬
      with title "${title.replace(/"/g, '\\"')}" ¬
      sound name "${sound}"
  `;

  try {
    await execAsync(`osascript -e '${script}'`);
    fastify.log.info({ data }, 'Notification sent successfully');
  } catch (error) {
    // 记录错误但不抛出异常(fire-and-forget 策略)
    fastify.log.error({ error, data }, 'Failed to send notification');
  }
}

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

  // 异步发送通知(不等待结果)
  sendNotification(data).catch(() => {
    // 错误已在 sendNotification 中记录
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
const start = async () => {
  try {
    const host = '100.103.79.86';
    const port = 8079;

    await fastify.listen({ host, port });
    console.log(`🚀 Master service running at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
