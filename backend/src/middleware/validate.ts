import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

/**
 * 验证中间件
 * 处理express-validator的验证结果
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error: ValidationError) => {
      if (error.type === 'field') {
        return {
          field: error.path,
          message: error.msg,
          value: error.value
        };
      }
      return {
        message: error.msg
      };
    });

    logger.warn('Validation failed', {
      url: req.originalUrl,
      method: req.method,
      errors: errorMessages,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const firstError = errorMessages[0];
    throw new ApiError(400, firstError.message, errorMessages);
  }

  next();
};

/**
 * 自定义验证器：检查ObjectId格式
 */
export const isValidObjectId = (value: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(value);
};

/**
 * 自定义验证器：检查手机号格式（中国大陆）
 */
export const isValidChinesePhone = (value: string): boolean => {
  return /^1[3-9]\d{9}$/.test(value);
};

/**
 * 自定义验证器：检查密码强度
 */
export const isStrongPassword = (value: string): boolean => {
  // 至少8位，包含大小写字母、数字和特殊字符
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
};

/**
 * 自定义验证器：检查URL格式
 */
export const isValidUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * 自定义验证器：检查日期格式
 */
export const isValidDate = (value: string): boolean => {
  const date = new Date(value);
  return !isNaN(date.getTime());
};

/**
 * 自定义验证器：检查未来日期
 */
export const isFutureDate = (value: string): boolean => {
  const date = new Date(value);
  return date > new Date();
};

/**
 * 自定义验证器：检查过去日期
 */
export const isPastDate = (value: string): boolean => {
  const date = new Date(value);
  return date < new Date();
};

/**
 * 自定义验证器：检查文件大小
 */
export const isValidFileSize = (maxSizeInMB: number) => {
  return (value: any): boolean => {
    if (!value || !value.size) return true;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return value.size <= maxSizeInBytes;
  };
};

/**
 * 自定义验证器：检查文件类型
 */
export const isValidFileType = (allowedTypes: string[]) => {
  return (value: any): boolean => {
    if (!value || !value.mimetype) return true;
    return allowedTypes.includes(value.mimetype);
  };
};

/**
 * 自定义验证器：检查数组长度
 */
export const isValidArrayLength = (min: number, max: number) => {
  return (value: any[]): boolean => {
    if (!Array.isArray(value)) return false;
    return value.length >= min && value.length <= max;
  };
};

/**
 * 自定义验证器：检查字符串是否为JSON
 */
export const isValidJSON = (value: string): boolean => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * 自定义验证器：检查颜色代码
 */
export const isValidHexColor = (value: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
};

/**
 * 自定义验证器：检查经纬度
 */
export const isValidLatitude = (value: number): boolean => {
  return value >= -90 && value <= 90;
};

export const isValidLongitude = (value: number): boolean => {
  return value >= -180 && value <= 180;
};

/**
 * 自定义验证器：检查IP地址
 */
export const isValidIP = (value: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(value) || ipv6Regex.test(value);
};

/**
 * 自定义验证器：检查MAC地址
 */
export const isValidMAC = (value: string): boolean => {
  return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(value);
};

/**
 * 自定义验证器：检查信用卡号
 */
export const isValidCreditCard = (value: string): boolean => {
  // Luhn算法验证
  const digits = value.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

/**
 * 自定义验证器：检查身份证号（中国大陆）
 */
export const isValidChineseID = (value: string): boolean => {
  const regex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
  if (!regex.test(value)) return false;
  
  // 校验码验证
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(value[i]) * weights[i];
  }
  
  const checkCode = checkCodes[sum % 11];
  return value[17].toUpperCase() === checkCode;
};

/**
 * 自定义验证器：检查银行卡号
 */
export const isValidBankCard = (value: string): boolean => {
  // 中国银行卡号一般为16-19位数字
  return /^\d{16,19}$/.test(value);
};

/**
 * 自定义验证器：检查邮政编码（中国大陆）
 */
export const isValidChinesePostalCode = (value: string): boolean => {
  return /^[1-9]\d{5}$/.test(value);
};

/**
 * 自定义验证器：检查QQ号
 */
export const isValidQQ = (value: string): boolean => {
  return /^[1-9]\d{4,10}$/.test(value);
};

/**
 * 自定义验证器：检查微信号
 */
export const isValidWeChat = (value: string): boolean => {
  return /^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/.test(value);
};

export default validate;