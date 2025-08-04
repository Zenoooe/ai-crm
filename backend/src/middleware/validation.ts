/**
 * 请求验证中间件
 * 使用express-validator进行请求参数验证
 */
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

/**
 * 验证请求参数
 * 如果验证失败，返回400错误和详细的错误信息
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    // Basic schema validation
    const errors: any[] = [];
    
    if (schema && typeof schema === 'object') {
      Object.keys(schema).forEach(key => {
        const rule = schema[key];
        const value = req.body[key];
        
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push({
            field: key,
            message: `${key} is required`,
            value: value
          });
        }
        
        if (value !== undefined && rule.type) {
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (actualType !== rule.type) {
            errors.push({
              field: key,
              message: `${key} must be of type ${rule.type}`,
              value: value
            });
          }
        }
      });
    }
    
    if (errors.length > 0) {
      logger.warn('请求验证失败', {
        url: req.url,
        method: req.method,
        errors: errors,
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errors
      });
    }
    
    next();
  };
};

/**
 * 自定义验证器：检查MongoDB ObjectId格式
 */
export const isValidObjectId = (value: string) => {
  return /^[0-9a-fA-F]{24}$/.test(value);
};

/**
 * 自定义验证器：检查日期范围
 */
export const isValidDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

/**
 * 自定义验证器：检查邮箱格式
 */
export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 自定义验证器：检查手机号格式
 */
export const isValidPhone = (phone: string) => {
  const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
};

/**
 * 自定义验证器：检查密码强度
 */
export const isStrongPassword = (password: string) => {
  // 至少8位，包含大小写字母、数字和特殊字符
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * 自定义验证器：检查URL格式
 */
export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 自定义验证器：检查JSON格式
 */
export const isValidJson = (value: string) => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * 文件上传验证
 */
export const validateFileUpload = (allowedTypes: string[], maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未找到上传文件'
      });
    }
    
    // 检查文件类型
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `不支持的文件类型。允许的类型：${allowedTypes.join(', ')}`
      });
    }
    
    // 检查文件大小
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `文件大小超过限制。最大允许：${maxSize / (1024 * 1024)}MB`
      });
    }
    
    next();
  };
};

/**
 * 批量文件上传验证
 */
export const validateMultipleFileUpload = (allowedTypes: string[], maxSize: number, maxCount: number) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '未找到上传文件'
      });
    }
    
    // 检查文件数量
    if (files.length > maxCount) {
      return res.status(400).json({
        success: false,
        message: `文件数量超过限制。最大允许：${maxCount}个`
      });
    }
    
    // 检查每个文件
    for (const file of files) {
      // 检查文件类型
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `文件 "${file.originalname}" 类型不支持。允许的类型：${allowedTypes.join(', ')}`
        });
      }
      
      // 检查文件大小
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `文件 "${file.originalname}" 大小超过限制。最大允许：${maxSize / (1024 * 1024)}MB`
        });
      }
    }
    
    next();
  };
};

/**
 * 分页参数验证
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): any => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: '页码必须大于0'
    });
  }
  
  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: '每页数量必须在1-100之间'
    });
  }
  
  req.query.page = page.toString();
  req.query.limit = limit.toString();
  
  next();
};

/**
 * 排序参数验证
 */
export const validateSorting = (allowedFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as string;
    
    if (sortBy && !allowedFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `无效的排序字段。允许的字段：${allowedFields.join(', ')}`
      });
    }
    
    if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: '排序方向必须是 asc 或 desc'
      });
    }
    
    next();
  };
};

/**
 * 日期范围验证
 */
export const validateDateRange = (req: Request, res: Response, next: NextFunction): any => {
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: '日期格式无效'
      });
    }
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: '开始日期不能晚于结束日期'
      });
    }
    
    // 检查日期范围是否过大（例如超过1年）
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      return res.status(400).json({
        success: false,
        message: '日期范围不能超过365天'
      });
    }
  }
  
  next();
};

export default {
  validateRequest,
  isValidObjectId,
  isValidDateRange,
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  isValidUrl,
  isValidJson,
  validateFileUpload,
  validateMultipleFileUpload,
  validatePagination,
  validateSorting,
  validateDateRange
};