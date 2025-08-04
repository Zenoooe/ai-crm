import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';

/**
 * 创建自定义错误处理函数
 */
const createErrorHandler = (message: string) => {
  return (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method
    });

    throw new ApiError(429, message);
  };
};

/**
 * 通用API速率限制
 * 每15分钟最多100个请求
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最大请求数
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true, // 返回速率限制信息在 `RateLimit-*` 头中
  legacyHeaders: false, // 禁用 `X-RateLimit-*` 头
  handler: createErrorHandler('请求过于频繁，请稍后再试'),
  skip: (req: Request) => {
    // 跳过健康检查和静态文件请求
    return req.path === '/health' || req.path.startsWith('/static/');
  }
});

/**
 * 认证相关API速率限制
 * 每15分钟最多5次登录/注册尝试
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最大请求数
  message: '认证请求过于频繁，请15分钟后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createErrorHandler('认证请求过于频繁，请15分钟后再试'),
  keyGenerator: (req: Request) => {
    // 基于IP和邮箱生成key
    const email = req.body?.email || '';
    return `auth:${req.ip}:${email}`;
  }
});

/**
 * 密码重置速率限制
 * 每小时最多3次密码重置请求
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最大请求数
  message: '密码重置请求过于频繁，请1小时后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createErrorHandler('密码重置请求过于频繁，请1小时后再试'),
  keyGenerator: (req: Request) => {
    const email = req.body?.email || '';
    return `password-reset:${req.ip}:${email}`;
  }
});

/**
 * 邮箱验证速率限制
 * 每小时最多5次验证邮件发送
 */
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 最大请求数
  message: '验证邮件发送过于频繁，请1小时后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createErrorHandler('验证邮件发送过于频繁，请1小时后再试'),
  keyGenerator: (req: Request) => {
    const email = req.body?.email || '';
    return `email-verification:${req.ip}:${email}`;
  }
});

/**
 * AI服务速率限制
 * 每分钟最多10次AI请求
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 最大请求数
  message: 'AI服务请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createErrorHandler('AI服务请求过于频繁，请稍后再试'),
  keyGenerator: (req: Request) => {
    // 基于用户ID限制（如果已认证）
    const userId = (req as any).user?.id || req.ip;
    return `ai:${userId}`;
  }
});

/**
 * 文件上传速率限制
 * 每小时最多50次文件上传
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 50, // 最大请求数
  message: '文件上传过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createErrorHandler('文件上传过于频繁，请稍后再试'),
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id || req.ip;
    return `upload:${userId}`;
  }
});

/**
 * 搜索API速率限制
 * 每分钟最多30次搜索请求
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 最大请求数
  message: '搜索请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createErrorHandler('搜索请求过于频繁，请稍后再试'),
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id || req.ip;
    return `search:${userId}`;
  }
});

/**
 * 导出API速率限制
 * 每小时最多5次数据导出
 */
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 最大请求数
  message: '数据导出请求过于频繁，请1小时后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createErrorHandler('数据导出请求过于频繁，请1小时后再试'),
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id || req.ip;
    return `export:${userId}`;
  }
});

/**
 * 批量操作速率限制
 * 每小时最多10次批量操作
 */
export const batchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 最大请求数
  message: '批量操作过于频繁，请1小时后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createErrorHandler('批量操作过于频繁，请1小时后再试'),
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id || '';
    return `batch:${req.ip}:${userId}`;
  }
});

/**
 * 报告生成速率限制
 * 每小时最多20次报告请求
 */
export const reportsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 最大请求数
  message: '报告生成请求过于频繁，请1小时后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createErrorHandler('报告生成请求过于频繁，请1小时后再试'),
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id || '';
    return `reports:${req.ip}:${userId}`;
  }
});

/**
 * 创建自定义速率限制器
 */
export const createCustomLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  keyPrefix?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createErrorHandler(options.message),
    keyGenerator: options.keyPrefix ? (req: Request) => {
      const userId = (req as any).user?.id || req.ip;
      return `${options.keyPrefix}:${userId}`;
    } : undefined
  });
};

/**
 * 导出所有速率限制器
 */
export const rateLimiter = {
  general: generalLimiter,
  auth: authLimiter,
  passwordReset: passwordResetLimiter,
  emailVerification: emailVerificationLimiter,
  ai: aiLimiter,
  upload: uploadLimiter,
  fileUpload: uploadLimiter, // alias for upload
  search: searchLimiter,
  exports: exportLimiter,
  batch: batchLimiter,
  bulk: batchLimiter, // alias for batch
  reports: reportsLimiter,
  custom: createCustomLimiter
};

export default rateLimiter;