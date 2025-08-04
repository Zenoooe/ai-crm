import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';

interface AuthRequest extends Request {
  user?: any;
}

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  timezone?: string;
  language?: string;
}

class AuthController {
  /**
   * 生成JWT令牌
   */
  private generateTokens(userId: string, rememberMe: boolean = false) {
    const accessTokenExpiry = rememberMe ? '30d' : '1d';
    const refreshTokenExpiry = rememberMe ? '90d' : '7d';

    const accessToken = jwt.sign(
      { userId, type: 'access' },
      process.env.JWT_SECRET!,
      { expiresIn: accessTokenExpiry }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: refreshTokenExpiry }
    );

    return { accessToken, refreshToken };
  }

  /**
   * 生成重置令牌
   */
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 生成验证令牌
   */
  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 用户注册
   */
  register = catchAsync(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, company, phone }: RegisterRequest = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, '该邮箱已被注册');
    }

    // 生成验证令牌
    const verificationToken = this.generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

    // 创建新用户
    const user = new User({
      email,
      password,
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      company,
      phone,
      verificationToken,
      verificationExpires,
      isActive: false // 需要邮箱验证后才能激活
    });

    await user.save();

    // 发送验证邮件（这里应该集成邮件服务）
    // await emailService.sendVerificationEmail(email, verificationToken);

    logger.info('User registered successfully', {
      userId: user._id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: '注册成功，请检查邮箱并验证账户',
      data: {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  });

  /**
   * 用户登录
   */
  login = catchAsync(async (req: Request, res: Response) => {
    const { email, password, rememberMe = false }: LoginRequest = req.body;

    // 查找用户
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError(401, '邮箱或密码错误');
    }

    // 检查账户是否激活
    if (!user.isActive) {
      throw new ApiError(401, '账户未激活，请先验证邮箱');
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.info(`Failed login attempt for ${email} from ${req.ip}`);
      throw new ApiError(401, '邮箱或密码错误');
    }

    // 生成令牌
    const { accessToken, refreshToken } = this.generateTokens(user._id.toString(), rememberMe);

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    await user.save();

    // 记录登录日志
    logger.info('User logged in successfully', {
      userId: user._id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      rememberMe
    });

    // 设置刷新令牌为HttpOnly Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 90 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          preferences: user.preferences,
          subscription: user.subscription
        }
      }
    });
  });

  /**
   * 用户登出
   */
  logout = catchAsync(async (req: AuthRequest, res: Response) => {
    // 清除刷新令牌Cookie
    res.clearCookie('refreshToken');

    logger.info('User logged out', {
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '登出成功'
    });
  });

  /**
   * 获取当前用户信息
   */
  getMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, '用户不存在');
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        preferences: user.preferences,
        subscription: user.subscription,
        apiUsage: user.apiUsage,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  });

  /**
   * 忘记密码
   */
  forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, '该邮箱未注册');
    }

    // 生成重置令牌
    const resetToken = this.generateResetToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // 发送重置邮件（这里应该集成邮件服务）
    // await emailService.sendPasswordResetEmail(email, resetToken);

    logger.info('Password reset requested', {
      userId: user._id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '密码重置邮件已发送，请检查邮箱'
    });
  });

  /**
   * 重置密码
   */
  resetPassword = catchAsync(async (req: Request, res: Response) => {
    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new ApiError(400, '重置令牌无效或已过期');
    }

    // 更新密码
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    logger.info('Password reset successfully', {
      userId: user._id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '密码重置成功，请使用新密码登录'
    });
  });

  /**
   * 修改密码
   */
  changePassword = catchAsync(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      throw new ApiError(404, '用户不存在');
    }

    // 验证当前密码
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new ApiError(401, '当前密码错误');
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    logger.info('Password changed successfully', {
      userId: user._id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '密码修改成功'
    });
  });

  /**
   * 更新个人资料
   */
  updateProfile = catchAsync(async (req: AuthRequest, res: Response) => {
    const updates: UpdateProfileRequest = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, '用户不存在');
    }

    // 更新用户信息
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof UpdateProfileRequest] !== undefined) {
        if (key === 'timezone' || key === 'language') {
          user.preferences[key] = updates[key as keyof UpdateProfileRequest] as string;
        } else {
          (user as any)[key] = updates[key as keyof UpdateProfileRequest];
        }
      }
    });

    await user.save();

    logger.info('Profile updated successfully', {
      userId: user._id,
      email: user.email,
      updates: Object.keys(updates),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '个人资料更新成功',
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        phone: user.phone,
        preferences: user.preferences
      }
    });
  });

  /**
   * 验证邮箱
   */
  verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new ApiError(400, '验证令牌无效');
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new ApiError(400, '验证令牌无效或已过期');
    }

    // 激活用户
    user.isActive = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    logger.info('Email verified successfully', {
      userId: user._id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '邮箱验证成功，账户已激活'
    });
  });

  /**
   * 重新发送验证邮件
   */
  resendVerification = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, '该邮箱未注册');
    }

    if (user.isActive) {
      throw new ApiError(400, '账户已激活，无需重复验证');
    }

    // 生成新的验证令牌
    const verificationToken = this.generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationExpires = verificationExpires;
    await user.save();

    // 发送验证邮件（这里应该集成邮件服务）
    // await emailService.sendVerificationEmail(email, verificationToken);

    logger.info('Verification email resent', {
      userId: user._id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '验证邮件已重新发送，请检查邮箱'
    });
  });

  /**
   * 刷新访问令牌
   */
  refreshToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw new ApiError(401, '刷新令牌不存在');
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      if (decoded.type !== 'refresh') {
        throw new ApiError(401, '令牌类型错误');
      }

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new ApiError(401, '用户不存在或未激活');
      }

      // 生成新的访问令牌
      const { accessToken } = this.generateTokens(user._id.toString());

      res.json({
        success: true,
        data: {
          accessToken
        }
      });
    } catch (error) {
      throw new ApiError(401, '刷新令牌无效');
    }
  });

  /**
   * 获取活跃会话列表
   */
  getSessions = catchAsync(async (req: AuthRequest, res: Response) => {
    // 这里应该从Redis或数据库获取用户的活跃会话
    // 暂时返回模拟数据
    const sessions = [
      {
        id: 'current',
        device: req.get('User-Agent') || 'Unknown',
        ip: req.ip,
        lastActive: new Date(),
        isCurrent: true
      }
    ];

    res.json({
      success: true,
      data: sessions
    });
  });

  /**
   * 终止指定会话
   */
  terminateSession = catchAsync(async (req: AuthRequest, res: Response) => {
    const { sessionId } = req.params;

    // 这里应该从Redis或数据库删除指定会话
    // 暂时返回成功响应
    logger.info('Session terminated', {
      userId: req.user.id,
      sessionId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '会话已终止'
    });
  });

  /**
   * 终止所有其他会话
   */
  terminateAllSessions = catchAsync(async (req: AuthRequest, res: Response) => {
    // 这里应该从Redis或数据库删除用户的所有其他会话
    // 暂时返回成功响应
    logger.info('All other sessions terminated', {
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '所有其他会话已终止'
    });
  });
}

export const authController = new AuthController();
export default authController;