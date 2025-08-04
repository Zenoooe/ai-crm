/**
 * 异步处理器工具
 * 用于包装异步路由处理器，自动捕获错误
 */
import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * 异步处理器包装函数
 * 自动捕获异步函数中的错误并传递给错误处理中间件
 * 
 * @param fn 异步处理函数
 * @returns 包装后的处理函数
 */
export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 异步处理器包装函数（带返回值类型）
 * 
 * @param fn 异步处理函数
 * @returns 包装后的处理函数
 */
export const asyncHandlerWithReturn = <T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) => {
  return (req: Request, res: Response, next: NextFunction): Promise<T | void> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 批量异步处理器
 * 用于处理多个异步操作
 * 
 * @param operations 异步操作数组
 * @returns Promise数组
 */
export const batchAsyncHandler = async <T>(operations: (() => Promise<T>)[]): Promise<T[]> => {
  try {
    return await Promise.all(operations.map(op => op()));
  } catch (error) {
    throw error;
  }
};

/**
 * 带超时的异步处理器
 * 
 * @param fn 异步函数
 * @param timeout 超时时间（毫秒）
 * @returns 包装后的函数
 */
export const asyncHandlerWithTimeout = (fn: AsyncFunction, timeout: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });

    Promise.race([
      Promise.resolve(fn(req, res, next)),
      timeoutPromise
    ]).catch(next);
  };
};

/**
 * 重试异步处理器
 * 
 * @param fn 异步函数
 * @param maxRetries 最大重试次数
 * @param delay 重试延迟（毫秒）
 * @returns 包装后的函数
 */
export const asyncHandlerWithRetry = (fn: AsyncFunction, maxRetries: number = 3, delay: number = 1000) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(req, res, next);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
      }
    }
    
    next(lastError);
  };
};

/**
 * 条件异步处理器
 * 根据条件决定是否执行异步函数
 * 
 * @param condition 条件函数
 * @param fn 异步函数
 * @param fallback 备用函数
 * @returns 包装后的函数
 */
export const conditionalAsyncHandler = (
  condition: (req: Request) => boolean,
  fn: AsyncFunction,
  fallback?: AsyncFunction
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (condition(req)) {
      Promise.resolve(fn(req, res, next)).catch(next);
    } else if (fallback) {
      Promise.resolve(fallback(req, res, next)).catch(next);
    } else {
      next();
    }
  };
};

/**
 * 缓存异步处理器
 * 缓存异步函数的结果
 * 
 * @param fn 异步函数
 * @param keyGenerator 缓存键生成器
 * @param ttl 缓存时间（毫秒）
 * @returns 包装后的函数
 */
export const cachedAsyncHandler = (
  fn: AsyncFunction,
  keyGenerator: (req: Request) => string,
  ttl: number = 300000 // 5分钟
): (req: Request, res: Response, next: NextFunction) => Promise<void> => {
  const cache = new Map<string, { data: any; timestamp: number }>();
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);
      const now = Date.now();
      const cached = cache.get(key);
      
      if (cached && (now - cached.timestamp) < ttl) {
        res.json(cached.data);
        return;
      }
      
      // 拦截响应以缓存结果
      const originalJson = res.json;
      res.json = function(data: any) {
        cache.set(key, { data, timestamp: now });
        return originalJson.call(this, data);
      };
      
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 限流异步处理器
 * 限制并发执行的异步函数数量
 * 
 * @param fn 异步函数
 * @param maxConcurrent 最大并发数
 * @returns 包装后的函数
 */
export const throttledAsyncHandler = (fn: AsyncFunction, maxConcurrent: number = 10): (req: Request, res: Response, next: NextFunction) => void => {
  let currentConcurrent = 0;
  const queue: Array<() => void> = [];
  
  return (req: Request, res: Response, next: NextFunction) => {
    const execute = async () => {
      currentConcurrent++;
      try {
        await fn(req, res, next);
      } catch (error) {
        next(error);
      } finally {
        currentConcurrent--;
        if (queue.length > 0) {
          const nextExecution = queue.shift();
          if (nextExecution) {
            nextExecution();
          }
        }
      }
    };
    
    if (currentConcurrent < maxConcurrent) {
      execute();
    } else {
      queue.push(execute);
    }
  };
};

export default asyncHandler;