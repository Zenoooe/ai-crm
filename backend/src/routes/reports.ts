/**
 * 报告路由
 * 处理各种报告和分析相关的API端点
 */
import express from 'express';
import { ReportsController } from '../controllers/reportsController';
import { auth } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
// 从验证中间件模块导入验证请求函数
import { validateRequest } from '../middleware/validation';
import { body, query, param } from 'express-validator';

const router = express.Router();

// 应用认证中间件到所有路由
router.use(auth);

/**
 * @route GET /api/reports/sales
 * @desc 获取销售报告
 * @access Private
 */
router.get('/sales',
  rateLimiter.reports,
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
    query('groupBy').optional().isIn(['day', 'week', 'month', 'quarter', 'year']).withMessage('分组方式无效'),
    query('userId').optional().isMongoId().withMessage('用户ID格式无效'),
    query('teamId').optional().isMongoId().withMessage('团队ID格式无效'),
    query('includeForecasts').optional().isBoolean().withMessage('预测包含标志必须是布尔值')
  ],
  validateRequest,
  ReportsController.getSalesReport
);

/**
 * @route GET /api/reports/revenue
 * @desc 获取收入报告
 * @access Private
 */
router.get('/revenue',
  rateLimiter.reports,
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
    query('currency').optional().isLength({ min: 3, max: 3 }).withMessage('货币代码必须是3位'),
    query('breakdown').optional().isIn(['product', 'region', 'salesperson', 'source']).withMessage('分解方式无效'),
    query('compareWithPrevious').optional().isBoolean().withMessage('对比标志必须是布尔值')
  ],
  validateRequest,
  ReportsController.getRevenueReport
);

/**
 * @route GET /api/reports/customers
 * @desc 获取客户报告
 * @access Private
 */
router.get('/customers',
  rateLimiter.reports,
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
    query('segmentBy').optional().isIn(['industry', 'size', 'region', 'source']).withMessage('分段方式无效'),
    query('includeChurn').optional().isBoolean().withMessage('流失包含标志必须是布尔值'),
    query('includeLTV').optional().isBoolean().withMessage('LTV包含标志必须是布尔值')
  ],
  validateRequest,
  ReportsController.getCustomerReport
);

/**
 * @route GET /api/reports/activities
 * @desc 获取活动报告
 * @access Private
 */
router.get('/activities',
  rateLimiter.reports,
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
    query('activityTypes').optional().isArray().withMessage('活动类型必须是数组'),
    query('userId').optional().isMongoId().withMessage('用户ID格式无效'),
    query('includeResponseRates').optional().isBoolean().withMessage('响应率包含标志必须是布尔值')
  ],
  validateRequest,
  ReportsController.getActivityReport
);

/**
 * @route GET /api/reports/performance
 * @desc 获取绩效报告
 * @access Private
 */
router.get('/performance',
  rateLimiter.reports,
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
    query('teamId').optional().isMongoId().withMessage('团队ID格式无效'),
    query('metrics').optional().isArray().withMessage('指标必须是数组'),
    query('includeComparisons').optional().isBoolean().withMessage('对比包含标志必须是布尔值')
  ],
  validateRequest,
  ReportsController.getPerformanceReport
);

/**
 * @route GET /api/reports/pipeline
 * @desc 获取销售管道报告
 * @access Private
 */
router.get('/pipeline',
  rateLimiter.reports,
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
    query('includeVelocity').optional().isBoolean().withMessage('速度包含标志必须是布尔值'),
    query('includeConversionRates').optional().isBoolean().withMessage('转化率包含标志必须是布尔值'),
    query('groupBy').optional().isIn(['stage', 'source', 'assignee']).withMessage('分组方式无效')
  ],
  validateRequest,
  ReportsController.getPipelineReport
);

/**
 * @route GET /api/reports/forecasts
 * @desc 获取预测报告
 * @access Private
 */
