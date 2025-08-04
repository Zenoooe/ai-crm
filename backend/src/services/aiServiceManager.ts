/**
 * AI服务管理器
 * 提供统一的接口来管理和调用各种AI服务
 */

import axios, { AxiosResponse } from 'axios';
import { AI_SERVICES, AIServiceConfig, getServiceConfig, getActiveServices } from '../config/aiServices';
import { logger } from '../utils/logger';

export interface AIRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  service: string;
}

export interface FinanceDataRequest {
  symbol?: string;
  interval?: string;
  startDate?: string;
  endDate?: string;
  indicators?: string[];
}

export interface NewsRequest {
  query?: string;
  category?: string;
  country?: string;
  language?: string;
  pageSize?: number;
}

class AIServiceManager {
  private static instance: AIServiceManager;
  private serviceConfigs: Record<string, AIServiceConfig>;

  private constructor() {
    this.serviceConfigs = AI_SERVICES;
  }

  public static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  /**
   * 调用AI聊天服务
   */
  async callAIService(serviceName: string, request: AIRequest): Promise<AIResponse> {
    const config = getServiceConfig(serviceName);
    if (!config || !config.isActive) {
      throw new Error(`服务 ${serviceName} 不可用`);
    }

    try {
      switch (serviceName) {
        case 'deepseek':
          return await this.callDeepSeek(request);
        case 'kimi':
          return await this.callKimi(request);
        case 'xai':
          return await this.callXAI(request);
        case 'gemini':
          return await this.callGemini(request);
        default:
          throw new Error(`不支持的AI服务: ${serviceName}`);
      }
    } catch (error) {
      logger.error(`AI服务调用失败 [${serviceName}]:`, error as Error);
      throw error;
    }
  }

  /**
   * 智能路由 - 自动选择最佳AI服务
   */
  async smartRoute(request: AIRequest): Promise<AIResponse> {
    const aiServices = getActiveServices().filter(s => s.category === 'AI');
    
    if (aiServices.length === 0) {
      throw new Error('没有可用的AI服务');
    }

    // 简单的负载均衡策略：随机选择
    const randomService = aiServices[Math.floor(Math.random() * aiServices.length)];
    const serviceName = Object.keys(this.serviceConfigs).find(
      key => this.serviceConfigs[key] === randomService
    );

    if (!serviceName) {
      throw new Error('无法找到可用的AI服务');
    }

    logger.info(`智能路由选择服务: ${serviceName}`);
    return await this.callAIService(serviceName, request);
  }

  /**
   * 获取金融数据
   */
  async getFinanceData(serviceName: string, request: FinanceDataRequest): Promise<any> {
    const config = getServiceConfig(serviceName);
    if (!config || !config.isActive || config.category !== 'Finance') {
      throw new Error(`金融服务 ${serviceName} 不可用`);
    }

    try {
      switch (serviceName) {
        case 'alphavantage':
          return await this.callAlphaVantage(request);
        case 'polygon':
          return await this.callPolygon(request);
        case 'finnhub':
          return await this.callFinnhub(request);
        case 'twelvedata':
          return await this.callTwelveData(request);
        default:
          throw new Error(`不支持的金融服务: ${serviceName}`);
      }
    } catch (error) {
      logger.error(`金融数据获取失败 [${serviceName}]:`, error as Error);
      throw error;
    }
  }

