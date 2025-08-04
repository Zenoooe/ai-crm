import Redis, { Redis as RedisType } from 'ioredis';
import { logger } from '../utils/logger';

// Redis配置选项
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  
  // 连接设置
  connectTimeout: 10000,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxLoadingTimeout: 0,
  
  // 重连设置
  retryDelayOnClusterDown: 300,
  
  // 键名前缀
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'crm:',
};

// 创建Redis客户端实例
export const redis = new Redis(redisOptions);

// 创建专用于会话的Redis客户端
export const sessionRedis = new Redis({
  ...redisOptions,
  db: parseInt(process.env.REDIS_SESSION_DB || '1'),
  keyPrefix: process.env.REDIS_SESSION_PREFIX || 'sess:',
});

// 创建专用于缓存的Redis客户端
export const cacheRedis = new Redis({
  ...redisOptions,
  db: parseInt(process.env.REDIS_CACHE_DB || '2'),
  keyPrefix: process.env.REDIS_CACHE_PREFIX || 'cache:',
});

// 创建专用于队列的Redis客户端
export const queueRedis = new Redis({
  ...redisOptions,
  db: parseInt(process.env.REDIS_QUEUE_DB || '3'),
  keyPrefix: process.env.REDIS_QUEUE_PREFIX || 'queue:',
});

/**
 * Redis连接事件监听
 */
redis.on('connect', () => {
  logger.info('Redis连接已建立');
});

redis.on('ready', () => {
  logger.info('Redis已准备就绪');
});

redis.on('error', (error: Error) => {
  logger.error('Redis连接错误', error);
});

redis.on('close', () => {
  logger.warn('Redis连接已关闭');
});

redis.on('reconnecting', () => {
  logger.info('Redis正在重连...');
});

/**
 * 连接到Redis
 */
export const connectRedis = async (): Promise<void> => {
  try {
    logger.info('正在连接Redis...');
    
    await redis.connect();
    await sessionRedis.connect();
    await cacheRedis.connect();
    await queueRedis.connect();
    
    logger.info('Redis连接成功', {
      host: redisOptions.host,
      port: redisOptions.port,
      db: redisOptions.db
    });
    
  } catch (error) {
    logger.error('Redis连接失败', error as Error);
    throw error;
  }
};

/**
 * 断开Redis连接
 */
export const disconnectRedis = async (): Promise<void> => {
  try {
    await redis.disconnect();
    await sessionRedis.disconnect();
    await cacheRedis.disconnect();
    await queueRedis.disconnect();
    
    logger.info('Redis连接已断开');
  } catch (error) {
    logger.error('断开Redis连接时出错', error as Error);
  }
};

/**
 * Redis工具函数
 */
export class RedisService {
  /**
   * 设置缓存
   */
  static async setCache(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await cacheRedis.setex(key, ttl, serializedValue);
    } catch (error) {
      logger.error(`设置缓存失败: ${key}`, error as Error);
      throw error;
    }
  }

  /**
   * 获取缓存
   */
  static async getCache<T>(key: string): Promise<T | null> {
    try {
      const value = await cacheRedis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`获取缓存失败: ${key}`, error as Error);
      return null;
    }
  }

  /**
   * 删除缓存
   */
  static async deleteCache(key: string): Promise<void> {
    try {
      await cacheRedis.del(key);
    } catch (error) {
      logger.error(`删除缓存失败: ${key}`, error as Error);
      throw error;
    }
  }

  /**
   * 清空缓存
   */
  static async clearCache(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        const keys = await cacheRedis.keys(pattern);
        if (keys.length > 0) {
          await cacheRedis.del(...keys);
        }
      } else {
        await cacheRedis.flushdb();
      }
    } catch (error) {
      logger.error(`清空缓存失败: ${pattern}`, error as Error);
      throw error;
    }
  }

  /**
   * 设置会话
   */
  static async setSession(sessionId: string, data: any, ttl: number = 86400): Promise<void> {
    try {
      const serializedData = JSON.stringify(data);
      await sessionRedis.setex(sessionId, ttl, serializedData);
    } catch (error) {
      logger.error(`设置会话失败: ${sessionId}`, error as Error);
      throw error;
    }
  }

  /**
   * 获取会话
   */
  static async getSession<T>(sessionId: string): Promise<T | null> {
    try {
      const data = await sessionRedis.get(sessionId);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`获取会话失败: ${sessionId}`, error as Error);
      return null;
    }
  }

  /**
   * 删除会话
   */
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      await sessionRedis.del(sessionId);
    } catch (error) {
      logger.error(`删除会话失败: ${sessionId}`, error as Error);
      throw error;
    }
  }

  /**
   * 检查Redis连接状态
   */
  static async checkConnection(): Promise<boolean> {
    try {
      await redis.ping();
      return true;
    } catch (error) {
      logger.error('Redis连接检查失败', error as Error);
      return false;
    }
  }
}

// 应用终止时关闭Redis连接
process.on('SIGINT', async () => {
  logger.info('收到SIGINT信号，正在关闭Redis连接...');
  await disconnectRedis();
});

process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号，正在关闭Redis连接...');
  await disconnectRedis();
});

export default redis;