router.get('/forecasts',
  rateLimiter.reports,
  [
    query('period').optional().isIn(['month', 'quarter', 'year']).withMessage('预测周期无效'),
    query('confidence').optional().isFloat({ min: 0, max: 100 }).withMessage('置信度必须在0-100之间'),
    query('includeScenarios').optional().isBoolean().withMessage('场景包含标志必须是布尔值'),
    query('method').optional().isIn(['linear', 'exponential', 'seasonal']).withMessage('预测方法无效')
  ],
  validateRequest,
  ReportsController.getForecastReport
);

/**
 * @route GET /api/reports/custom/:reportId
 * @desc 获取自定义报告
 * @access Private
 */
router.get('/custom/:reportId',
  rateLimiter.reports,
  [
    param('reportId').isMongoId().withMessage('报告ID格式无效'),
    query('parameters').optional().isJSON().withMessage('参数必须是有效的JSON')
  ],
  validateRequest,
  ReportsController.getCustomReport
);

/**
 * @route POST /api/reports/custom
 * @desc 创建自定义报告
 * @access Private
 */
router.post('/custom',
  rateLimiter.reports,
  [
    body('name').notEmpty().withMessage('报告名称不能为空'),
    body('description').optional().isString().withMessage('描述必须是字符串'),
    body('query').isObject().withMessage('查询必须是对象'),
    body('visualization').isObject().withMessage('可视化配置必须是对象'),
    body('schedule').optional().isObject().withMessage('调度配置必须是对象'),
    body('recipients').optional().isArray().withMessage('收件人必须是数组')
  ],
  validateRequest,
  ReportsController.createCustomReport
);

/**
 * @route PUT /api/reports/custom/:reportId
 * @desc 更新自定义报告
 * @access Private
 */
router.put('/custom/:reportId',
  rateLimiter.reports,
  [
    param('reportId').isMongoId().withMessage('报告ID格式无效'),
    body('name').optional().notEmpty().withMessage('报告名称不能为空'),
    body('description').optional().isString().withMessage('描述必须是字符串'),
    body('query').optional().isObject().withMessage('查询必须是对象'),
    body('visualization').optional().isObject().withMessage('可视化配置必须是对象'),
    body('schedule').optional().isObject().withMessage('调度配置必须是对象'),
    body('recipients').optional().isArray().withMessage('收件人必须是数组')
  ],
  validateRequest,
  ReportsController.updateCustomReport
);

/**
 * @route DELETE /api/reports/custom/:reportId
 * @desc 删除自定义报告
 * @access Private
 */
router.delete('/custom/:reportId',
  rateLimiter.reports,
  [
    param('reportId').isMongoId().withMessage('报告ID格式无效')
  ],
  validateRequest,
  ReportsController.deleteCustomReport
);

/**
 * @route GET /api/reports/export/:reportType
 * @desc 导出报告
 * @access Private
 */
router.get('/export/:reportType',
  rateLimiter.exports,
  [
    param('reportType').isIn(['sales', 'revenue', 'customers', 'activities', 'performance', 'pipeline']).withMessage('报告类型无效'),
    query('format').isIn(['pdf', 'excel', 'csv']).withMessage('导出格式无效'),
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
    query('includeCharts').optional().isBoolean().withMessage('图表包含标志必须是布尔值')
  ],
  validateRequest,
  ReportsController.exportReport
);

/**
 * @route POST /api/reports/schedule
 * @desc 创建报告调度
 * @access Private
 */
router.post('/schedule',
  rateLimiter.reports,
  [
    body('reportType').isIn(['sales', 'revenue', 'customers', 'activities', 'performance', 'pipeline']).withMessage('报告类型无效'),
    body('frequency').isIn(['daily', 'weekly', 'monthly', 'quarterly']).withMessage('频率无效'),
    body('recipients').isArray({ min: 1 }).withMessage('至少需要一个收件人'),
    body('recipients.*').isEmail().withMessage('收件人邮箱格式无效'),
    body('format').isIn(['pdf', 'excel']).withMessage('格式无效'),
    body('parameters').optional().isObject().withMessage('参数必须是对象')
  ],
  validateRequest,
  ReportsController.scheduleReport
);

