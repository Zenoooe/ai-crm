/**
 * 外部API路由
 * 定义各种第三方API接口的路由
 */
import { Router } from 'express';
import { ExternalApiController } from '../controllers/externalApiController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import rateLimit from 'express-rate-limit';
import { body, param, query } from 'express-validator';

const router = Router();

// 应用认证中间件到所有路由
router.use(auth);

// 新闻API路由
router.get('/news',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }), // 15分钟100次
  [
    query('query').optional().isString().withMessage('查询关键词必须是字符串'),
    query('category').optional().isIn(['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology']).withMessage('无效的新闻分类'),
    query('country').optional().isString().isLength({ min: 2, max: 2 }).withMessage('国家代码必须是2位字符'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('页面大小必须在1-100之间'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0')
  ],
  validate,
  ExternalApiController.getNews
);

// 行业新闻
router.get('/news/industry/:industry',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }),
  [
    param('industry').notEmpty().isString().withMessage('行业类型不能为空'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('页面大小必须在1-100之间'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0')
  ],
  validate,
  ExternalApiController.getIndustryNews
);

// 公司新闻
router.get('/news/company/:company',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }),
  [
    param('company').notEmpty().isString().withMessage('公司名称不能为空'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('页面大小必须在1-100之间'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0')
  ],
  validate,
  ExternalApiController.getCompanyNews
);

// 股票数据API路由
router.get('/stock/:symbol/:interval?',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }),
  [
    param('symbol').notEmpty().isString().isLength({ min: 1, max: 10 }).withMessage('股票代码格式错误'),
    param('interval').optional().isIn(['intraday', 'daily', 'weekly', 'monthly']).withMessage('无效的时间间隔')
  ],
  validate,
  ExternalApiController.getStockData
);

// 技术分析指标
router.get('/technical/:exchange/:symbol/:interval/:indicator',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }),
  [
    param('exchange').notEmpty().isString().withMessage('交易所不能为空'),
    param('symbol').notEmpty().isString().withMessage('交易对不能为空'),
    param('interval').notEmpty().isIn(['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M']).withMessage('无效的时间间隔'),
    param('indicator').notEmpty().isString().withMessage('指标类型不能为空'),
    query('period').optional().isInt({ min: 1, max: 200 }).withMessage('周期必须在1-200之间')
  ],
  validate,
  ExternalApiController.getTechnicalIndicator
);

// 市场数据
router.get('/market/:symbol/:timespan/:from/:to',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }),
  [
    param('symbol').notEmpty().isString().withMessage('股票代码不能为空'),
    param('timespan').notEmpty().isIn(['minute', 'hour', 'day', 'week', 'month', 'quarter', 'year']).withMessage('无效的时间跨度'),
    param('from').notEmpty().isISO8601().withMessage('开始日期格式错误'),
    param('to').notEmpty().isISO8601().withMessage('结束日期格式错误'),
    query('multiplier').optional().isInt({ min: 1, max: 1000 }).withMessage('倍数必须在1-1000之间')
  ],
  validate,
  ExternalApiController.getMarketData
);

// 公司财务数据
router.get('/financials/:symbol/:statement?',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }),
  [
    param('symbol').notEmpty().isString().withMessage('股票代码不能为空'),
    param('statement').optional().isIn(['income-statement', 'balance-sheet-statement', 'cash-flow-statement']).withMessage('无效的财务报表类型')
  ],
  validate,
  ExternalApiController.getCompanyFinancials
);

// 实时股价
router.get('/price/:symbol',
  rateLimit({ windowMs: 1 * 60 * 1000, max: 60 }), // 1分钟60次
  [
    param('symbol').notEmpty().isString().withMessage('股票代码不能为空')
  ],
  validate,
  ExternalApiController.getRealTimePrice
);

// 加密货币数据
router.get('/crypto/:symbol/:interval',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }),
  [
    param('symbol').notEmpty().isString().withMessage('加密货币代码不能为空'),
    param('interval').notEmpty().isIn(['1min', '5min', '15min', '30min', '45min', '1h', '2h', '4h', '1day', '1week', '1month']).withMessage('无效的时间间隔'),
    query('outputsize').optional().isInt({ min: 1, max: 5000 }).withMessage('输出大小必须在1-5000之间')
  ],
  validate,
  ExternalApiController.getCryptoData
);

