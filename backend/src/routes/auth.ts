import express from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// 注册验证规则
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请提供有效的邮箱地址'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码至少需要8个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('密码必须包含大小写字母、数字和特殊字符'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('名字长度必须在1-50个字符之间'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('姓氏长度必须在1-50个字符之间'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('公司名称不能超过100个字符'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('请提供有效的手机号码')
];

// 登录验证规则
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请提供有效的邮箱地址'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
];

// 忘记密码验证规则
const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请提供有效的邮箱地址')
];

// 重置密码验证规则
const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('重置令牌不能为空'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码至少需要8个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('密码必须包含大小写字母、数字和特殊字符')
];

// 修改密码验证规则
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('当前密码不能为空'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('新密码至少需要8个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('新密码必须包含大小写字母、数字和特殊字符')
];

// 更新个人资料验证规则
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('名字长度必须在1-50个字符之间'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('姓氏长度必须在1-50个字符之间'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('公司名称不能超过100个字符'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('请提供有效的手机号码'),
  body('timezone')
    .optional()
    .isIn([
      'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
      'Asia/Kolkata', 'Australia/Sydney'
    ])
    .withMessage('请选择有效的时区'),
  body('language')
    .optional()
    .isIn(['zh-CN', 'en-US', 'ja-JP', 'ko-KR'])
    .withMessage('请选择有效的语言')
];

// 公开路由（不需要认证）

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               company:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: 注册成功
 *       400:
 *         description: 请求参数错误
 *       409:
 *         description: 邮箱已存在
 */
router.post('/register', 
  rateLimiter.auth,
  registerValidation,
  validate,
  authController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               rememberMe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 登录成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 邮箱或密码错误
 */
router.post('/login',
  rateLimiter.auth,
  loginValidation,
  validate,
  authController.login
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: 忘记密码
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: 重置邮件已发送
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 用户不存在
 */
router.post('/forgot-password',
  rateLimiter.auth,
  forgotPasswordValidation,
  validate,
  authController.forgotPassword
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: 重置密码
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: 密码重置成功
 *       400:
 *         description: 请求参数错误或令牌无效
 */
router.post('/reset-password',
  rateLimiter.auth,
  resetPasswordValidation,
  validate,
  authController.resetPassword
);

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: 验证邮箱
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 邮箱验证成功
 *       400:
 *         description: 令牌无效或已过期
 */
router.get('/verify-email', authController.verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: 重新发送验证邮件
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: 验证邮件已发送
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 用户不存在
 */
router.post('/resend-verification',
  rateLimiter.auth,
  forgotPasswordValidation, // 复用邮箱验证规则
  validate,
  authController.resendVerification
);

// 需要认证的路由

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 获取当前用户信息
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户信息
 *       401:
 *         description: 未授权
 */
router.get('/me', auth, authController.getMe);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 用户登出
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 *       401:
 *         description: 未授权
 */
router.post('/logout', auth, authController.logout);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: 修改密码
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: 密码修改成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 当前密码错误
 */
router.put('/change-password',
  auth,
  changePasswordValidation,
  validate,
  authController.changePassword
);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: 更新个人资料
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               company:
 *                 type: string
 *               phone:
 *                 type: string
 *               timezone:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: 资料更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.put('/profile',
  auth,
  updateProfileValidation,
  validate,
  authController.updateProfile
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 刷新访问令牌
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 令牌刷新成功
 *       401:
 *         description: 刷新令牌无效
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     summary: 获取活跃会话列表
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 会话列表
 *       401:
 *         description: 未授权
 */
router.get('/sessions', auth, authController.getSessions);

/**
 * @swagger
 * /api/auth/sessions/{sessionId}:
 *   delete:
 *     summary: 终止指定会话
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 会话已终止
 *       401:
 *         description: 未授权
 *       404:
 *         description: 会话不存在
 */
router.delete('/sessions/:sessionId', auth, authController.terminateSession);

/**
 * @swagger
 * /api/auth/sessions:
 *   delete:
 *     summary: 终止所有其他会话
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 所有其他会话已终止
 *       401:
 *         description: 未授权
 */
router.delete('/sessions', auth, authController.terminateAllSessions);

export default router;