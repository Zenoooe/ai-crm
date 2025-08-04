import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import { initializeStorage } from './config/storage';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { ApiError } from './utils/ApiError';
import { AIService } from './services/aiService';

// 创建Express应用
const app = express();

// 信任代理
app.set('trust proxy', 1);

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS配置 - 开发环境允许所有来源
const corsOptions = {
  origin: true, // 允许所有来源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// 压缩中间件
app.use(compression());

// 请求日志中间件
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      }
    }
  }));
}

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CRM Backend is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API路由
app.use('/api', routes);

// 404处理
app.use('*', (req, res, next) => {
  const error = ApiError.notFound(`路由 ${req.originalUrl} 不存在`);
  next(error);
});

// 错误处理中间件
app.use(errorHandler);

/**
 * 初始化应用
 */
export const initializeApp = async (): Promise<void> => {
  try {
    logger.info('正在初始化应用...');
    
    // 连接数据库
    await connectDB();
    
    // 连接Redis
    try {
      await connectRedis();
    } catch (error) {
      logger.warn('Redis连接失败，将在无缓存模式下运行', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // 初始化存储
    await initializeStorage();
    
    // 初始化AI服务
    try {
      AIService.initialize();
      logger.info('AI服务初始化完成');
    } catch (error) {
      logger.warn('AI服务初始化失败', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    logger.info('应用初始化完成');
    
  } catch (error) {
    logger.error(`应用初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * 优雅关闭
 */
export const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`收到${signal}信号，开始优雅关闭...`);
  
  // 这里可以添加清理逻辑
  // 例如：关闭数据库连接、清理定时任务等
  
  logger.info('应用已优雅关闭');
  process.exit(0);
};

// 监听进程信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  logger.error(`未捕获的异常: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`未处理的Promise拒绝: ${reason instanceof Error ? reason.message : String(reason)}`);
  process.exit(1);
});

export default app;