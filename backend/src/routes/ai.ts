import express from 'express';
import { body, param, query } from 'express-validator';
import { AIController } from '../controllers/aiController';
import { auth, checkApiUsage } from '../middleware/auth';
import { validate, isValidObjectId } from '../middleware/validate';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// 验证规则
const chatValidation = [
  body('message')
    .notEmpty()
    .withMessage('消息内容不能为空')
    .isLength({ min: 1, max: 2000 })
    .withMessage('消息长度应在1-2000个字符之间'),
  
  body('contact')
    .optional()
    .isObject()
    .withMessage('联系人信息必须是对象格式'),
  
  body('context')
    .optional()
    .isObject()
    .withMessage('上下文信息必须是对象格式')
];

// 验证规则
const generateScriptValidation = [
  body('customerId')
    .custom(isValidObjectId)
    .withMessage('无效的客户ID格式'),
  
  body('scenario')
    .isIn(['cold_call', 'follow_up', 'demo', 'negotiation', 'closing'])
    .withMessage('场景类型必须是 cold_call, follow_up, demo, negotiation, closing 之一'),
  
  body('tone')
    .optional()
    .isIn(['professional', 'friendly', 'casual', 'formal'])
    .withMessage('语调必须是 professional, friendly, casual, formal 之一'),
  
  body('language')
    .optional()
    .isIn(['zh-CN', 'en-US'])
    .withMessage('语言必须是 zh-CN 或 en-US'),
  
  body('customRequirements')
    .optional()
    .isLength({ max: 500 })
    .withMessage('自定义要求长度不能超过500个字符'),
  
  body('includePersonalization')
    .optional()
    .isBoolean()
    .withMessage('个性化选项必须是布尔值')
];

const analyzeConversationValidation = [
  body('conversationText')
    .notEmpty()
    .withMessage('对话内容不能为空')
    .isLength({ min: 10, max: 5000 })
    .withMessage('对话内容长度应在10-5000个字符之间'),
  
  body('customerId')
    .optional()
    .custom(isValidObjectId)
    .withMessage('无效的客户ID格式'),
  
  body('analysisType')
    .optional()
    .isIn(['sentiment', 'intent', 'objections', 'next_steps', 'comprehensive'])
    .withMessage('分析类型无效')
];

const generateEmailValidation = [
  body('customerId')
    .custom(isValidObjectId)
    .withMessage('无效的客户ID格式'),
  
  body('emailType')
    .isIn(['introduction', 'follow_up', 'proposal', 'thank_you', 'reminder'])
    .withMessage('邮件类型必须是 introduction, follow_up, proposal, thank_you, reminder 之一'),
  
  body('subject')
    .optional()
    .isLength({ max: 100 })
    .withMessage('邮件主题长度不能超过100个字符'),
  
  body('keyPoints')
    .optional()
    .isArray()
    .withMessage('关键点必须是数组格式'),
  
  body('keyPoints.*')
    .optional()
    .isLength({ max: 200 })
    .withMessage('每个关键点长度不能超过200个字符'),
  
  body('tone')
    .optional()
    .isIn(['professional', 'friendly', 'casual', 'formal'])
    .withMessage('语调必须是 professional, friendly, casual, formal 之一'),
  
  body('language')
    .optional()
    .isIn(['zh-CN', 'en-US'])
    .withMessage('语言必须是 zh-CN 或 en-US')
];

const generateProposalValidation = [
  body('opportunityId')
    .custom(isValidObjectId)
    .withMessage('无效的销售机会ID格式'),
  
  body('proposalType')
    .isIn(['service', 'product', 'solution', 'partnership'])
    .withMessage('提案类型必须是 service, product, solution, partnership 之一'),
  
  body('requirements')
    .optional()
    .isArray()
    .withMessage('需求必须是数组格式'),
  
  body('requirements.*')
    .optional()
    .isLength({ max: 300 })
    .withMessage('每个需求长度不能超过300个字符'),
  
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('预算必须是非负数'),
  
  body('timeline')
    .optional()
    .isLength({ max: 200 })
    .withMessage('时间线长度不能超过200个字符'),
  
  body('customInstructions')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('自定义指令长度不能超过1000个字符')
];

