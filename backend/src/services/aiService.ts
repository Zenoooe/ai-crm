import { Request, Response } from 'express';
import OpenAI from 'openai';
import axios from 'axios';

// AI服务配置
const AI_CONFIGS = {
    deepseek: {
        baseURL: 'https://api.deepseek.com',
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner']
    },
    kimi: {
        baseURL: 'https://api.moonshot.cn/v1',
        apiKey: process.env.KIMI_API_KEY || '',
        models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
    },
    xai: {
        baseURL: 'https://api.x.ai/v1',
        apiKey: process.env.XAI_API_KEY || '',
        models: ['grok-beta', 'grok-vision-beta', 'grok-2-1212', 'grok-2-vision-1212', 'grok-3-mini', 'grok-3-mini-fast']
    },
    gemini: {
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        apiKey: process.env.GEMINI_API_KEY || '',
        models: ['gemini-pro', 'gemini-pro-vision', 'gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash']
    },
    openai: {
        baseURL: 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY || '',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini']
    }
};

// 创建AI客户端
function createAIClient(provider: string) {
    const config = AI_CONFIGS[provider as keyof typeof AI_CONFIGS];
    if (!config) {
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    return new OpenAI({
        baseURL: config.baseURL,
        apiKey: config.apiKey
    });
}

// AI聊天接口
export const aiChat = async (req: Request, res: Response) => {
    try {
        const { message, provider = 'deepseek', model, conversationHistory = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const config = AI_CONFIGS[provider as keyof typeof AI_CONFIGS];
        if (!config) {
            return res.status(400).json({ error: `Unsupported AI provider: ${provider}` });
        }

        if (!config.apiKey) {
            return res.status(500).json({ error: `API key not configured for ${provider}` });
        }

        const client = createAIClient(provider);
        const selectedModel = model || config.models[0];

        // 构建消息历史
        const messages = [
            ...conversationHistory,
            { role: 'user', content: message }
        ];

        const completion = await client.chat.completions.create({
            model: selectedModel,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        });

        const response = completion.choices[0]?.message?.content || 'No response generated';

        res.json({
            success: true,
            response,
            provider,
            model: selectedModel
        });

    } catch (error: any) {
        console.error('AI Chat Error:', error);
        res.status(500).json({
            error: 'Failed to get AI response',
            details: error.message
        });
    }
};

// 获取可用的AI模型
export const getAvailableModels = async (req: Request, res: Response) => {
    try {
        const availableProviders: any = {};

        for (const [provider, config] of Object.entries(AI_CONFIGS)) {
            if (config.apiKey) {
                availableProviders[provider] = {
                    models: config.models,
                    available: true
                };
            } else {
                availableProviders[provider] = {
                    models: config.models,
                    available: false,
                    reason: 'API key not configured'
                };
            }
        }

        res.json({
            success: true,
            providers: availableProviders
        });

    } catch (error: any) {
        console.error('Get Models Error:', error);
        res.status(500).json({
            error: 'Failed to get available models',
            details: error.message
        });
    }
};

// 测试AI连接
export const testAIConnection = async (req: Request, res: Response) => {
    try {
        const { provider } = req.body;

        if (!provider) {
            return res.status(400).json({ error: 'Provider is required' });
        }

        const config = AI_CONFIGS[provider as keyof typeof AI_CONFIGS];
        if (!config) {
            return res.status(400).json({ error: `Unsupported AI provider: ${provider}` });
        }

        if (!config.apiKey) {
            return res.status(400).json({ error: `API key not configured for ${provider}` });
        }

        const client = createAIClient(provider);

        // 发送测试消息
        const completion = await client.chat.completions.create({
            model: config.models[0],
            messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
            max_tokens: 50
        });

        const response = completion.choices[0]?.message?.content;

        res.json({
            success: true,
            message: 'Connection successful',
            provider,
            testResponse: response
        });

    } catch (error: any) {
        console.error('Test Connection Error:', error);
        res.status(500).json({
            success: false,
            error: 'Connection failed',
            details: error.message
        });
    }
};