import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import cors from '@fastify/cors';
import { config } from 'dotenv';
import Fastify from 'fastify';

// 加载 .env 配置
config();

const execAsync = promisify(exec);

// 从环境变量读取配置
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NOTIFICATION_SOUND_QUESTION = process.env.NOTIFICATION_SOUND_QUESTION || 'Ping';
const NOTIFICATION_SOUND_ERROR = process.env.NOTIFICATION_SOUND_ERROR || 'Basso';
const NOTIFICATION_SOUND_DEFAULT = process.env.NOTIFICATION_SOUND_DEFAULT || 'default';

const fastify = Fastify({
  logger: {
    level: LOG_LEVEL,
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
  let sound = NOTIFICATION_SOUND_DEFAULT;
  if (type === 'error') {
    sound = NOTIFICATION_SOUND_ERROR;
  } else if (type === 'question') {
    sound = NOTIFICATION_SOUND_QUESTION;
  }

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
    const host = process.env.HOST || '0.0.0.0'; // 监听所有网络接口
    const port = Number.parseInt(process.env.PORT || '8079', 10);

    await fastify.listen({ host, port });
    console.log(`🚀 Master service running at http://${host}:${port}`);
    console.log('   可通过以下地址访问：');
    console.log(`   - http://127.0.0.1:${port}`);
    console.log(`   - http://192.168.3.64:${port}`);
    console.log(`   - http://100.109.26.102:${port} (Tailscale)`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