const optimizeContentValidation = [
  body('content')
    .notEmpty()
    .withMessage('内容不能为空')
    .isLength({ min: 10, max: 10000 })
    .withMessage('内容长度应在10-10000个字符之间'),
  
  body('contentType')
    .isIn(['email', 'script', 'proposal', 'presentation', 'social_media'])
    .withMessage('内容类型无效'),
  
  body('optimizationGoal')
    .isIn(['clarity', 'persuasion', 'engagement', 'professionalism', 'brevity'])
    .withMessage('优化目标无效'),
  
  body('targetAudience')
    .optional()
    .isLength({ max: 200 })
    .withMessage('目标受众描述长度不能超过200个字符')
];

const predictOutcomeValidation = [
  body('opportunityId')
    .custom(isValidObjectId)
    .withMessage('无效的销售机会ID格式'),
  
  body('additionalFactors')
    .optional()
    .isObject()
    .withMessage('附加因素必须是对象格式')
];

const generateInsightsValidation = [
  body('customerId')
    .custom(isValidObjectId)
    .withMessage('无效的客户ID格式'),
  
  body('insightType')
    .isIn(['relationship', 'sales_strategy', 'communication', 'next_actions'])
    .withMessage('洞察类型无效'),
  
  body('timeframe')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year'])
    .withMessage('时间范围必须是 week, month, quarter, year 之一')
];

