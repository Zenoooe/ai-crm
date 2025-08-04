import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Psychology,
  Send,
  Compare,
  ExpandMore,
  Email,
  Chat,
  LinkedIn,
  AutoAwesome,
  TrendingUp
} from '@mui/icons-material';
// import { Customer } from '../../types/customer';
import { apiService } from '../../services/api.ts';

// 临时类型定义
interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  industry?: string;
  progress: number;
  priority: number;
  tags?: string[];
  latest_notes?: string;
}

interface AISalesAssistantProps {
  customer: Customer;
  onProgressUpdate?: (progress: number) => void;
}

interface AIModel {
  id: string;
  name: string;
  description: string;
  cost: string;
  speed: string;
}

const AI_MODELS: AIModel[] = [
  {
    id: 'grok-4',
    name: 'xAI Grok-4',
    description: '最新的推理模型，擅长复杂销售场景',
    cost: '高',
    speed: '中等'
  },
  {
    id: 'deepseek-reasoner',
    name: 'Deepseek Reasoner',
    description: '深度推理模型，适合策略分析',
    cost: '中等',
    speed: '慢'
  },
  {
    id: 'gemini-pro',
    name: 'Google Gemini Pro',
    description: '多模态模型，支持图文分析',
    cost: '中等',
    speed: '快'
  },
  {
    id: 'moonshot-kimi-k2',
    name: 'Moonshot Kimi K2',
    description: '长文本处理，适合详细分析',
    cost: '低',
    speed: '快'
  },
  {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    description: '通用对话模型，平衡性能',
    cost: '高',
    speed: '中等'
  }
];

const MESSAGE_CHANNELS = [
  { id: 'email', name: '邮件', icon: <Email />, available: true },
  { id: 'wechat', name: '微信', icon: <Chat />, available: false },
  { id: 'linkedin', name: 'LinkedIn', icon: <LinkedIn />, available: false }
];

const PROMPT_TEMPLATES = [
  {
    name: '开场白生成',
    prompt: '请为这位客户生成一个专业且个性化的销售开场白，要求简洁有力，能够快速建立信任。'
  },
  {
    name: '异议处理',
    prompt: '客户对价格有异议，请生成一个专业的异议处理回应，强调价值而非价格。'
  },
  {
    name: '跟进策略',
    prompt: '请为这位客户制定下一步的跟进策略，包括时间安排和沟通要点。'
  },
  {
    name: '成交促进',
    prompt: '客户已经表现出购买意向，请生成一个促进成交的专业话术。'
  },
  {
    name: '关系维护',
    prompt: '请生成一个用于维护客户关系的温暖问候消息，体现专业关怀。'
  }
];