  /**
   * 获取新闻数据
   */
  async getNews(request: NewsRequest): Promise<any> {
    const config = getServiceConfig('newsapi');
    if (!config || !config.isActive) {
      throw new Error('新闻服务不可用');
    }

    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: request.query || 'business',
          category: request.category,
          country: request.country,
          language: request.language || 'zh',
          pageSize: request.pageSize || 20,
          apiKey: config.apiKey
        }
      });

      return response.data;
    } catch (error) {
      logger.error('新闻数据获取失败:', error as Error);
      throw error;
    }
  }

  /**
   * 生成图像
   */
  async generateImage(prompt: string): Promise<any> {
    const config = getServiceConfig('starryai');
    if (!config || !config.isActive) {
      throw new Error('图像生成服务不可用');
    }

    try {
      const response = await axios.post(`${config.baseUrl}/dashboard`, {
        prompt,
        style: 'realistic',
        size: '1024x1024'
      }, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('图像生成失败:', error as Error);
      throw error;
    }
  }

  // 私有方法：具体的AI服务调用实现
  private async callDeepSeek(request: AIRequest): Promise<AIResponse> {
    const config = getServiceConfig('deepseek')!;
    
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: request.model || 'deepseek-chat',
      messages: [
        ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
        { role: 'user', content: request.prompt }
      ],
      max_tokens: request.maxTokens || 1000,
      temperature: request.temperature || 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model,
      service: 'deepseek'
    };
  }

  private async callKimi(request: AIRequest): Promise<AIResponse> {
    const config = getServiceConfig('kimi')!;
    
    const response = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
      model: request.model || 'moonshot-v1-8k',
      messages: [
        ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
        { role: 'user', content: request.prompt }
      ],
      max_tokens: request.maxTokens || 1000,
      temperature: request.temperature || 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model,
      service: 'kimi'
    };
  }

  private async callXAI(request: AIRequest): Promise<AIResponse> {
    const config = getServiceConfig('xai')!;
    
    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      model: request.model || 'grok-beta',
      messages: [
        ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
        { role: 'user', content: request.prompt }
      ],
      max_tokens: request.maxTokens || 1000,
      temperature: request.temperature || 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model,
      service: 'xai'
    };
  }

  private async callGemini(request: AIRequest): Promise<AIResponse> {
    const config = getServiceConfig('gemini')!;
    
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.apiKey}`, {
      contents: [{
        parts: [{
          text: request.systemPrompt ? `${request.systemPrompt}\n\n${request.prompt}` : request.prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      content: response.data.candidates[0].content.parts[0].text,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      model: 'gemini-pro',
      service: 'gemini'
    };
  }

  // 金融数据服务调用实现
  private async callAlphaVantage(request: FinanceDataRequest): Promise<any> {
    const config = getServiceConfig('alphavantage')!;
    
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: request.symbol || 'AAPL',
        apikey: config.apiKey
      }
    });

    return response.data;
  }

  private async callPolygon(request: FinanceDataRequest): Promise<any> {
    const config = getServiceConfig('polygon')!;
    
    const response = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${request.symbol || 'AAPL'}/range/1/day/2023-01-01/2023-12-31`, {
      params: {
        apikey: config.apiKey
      }
    });

    return response.data;
  }

  private async callFinnhub(request: FinanceDataRequest): Promise<any> {
    const config = getServiceConfig('finnhub')!;
    
    const response = await axios.get('https://finnhub.io/api/v1/quote', {
      params: {
        symbol: request.symbol || 'AAPL',
        token: config.apiKey
      }
    });

    return response.data;
  }

  private async callTwelveData(request: FinanceDataRequest): Promise<any> {
    const config = getServiceConfig('twelvedata')!;
    
    const response = await axios.get('https://api.twelvedata.com/time_series', {
      params: {
        symbol: request.symbol || 'AAPL',
        interval: request.interval || '1day',
        apikey: config.apiKey
      }
    });

    return response.data;
  }

  /**
   * 健康检查 - 测试所有服务的可用性
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    const activeServices = getActiveServices();

    for (const service of activeServices) {
      const serviceName = Object.keys(this.serviceConfigs).find(
        key => this.serviceConfigs[key] === service
      );
      
      if (serviceName) {
        try {
          // 简单的健康检查
          if (service.category === 'AI') {
            await this.callAIService(serviceName, {
              prompt: 'Hello',
              maxTokens: 10
            });
          }
          results[serviceName] = true;
        } catch (error) {
          results[serviceName] = false;
          logger.warn(`服务健康检查失败 [${serviceName}]:`, error);
        }
      }
    }

    return results;
  }

  /**
   * 获取服务使用统计
   */
  getServiceStats() {
    return {
      totalServices: Object.keys(this.serviceConfigs).length,
      activeServices: getActiveServices().length,
      servicesByCategory: getActiveServices().reduce((acc, service) => {
        acc[service.category] = (acc[service.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export default AIServiceManager;
export const aiServiceManager = AIServiceManager.getInstance();