const feedbackValidation = [
  body('scriptId')
    .custom(isValidObjectId)
    .withMessage('无效的话术ID格式'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('评分必须是1-5之间的整数'),
  
  body('feedback')
    .optional()
    .isLength({ max: 500 })
    .withMessage('反馈内容长度不能超过500个字符'),
  
  body('usageContext')
    .optional()
    .isIn(['call', 'email', 'meeting', 'presentation'])
    .withMessage('使用场景无效')
];

// 路由定义

/**
 * @route POST /api/ai/chat
 * @desc AI聊天对话
 * @access Private
 */
router.post('/chat',
  auth,
  checkApiUsage,
  rateLimiter.ai,
  chatValidation,
  validate,
  AIController.chat
);

/**
 * @route POST /api/ai/generate-script
 * @desc 生成销售话术
 * @access Private
 */
router.post('/generate-script',
  auth,
  checkApiUsage,
  rateLimiter.ai,
  generateScriptValidation,
  validate,
  AIController.generateScript
);

/**
 * @route POST /api/ai/analyze-conversation
 * @desc 分析对话内容
 * @access Private
 */
router.post('/analyze-conversation',
  auth,
  checkApiUsage,
  rateLimiter.ai,
  analyzeConversationValidation,
  validate,
  AIController.analyzeConversation
);

/**
 * @route POST /api/ai/generate-email
 * @desc 生成邮件内容
 * @access Private
 */
router.post('/generate-email',
  auth,
  checkApiUsage,
  rateLimiter.ai,
  generateEmailValidation,
  validate,
  AIController.generateEmail
);

/**
 * @route POST /api/ai/generate-proposal
 * @desc 生成提案内容
 * @access Private
 */
router.post('/generate-proposal',
  auth,
  checkApiUsage,
  rateLimiter.ai,
  generateProposalValidation,
  validate,
  AIController.generateProposal
);

/**
 * @route POST /api/ai/optimize-content
 * @desc 优化内容
 * @access Private
 */
router.post('/optimize-content',
  auth,
  checkApiUsage,
  rateLimiter.ai,
  optimizeContentValidation,
  validate,
  AIController.optimizeContent
);

/**
 * @route POST /api/ai/predict-outcome
 * @desc 预测销售结果
 * @access Private
 */
router.post('/predict-outcome',
  auth,
  checkApiUsage,
  rateLimiter.ai,
  predictOutcomeValidation,
  validate,
  AIController.predictOutcome
);

/**
 * @route POST /api/ai/generate-insights
 * @desc 生成客户洞察
 * @access Private
 */
router.post('/generate-insights',
  auth,
  checkApiUsage,
  rateLimiter.ai,
  generateInsightsValidation,
  validate,
  AIController.generateInsights
);

/**
 * @route GET /api/ai/scripts
 * @desc 获取AI生成的话术列表
 * @access Private
 */
router.get('/scripts',
  auth,
  checkApiUsage,
  rateLimiter.general,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('每页数量必须是1-50之间的整数'),
  query('scenario')
    .optional()
    .isIn(['cold_call', 'follow_up', 'demo', 'negotiation', 'closing'])
    .withMessage('场景类型无效'),
  query('customerId')
    .optional()
    .custom(isValidObjectId)
    .withMessage('无效的客户ID格式'),
  validate,
  AIController.getScripts
);

/**
 * @route GET /api/ai/scripts/:id
 * @desc 获取单个话术详情
 * @access Private
 */
router.get('/scripts/:id',
  auth,
  checkApiUsage,
  rateLimiter.general,
  param('id')
    .custom(isValidObjectId)
    .withMessage('无效的话术ID格式'),
  validate,
  AIController.getScript
);

/**
 * @route POST /api/ai/scripts/:id/feedback
 * @desc 提交话术反馈
 * @access Private
 */
router.post('/scripts/:id/feedback',
  auth,
  checkApiUsage,
  rateLimiter.general,
  param('id')
    .custom(isValidObjectId)
    .withMessage('无效的话术ID格式'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('评分必须是1-5之间的整数'),
  body('feedback')
    .optional()
    .isLength({ max: 500 })
    .withMessage('反馈内容长度不能超过500个字符'),
  body('usageContext')
    .optional()
    .isIn(['call', 'email', 'meeting', 'presentation'])
    .withMessage('使用场景无效'),
  validate,
  AIController.submitFeedback
);

/**
 * @route GET /api/ai/usage-stats
 * @desc 获取AI使用统计
 * @access Private
 */
router.get('/usage-stats',
  auth,
  checkApiUsage,
  rateLimiter.general,
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('统计周期必须是 day, week, month, year 之一'),
  validate,
  AIController.getUsageStats
);

/**
 * @route GET /api/ai/recommendations
 * @desc 获取AI推荐
 * @access Private
 */
router.get('/recommendations',
  auth,
  checkApiUsage,
  rateLimiter.general,
  query('type')
    .optional()
    .isIn(['scripts', 'actions', 'content', 'strategies'])
    .withMessage('推荐类型无效'),
  query('customerId')
    .optional()
    .custom(isValidObjectId)
    .withMessage('无效的客户ID格式'),
  validate,
  AIController.getRecommendations
);

// ========== 万能AI服务路由 ==========

/**
 * @route POST /api/ai/universal-chat
 * @desc 万能AI聊天 - 支持多个AI服务
 * @access Private
 */
router.post('/universal-chat',
  auth,
  checkApiUsage,
  rateLimiter.ai,
  body('prompt')
    .notEmpty()
    .isLength({ min: 1, max: 4000 })
    .withMessage('聊天内容不能为空且长度不能超过4000字符'),
  body('serviceName')
    .optional()
    .isString()
    .withMessage('服务名称必须是字符串'),
  body('model')
    .optional()
    .isString()
    .withMessage('模型名称必须是字符串'),
  body('maxTokens')
    .optional()
    .isInt({ min: 1, max: 4000 })
    .withMessage('最大token数必须在1-4000之间'),
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('温度参数必须在0-2之间'),
  body('systemPrompt')
    .optional()
    .isString()
    .withMessage('系统提示必须是字符串'),
  validate,
  AIController.universalChat
);

/**
 * @route GET /api/ai/finance/:serviceName
 * @desc 获取金融数据
 * @access Private
 */
router.get('/finance/:serviceName',
  auth,
  checkApiUsage,
  rateLimiter.general,
  param('serviceName')
    .notEmpty()
    .isString()
    .withMessage('服务名称不能为空'),
  query('symbol')
    .notEmpty()
    .isString()
    .withMessage('股票代码不能为空'),
  query('interval')
    .optional()
    .isString()
    .withMessage('时间间隔必须是字符串'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式无效'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式无效'),
  query('indicators')
    .optional()
    .isString()
    .withMessage('指标参数必须是字符串'),
  validate,
  AIController.getFinanceData
);

/**
 * @route GET /api/ai/news
 * @desc 获取新闻数据
 * @access Private
 */
router.get('/news',
  auth,
  checkApiUsage,
  rateLimiter.general,
  query('query')
    .optional()
    .isString()
    .withMessage('查询关键词必须是字符串'),
  query('category')
    .optional()
    .isString()
    .withMessage('新闻分类必须是字符串'),
  query('country')
    .optional()
    .isString()
    .withMessage('国家代码必须是字符串'),
  query('language')
    .optional()
    .isString()
    .withMessage('语言代码必须是字符串'),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('页面大小必须在1-100之间'),
  validate,
  AIController.getNews
);

/**
 * @route POST /api/ai/generate-image
 * @desc 生成图像
 * @access Private
 */
router.post('/generate-image',
  auth,
  checkApiUsage,
  rateLimiter.ai,
  body('prompt')
    .notEmpty()
    .isLength({ min: 1, max: 1000 })
    .withMessage('图像描述不能为空且长度不能超过1000字符'),
  validate,
  AIController.generateImage
);

/**
 * @route GET /api/ai/services
 * @desc 获取所有可用的AI服务
 * @access Private
 */
router.get('/services',
  auth,
  checkApiUsage,
  rateLimiter.general,
  query('category')
    .optional()
    .isIn(['AI', 'Finance', 'News', 'Workflow', 'Media', 'Other'])
    .withMessage('服务分类无效'),
  validate,
  AIController.getAvailableServices
);

/**
 * @route GET /api/ai/services/statistics
 * @desc 获取服务统计信息
 * @access Private
 */
router.get('/services/statistics',
  auth,
  checkApiUsage,
  rateLimiter.general,
  AIController.getServiceStatistics
);

/**
 * @route GET /api/ai/health-check
 * @desc 服务健康检查
 * @access Private
 */
router.get('/health-check',
  auth,
  checkApiUsage,
  rateLimiter.general,
  AIController.healthCheck
);

/**
 * @route POST /api/ai/intelligent-analysis
 * @desc 智能分析 - 结合多个AI服务进行综合分析
 * @access Private
 */
router.post('/intelligent-analysis',
  auth,
  checkApiUsage,
  rateLimiter.ai,
  body('content')
    .notEmpty()
    .isLength({ min: 1, max: 5000 })
    .withMessage('分析内容不能为空且长度不能超过5000字符'),
  body('analysisType')
    .optional()
    .isIn(['general', 'customer', 'market', 'financial'])
    .withMessage('分析类型无效'),
  validate,
  AIController.intelligentAnalysis
);

/**
 * @route POST /api/ai/batch-analysis
 * @desc 批量处理 - 同时调用多个AI服务进行对比分析
 * @access Private
 */
router.post('/batch-analysis',
  auth,
  checkApiUsage,
  rateLimiter.ai,
  body('prompt')
    .notEmpty()
    .isLength({ min: 1, max: 3000 })
    .withMessage('分析内容不能为空且长度不能超过3000字符'),
  body('services')
    .optional()
    .isArray()
    .withMessage('服务列表必须是数组'),
  body('services.*')
    .optional()
    .isString()
    .withMessage('服务名称必须是字符串'),
  body('systemPrompt')
    .optional()
    .isString()
    .withMessage('系统提示必须是字符串'),
  validate,
  AIController.batchAnalysis
);

export default router;