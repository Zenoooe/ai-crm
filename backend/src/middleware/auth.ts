import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';

interface AuthRequest extends Request {
  user?: any;
}

interface JWTPayload {
  userId: string;
  type: string;
  iat: number;
  exp: number;
}

/**
 * 认证中间件
 * 验证JWT令牌并设置用户信息
 */
export const auth = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  // 从请求头获取令牌
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    throw new ApiError(401, '访问令牌不存在，请先登录');
  }

  try {
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    if (decoded.type !== 'access') {
      throw new ApiError(401, '令牌类型错误');
    }

    // 查找用户
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new ApiError(401, '用户不存在');
    }

    if (!user.isActive) {
      throw new ApiError(401, '账户未激活');
    }

    // 设置用户信息到请求对象
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.security('Invalid JWT token', undefined, req.ip, req.get('User-Agent'), {
        token: token.substring(0, 20) + '...'
      });
      throw new ApiError(401, '访问令牌无效');
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, '访问令牌已过期，请刷新令牌');
    }

    throw error;
  }
});

/**
 * 可选认证中间件
 * 如果有令牌则验证，没有令牌则继续
 */
export const optionalAuth = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    if (decoded.type === 'access') {
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          role: user.role
        };
      }
    }
  } catch (error) {
    // 可选认证中，令牌错误时不抛出异常，只记录日志
    logger.warn('Optional auth failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  next();
});

/**
 * 角色权限中间件
 * 检查用户是否具有指定角色
 */
export const requireRole = (...roles: string[]) => {
  return catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, '请先登录');
    }

    if (!roles.includes(req.user.role)) {
      logger.security('Insufficient permissions', req.user.id, req.ip, req.get('User-Agent'), {
        requiredRoles: roles,
        userRole: req.user.role
      });
      throw new ApiError(403, '权限不足');
    }

    next();
  });
};

/**
 * 管理员权限中间件
 */
export const requireAdmin = requireRole('admin');

/**
 * 超级管理员权限中间件
 */
export const requireSuperAdmin = requireRole('super_admin');

/**
 * 资源所有者权限中间件
 * 检查用户是否为资源的所有者或管理员
 */
export const requireOwnershipOrAdmin = (resourceUserIdField: string = 'userId') => {
  return catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, '请先登录');
    }

    // 管理员可以访问所有资源
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      return next();
    }

    // 检查资源所有权
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      throw new ApiError(400, '资源用户ID不存在');
    }

    if (resourceUserId !== req.user.id) {
      logger.security('Unauthorized resource access', req.user.id, req.ip, req.get('User-Agent'), {
        resourceUserId,
        requestedResource: req.originalUrl
      });
      throw new ApiError(403, '无权访问该资源');
    }

    next();
  });
};

/**
 * API使用限制中间件
 * 检查用户的API使用配额
 */
export const checkApiUsage = (apiType: 'ai' | 'ocr') => {
  return catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, '请先登录');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(401, '用户不存在');
    }

    // 检查API使用限制
    const hasQuota = await User.checkApiLimit(user._id.toString(), apiType === 'ai' ? 'aiRequests' : 'ocrScans');
    if (!hasQuota) {
      const limitField = apiType === 'ai' ? 'aiRequests' : 'ocrScans';
    const usedField = apiType === 'ai' ? 'aiRequests' : 'ocrScans';
    
    logger.warn('API usage limit exceeded', {
      userId: user._id,
      apiType,
      limit: user.apiUsage.limits[limitField],
      used: user.apiUsage[usedField],
      subscription: user.subscription.plan
    });
      
      throw new ApiError(429, `${apiType.toUpperCase()}服务使用次数已达上限，请升级订阅计划`);
    }

    next();
  });
};

/**
 * 订阅状态检查中间件
 * 检查用户订阅是否有效
 */
export const requireActiveSubscription = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new ApiError(401, '请先登录');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(401, '用户不存在');
  }

  if (user.subscription.status !== 'active') {
    throw new ApiError(403, '订阅已过期，请续费后继续使用');
  }

  if (user.subscription.endDate && user.subscription.endDate < new Date()) {
    throw new ApiError(403, '订阅已过期，请续费后继续使用');
  }

  next();
});

/**
 * 功能权限检查中间件
 * 检查用户订阅是否包含指定功能
 */
export const requireFeature = (feature: string) => {
  return catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, '请先登录');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(401, '用户不存在');
    }

    if (!user.subscription.features.includes(feature)) {
      throw new ApiError(403, `当前订阅计划不支持${feature}功能，请升级订阅`);
    }

    next();
  });
};

export default auth;