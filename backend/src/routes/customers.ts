import express from 'express';
import { body, param, query } from 'express-validator';
import { CustomerController } from '../controllers/customerController';
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
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// 验证规则
const customerIdValidation = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('无效的客户ID格式')
];

const createCustomerValidation = [
  body('basicInfo.name')
    .notEmpty()
    .withMessage('客户姓名不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('客户姓名长度应在1-50个字符之间'),
  
  body('basicInfo.company')
    .optional()
    .isLength({ max: 100 })
    .withMessage('公司名称长度不能超过100个字符'),
  
  body('basicInfo.position')
    .optional()
    .isLength({ max: 50 })
    .withMessage('职位长度不能超过50个字符'),
  
  body('basicInfo.email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('basicInfo.phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码'),
  
  body('basicInfo.industry')
    .optional()
    .isLength({ max: 50 })
    .withMessage('行业长度不能超过50个字符'),
  
  body('basicInfo.location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('地址长度不能超过100个字符'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('优先级必须是 low, medium, high, urgent 之一'),
  
  body('status')
    .optional()
    .isIn(['lead', 'prospect', 'customer', 'inactive'])
    .withMessage('状态必须是 lead, prospect, customer, inactive 之一'),
  
  body('source')
    .optional()
    .isLength({ max: 50 })
    .withMessage('来源长度不能超过50个字符'),
  
  body('folder')
    .optional()
    .isLength({ max: 50 })
    .withMessage('文件夹名称长度不能超过50个字符'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组格式'),
  
  body('tags.*.name')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('标签名称长度应在1-20个字符之间'),
  
  body('tags.*.color')
    .optional()
    .isHexColor()
    .withMessage('标签颜色必须是有效的十六进制颜色值'),
  
  body('customFields')
    .optional()
    .isObject()
    .withMessage('自定义字段必须是对象格式'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('备注长度不能超过1000个字符')
];

const updateCustomerValidation = [
  ...customerIdValidation,
  body('basicInfo.name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('客户姓名长度应在1-50个字符之间'),
  
  body('basicInfo.company')
    .optional()
    .isLength({ max: 100 })
    .withMessage('公司名称长度不能超过100个字符'),
  
  body('basicInfo.position')
    .optional()
    .isLength({ max: 50 })
    .withMessage('职位长度不能超过50个字符'),
  
  body('basicInfo.email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('basicInfo.phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码'),
  
  body('basicInfo.industry')
    .optional()
    .isLength({ max: 50 })
    .withMessage('行业长度不能超过50个字符'),
  
  body('basicInfo.location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('地址长度不能超过100个字符'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('优先级必须是 low, medium, high, urgent 之一'),
  
  body('status')
    .optional()
    .isIn(['lead', 'prospect', 'customer', 'inactive'])
    .withMessage('状态必须是 lead, prospect, customer, inactive 之一'),
  
  body('source')
    .optional()
    .isLength({ max: 50 })
    .withMessage('来源长度不能超过50个字符'),
  
  body('folder')
    .optional()
    .isLength({ max: 50 })
    .withMessage('文件夹名称长度不能超过50个字符'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组格式'),
  
  body('tags.*.name')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('标签名称长度应在1-20个字符之间'),
  
  body('tags.*.color')
    .optional()
    .isHexColor()
    .withMessage('标签颜色必须是有效的十六进制颜色值'),
  
  body('customFields')
    .optional()
    .isObject()
    .withMessage('自定义字段必须是对象格式'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('备注长度不能超过1000个字符')
];

const searchValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('搜索关键词长度应在1-100个字符之间'),
  
  query('folder')
    .optional()
    .isLength({ max: 50 })
    .withMessage('文件夹名称长度不能超过50个字符'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('优先级必须是 low, medium, high, urgent 之一'),
  
  query('status')
    .optional()
    .isIn(['lead', 'prospect', 'customer', 'inactive'])
    .withMessage('状态必须是 lead, prospect, customer, inactive 之一'),
  
  query('industry')
    .optional()
    .isLength({ max: 50 })
    .withMessage('行业长度不能超过50个字符'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'name', 'company', 'priority'])
    .withMessage('排序字段无效'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向必须是 asc 或 desc')
];

const batchDeleteValidation = [
  body('customerIds')
    .isArray({ min: 1 })
    .withMessage('请提供要删除的客户ID列表'),
  
  body('customerIds.*')
    .custom(isValidObjectId)
    .withMessage('客户ID格式无效')
];

const moveToFolderValidation = [
  body('customerIds')
    .isArray({ min: 1 })
    .withMessage('请提供要移动的客户ID列表'),
  
  body('customerIds.*')
    .custom(isValidObjectId)
    .withMessage('客户ID格式无效'),
  
  body('folder')
    .notEmpty()
    .withMessage('目标文件夹不能为空')
    .isLength({ max: 50 })
    .withMessage('文件夹名称长度不能超过50个字符')
];

const updateTagsValidation = [
  ...customerIdValidation,
  body('tags')
    .isArray()
    .withMessage('标签必须是数组格式'),
  
  body('tags.*.name')
    .isLength({ min: 1, max: 20 })
    .withMessage('标签名称长度应在1-20个字符之间'),
  
  body('tags.*.color')
    .optional()
    .isHexColor()
    .withMessage('标签颜色必须是有效的十六进制颜色值')
];

const addInteractionValidation = [
  ...customerIdValidation,
  body('type')
    .isIn(['call', 'email', 'meeting', 'note', 'task'])
    .withMessage('交互类型必须是 call, email, meeting, note, task 之一'),
  
  body('content')
    .notEmpty()
    .withMessage('交互内容不能为空')
    .isLength({ max: 1000 })
    .withMessage('交互内容长度不能超过1000个字符'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('日期格式无效'),
  
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('持续时间必须是非负整数'),
  
  body('outcome')
    .optional()
    .isLength({ max: 200 })
    .withMessage('结果描述长度不能超过200个字符')
];

// 路由定义

/**
 * @route GET /api/customers
 * @desc 获取客户列表
 * @access Private
 */
router.get('/',
  auth,
  checkApiUsage,
  rateLimiter.search,
  searchValidation,
  validate,
  CustomerController.getCustomers
);

/**
 * @route POST /api/customers
 * @desc 创建新客户
 * @access Private
 */
router.post('/',
  auth,
  checkApiUsage,
  rateLimiter.general,
  createCustomerValidation,
  validate,
  CustomerController.createCustomer
);

/**
 * @route GET /api/customers/:id
 * @desc 获取单个客户详情
 * @access Private
 */
router.get('/:id',
  auth,
  checkApiUsage,
  rateLimiter.general,
  customerIdValidation,
  validate,
  CustomerController.getCustomer
);

/**
 * @route PUT /api/customers/:id
 * @desc 更新客户信息
 * @access Private
 */
router.put('/:id',
  auth,
  checkApiUsage,
  rateLimiter.general,
  updateCustomerValidation,
  validate,
  CustomerController.updateCustomer
);

/**
 * @route DELETE /api/customers/:id
 * @desc 删除客户
 * @access Private
 */
router.delete('/:id',
  auth,
  checkApiUsage,
  rateLimiter.general,
  customerIdValidation,
  validate,
  CustomerController.deleteCustomer
);

/**
 * @route POST /api/customers/batch-delete
 * @desc 批量删除客户
 * @access Private
 */
router.post('/batch-delete',
  auth,
  checkApiUsage,
  rateLimiter.batch,
  batchDeleteValidation,
  validate,
  CustomerController.batchDeleteCustomers
);

/**
 * @route POST /api/customers/move-to-folder
 * @desc 批量移动客户到文件夹
 * @access Private
 */
router.post('/move-to-folder',
  auth,
  checkApiUsage,
  rateLimiter.batch,
  moveToFolderValidation,
  validate,
  CustomerController.moveToFolder
);

/**
 * @route POST /api/customers/:id/photo
 * @desc 上传客户头像
 * @access Private
 */
router.post('/:id/photo',
  auth,
  checkApiUsage,
  rateLimiter.upload,
  customerIdValidation,
  validate,
  upload.single('photo'),
  CustomerController.uploadPhoto
);

/**
 * @route DELETE /api/customers/:id/photo
 * @desc 删除客户头像
 * @access Private
 */
router.delete('/:id/photo',
  auth,
  checkApiUsage,
  rateLimiter.general,
  customerIdValidation,
  validate,
  CustomerController.deletePhoto
);

/**
 * @route PUT /api/customers/:id/tags
 * @desc 更新客户标签
 * @access Private
 */
router.put('/:id/tags',
  auth,
  checkApiUsage,
  rateLimiter.general,
  updateTagsValidation,
  validate,
  CustomerController.updateTags
);

/**
 * @route POST /api/customers/:id/interactions
 * @desc 添加客户交互记录
 * @access Private
 */
router.post('/:id/interactions',
  auth,
  checkApiUsage,
  rateLimiter.general,
  addInteractionValidation,
  validate,
  CustomerController.addInteraction
);

/**
 * @route GET /api/customers/:id/interactions
 * @desc 获取客户交互记录
 * @access Private
 */
router.get('/:id/interactions',
  auth,
  checkApiUsage,
  rateLimiter.general,
  customerIdValidation,
  validate,
  CustomerController.getInteractions
);

/**
 * @route GET /api/customers/folders
 * @desc 获取客户文件夹列表
 * @access Private
 */
router.get('/folders',
  auth,
  checkApiUsage,
  rateLimiter.general,
  CustomerController.getFolders
);

/**
 * @route GET /api/customers/stats
 * @desc 获取客户统计信息
 * @access Private
 */
router.get('/stats',
  auth,
  checkApiUsage,
  rateLimiter.general,
  CustomerController.getStats
);

/**
 * @route GET /api/customers/export
 * @desc 导出客户数据
 * @access Private
 */
router.get('/export',
  auth,
  checkApiUsage,
  rateLimiter.exports,
  searchValidation,
  validate,
  CustomerController.exportCustomers
);

export default router;