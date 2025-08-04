import { Request, Response, NextFunction } from 'express';

/**
 * 异步函数包装器
 * 用于捕获异步路由处理函数中的错误并传递给错误处理中间件
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;