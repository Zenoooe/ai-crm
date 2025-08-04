/**
 * 自定义API错误类
 * 用于统一处理应用程序中的错误
 */
export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(
    statusCode: number,
    message: string,
    details?: any,
    isOperational: boolean = true,
    stack: string = ''
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    
    if (stack) {
      this.stack = stack;
    } else if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }

  /**
   * 创建400错误 - 请求参数错误
   */
  static badRequest(message: string = '请求参数错误', details?: any): ApiError {
    return new ApiError(400, message, details);
  }

  /**
   * 创建401错误 - 未授权
   */
  static unauthorized(message: string = '未授权访问', details?: any): ApiError {
    return new ApiError(401, message, details);
  }

  /**
   * 创建403错误 - 禁止访问
   */
  static forbidden(message: string = '禁止访问', details?: any): ApiError {
    return new ApiError(403, message, details);
  }

  /**
   * 创建404错误 - 资源不存在
   */
  static notFound(message: string = '资源不存在', details?: any): ApiError {
    return new ApiError(404, message, details);
  }

  /**
   * 创建409错误 - 资源冲突
   */
  static conflict(message: string = '资源冲突', details?: any): ApiError {
    return new ApiError(409, message, details);
  }

  /**
   * 创建422错误 - 数据验证失败
   */
  static validationError(message: string = '数据验证失败', details?: any): ApiError {
    return new ApiError(422, message, details);
  }

  /**
   * 创建429错误 - 请求过于频繁
   */
  static tooManyRequests(message: string = '请求过于频繁', details?: any): ApiError {
    return new ApiError(429, message, details);
  }

  /**
   * 创建500错误 - 服务器内部错误
   */
  static internal(message: string = '服务器内部错误', details?: any): ApiError {
    return new ApiError(500, message, details);
  }

  /**
   * 创建502错误 - 网关错误
   */
  static badGateway(message: string = '网关错误', details?: any): ApiError {
    return new ApiError(502, message, details);
  }

  /**
   * 创建503错误 - 服务不可用
   */
  static serviceUnavailable(message: string = '服务暂时不可用', details?: any): ApiError {
    return new ApiError(503, message, details);
  }

  /**
   * 将错误转换为JSON格式
   */
  toJSON(): object {
    return {
      success: false,
      error: {
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 检查是否为操作性错误
   */
  static isOperationalError(error: Error): boolean {
    if (error instanceof ApiError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * 从标准错误创建ApiError
   */
  static fromError(error: Error, statusCode: number = 500): ApiError {
    return new ApiError(
      statusCode,
      error.message,
      { originalError: error.name },
      false,
      error.stack
    );
  }

  /**
   * 从Mongoose验证错误创建ApiError
   */
  static fromMongooseValidationError(error: any): ApiError {
    const errors = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));

    return new ApiError(
      422,
      '数据验证失败',
      { validationErrors: errors }
    );
  }

  /**
   * 从Mongoose重复键错误创建ApiError
   */
  static fromMongoDuplicateKeyError(error: any): ApiError {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];

    return new ApiError(
      409,
      `${field} '${value}' 已存在`,
      { field, value }
    );
  }

  /**
   * 从JWT错误创建ApiError
   */
  static fromJWTError(error: any): ApiError {
    if (error.name === 'TokenExpiredError') {
      return new ApiError(401, '令牌已过期', { expiredAt: error.expiredAt });
    }
    if (error.name === 'JsonWebTokenError') {
      return new ApiError(401, '无效的令牌', { reason: error.message });
    }
    if (error.name === 'NotBeforeError') {
      return new ApiError(401, '令牌尚未生效', { notBefore: error.notBefore });
    }
    return new ApiError(401, '令牌验证失败', { reason: error.message });
  }
}

export default ApiError;