/**
 * 日志记录器
 * 提供统一的日志记录功能
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase();
    switch (level) {
      case 'ERROR':
        return LogLevel.ERROR;
      case 'WARN':
        return LogLevel.WARN;
      case 'INFO':
        return LogLevel.INFO;
      case 'DEBUG':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    let message = `[${timestamp}] [${levelName}] ${entry.message}`;

    if (entry.data) {
      message += ` | Data: ${JSON.stringify(entry.data, null, 2)}`;
    }

    if (entry.error) {
      message += ` | Error: ${entry.error.message}`;
      if (this.isDevelopment && entry.error.stack) {
        message += `\nStack: ${entry.error.stack}`;
      }
    }

    return message;
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
      error
    };

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
    }

    // 在生产环境中，可以在这里添加日志持久化逻辑
    // 例如写入文件、发送到日志服务等
    if (!this.isDevelopment) {
      this.persistLog(entry);
    }
  }

  private persistLog(entry: LogEntry): void {
    // 这里可以实现日志持久化逻辑
    // 例如：
    // - 写入文件
    // - 发送到 ELK Stack
    // - 发送到云日志服务
    // - 存储到数据库
  }

  /**
   * 记录错误日志
   */
  error(message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, message, data, error);
  }

  /**
   * 记录警告日志
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * 记录信息日志
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * 记录调试日志
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * 记录HTTP请求日志
   */
  http(method: string, url: string, statusCode: number, responseTime: number, userAgent?: string): void {
    const data = {
      method,
      url,
      statusCode,
      responseTime,
      userAgent
    };

    const message = `${method} ${url} ${statusCode} - ${responseTime}ms`;
    
    if (statusCode >= 400) {
      this.warn(message, data);
    } else {
      this.info(message, data);
    }
  }

  /**
   * 记录数据库操作日志
   */
  database(operation: string, collection: string, duration: number, error?: Error): void {
    const data = {
      operation,
      collection,
      duration
    };

    const message = `DB ${operation} on ${collection} - ${duration}ms`;
    
    if (error) {
      this.error(message, error, data);
    } else {
      this.debug(message, data);
    }
  }

  /**
   * 记录AI服务调用日志
   */
  ai(service: string, operation: string, tokens?: number, cost?: number, duration?: number, error?: Error): void {
    const data = {
      service,
      operation,
      tokens,
      cost,
      duration
    };

    const message = `AI ${service} ${operation}${tokens ? ` - ${tokens} tokens` : ''}${duration ? ` - ${duration}ms` : ''}`;
    
    if (error) {
      this.error(message, error, data);
    } else {
      this.info(message, data);
    }
  }

  /**
   * 记录安全相关日志
   */
  security(event: string, userId?: string, ip?: string, userAgent?: string, details?: any): void {
    const data = {
      event,
      userId,
      ip,
      userAgent,
      details
    };

    const message = `Security Event: ${event}${userId ? ` - User: ${userId}` : ''}${ip ? ` - IP: ${ip}` : ''}`;
    this.warn(message, data);
  }

  /**
   * 记录性能监控日志
   */
  performance(metric: string, value: number, unit: string = 'ms', tags?: Record<string, string>): void {
    const data = {
      metric,
      value,
      unit,
      tags
    };

    const message = `Performance: ${metric} = ${value}${unit}`;
    this.debug(message, data);
  }

  /**
   * 创建子日志记录器
   */
  child(context: Record<string, any>): Logger {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);
    
    childLogger.log = (level: LogLevel, message: string, data?: any, error?: Error) => {
      const mergedData = { ...context, ...data };
      originalLog(level, message, mergedData, error);
    };

    return childLogger;
  }
}

// 创建全局日志记录器实例
export const logger = new Logger();

// 导出日志记录器类，以便创建自定义实例
export { Logger };

export default logger;