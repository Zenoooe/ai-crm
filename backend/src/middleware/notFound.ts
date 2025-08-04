/**
 * 404 Not Found 中间件
 * 处理未找到的路由
 */
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(404, `Not found - ${req.originalUrl}`);
  next(error);
};