// 图像生成API路由
router.post('/image/generate',
  rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }), // 1小时20次
  [
    body('prompt').notEmpty().isString().isLength({ min: 10, max: 1000 }).withMessage('图像描述必须在10-1000字符之间'),
    body('style').optional().isIn(['realistic', 'artistic', 'cartoon', 'abstract', 'photographic']).withMessage('无效的图像风格'),
    body('aspectRatio').optional().isIn(['1:1', '16:9', '9:16', '4:3', '3:4']).withMessage('无效的宽高比'),
    body('model').optional().isString().withMessage('模型名称必须是字符串')
  ],
  validate,
  ExternalApiController.generateImage
);

// 营销图片生成
router.post('/image/marketing',
  rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }),
  [
    body('productName').notEmpty().isString().isLength({ min: 2, max: 100 }).withMessage('产品名称必须在2-100字符之间'),
    body('targetAudience').optional().isString().isLength({ max: 200 }).withMessage('目标受众描述不能超过200字符'),
    body('style').optional().isString().isLength({ max: 50 }).withMessage('风格描述不能超过50字符'),
    body('message').optional().isString().isLength({ max: 300 }).withMessage('营销信息不能超过300字符')
  ],
  validate,
  ExternalApiController.generateMarketingImage
);

// 视频生成API路由
router.post('/video/generate',
  rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }), // 1小时5次
  [
    body('scenes').isArray({ min: 1, max: 10 }).withMessage('场景数组必须包含1-10个元素'),
    body('scenes.*.duration').optional().isFloat({ min: 1, max: 30 }).withMessage('场景时长必须在1-30秒之间'),
    body('template').optional().isString().withMessage('模板名称必须是字符串'),
    body('resolution').optional().isIn(['1280x720', '1920x1080', '3840x2160']).withMessage('无效的分辨率'),
    body('quality').optional().isIn(['low', 'medium', 'high', 'ultra']).withMessage('无效的质量设置')
  ],
  validate,
  ExternalApiController.generateVideo
);

// 产品演示视频
router.post('/video/product',
  rateLimit({ windowMs: 60 * 60 * 1000, max: 3 }),
  [
    body('productName').notEmpty().isString().isLength({ min: 2, max: 100 }).withMessage('产品名称必须在2-100字符之间'),
    body('features').isArray({ min: 1, max: 10 }).withMessage('功能列表必须包含1-10个元素'),
    body('features.*').isString().isLength({ min: 5, max: 100 }).withMessage('每个功能描述必须在5-100字符之间'),
    body('duration').optional().isInt({ min: 10, max: 300 }).withMessage('视频时长必须在10-300秒之间'),
    body('style').optional().isIn(['light', 'dark', 'colorful', 'minimal']).withMessage('无效的视频风格')
  ],
  validate,
  ExternalApiController.generateProductVideo
);

// N8N工作流API路由
router.post('/workflow/:workflowId/trigger',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }),
  [
    param('workflowId').notEmpty().isString().withMessage('工作流ID不能为空'),
    body('data').optional().isObject().withMessage('数据必须是对象格式'),
    body('webhookUrl').optional().isURL().withMessage('Webhook URL格式错误')
  ],
  validate,
  ExternalApiController.triggerWorkflow
);

// 批量API调用
router.post('/batch',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  [
    body('requests').isArray({ min: 1, max: 10 }).withMessage('请求列表必须包含1-10个元素'),
    body('requests.*.service').notEmpty().isString().withMessage('服务类型不能为空'),
    body('requests.*.method').notEmpty().isString().withMessage('方法名称不能为空'),
    body('requests.*.params').isObject().withMessage('参数必须是对象格式')
  ],
  validate,
  ExternalApiController.batchApiCall
);

// 竞争对手分析
router.post('/analysis/competitor',
  rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }),
  [
    body('company').notEmpty().isString().isLength({ min: 2, max: 100 }).withMessage('公司名称必须在2-100字符之间'),
    body('competitors').isArray({ min: 1, max: 5 }).withMessage('竞争对手列表必须包含1-5个元素'),
    body('competitors.*').isString().isLength({ min: 2, max: 100 }).withMessage('竞争对手名称必须在2-100字符之间')
  ],
  validate,
  ExternalApiController.getCompetitorAnalysis
);

// API配置信息
router.get('/configs',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }),
  ExternalApiController.getApiConfigs
);

// 健康检查端点
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '外部API服务运行正常',
    timestamp: new Date().toISOString(),
    services: {
      news: 'active',
      financial: 'active',
      ai_generation: 'active',
      workflow: 'active'
    }
  });
});

export default router;