/**
 * @route GET /api/reports/schedules
 * @desc 获取报告调度列表
 * @access Private
 */
router.get('/schedules',
  rateLimiter.reports,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('限制数量必须在1-100之间'),
    query('status').optional().isIn(['active', 'paused', 'disabled']).withMessage('状态无效')
  ],
  validateRequest,
  ReportsController.getReportSchedules
);

/**
 * @route PUT /api/reports/schedules/:scheduleId
 * @desc 更新报告调度
 * @access Private
 */
router.put('/schedules/:scheduleId',
  rateLimiter.reports,
  [
    param('scheduleId').isMongoId().withMessage('调度ID格式无效'),
    body('frequency').optional().isIn(['daily', 'weekly', 'monthly', 'quarterly']).withMessage('频率无效'),
    body('recipients').optional().isArray({ min: 1 }).withMessage('至少需要一个收件人'),
    body('recipients.*').optional().isEmail().withMessage('收件人邮箱格式无效'),
    body('status').optional().isIn(['active', 'paused', 'disabled']).withMessage('状态无效'),
    body('parameters').optional().isObject().withMessage('参数必须是对象')
  ],
  validateRequest,
  ReportsController.updateReportSchedule
);

/**
 * @route DELETE /api/reports/schedules/:scheduleId
 * @desc 删除报告调度
 * @access Private
 */
router.delete('/schedules/:scheduleId',
  rateLimiter.reports,
  [
    param('scheduleId').isMongoId().withMessage('调度ID格式无效')
  ],
  validateRequest,
  ReportsController.deleteReportSchedule
);

/**
 * @route GET /api/reports/analytics/trends
 * @desc 获取趋势分析
 * @access Private
 */
router.get('/analytics/trends',
  rateLimiter.reports,
  [
    query('metric').isIn(['sales', 'revenue', 'customers', 'activities']).withMessage('指标类型无效'),
    query('period').isIn(['week', 'month', 'quarter', 'year']).withMessage('周期无效'),
    query('comparison').optional().isBoolean().withMessage('对比标志必须是布尔值')
  ],
  validateRequest,
  ReportsController.getTrendAnalysis
);

/**
 * @route GET /api/reports/analytics/cohort
 * @desc 获取队列分析
 * @access Private
 */
router.get('/analytics/cohort',
  rateLimiter.reports,
  [
    query('startDate').isISO8601().withMessage('开始日期格式无效'),
    query('endDate').isISO8601().withMessage('结束日期格式无效'),
    query('cohortType').isIn(['acquisition', 'revenue', 'retention']).withMessage('队列类型无效'),
    query('period').isIn(['week', 'month']).withMessage('周期无效')
  ],
  validateRequest,
  ReportsController.getCohortAnalysis
);

/**
 * @route GET /api/reports/analytics/funnel
 * @desc 获取漏斗分析
 * @access Private
 */
router.get('/analytics/funnel',
  rateLimiter.reports,
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
    query('includeDropoff').optional().isBoolean().withMessage('流失包含标志必须是布尔值'),
    query('segmentBy').optional().isIn(['source', 'campaign', 'region']).withMessage('分段方式无效')
  ],
  validateRequest,
  ReportsController.getFunnelAnalysis
);

/**
 * @route GET /api/reports/kpis
 * @desc 获取关键绩效指标
 * @access Private
 */
router.get('/kpis',
  rateLimiter.reports,
  [
    query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year']).withMessage('周期无效'),
    query('compareWithPrevious').optional().isBoolean().withMessage('对比标志必须是布尔值'),
    query('teamId').optional().isMongoId().withMessage('团队ID格式无效')
  ],
  validateRequest,
  ReportsController.getKPIs
);

export default router;