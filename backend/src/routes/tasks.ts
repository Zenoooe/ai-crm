import express from 'express';
import { body, param, query } from 'express-validator';
import { TaskController } from '../controllers/taskController';
import { auth, requireOwnershipOrAdmin, checkApiUsage } from '../middleware/auth';
import { validate, isValidObjectId } from '../middleware/validate';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// 验证规则
const taskIdValidation = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('无效的任务ID格式')
];

const createTaskValidation = [
  body('title')
    .notEmpty()
    .withMessage('任务标题不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('标题长度应在1-100个字符之间'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('描述长度不能超过1000个字符'),
  
  body('type')
    .isIn(['call', 'email', 'meeting', 'follow_up', 'demo', 'proposal', 'other'])
    .withMessage('任务类型无效'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('优先级必须是 low, medium, high, urgent 之一'),
  
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('状态必须是 pending, in_progress, completed, cancelled 之一'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('截止日期格式无效'),
  
  body('reminderDate')
    .optional()
    .isISO8601()
    .withMessage('提醒日期格式无效'),
  
  body('customerId')
    .optional()
    .custom(isValidObjectId)
    .withMessage('无效的客户ID格式'),
  
  body('opportunityId')
    .optional()
    .custom(isValidObjectId)
    .withMessage('无效的销售机会ID格式'),
  
  body('assignedTo')
    .optional()
    .custom(isValidObjectId)
    .withMessage('无效的分配用户ID格式'),
  
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
  
  body('estimatedDuration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('预估时长必须是非负整数'),
  
  body('customFields')
    .optional()
    .isObject()
    .withMessage('自定义字段必须是对象格式')
];

const updateTaskValidation = [
  ...taskIdValidation,
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('标题长度应在1-100个字符之间'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('描述长度不能超过1000个字符'),
  
  body('type')
    .optional()
    .isIn(['call', 'email', 'meeting', 'follow_up', 'demo', 'proposal', 'other'])
    .withMessage('任务类型无效'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('优先级必须是 low, medium, high, urgent 之一'),
  
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('状态必须是 pending, in_progress, completed, cancelled 之一'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('截止日期格式无效'),
  
  body('reminderDate')
    .optional()
    .isISO8601()
    .withMessage('提醒日期格式无效'),
  
  body('completedDate')
    .optional()
    .isISO8601()
    .withMessage('完成日期格式无效'),
  
  body('customerId')
    .optional()
    .custom(isValidObjectId)
    .withMessage('无效的客户ID格式'),
  
  body('opportunityId')
    .optional()
    .custom(isValidObjectId)
    .withMessage('无效的销售机会ID格式'),
  
  body('assignedTo')
    .optional()
    .custom(isValidObjectId)
    .withMessage('无效的分配用户ID格式'),
  
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
  
  body('estimatedDuration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('预估时长必须是非负整数'),
  
  body('actualDuration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('实际时长必须是非负整数'),
  
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
  
  query('type')
    .optional()
    .isIn(['call', 'email', 'meeting', 'follow_up', 'demo', 'proposal', 'other'])
    .withMessage('任务类型无效'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('优先级必须是 low, medium, high, urgent 之一'),
  
  query('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('状态必须是 pending, in_progress, completed, cancelled 之一'),
  
  query('customerId')
    .optional()
    .custom(isValidObjectId)
    .withMessage('无效的客户ID格式'),
  
  query('opportunityId')
    .optional()
    .custom(isValidObjectId)
    .withMessage('无效的销售机会ID格式'),
  
  query('assignedTo')
    .optional()
    .custom(isValidObjectId)
    .withMessage('无效的分配用户ID格式'),
  
  query('dueDateFrom')
    .optional()
    .isISO8601()
    .withMessage('开始截止日期格式无效'),
  
  query('dueDateTo')
    .optional()
    .isISO8601()
    .withMessage('结束截止日期格式无效'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'title', 'dueDate', 'priority', 'status'])
    .withMessage('排序字段无效'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向必须是 asc 或 desc')
];

const batchDeleteValidation = [
  body('taskIds')
    .isArray({ min: 1 })
    .withMessage('请提供要删除的任务ID列表'),
  
  body('taskIds.*')
    .custom(isValidObjectId)
    .withMessage('任务ID格式无效')
];

const batchUpdateValidation = [
  body('taskIds')
    .isArray({ min: 1 })
    .withMessage('请提供要更新的任务ID列表'),
  
  body('taskIds.*')
    .custom(isValidObjectId)
    .withMessage('任务ID格式无效'),
  
  body('updates')
    .isObject()
    .withMessage('更新数据必须是对象格式'),
  
  body('updates.status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('状态必须是 pending, in_progress, completed, cancelled 之一'),
  
  body('updates.priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('优先级必须是 low, medium, high, urgent 之一'),
  
  body('updates.assignedTo')
    .optional()
    .custom(isValidObjectId)
    .withMessage('无效的分配用户ID格式')
];

const addCommentValidation = [
  ...taskIdValidation,
  body('content')
    .notEmpty()
    .withMessage('评论内容不能为空')
    .isLength({ max: 500 })
    .withMessage('评论内容长度不能超过500个字符')
];

// 路由定义

/**
 * @route GET /api/tasks
 * @desc 获取任务列表
 * @access Private
 */
router.get('/',
  auth,
  checkApiUsage,
  rateLimiter.search,
  searchValidation,
  validate,
  TaskController.getTasks
);

/**
 * @route POST /api/tasks
 * @desc 创建新任务
 * @access Private
 */
router.post('/',
  auth,
  checkApiUsage,
  rateLimiter.general,
  createTaskValidation,
  validate,
  TaskController.createTask
);

/**
 * @route GET /api/tasks/:id
 * @desc 获取单个任务详情
 * @access Private
 */
router.get('/:id',
  auth,
  checkApiUsage,
  rateLimiter.general,
  taskIdValidation,
  validate,
  TaskController.getTask
);

/**
 * @route PUT /api/tasks/:id
 * @desc 更新任务信息
 * @access Private
 */
router.put('/:id',
  auth,
  checkApiUsage,
  rateLimiter.general,
  updateTaskValidation,
  validate,
  TaskController.updateTask
);

/**
 * @route DELETE /api/tasks/:id
 * @desc 删除任务
 * @access Private
 */
router.delete('/:id',
  auth,
  checkApiUsage,
  rateLimiter.general,
  taskIdValidation,
  validate,
  TaskController.deleteTask
);

/**
 * @route POST /api/tasks/batch-delete
 * @desc 批量删除任务
 * @access Private
 */
router.post('/batch-delete',
  auth,
  checkApiUsage,
  rateLimiter.batch,
  batchDeleteValidation,
  validate,
  TaskController.batchDeleteTasks
);

/**
 * @route POST /api/tasks/batch-update
 * @desc 批量更新任务
 * @access Private
 */
router.post('/batch-update',
  auth,
  checkApiUsage,
  rateLimiter.batch,
  batchUpdateValidation,
  validate,
  TaskController.batchUpdateTasks
);

/**
 * @route POST /api/tasks/:id/comments
 * @desc 添加任务评论
 * @access Private
 */
router.post('/:id/comments',
  auth,
  checkApiUsage,
  rateLimiter.general,
  addCommentValidation,
  validate,
  TaskController.addComment
);

/**
 * @route GET /api/tasks/:id/comments
 * @desc 获取任务评论
 * @access Private
 */
router.get('/:id/comments',
  auth,
  checkApiUsage,
  rateLimiter.general,
  taskIdValidation,
  validate,
  TaskController.getComments
);

/**
 * @route GET /api/tasks/my/assigned
 * @desc 获取分配给我的任务
 * @access Private
 */
router.get('/my/assigned',
  auth,
  checkApiUsage,
  rateLimiter.general,
  searchValidation,
  validate,
  TaskController.getMyAssignedTasks
);

/**
 * @route GET /api/tasks/my/created
 * @desc 获取我创建的任务
 * @access Private
 */
router.get('/my/created',
  auth,
  checkApiUsage,
  rateLimiter.general,
  searchValidation,
  validate,
  TaskController.getMyCreatedTasks
);

/**
 * @route GET /api/tasks/stats/overview
 * @desc 获取任务统计概览
 * @access Private
 */
router.get('/stats/overview',
  auth,
  checkApiUsage,
  rateLimiter.general,
  TaskController.getTaskStats
);

/**
 * @route GET /api/tasks/calendar
 * @desc 获取任务日历数据
 * @access Private
 */
router.get('/calendar',
  auth,
  checkApiUsage,
  rateLimiter.general,
  query('start')
    .isISO8601()
    .withMessage('开始日期格式无效'),
  query('end')
    .isISO8601()
    .withMessage('结束日期格式无效'),
  validate,
  TaskController.getCalendarTasks
);

/**
 * @route GET /api/tasks/export
 * @desc 导出任务数据
 * @access Private
 */
router.get('/export',
  auth,
  checkApiUsage,
  rateLimiter.exports,
  searchValidation,
  validate,
  TaskController.exportTasks
);

export default router;