export const AISalesAssistant: React.FC<AISalesAssistantProps> = ({
  customer,
  onProgressUpdate
}) => {
  const [selectedModel, setSelectedModel] = useState<string>('grok-4');
  const [prompt, setPrompt] = useState<string>('');
  const [context, setContext] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(1000);
  const [sendMessage, setSendMessage] = useState<boolean>(false);
  const [messageChannel, setMessageChannel] = useState<string>('email');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareResults, setCompareResults] = useState<any>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入提示词');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await apiService.post('/ai/sales-assistant', {
        model: selectedModel,
        prompt,
        customer_id: customer.id,
        context,
        temperature,
        max_tokens: maxTokens,
        send_message: sendMessage,
        message_channel: messageChannel
      });

      setResponse(result.data.generated_content);
      
      if (result.data.message_sent) {
        // 显示发送成功消息
      }
      
      if (onProgressUpdate) {
        // 模拟进度更新
        onProgressUpdate(Math.min(customer.progress + 5, 100));
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareModels = async () => {
    if (!prompt.trim()) {
      setError('请输入提示词');
      return;
    }

    setLoading(true);
    setError('');
    setCompareResults(null);

    try {
      const result = await apiService.post('/ai/compare-models', {
        prompt,
        customer_id: customer.id,
        models: ['grok-4', 'deepseek-reasoner', 'gemini-pro']
      });

      setCompareResults(result.data.results);
    } catch (err: any) {
      setError(err.response?.data?.detail || '比较失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setPrompt(template.prompt);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Psychology color="primary" />
        AI销售助手
      </Typography>

      <Grid container spacing={3}>
        {/* 左侧：配置面板 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                配置选项
              </Typography>

              {/* 模型选择 */}
              <FormControl fullWidth margin="normal">
                <InputLabel>AI模型</InputLabel>
                <Select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  label="AI模型"
                >
                  {AI_MODELS.map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      <Box>
                        <Typography variant="body1">{model.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {model.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip label={`成本: ${model.cost}`} size="small" />
                          <Chip label={`速度: ${model.speed}`} size="small" />
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 提示词模板 */}
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                快速模板
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {PROMPT_TEMPLATES.map((template, index) => (
                  <Chip
                    key={index}
                    label={template.name}
                    onClick={() => handleTemplateSelect(template)}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>

              {/* 提示词输入 */}
              <TextField
                fullWidth
                multiline
                rows={4}
                label="提示词"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="请输入您的销售需求或问题..."
                margin="normal"
              />

              {/* 额外上下文 */}
              <TextField
                fullWidth
                multiline
                rows={2}
                label="额外上下文（可选）"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="补充客户信息或特殊情况..."
                margin="normal"
              />

              {/* 高级设置 */}
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>高级设置</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      type="number"
                      label="创造性 (0-2)"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      inputProps={{ min: 0, max: 2, step: 0.1 }}
                      size="small"
                    />
                    <TextField
                      type="number"
                      label="最大字数"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      inputProps={{ min: 100, max: 4000, step: 100 }}
                      size="small"
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* 消息发送选项 */}
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={sendMessage}
                      onChange={(e) => setSendMessage(e.target.checked)}
                    />
                  }
                  label="生成后直接发送消息"
                />
                
                {sendMessage && (
                  <FormControl fullWidth margin="normal" size="small">
                    <InputLabel>发送渠道</InputLabel>
                    <Select
                      value={messageChannel}
                      onChange={(e) => setMessageChannel(e.target.value)}
                      label="发送渠道"
                    >
                      {MESSAGE_CHANNELS.map((channel) => (
                        <MenuItem 
                          key={channel.id} 
                          value={channel.id}
                          disabled={!channel.available}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {channel.icon}
                            {channel.name}
                            {!channel.available && (
                              <Chip label="即将推出" size="small" color="warning" />
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>

              {/* 操作按钮 */}
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
                  fullWidth
                >
                  {loading ? '生成中...' : '生成回应'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleCompareModels}
                  disabled={loading || !prompt.trim()}
                  startIcon={<Compare />}
                >
                  模型比较
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 右侧：结果展示 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                客户信息
              </Typography>
              
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2">
                  <strong>姓名：</strong>{customer.name}
                </Typography>
                <Typography variant="body2">
                  <strong>公司：</strong>{customer.company || '未知'}
                </Typography>
                <Typography variant="body2">
                  <strong>职位：</strong>{customer.position || '未知'}
                </Typography>
                <Typography variant="body2">
                  <strong>进度：</strong>{customer.progress}%
                </Typography>
                {customer.tags && customer.tags.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" component="span">
                      <strong>标签：</strong>
                    </Typography>
                    {customer.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" sx={{ ml: 0.5 }} />
                    ))}
                  </Box>
                )}
              </Paper>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                AI回应结果
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {response && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {response}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      startIcon={<Send />}
                      variant="outlined"
                    >
                      发送消息
                    </Button>
                    <Button size="small" variant="text">
                      复制内容
                    </Button>
                    <Button size="small" variant="text">
                      保存模板
                    </Button>
                  </Box>
                </Paper>
              )}

              {compareResults && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    模型比较结果
                  </Typography>
                  {Object.entries(compareResults).map(([model, result]: [string, any]) => (
                    <Accordion key={model}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography>
                          {AI_MODELS.find(m => m.id === model)?.name || model}
                          {result.success ? (
                            <Chip label="成功" color="success" size="small" sx={{ ml: 1 }} />
                          ) : (
                            <Chip label="失败" color="error" size="small" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {result.success ? (
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {result.content}
                          </Typography>
                        ) : (
                          <Alert severity="error">
                            {result.error}
                          </Alert>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AISalesAssistant;