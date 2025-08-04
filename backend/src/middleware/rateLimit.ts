/**
 * 速率限制中间件
 * 用于限制API请求频率，防止滥用
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs: number; // 时间窗口（毫秒）
  max: number; // 最大请求次数
  message?: string; // 超限时的错误消息
  skipSuccessfulRequests?: boolean; // 是否跳过成功的请求
  skipFailedRequests?: boolean; // 是否跳过失败的请求
  keyGenerator?: (req: Request) => string; // 自定义key生成器
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// 内存存储（生产环境建议使用Redis）
const store: RateLimitStore = {};

/**
 * 清理过期的记录
 */
function cleanupExpiredRecords(): void {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime <= now) {
      delete store[key];
    }
  });
}

// 每分钟清理一次过期记录
setInterval(cleanupExpiredRecords, 60 * 1000);

/**
 * 创建速率限制中间件
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = '请求过于频繁，请稍后再试',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req: Request) => {
      // 默认使用IP地址和用户ID（如果存在）作为key
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userId = req.user?.id || '';
      return `${ip}:${userId}`;
    }
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const key = keyGenerator(req);
      const now = Date.now();
      const resetTime = now + windowMs;

      // 获取或创建记录
      if (!store[key] || store[key].resetTime <= now) {
        store[key] = {
          count: 0,
          resetTime
        };
      }

      // 检查是否超过限制
      if (store[key].count >= max) {
        logger.warn(`Rate limit exceeded for key: ${key}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method
        });

        res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
        });
        return;
      }

      // 增加计数
      store[key].count++;

      // 设置响应头
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': Math.max(0, max - store[key].count).toString(),
        'X-RateLimit-Reset': new Date(store[key].resetTime).toISOString()
      });

      // 处理响应后的逻辑
      const originalSend = res.send;
      res.send = function(body: any) {
        const statusCode = res.statusCode;
        
        // 根据配置决定是否回滚计数
        if (
          (skipSuccessfulRequests && statusCode >= 200 && statusCode < 300) ||
          (skipFailedRequests && statusCode >= 400)
        ) {
          store[key].count--;
        }

        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Rate limit middleware error', error as Error);
      next(); // 发生错误时继续执行，不阻塞请求
    }
  };
}

/**
 * 预定义的速率限制配置
 */
export const rateLimitConfigs = {
  // 严格限制（登录、注册等敏感操作）
  strict: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5 // 5次
  },
  
  // 中等限制（一般API操作）
  moderate: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 100次
  },
  
  // 宽松限制（读取操作）
  lenient: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 1000 // 1000次
  },
  
  // 实时数据限制
  realtime: {
    windowMs: 1 * 60 * 1000, // 1分钟
    max: 60 // 60次
  },
  
  // 文件上传限制
  upload: {
    windowMs: 60 * 60 * 1000, // 1小时
    max: 10 // 10次
  }
};

/**
 * 获取当前速率限制状态
 */
export function getRateLimitStatus(key: string): {
  count: number;
  remaining: number;
  resetTime: Date;
} | null {
  const record = store[key];
  if (!record) {
    return null;
  }

  return {
    count: record.count,
    remaining: Math.max(0, record.count),
    resetTime: new Date(record.resetTime)
  };
}

/**
 * 重置特定key的速率限制
 */
export function resetRateLimit(key: string): boolean {
  if (store[key]) {
    delete store[key];
    return true;
  }
  return false;
}

/**
 * 获取所有活跃的速率限制记录
 */
export function getActiveRateLimits(): { [key: string]: { count: number; resetTime: Date } } {
  const now = Date.now();
  const active: { [key: string]: { count: number; resetTime: Date } } = {};
  
  Object.keys(store).forEach(key => {
    if (store[key].resetTime > now) {
      active[key] = {
        count: store[key].count,
        resetTime: new Date(store[key].resetTime)
      };
    }
  });
  
  return active;
}