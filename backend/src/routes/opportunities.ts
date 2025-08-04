import express from 'express';
import { body, param, query } from 'express-validator';
import { OpportunityController } from '../controllers/opportunityController';
import { auth, requireOwnershipOrAdmin, checkApiUsage } from '../middleware/auth';
import { validate, isValidObjectId } from '../middleware/validate';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// 验证规则
const opportunityIdValidation = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('无效的销售机会ID格式')
];

const createOpportunityValidation = [
  body('title')
    .notEmpty()
    .withMessage('销售机会标题不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('标题长度应在1-100个字符之间'),
  
  body('customerId')
    .custom(isValidObjectId)
    .withMessage('无效的客户ID格式'),
  
  body('value')
    .isFloat({ min: 0 })
    .withMessage('销售机会价值必须是非负数'),
  
  body('currency')
    .optional()
    .isIn(['CNY', 'USD', 'EUR', 'GBP', 'JPY'])
    .withMessage('货币类型无效'),
  
  body('stage')
    .isIn(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
    .withMessage('销售阶段无效'),
  
  body('probability')
    .isInt({ min: 0, max: 100 })
    .withMessage('成交概率必须是0-100之间的整数'),
  
  body('expectedCloseDate')
    .isISO8601()
    .withMessage('预期成交日期格式无效'),
  
  body('source')
    .optional()
    .isLength({ max: 50 })
    .withMessage('来源长度不能超过50个字符'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('优先级必须是 low, medium, high, urgent 之一'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('描述长度不能超过1000个字符'),
  
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
    .withMessage('自定义字段必须是对象格式')
];

const updateOpportunityValidation = [
  ...opportunityIdValidation,
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('标题长度应在1-100个字符之间'),
  
  body('customerId')
    .optional()
    .custom(isValidObjectId)
    .withMessage('无效的客户ID格式'),
  
  body('value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('销售机会价值必须是非负数'),
  
  body('currency')
    .optional()
    .isIn(['CNY', 'USD', 'EUR', 'GBP', 'JPY'])
    .withMessage('货币类型无效'),
  
  body('stage')
    .optional()
    .isIn(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
    .withMessage('销售阶段无效'),
  
  body('probability')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('成交概率必须是0-100之间的整数'),
  
  body('expectedCloseDate')
    .optional()
    .isISO8601()
    .withMessage('预期成交日期格式无效'),
  
  body('actualCloseDate')
    .optional()
    .isISO8601()
    .withMessage('实际成交日期格式无效'),
  
  body('source')
    .optional()
    .isLength({ max: 50 })
    .withMessage('来源长度不能超过50个字符'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('优先级必须是 low, medium, high, urgent 之一'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('描述长度不能超过1000个字符'),
  
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
    .withMessage('自定义字段必须是对象格式')
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
  
  query('stage')
    .optional()
    .isIn(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
    .withMessage('销售阶段无效'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('优先级必须是 low, medium, high, urgent 之一'),
  
  query('customerId')
    .optional()
    .custom(isValidObjectId)
    .withMessage('无效的客户ID格式'),
  
  query('minValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('最小价值必须是非负数'),
  
  query('maxValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('最大价值必须是非负数'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'title', 'value', 'expectedCloseDate', 'probability'])
    .withMessage('排序字段无效'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向必须是 asc 或 desc')
];

const batchDeleteValidation = [
  body('opportunityIds')
    .isArray({ min: 1 })
    .withMessage('请提供要删除的销售机会ID列表'),
  
  body('opportunityIds.*')
    .custom(isValidObjectId)
    .withMessage('销售机会ID格式无效')
];

const updateStageValidation = [
  ...opportunityIdValidation,
  body('stage')
    .isIn(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
    .withMessage('销售阶段无效'),
  
  body('probability')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('成交概率必须是0-100之间的整数'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('备注长度不能超过500个字符')
];

const addActivityValidation = [
  ...opportunityIdValidation,
  body('type')
    .isIn(['call', 'email', 'meeting', 'note', 'task', 'demo'])
    .withMessage('活动类型必须是 call, email, meeting, note, task, demo 之一'),
  
  body('subject')
    .notEmpty()
    .withMessage('活动主题不能为空')
    .isLength({ max: 100 })
    .withMessage('活动主题长度不能超过100个字符'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('活动描述长度不能超过1000个字符'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('活动日期格式无效'),
  
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
 * @route GET /api/opportunities
 * @desc 获取销售机会列表
 * @access Private
 */
router.get('/',
  auth,
  checkApiUsage,
  rateLimiter.search,
  searchValidation,
  validate,
  OpportunityController.getOpportunities
);

/**
 * @route POST /api/opportunities
 * @desc 创建新销售机会
 * @access Private
 */
router.post('/',
  auth,
  checkApiUsage,
  rateLimiter.general,
  createOpportunityValidation,
  validate,
  OpportunityController.createOpportunity
);

/**
 * @route GET /api/opportunities/:id
 * @desc 获取单个销售机会详情
 * @access Private
 */
router.get('/:id',
  auth,
  checkApiUsage,
  rateLimiter.general,
  opportunityIdValidation,
  validate,
  OpportunityController.getOpportunity
);

/**
 * @route PUT /api/opportunities/:id
 * @desc 更新销售机会信息
 * @access Private
 */
router.put('/:id',
  auth,
  checkApiUsage,
  rateLimiter.general,
  updateOpportunityValidation,
  validate,
  OpportunityController.updateOpportunity
);

/**
 * @route DELETE /api/opportunities/:id
 * @desc 删除销售机会
 * @access Private
 */
router.delete('/:id',
  auth,
  checkApiUsage,
  rateLimiter.general,
  opportunityIdValidation,
  validate,
  OpportunityController.deleteOpportunity
);

/**
 * @route POST /api/opportunities/batch-delete
 * @desc 批量删除销售机会
 * @access Private
 */
router.post('/batch-delete',
  auth,
  checkApiUsage,
  rateLimiter.batch,
  batchDeleteValidation,
  validate,
  OpportunityController.batchDeleteOpportunities
);

/**
 * @route PUT /api/opportunities/:id/stage
 * @desc 更新销售机会阶段
 * @access Private
 */
router.put('/:id/stage',
  auth,
  checkApiUsage,
  rateLimiter.general,
  updateStageValidation,
  validate,
  OpportunityController.updateStage
);

/**
 * @route POST /api/opportunities/:id/activities
 * @desc 添加销售机会活动记录
 * @access Private
 */
router.post('/:id/activities',
  auth,
  checkApiUsage,
  rateLimiter.general,
  addActivityValidation,
  validate,
  OpportunityController.addActivity
);

/**
 * @route GET /api/opportunities/:id/activities
 * @desc 获取销售机会活动记录
 * @access Private
 */
router.get('/:id/activities',
  auth,
  checkApiUsage,
  rateLimiter.general,
  opportunityIdValidation,
  validate,
  OpportunityController.getActivities
);

/**
 * @route GET /api/opportunities/stats/pipeline
 * @desc 获取销售漏斗统计
 * @access Private
 */
router.get('/stats/pipeline',
  auth,
  checkApiUsage,
  rateLimiter.general,
  OpportunityController.getPipelineStats
);

/**
 * @route GET /api/opportunities/stats/performance
 * @desc 获取销售业绩统计
 * @access Private
 */
router.get('/stats/performance',
  auth,
  checkApiUsage,
  rateLimiter.general,
  query('period')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year'])
    .withMessage('统计周期必须是 week, month, quarter, year 之一'),
  validate,
  OpportunityController.getPerformanceStats
);

/**
 * @route GET /api/opportunities/export
 * @desc 导出销售机会数据
 * @access Private
 */
router.get('/export',
  auth,
  checkApiUsage,
  rateLimiter.exports,
  searchValidation,
  validate,
  OpportunityController.exportOpportunities
);

export default router;