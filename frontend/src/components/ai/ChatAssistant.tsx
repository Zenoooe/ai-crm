import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  MoreVert as MoreIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { clearChatMessages, addChatMessage } from '../../store/slices/aiSlice';
import { useGenerateAIResponseMutation } from '../../store/api/api';
import { Contact } from '../../types/contact';
import { AIMessage, ChatContext } from '../../types/ai';

interface ChatAssistantProps {
  contact?: Contact;
  context?: ChatContext;
  onScriptGenerated?: (script: string) => void;
  onInsightGenerated?: (insight: string) => void;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({
  contact,
  context,
  onScriptGenerated,
  onInsightGenerated
}) => {
  const dispatch = useAppDispatch();
  const { messages, isLoading, error } = useAppSelector(state => state.ai.chat);
  const [generateAIResponse, { isLoading: isGenerating }] = useGenerateAIResponseMutation();
  const [inputMessage, setInputMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');

    // Add user message immediately
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    dispatch(addChatMessage(userMessage));

    try {
      const result = await generateAIResponse({
        message,
        contact,
        context
      }).unwrap();

      // Add AI response
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message,
        timestamp: result.timestamp,
        metadata: result.metadata
      };
      dispatch(addChatMessage(aiMessage));
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      dispatch(addChatMessage(errorMessage));
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleUseAsScript = (content: string) => {
    onScriptGenerated?.(content);
  };

  const handleSaveInsight = (content: string) => {
    onInsightGenerated?.(content);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleClearHistory = () => {
    dispatch(clearChatMessages());
    handleMenuClose();
  };

  const renderMessage = (message: AIMessage, index: number) => {
    const isUser = message.role === 'user';
    const isAI = message.role === 'assistant';

    return (
      <ListItem
        key={index}
        sx={{
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          px: 2,
          py: 1
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            maxWidth: '80%',
            flexDirection: isUser ? 'row-reverse' : 'row'
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: isUser ? 'primary.main' : 'secondary.main'
            }}
          >
            {isUser ? <PersonIcon /> : <AIIcon />}
          </Avatar>
          
          <Paper
            elevation={1}
            sx={{
              p: 2,
              bgcolor: isUser ? 'primary.light' : 'grey.100',
              color: isUser ? 'primary.contrastText' : 'text.primary',
              borderRadius: 2,
              position: 'relative'
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>
            
            {message.metadata?.type && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  size="small"
                  label={message.metadata.type}
                  color={message.metadata.type === 'script' ? 'primary' : 'secondary'}
                  icon={message.metadata.type === 'script' ? <PsychologyIcon /> : undefined}
                />
              </Box>
            )}
            
            {isAI && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  '.MuiPaper-root:hover &': {
                    opacity: 1
                  }
                }}
              >
                <Tooltip title="复制">
                  <IconButton
                    size="small"
                    onClick={() => handleCopyMessage(message.content)}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                {message.metadata?.type === 'script' && (
                  <Tooltip title="使用为话术">
                    <IconButton
                      size="small"
                      onClick={() => handleUseAsScript(message.content)}
                    >
                      <PsychologyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </Paper>
        </Box>
        
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, alignSelf: isUser ? 'flex-end' : 'flex-start' }}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </Typography>
      </ListItem>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon color="primary" />
          <Typography variant="h6">AI销售助手</Typography>
          {contact && (
            <Chip
              size="small"
              label={contact.basicInfo.name}
              variant="outlined"
            />
          )}
        </Box>
        
        <IconButton onClick={handleMenuClick}>
          <MoreIcon />
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleClearHistory}>
            <RefreshIcon sx={{ mr: 1 }} />
            清空对话
          </MenuItem>
        </Menu>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {messages.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              color: 'text.secondary'
            }}
          >
            <AIIcon sx={{ fontSize: 48 }} />
            <Typography variant="body1">
              你好！我是你的AI销售助手，可以帮你：
            </Typography>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">• 生成个性化销售话术</Typography>
              <Typography variant="body2">• 分析客户画像和需求</Typography>
              <Typography variant="body2">• 提供沟通策略建议</Typography>
              <Typography variant="body2">• 处理销售异议</Typography>
            </Box>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {messages.map((message, index) => renderMessage(message, index))}
            {isGenerating && (
              <ListItem sx={{ justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  AI正在思考...
                </Typography>
              </ListItem>
            )}
          </List>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Input */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder="输入你的问题或需求..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            sx={{ alignSelf: 'flex-end' }}
          >
            <SendIcon />
          </IconButton>
        </Box>
        
        {error && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            {error}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ChatAssistant;