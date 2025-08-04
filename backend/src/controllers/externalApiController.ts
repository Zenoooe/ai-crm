/**
 * 外部API控制器
 * 处理各种第三方API接口的调用
 */
import { Request, Response } from 'express';
import { ExternalApiService } from '../services/externalApiService';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export class ExternalApiController {
  
  /**
   * 获取新闻数据
   */
  static getNews = catchAsync(async (req: Request, res: Response) => {
    const { query, category, country, pageSize, page } = req.query;
    
    const newsData = await ExternalApiService.getNews({
      query: query as string,
      category: category as string,
      country: country as string,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      page: page ? parseInt(page as string) : undefined
    });
    
    res.json({
      success: true,
      message: '新闻数据获取成功',
      data: newsData
    });
  });
  
  /**
   * 获取股票数据
   */
  static getStockData = catchAsync(async (req: Request, res: Response) => {
    const { symbol, interval } = req.params;
    
    if (!symbol) {
      throw new ApiError(400, '股票代码不能为空');
    }
    
    const stockData = await ExternalApiService.getStockData(symbol, interval);
    
    res.json({
      success: true,
      message: '股票数据获取成功',
      data: stockData
    });
  });
  
  /**
   * 获取技术分析指标
   */
  static getTechnicalIndicator = catchAsync(async (req: Request, res: Response) => {
    const { symbol, exchange, interval, indicator } = req.params;
    const { period } = req.query;
    
    const requiredFields = { symbol, exchange, interval, indicator };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        throw new ApiError(400, `${key}不能为空`);
      }
    }
    
    const technicalData = await ExternalApiService.getTechnicalIndicator({
      symbol,
      exchange,
      interval,
      indicator,
      period: period ? parseInt(period as string) : undefined
    });
    
    res.json({
      success: true,
      message: '技术指标获取成功',
      data: technicalData
    });
  });
  
  /**
   * 生成图像
   */
  static generateImage = catchAsync(async (req: Request, res: Response) => {
    const { prompt, style, aspectRatio, model } = req.body;
    
    if (!prompt) {
      throw new ApiError(400, '图像描述不能为空');
    }
    
    const imageData = await ExternalApiService.generateImage({
      prompt,
      style,
      aspectRatio,
      model
    });
    
    res.json({
      success: true,
      message: '图像生成成功',
      data: imageData
    });
  });
  
  /**
   * 生成视频
   */
  static generateVideo = catchAsync(async (req: Request, res: Response) => {
    const { scenes, template, resolution, quality } = req.body;
    
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      throw new ApiError(400, '场景数据不能为空');
    }
    
    const videoData = await ExternalApiService.generateVideo({
      scenes,
      template,
      resolution,
      quality
    });
    
    res.json({
      success: true,
      message: '视频生成成功',
      data: videoData
    });
  });
  
  /**
   * 触发N8N工作流
   */
  static triggerWorkflow = catchAsync(async (req: Request, res: Response) => {
    const { workflowId } = req.params;
    const { data, webhookUrl } = req.body;
    
    if (!workflowId) {
      throw new ApiError(400, '工作流ID不能为空');
    }
    
    const result = await ExternalApiService.triggerWorkflow({
      workflowId,
      data: data || {},
      webhookUrl
    });
    
    res.json({
      success: true,
      message: '工作流触发成功',
      data: result
    });
  });
  
  /**
   * 获取市场数据
   */
  static getMarketData = catchAsync(async (req: Request, res: Response) => {
    const { symbol, timespan, from, to } = req.params;
    const { multiplier } = req.query;
    
    const requiredFields = { symbol, timespan, from, to };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        throw new ApiError(400, `${key}不能为空`);
      }
    }
    
    const marketData = await ExternalApiService.getMarketData({
      symbol,
      timespan,
      from,
      to,
      multiplier: multiplier ? parseInt(multiplier as string) : undefined
    });
    
    res.json({
      success: true,
      message: '市场数据获取成功',
      data: marketData
    });
  });
  
  /**
   * 获取公司财务数据
   */
  static getCompanyFinancials = catchAsync(async (req: Request, res: Response) => {
    const { symbol, statement } = req.params;
    
    if (!symbol) {
      throw new ApiError(400, '股票代码不能为空');
    }
    
    const financialData = await ExternalApiService.getCompanyFinancials(symbol, statement);
    
    res.json({
      success: true,
      message: '财务数据获取成功',
      data: financialData
    });
  });
  
  /**
   * 获取实时股价
   */
  static getRealTimePrice = catchAsync(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    
    if (!symbol) {
      throw new ApiError(400, '股票代码不能为空');
    }
    
    const priceData = await ExternalApiService.getRealTimePrice(symbol);
    
    res.json({
      success: true,
      message: '实时股价获取成功',
      data: priceData
    });
  });
  
  /**
   * 获取加密货币数据
   */
  static getCryptoData = catchAsync(async (req: Request, res: Response) => {
    const { symbol, interval } = req.params;
    const { outputsize } = req.query;
    
    const requiredFields = { symbol, interval };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        throw new ApiError(400, `${key}不能为空`);
      }
    }
    
    const cryptoData = await ExternalApiService.getCryptoData({
      symbol,
      interval,
      outputsize: outputsize ? parseInt(outputsize as string) : undefined
    });
    
    res.json({
      success: true,
      message: '加密货币数据获取成功',
      data: cryptoData
    });
  });
  
  /**
   * 批量API调用
   */
  static batchApiCall = catchAsync(async (req: Request, res: Response) => {
    const { requests } = req.body;
    
    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      throw new ApiError(400, '请求列表不能为空');
    }
    
    if (requests.length > 10) {
      throw new ApiError(400, '批量请求数量不能超过10个');
    }
    
    const results = await ExternalApiService.batchApiCall(requests);
    
    res.json({
      success: true,
      message: '批量API调用完成',
      data: {
        total: requests.length,
        results
      }
    });
  });
  
  /**
   * 获取API配置信息
   */
  static getApiConfigs = catchAsync(async (req: Request, res: Response) => {
    const configs = ExternalApiService.getApiConfigs();
    
    res.json({
      success: true,
      message: 'API配置获取成功',
      data: configs
    });
  });
  
  /**
   * 获取行业新闻
   */
  static getIndustryNews = catchAsync(async (req: Request, res: Response) => {
    const { industry } = req.params;
    const { pageSize, page } = req.query;
    
    if (!industry) {
      throw new ApiError(400, '行业类型不能为空');
    }
    
    const newsData = await ExternalApiService.getNews({
      query: `${industry} industry business`,
      pageSize: pageSize ? parseInt(pageSize as string) : 20,
      page: page ? parseInt(page as string) : 1
    });
    
    res.json({
      success: true,
      message: '行业新闻获取成功',
      data: newsData
    });
  });
  
  /**
   * 获取公司新闻
   */
  static getCompanyNews = catchAsync(async (req: Request, res: Response) => {
    const { company } = req.params;
    const { pageSize, page } = req.query;
    
    if (!company) {
      throw new ApiError(400, '公司名称不能为空');
    }
    
    const newsData = await ExternalApiService.getNews({
      query: company,
      pageSize: pageSize ? parseInt(pageSize as string) : 20,
      page: page ? parseInt(page as string) : 1
    });
    
    res.json({
      success: true,
      message: '公司新闻获取成功',
      data: newsData
    });
  });
  
  /**
   * 生成营销素材图片
   */
  static generateMarketingImage = catchAsync(async (req: Request, res: Response) => {
    const { productName, targetAudience, style, message } = req.body;
    
    if (!productName) {
      throw new ApiError(400, '产品名称不能为空');
    }
    
    const prompt = `Create a professional marketing image for ${productName}. Target audience: ${targetAudience || 'general'}. Style: ${style || 'modern'}. Message: ${message || 'high quality product'}. Include attractive visuals and clear branding.`;
    
    const imageData = await ExternalApiService.generateImage({
      prompt,
      style: style || 'realistic',
      aspectRatio: '16:9',
      model: 'starryai'
    });
    
    res.json({
      success: true,
      message: '营销图片生成成功',
      data: imageData
    });
  });
  
  /**
   * 生成产品演示视频
   */
  static generateProductVideo = catchAsync(async (req: Request, res: Response) => {
    const { productName, features, duration, style } = req.body;
    
    if (!productName || !features || !Array.isArray(features)) {
      throw new ApiError(400, '产品名称和功能列表不能为空');
    }
    
    const scenes = features.map((feature: string, index: number) => ({
      id: index + 1,
      duration: (duration || 30) / features.length,
      elements: [
        {
          type: 'text',
          text: feature,
          style: {
            fontSize: 24,
            color: '#333333',
            position: 'center'
          }
        },
        {
          type: 'background',
          color: style === 'dark' ? '#1a1a1a' : '#ffffff'
        }
      ]
    }));
    
    const videoData = await ExternalApiService.generateVideo({
      scenes,
      template: 'product_demo',
      resolution: '1920x1080',
      quality: 'high'
    });
    
    res.json({
      success: true,
      message: '产品视频生成成功',
      data: videoData
    });
  });
  
  /**
   * 获取竞争对手分析数据
   */
  static getCompetitorAnalysis = catchAsync(async (req: Request, res: Response) => {
    const { company, competitors } = req.body;
    
    if (!company || !competitors || !Array.isArray(competitors)) {
      throw new ApiError(400, '公司名称和竞争对手列表不能为空');
    }
    
    const requests = [
      {
        service: 'news',
        method: 'getNews',
        params: { query: company, pageSize: 10 }
      },
      ...competitors.map((competitor: string) => ({
        service: 'news',
        method: 'getNews',
        params: { query: competitor, pageSize: 5 }
      }))
    ];
    
    const results = await ExternalApiService.batchApiCall(requests);
    
    res.json({
      success: true,
      message: '竞争对手分析数据获取成功',
      data: {
        company,
        competitors,
        analysis: results
      }
    });
  });
}

export default ExternalApiController;