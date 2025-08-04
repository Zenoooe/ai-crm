import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';
import { AIService } from '../services/aiService';
import { AIScript } from '../models/AIScript';
import { AIProfile } from '../models/AIProfile';
import { logger } from '../utils/logger';
import { aiServiceManager } from '../services/aiServiceManager';
import { getActiveServices, getServiceStats, getServicesByCategory } from '../config/aiServices';

export class AIController {
  /**
   * 生成销售话术
   */
  static generateScript = catchAsync(async (req: Request, res: Response) => {
    const {
      customerId,
      scenario,
      tone = 'professional',
      language = 'zh-CN',
      customRequirements,
      includePersonalization = true
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    // 生成话术
    const scriptData = await AIService.generateSalesScript({
      customerId,
      scenario,
      tone,
      language,
      customRequirements,
      includePersonalization,
      userId
    });

    // 保存到数据库
    const script = new AIScript({
      userId,
      customerId,
      scenario,
      content: scriptData.content,
      tone,
      language,
      metadata: {
        generatedAt: new Date(),
        version: '1.0',
        customRequirements,
        includePersonalization
      }
    });

    await script.save();

    logger.info('AI话术生成成功', {
      userId,
      customerId,
      scenario,
      scriptId: script._id
    });

    res.status(201).json({
      success: true,
      message: '话术生成成功',
      data: {
        script: {
          id: script._id,
          content: script.content,
          scenario: script.scenario,
          tone: script.content.opening.tone,
          language: script.metadata.language,
          createdAt: script.createdAt
        },
        usage: scriptData.usage
      }
    });
  });

  /**
   * AI聊天对话
   */
  static chat = catchAsync(async (req: Request, res: Response) => {
    const { message, contact, context } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    if (!message || !message.trim()) {
      throw new ApiError(400, '消息内容不能为空');
    }

    try {
      const response = await AIService.generateChatResponse({
        message: message.trim(),
        contact,
        context,
        userId
      });

      logger.info('AI聊天响应生成成功', {
        userId,
        contactId: contact?.id,
        messageLength: message.length
      });

      res.json({
        success: true,
        message: response.message,
        metadata: response.metadata,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`AI聊天响应生成失败: ${(error as Error).message}, userId: ${userId}`);
      throw new ApiError(500, 'AI服务暂时不可用，请稍后重试');
    }
  });

  /**
   * 分析对话内容
   */
  static analyzeConversation = catchAsync(async (req: Request, res: Response) => {
    const {
      conversationText,
      customerId,
      analysisType = 'comprehensive'
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const analysis = await AIService.analyzeConversation({
      conversationText,
      customerId,
      analysisType,
      userId
    });

    logger.info('对话分析完成', {
      userId,
      customerId,
      analysisType,
      textLength: conversationText.length
    });

    res.json({
      success: true,
      message: '对话分析完成',
      data: analysis
    });
  });

  /**
   * 生成邮件内容
   */
  static generateEmail = catchAsync(async (req: Request, res: Response) => {
    const {
      customerId,
      emailType,
      subject,
      keyPoints = [],
      tone = 'professional',
      language = 'zh-CN'
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const emailContent = await AIService.generateEmail({
      customerId,
      emailType,
      subject,
      keyPoints,
      tone,
      language,
      userId
    });

    logger.info('AI邮件生成成功', {
      userId,
      customerId,
      emailType
    });

    res.json({
      success: true,
      message: '邮件内容生成成功',
      data: emailContent
    });
  });

  /**
   * 生成提案内容
   */
  static generateProposal = catchAsync(async (req: Request, res: Response) => {
    const {
      opportunityId,
      proposalType,
      requirements = [],
      budget,
      timeline,
      customInstructions
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const proposal = await AIService.generateProposal({
      opportunityId,
      proposalType,
      requirements,
      budget,
      timeline,
      customInstructions,
      userId
    });

    logger.info('AI提案生成成功', {
      userId,
      opportunityId,
      proposalType
    });

    res.json({
      success: true,
      message: '提案内容生成成功',
      data: proposal
    });
  });

  /**
   * 优化内容
   */
  static optimizeContent = catchAsync(async (req: Request, res: Response) => {
    const {
      content,
      contentType,
      optimizationGoal,
      targetAudience
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const optimizedContent = await AIService.optimizeContent({
      content,
      contentType,
      optimizationGoal,
      targetAudience,
      userId
    });

    logger.info('内容优化完成', {
      userId,
      contentType,
      optimizationGoal,
      originalLength: content.length,
      optimizedLength: optimizedContent.content.length
    });

    res.json({
      success: true,
      message: '内容优化完成',
      data: optimizedContent
    });
  });

  /**
   * 预测销售结果
   */
  static predictOutcome = catchAsync(async (req: Request, res: Response) => {
    const {
      opportunityId,
      additionalFactors = {}
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const prediction = await AIService.predictSalesOutcome({
      opportunityId,
      additionalFactors,
      userId
    });

    logger.info('销售结果预测完成', {
      userId,
      opportunityId,
      probability: prediction.probability
    });

    res.json({
      success: true,
      message: '销售结果预测完成',
      data: prediction
    });
  });

  /**
   * 生成客户洞察
   */
  static generateInsights = catchAsync(async (req: Request, res: Response) => {
    const {
      customerId,
      insightType,
      timeframe = 'month'
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const insights = await AIService.generateCustomerInsights({
      customerId,
      insightType,
      timeframe,
      userId
    });

    logger.info('客户洞察生成完成', {
      userId,
      customerId,
      insightType,
      timeframe
    });

    res.json({
      success: true,
      message: '客户洞察生成完成',
      data: insights
    });
  });

  /**
   * 获取AI生成话术列表
   */
  static getScripts = catchAsync(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      scenario,
      customerId
    } = req.query;

    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const filter: any = { userId };
    if (scenario) filter.scenario = scenario;
    if (customerId) filter.customerId = customerId;

    const skip = (Number(page) - 1) * Number(limit);
    
    const [scripts, total] = await Promise.all([
      AIScript.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('customerId', 'name company')
        .lean(),
      AIScript.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: '话术列表获取成功',
      data: {
        scripts,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          count: scripts.length,
          totalCount: total
        }
      }
    });
  });

  /**
   * 获取单个话术详情
   */
  static getScript = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const script = await AIScript.findOne({ _id: id, userId })
      .populate('customerId', 'name company email phone')
      .lean();

    if (!script) {
      throw new ApiError(404, '话术不存在');
    }

    res.json({
      success: true,
      message: '话术详情获取成功',
      data: { script }
    });
  });

  /**
   * 提交话术反馈
   */
  static submitFeedback = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      rating,
      feedback,
      usageContext
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const script = await AIScript.findOne({ _id: id, userId });
    if (!script) {
      throw new ApiError(404, '话术不存在');
    }

    // 更新反馈信息
    script.usage.feedback.push({
      rating,
      comment: feedback,
      helpful_sections: [],
      improvement_suggestions: []
    });

    await script.save();

    // 更新AI配置文件的反馈统计
    await AIProfile.updateOne(
      { userId },
      {
        $inc: {
          'feedbackStats.totalFeedbacks': 1,
          [`feedbackStats.ratingDistribution.${rating}`]: 1
        },
        $set: {
          'feedbackStats.lastFeedbackAt': new Date()
        }
      },
      { upsert: true }
    );

    logger.info('话术反馈提交成功', {
      userId,
      scriptId: id,
      rating,
      usageContext
    });

    res.json({
      success: true,
      message: '反馈提交成功',
      data: {
        feedback: script.usage.feedback
      }
    });
  });

  /**
   * 获取AI使用统计
   */
  static getUsageStats = catchAsync(async (req: Request, res: Response) => {
    const { period = 'month' } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const stats = await AIService.getUsageStatistics({
      userId,
      period: period as string
    });

    res.json({
      success: true,
      message: 'AI使用统计获取成功',
      data: stats
    });
  });

  /**
   * 获取AI推荐
   */
  static getRecommendations = catchAsync(async (req: Request, res: Response) => {
    const {
      type = 'scripts',
      customerId
    } = req.query;

    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const recommendations = await AIService.getRecommendations({
      userId,
      type: type as string,
      customerId: customerId as string
    });

    res.json({
      success: true,
      message: 'AI推荐获取成功',
      data: recommendations
    });
  });

  /**
   * 万能AI聊天 - 使用多个AI服务
   */
  static universalChat = catchAsync(async (req: Request, res: Response) => {
    const { serviceName, prompt, model, maxTokens, temperature, systemPrompt } = req.body;

    if (!prompt) {
      throw new ApiError(400, '请提供聊天内容');
    }

    let result;
    if (serviceName) {
      // 使用指定的AI服务
      result = await aiServiceManager.callAIService(serviceName, {
        prompt,
        model,
        maxTokens,
        temperature,
        systemPrompt
      });
    } else {
      // 使用智能路由
      result = await aiServiceManager.smartRoute({
        prompt,
        model,
        maxTokens,
        temperature,
        systemPrompt
      });
    }

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * 获取金融数据
   */
  static getFinanceData = catchAsync(async (req: Request, res: Response) => {
    const { serviceName } = req.params;
    const { symbol, interval, startDate, endDate, indicators } = req.query;

    const result = await aiServiceManager.getFinanceData(serviceName, {
      symbol: symbol as string,
      interval: interval as string,
      startDate: startDate as string,
      endDate: endDate as string,
      indicators: indicators ? (indicators as string).split(',') : undefined
    });

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * 获取新闻数据
   */
  static getNews = catchAsync(async (req: Request, res: Response) => {
    const { query, category, country, language, pageSize } = req.query;

    const result = await aiServiceManager.getNews({
      query: query as string,
      category: category as string,
      country: country as string,
      language: language as string,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined
    });

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * 生成图像
   */
  static generateImage = catchAsync(async (req: Request, res: Response) => {
    const { prompt } = req.body;

    if (!prompt) {
      throw new ApiError(400, '请提供图像描述');
    }

    const result = await aiServiceManager.generateImage(prompt);

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * 获取所有可用的AI服务
   */
  static getAvailableServices = catchAsync(async (req: Request, res: Response) => {
    const { category } = req.query;

    let services;
    if (category) {
      services = getServicesByCategory(category as any);
    } else {
      services = getActiveServices();
    }

    res.json({
      success: true,
      data: services
    });
  });

  /**
   * 获取服务统计信息
   */
  static getServiceStatistics = catchAsync(async (req: Request, res: Response) => {
    const configStats = getServiceStats();
    const managerStats = aiServiceManager.getServiceStats();

    res.json({
      success: true,
      data: {
        ...configStats,
        ...managerStats
      }
    });
  });

  /**
   * 服务健康检查
   */
  static healthCheck = catchAsync(async (req: Request, res: Response) => {
    const healthStatus = await aiServiceManager.healthCheck();
    const overallHealth = Object.values(healthStatus).every(status => status);

    res.json({
      success: true,
      data: {
        overall: overallHealth,
        services: healthStatus,
        timestamp: new Date().toISOString()
      }
    });
  });

  /**
   * 智能分析 - 结合多个AI服务进行综合分析
   */
  static intelligentAnalysis = catchAsync(async (req: Request, res: Response) => {
    const { content, analysisType = 'general' } = req.body;

    if (!content) {
      throw new ApiError(400, '请提供分析内容');
    }

    // 根据分析类型选择不同的系统提示
    let systemPrompt = '';
    switch (analysisType) {
      case 'customer':
        systemPrompt = '你是一个专业的客户关系管理专家，请分析客户信息并提供洞察。';
        break;
      case 'market':
        systemPrompt = '你是一个市场分析专家，请分析市场趋势和商业机会。';
        break;
      case 'financial':
        systemPrompt = '你是一个金融分析师，请分析财务数据和投资机会。';
        break;
      default:
        systemPrompt = '你是一个智能助手，请提供专业的分析和建议。';
    }

    // 使用智能路由获取AI分析
    const aiAnalysis = await aiServiceManager.smartRoute({
      prompt: content,
      systemPrompt,
      maxTokens: 2000,
      temperature: 0.7
    });

    // 如果是金融分析，尝试获取相关的市场数据
    let marketData = null;
    if (analysisType === 'financial') {
      try {
        // 尝试从内容中提取股票代码
        const symbolMatch = content.match(/\b[A-Z]{1,5}\b/);
        if (symbolMatch) {
          marketData = await aiServiceManager.getFinanceData('finnhub', {
            symbol: symbolMatch[0]
          });
        }
      } catch (error) {
        logger.warn('获取市场数据失败:', error as Error);
      }
    }

    res.json({
      success: true,
      data: {
        analysis: aiAnalysis,
        marketData,
        analysisType,
        timestamp: new Date().toISOString()
      }
    });
  });

  /**
   * 批量处理 - 同时调用多个AI服务进行对比分析
   */
  static batchAnalysis = catchAsync(async (req: Request, res: Response) => {
    const { prompt, services = ['deepseek', 'kimi', 'xai'], systemPrompt } = req.body;

    if (!prompt) {
      throw new ApiError(400, '请提供分析内容');
    }

    const results = await Promise.allSettled(
      services.map(async (serviceName: string) => {
        try {
          const result = await aiServiceManager.callAIService(serviceName, {
            prompt,
            systemPrompt,
            maxTokens: 1000,
            temperature: 0.7
          });
          return { serviceName, result, status: 'success' };
        } catch (error) {
          return { 
            serviceName, 
            error: error instanceof Error ? error.message : '未知错误', 
            status: 'failed' 
          };
        }
      })
    );

    const successResults = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value)
      .filter(result => result.status === 'success');

    const failedResults = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value)
      .filter(result => result.status === 'failed');

    res.json({
      success: true,
      data: {
        successful: successResults,
        failed: failedResults,
        summary: {
          total: services.length,
          successful: successResults.length,
          failed: failedResults.length
        }
      }
    });
  });
}