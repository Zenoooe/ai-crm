import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Button,
  List,
  ListItem,
  Avatar,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Grid,
} from '@mui/material';
import {
  Send,
  Psychology,
  TrendingUp,
  Lightbulb,
  Chat,
  Analytics,
  Handshake,
} from '@mui/icons-material';
import { Contact } from '../../types/contact';
import { apiService } from '../../services/api.ts';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: 'script' | 'analysis' | 'strategy' | 'closing';
    methodology?: string;
    confidence?: number;
  };
}

interface ContactAISalesAssistantProps {
  contact: Contact;
}

const SALES_METHODOLOGIES = [
  {
    id: 'straightLine',
    name: '华尔街之狼直线销售法',
    description: '建立融洽关系 → 发现需求 → 展示价值 → 处理异议 → 促成交易'
  },
  {
    id: 'sandler',
    name: '桑德拉七步销售法',
    description: '建立融洽 → 前期准备 → 痛点发现 → 预算确认 → 决策流程 → 履行承诺 → 售后跟进'
  },
  {
    id: 'obppc',
    name: 'OBPPC销售模型',
    description: '开场 → 建立关系 → 探索需求 → 展示方案 → 促成交易'
  }
];

const QUICK_ACTIONS = [
  { id: 'opening', label: '生成开场白', icon: <Chat />, prompt: '请为这位客户生成一个专业的开场白，要体现出我们对他们公司和行业的了解' },
  { id: 'needs', label: '需求挖掘', icon: <Psychology />, prompt: '请提供一些深度挖掘客户需求的问题，帮助我了解他们的痛点和目标' },
  { id: 'objection', label: '异议处理', icon: <Lightbulb />, prompt: '客户可能会提出哪些异议？请提供相应的处理话术和策略' },
  { id: 'closing', label: '成交促成', icon: <Handshake />, prompt: '基于当前情况，请提供几种不同的成交促成话术和技巧' },
  { id: 'strategy', label: '策略建议', icon: <TrendingUp />, prompt: '基于客户画像和互动历史，请提供下一步的销售策略建议' },
  { id: 'analysis', label: '客户分析', icon: <Analytics />, prompt: '请深度分析这位客户的特点、需求和决策风格，提供个性化的沟通建议' }
];

const ContactAISalesAssistant: React.FC<ContactAISalesAssistantProps> = ({ contact }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethodology, setSelectedMethodology] = useState<string>('straightLine');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 初始化欢迎消息
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'assistant',
      content: `你好！我是专门为 ${contact.basicInfo.name} 定制的AI销售助手。\n\n我可以帮你：\n• 生成针对性的销售话术\n• 分析客户特点和需求\n• 提供成交策略建议\n• 处理销售异议\n• 制定跟进计划\n\n请选择你需要的帮助，或者直接与我对话！`,
      timestamp: new Date(),
      metadata: { type: 'strategy' }
    };
    setMessages([welcomeMessage]);
  }, [contact]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.post('/ai/chat', {
        message,
        contact: {
          id: contact._id,
          name: contact.basicInfo.name,
          company: contact.basicInfo.company,
          position: contact.basicInfo.position,
          industry: contact.basicInfo.industry
        },
        context: {
          methodology: selectedMethodology,
          contactInfo: contact.basicInfo,
          businessInfo: contact.businessInfo
        }
      });

      if (response.data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.data.message || response.data.data?.message || '抱歉，我现在无法回复，请稍后再试。',
          timestamp: new Date(),
          metadata: response.data.metadata || response.data.data?.metadata
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.data.message || '发送失败');
      }
    } catch (error: any) {
      console.error('发送消息失败:', error);
      setError(error.response?.data?.message || '发送消息失败，请重试');
      
      // 添加错误消息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '抱歉，我现在无法回复。请检查网络连接或稍后再试。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: any) => {
    handleSendMessage(action.prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            🤖 AI销售助手
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>销售方法论</InputLabel>
            <Select
              value={selectedMethodology}
              label="销售方法论"
              onChange={(e) => setSelectedMethodology(e.target.value)}
            >
              {SALES_METHODOLOGIES.map((methodology) => (
                <MenuItem key={methodology.id} value={methodology.id}>
                  {methodology.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* 快捷操作按钮 */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            快捷操作：
          </Typography>
          <Grid container spacing={1}>
            {QUICK_ACTIONS.map((action) => (
              <Grid item key={action.id}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={action.icon}
                  onClick={() => handleQuickAction(action)}
                  disabled={isLoading}
                >
                  {action.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 聊天区域 */}
        <Box
          sx={{
            height: 400,
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            p: 2,
            mb: 2,
            overflow: 'auto',
            backgroundColor: '#fafafa'
          }}
        >
          <List>
            {messages.map((message) => (
              <ListItem key={message.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    width: '100%',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  {message.type === 'assistant' && (
                    <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                      🤖
                    </Avatar>
                  )}
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '80%',
                      bgcolor: message.type === 'user' ? 'primary.main' : 'grey.100',
                      color: message.type === 'user' ? 'white' : 'text.primary'
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                    {message.metadata?.type && (
                      <Chip
                        size="small"
                        label={message.metadata.type}
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Paper>
                  {message.type === 'user' && (
                    <Avatar sx={{ ml: 1, bgcolor: 'secondary.main' }}>
                      👤
                    </Avatar>
                  )}
                </Box>
              </ListItem>
            ))}
            {isLoading && (
              <ListItem>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                    🤖
                  </Avatar>
                  <CircularProgress size={20} />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    正在思考...
                  </Typography>
                </Box>
              </ListItem>
            )}
          </List>
          <div ref={messagesEndRef} />
        </Box>

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 输入区域 */}
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            size="small"
            placeholder={`与${contact.basicInfo.name}的AI销售助手对话...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            multiline
            maxRows={3}
          />
          <IconButton
            color="primary"
            onClick={() => handleSendMessage(inputMessage)}
            disabled={!inputMessage.trim() || isLoading}
          >
            <Send />
          </IconButton>
        </Box>

        {/* 当前方法论说明 */}
        <Box mt={2}>
          <Typography variant="caption" color="textSecondary">
            当前使用：{SALES_METHODOLOGIES.find(m => m.id === selectedMethodology)?.name}
          </Typography>
          <Typography variant="caption" display="block" color="textSecondary">
            {SALES_METHODOLOGIES.find(m => m.id === selectedMethodology)?.description}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ContactAISalesAssistant;