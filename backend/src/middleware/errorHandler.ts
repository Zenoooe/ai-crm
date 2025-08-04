import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

/**
 * 错误处理中间件
 */
export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = '服务器内部错误';
  let errors: any[] = [];
  let stack: string | undefined;

  // 如果是ApiError实例
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    stack = error.stack;
  }
  // MongoDB错误处理
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = '数据验证失败';
    errors = Object.values((error as any).errors).map((err: any) => ({
      field: err.path,
      message: err.message
    }));
  }
  // MongoDB重复键错误
  else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    statusCode = 400;
    message = '数据已存在';
    const field = Object.keys((error as any).keyPattern)[0];
    errors = [{
      field,
      message: `${field}已存在`
    }];
  }
  // MongoDB转换错误
  else if (error.name === 'CastError') {
    statusCode = 400;
    message = '无效的ID格式';
    errors = [{
      field: (error as any).path,
      message: '无效的ID格式'
    }];
  }
  // JWT错误处理
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的令牌';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '令牌已过期';
  }
  // Multer错误处理
  else if (error.name === 'MulterError') {
    statusCode = 400;
    const multerError = error as any;
    
    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        message = '文件大小超出限制';
        break;
      case 'LIMIT_FILE_COUNT':
        message = '文件数量超出限制';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = '意外的文件字段';
        break;
      default:
        message = '文件上传错误';
    }
  }
  // 语法错误
  else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = '请求体格式错误';
  }
  // 其他错误
  else {
    statusCode = 500;
    message = process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message;
    stack = error.stack;
  }

  // 记录错误日志
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    statusCode,
    message: error.message,
    stack: error.stack
  };

  if (statusCode >= 500) {
    logger.error('服务器错误', error);
  } else if (statusCode >= 400) {
    logger.warn('客户端错误', error);
  }

  // 构建响应
  const response: any = {
    success: false,
    message,
    statusCode
  };

  // 添加错误详情（仅在开发环境）
  if (process.env.NODE_ENV === 'development') {
    response.stack = stack;
    response.originalError = error.message;
  }

  // 添加验证错误
  if (errors.length > 0) {
    response.errors = errors;
  }

  // 添加请求ID（如果存在）
  if ((req as any).requestId) {
    response.requestId = (req as any).requestId;
  }

  res.status(statusCode).json(response);
};

/**
 * 404错误处理中间件
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new ApiError(404, `路由 ${req.originalUrl} 不存在`);
  next(error);
};

/**
 * 异步错误包装器
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 验证错误格式化
 */
export const formatValidationErrors = (errors: any[]): any[] => {
  return errors.map(error => {
    if (error.type === 'field') {
      return {
        field: error.path,
        message: error.msg,
        value: error.value
      };
    }
    return {
      message: error.msg || error.message
    };
  });
};

/**
 * 数据库错误格式化
 */
export const formatDatabaseError = (error: any): { statusCode: number; message: string; errors?: any[] } => {
  // MongoDB验证错误
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: '数据验证失败',
      errors: Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
        value: err.value
      }))
    };
  }

  // MongoDB重复键错误
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      statusCode: 400,
      message: '数据已存在',
      errors: [{
        field,
        message: `${field}已存在`,
        value: error.keyValue[field]
      }]
    };
  }

  // MongoDB转换错误
  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      message: '无效的数据格式',
      errors: [{
        field: error.path,
        message: `无效的${error.kind}格式`,
        value: error.value
      }]
    };
  }

  // 默认数据库错误
  return {
    statusCode: 500,
    message: '数据库操作失败'
  };
};

export default errorHandler;