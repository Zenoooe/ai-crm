import express from 'express';
import { body, param, query } from 'express-validator';
import { ContactController } from '../controllers/contactController';
import { auth, requireOwnershipOrAdmin, checkApiUsage } from '../middleware/auth';
import { validate, isValidObjectId } from '../middleware/validate';
import { rateLimiter } from '../middleware/rateLimiter';
import multer from 'multer';

const router = express.Router();

// 配置文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPEG, PNG, GIF, WebP 格式的图片'));
    }
  }
});

// 验证规则
const createContactValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('名字长度必须在1-50个字符之间'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('姓氏长度不能超过50个字符'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('请提供有效的邮箱地址'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('请提供有效的手机号码'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('公司名称不能超过100个字符'),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('职位不能超过100个字符'),
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('行业不能超过50个字符'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('优先级必须是 low, medium, high, urgent 之一'),
  body('folder')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('文件夹名称不能超过50个字符'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组格式'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('标签长度必须在1-30个字符之间'),
  body('socialProfiles')
    .optional()
    .isObject()
    .withMessage('社交资料必须是对象格式'),
  body('businessInfo')
    .optional()
    .isObject()
    .withMessage('业务信息必须是对象格式')
];

const updateContactValidation = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('无效的联系人ID'),
  ...createContactValidation.map(rule => rule.optional())
];

const contactIdValidation = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('无效的联系人ID')
];

const batchDeleteValidation = [
  body('contactIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('联系人ID数组长度必须在1-100之间'),
  body('contactIds.*')
    .custom(isValidObjectId)
    .withMessage('无效的联系人ID')
];

const moveToFolderValidation = [
  body('contactIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('联系人ID数组长度必须在1-100之间'),
  body('contactIds.*')
    .custom(isValidObjectId)
    .withMessage('无效的联系人ID'),
  body('folder')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('文件夹名称长度必须在1-50个字符之间')
];

const updateTagsValidation = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('无效的联系人ID'),
  body('tags')
    .isArray({ max: 20 })
    .withMessage('标签数组长度不能超过20'),
  body('tags.*')
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('标签长度必须在1-30个字符之间')
];

const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('搜索关键词长度必须在1-100个字符之间'),
  query('folder')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('文件夹名称不能超过50个字符'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('优先级必须是 low, medium, high, urgent 之一'),
  query('industry')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('行业不能超过50个字符'),
  query('tags')
    .optional()
    .isString()
    .withMessage('标签必须是字符串格式'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  query('sortBy')
    .optional()
    .isIn(['firstName', 'lastName', 'company', 'createdAt', 'updatedAt', 'priority'])
    .withMessage('排序字段无效'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向必须是 asc 或 desc')
];

// 所有路由都需要认证
router.use(auth);

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: 获取联系人列表
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *         description: 文件夹筛选
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: 优先级筛选
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: 行业筛选
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: 标签筛选（逗号分隔）
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: 每页数量
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [firstName, lastName, company, createdAt, updatedAt, priority]
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 联系人列表
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.get('/',
  rateLimiter.search,
  searchValidation,
  validate,
  ContactController.getContacts
);

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     summary: 创建新联系人
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               company:
 *                 type: string
 *               position:
 *                 type: string
 *               industry:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               folder:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               socialProfiles:
 *                 type: object
 *               businessInfo:
 *                 type: object
 *     responses:
 *       201:
 *         description: 联系人创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/',
  rateLimiter.general,
  createContactValidation,
  validate,
  ContactController.createContact
);

/**
 * @swagger
 * /api/contacts/{id}:
 *   get:
 *     summary: 获取单个联系人详情
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 联系人ID
 *     responses:
 *       200:
 *         description: 联系人详情
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 联系人不存在
 */
router.get('/:id',
  contactIdValidation,
  validate,
  ContactController.getContact
);

/**
 * @swagger
 * /api/contacts/{id}:
 *   put:
 *     summary: 更新联系人信息
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 联系人ID
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
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               company:
 *                 type: string
 *               position:
 *                 type: string
 *               industry:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               folder:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               socialProfiles:
 *                 type: object
 *               businessInfo:
 *                 type: object
 *     responses:
 *       200:
 *         description: 联系人更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 联系人不存在
 */
router.put('/:id',
  rateLimiter.general,
  updateContactValidation,
  validate,
  ContactController.updateContact
);

/**
 * @swagger
 * /api/contacts/{id}:
 *   delete:
 *     summary: 删除联系人
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 联系人ID
 *     responses:
 *       200:
 *         description: 联系人删除成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 联系人不存在
 */
router.delete('/:id',
  contactIdValidation,
  validate,
  ContactController.deleteContact
);

/**
 * @swagger
 * /api/contacts/batch/delete:
 *   post:
 *     summary: 批量删除联系人
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactIds
 *             properties:
 *               contactIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 100
 *     responses:
 *       200:
 *         description: 批量删除成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/batch/delete',
  rateLimiter.batch,
  batchDeleteValidation,
  validate,
  ContactController.batchDeleteContacts
);

/**
 * @swagger
 * /api/contacts/batch/move:
 *   post:
 *     summary: 批量移动联系人到文件夹
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactIds
 *               - folder
 *             properties:
 *               contactIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 100
 *               folder:
 *                 type: string
 *     responses:
 *       200:
 *         description: 批量移动成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/batch/move',
  rateLimiter.batch,
  moveToFolderValidation,
  validate,
  ContactController.moveToFolder
);

/**
 * @swagger
 * /api/contacts/{id}/photo:
 *   post:
 *     summary: 上传联系人照片
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 联系人ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 照片上传成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 联系人不存在
 */
router.post('/:id/photo',
  rateLimiter.upload,
  contactIdValidation,
  validate,
  upload.single('photo'),
  ContactController.uploadPhoto
);

/**
 * @swagger
 * /api/contacts/{id}/photo:
 *   delete:
 *     summary: 删除联系人照片
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 联系人ID
 *     responses:
 *       200:
 *         description: 照片删除成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 联系人不存在
 */
router.delete('/:id/photo',
  contactIdValidation,
  validate,
  ContactController.deletePhoto
);

/**
 * @swagger
 * /api/contacts/{id}/tags:
 *   put:
 *     summary: 更新联系人标签
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 联系人ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tags
 *             properties:
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 20
 *     responses:
 *       200:
 *         description: 标签更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 联系人不存在
 */
router.put('/:id/tags',
  updateTagsValidation,
  validate,
  ContactController.updateTags
);

/**
 * @swagger
 * /api/contacts/folders:
 *   get:
 *     summary: 获取联系人文件夹列表
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 文件夹列表
 *       401:
 *         description: 未授权
 */
router.get('/folders',
  ContactController.getFolders
);

/**
 * @swagger
 * /api/contacts/stats:
 *   get:
 *     summary: 获取联系人统计信息
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计信息
 *       401:
 *         description: 未授权
 */
router.get('/stats',
  ContactController.getStats
);

export default router;