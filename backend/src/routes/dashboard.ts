/**
 * 仪表板路由
 * 定义仪表板相关的API端点
 */
import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateLimiter } from '../middleware/rateLimiter';
import { query } from 'express-validator';

const router = Router();

// 应用认证中间件到所有路由
router.use(auth);

// 获取仪表板概览数据
router.get('/overview',
  rateLimiter.general,
  [
    query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year']).withMessage('无效的时间周期'),
    query('timezone').optional().isString().withMessage('时区必须是字符串')
  ],
  validate,
  DashboardController.getOverview
);

// 获取销售统计数据
router.get('/sales-stats',
  rateLimiter.general,
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式错误'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式错误'),
    query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('无效的分组方式'),
    query('includeForecasts').optional().isBoolean().withMessage('包含预测标识必须是布尔值')
  ],
  validate,
  DashboardController.getSalesStats
);

// 获取客户统计数据
router.get('/customer-stats',
  rateLimiter.general,
  [
    query('period').optional().isIn(['week', 'month', 'quarter', 'year']).withMessage('无效的时间周期'),
    query('segmentBy').optional().isIn(['industry', 'size', 'region', 'source']).withMessage('无效的分段方式')
  ],
  validate,
  DashboardController.getCustomerStats
);

// 获取活动统计数据
router.get('/activity-stats',
  rateLimiter.general,
  [
    query('period').optional().isIn(['today', 'week', 'month']).withMessage('无效的时间周期'),
    query('activityTypes').optional().isArray().withMessage('活动类型必须是数组'),
    query('userId').optional().isMongoId().withMessage('用户ID格式错误')
  ],
  validate,
  DashboardController.getActivityStats
);

// 获取销售漏斗数据
router.get('/sales-funnel',
  rateLimiter.general,
  [
    query('period').optional().isIn(['month', 'quarter', 'year']).withMessage('无效的时间周期'),
    query('includeConversionRates').optional().isBoolean().withMessage('包含转化率标识必须是布尔值')
  ],
  validate,
  DashboardController.getSalesFunnel
);

// 获取收入趋势
router.get('/revenue-trends',
  rateLimiter.general,
  [
    query('period').optional().isIn(['month', 'quarter', 'year']).withMessage('无效的时间周期'),
    query('compareWithPrevious').optional().isBoolean().withMessage('对比上期标识必须是布尔值'),
    query('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('货币代码必须是3位字符')
  ],
  validate,
  DashboardController.getRevenueTrends
);

// 获取团队绩效数据
router.get('/team-performance',
  rateLimiter.general,
  [
    query('period').optional().isIn(['month', 'quarter', 'year']).withMessage('无效的时间周期'),
    query('teamId').optional().isMongoId().withMessage('团队ID格式错误'),
    query('metrics').optional().isArray().withMessage('指标必须是数组')
  ],
  validate,
  DashboardController.getTeamPerformance
);

// 获取最近活动
router.get('/recent-activities',
  rateLimiter.general,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('限制数量必须在1-100之间'),
    query('offset').optional().isInt({ min: 0 }).withMessage('偏移量必须大于等于0'),
    query('activityTypes').optional().isArray().withMessage('活动类型必须是数组')
  ],
  validate,
  DashboardController.getRecentActivities
);

// 获取待办事项
router.get('/tasks',
  rateLimiter.general,
  [
    query('status').optional().isIn(['pending', 'in_progress', 'completed', 'overdue']).withMessage('无效的任务状态'),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('无效的优先级'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('限制数量必须在1-50之间')
  ],
  validate,
  DashboardController.getTasks
);

// 获取通知
router.get('/notifications',
  rateLimiter.general,
  [
    query('unreadOnly').optional().isBoolean().withMessage('仅未读标识必须是布尔值'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('限制数量必须在1-50之间'),
    query('types').optional().isArray().withMessage('通知类型必须是数组')
  ],
  validate,
  DashboardController.getNotifications
);

// 获取关键指标
router.get('/kpis',
  rateLimiter.general,
  [
    query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year']).withMessage('无效的时间周期'),
    query('metrics').optional().isArray().withMessage('指标必须是数组'),
    query('compareWithTarget').optional().isBoolean().withMessage('对比目标标识必须是布尔值')
  ],
  validate,
  DashboardController.getKPIs
);

// 获取预测数据
router.get('/forecasts',
  rateLimiter.general,
  [
    query('type').optional().isIn(['sales', 'revenue', 'customers']).withMessage('无效的预测类型'),
    query('period').optional().isIn(['month', 'quarter', 'year']).withMessage('无效的时间周期'),
    query('confidence').optional().isFloat({ min: 0, max: 1 }).withMessage('置信度必须在0-1之间')
  ],
  validate,
  DashboardController.getForecasts
);

// 获取竞争对手分析
router.get('/competitor-analysis',
  rateLimiter.general,
  [
    query('competitors').optional().isArray().withMessage('竞争对手列表必须是数组'),
    query('metrics').optional().isArray().withMessage('分析指标必须是数组')
  ],
  validate,
  DashboardController.getCompetitorAnalysis
);

// 获取市场趋势
router.get('/market-trends',
  rateLimiter.general,
  [
    query('industry').optional().isString().withMessage('行业必须是字符串'),
    query('region').optional().isString().withMessage('地区必须是字符串'),
    query('period').optional().isIn(['month', 'quarter', 'year']).withMessage('无效的时间周期')
  ],
  validate,
  DashboardController.getMarketTrends
);

// 自定义仪表板配置
router.get('/config',
  rateLimiter.general,
  DashboardController.getDashboardConfig
);

router.put('/config',
  rateLimiter.general,
  DashboardController.updateDashboardConfig
);

// 导出仪表板数据
router.post('/export',
  rateLimiter.exports,
  [
    query('format').optional().isIn(['pdf', 'excel', 'csv']).withMessage('无效的导出格式'),
    query('sections').optional().isArray().withMessage('导出部分必须是数组')
  ],
  validate,
  DashboardController.exportDashboard
);

export default router;