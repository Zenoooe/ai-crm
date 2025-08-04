import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Message as MessageIcon,
  VideoCall as VideoCallIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Attachment as AttachmentIcon,
} from '@mui/icons-material';
import { Contact } from '../../types/contact';
import { Interaction } from '../../types/interaction';
import InteractionForm from './InteractionForm';


interface CommunicationPanelProps {
  contact: Contact;
  interactions: Interaction[];
  onAddInteraction: (interaction: Partial<Interaction>) => void;
  onUpdateInteraction: (id: string, interaction: Partial<Interaction>) => void;
  onDeleteInteraction: (id: string) => void;
  loading?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`communication-tabpanel-${index}`}
      aria-labelledby={`communication-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const CommunicationPanel: React.FC<CommunicationPanelProps> = ({
  contact,
  interactions,
  onAddInteraction,
  onUpdateInteraction,
  onDeleteInteraction,
  loading = false,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<Interaction['type'] | 'all'>('all');
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [quickMessageOpen, setQuickMessageOpen] = useState(false);
  const [quickMessage, setQuickMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);

  // 过滤和搜索交互记录
  const filteredInteractions = interactions.filter(interaction => {
    const matchesSearch = interaction.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interaction.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || interaction.type === filterType;
    return matchesSearch && matchesType;
  });

  // 按时间排序（最新的在前）
  const sortedInteractions = [...filteredInteractions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddInteraction = (type: Interaction['type']) => {
    setEditingInteraction(null);
    setShowInteractionForm(true);
  };

  const handleEditInteraction = (interaction: Interaction) => {
    setEditingInteraction(interaction);
    setShowInteractionForm(true);
  };

  const handleInteractionSubmit = (interactionData: Partial<Interaction>) => {
    if (editingInteraction) {
      onUpdateInteraction(editingInteraction._id, interactionData);
    } else {
      onAddInteraction(interactionData);
    }
    setShowInteractionForm(false);
    setEditingInteraction(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, interaction: Interaction) => {
    setAnchorEl(event.currentTarget);
    setSelectedInteraction(interaction);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInteraction(null);
  };

  const handleDeleteInteraction = () => {
    if (selectedInteraction) {
      onDeleteInteraction(selectedInteraction._id);
    }
    handleMenuClose();
  };

  const handleQuickCall = () => {
    if (contact.basicInfo.phone) {
      // 这里可以集成电话系统
      window.open(`tel:${contact.basicInfo.phone}`);
    }
  };

  const handleQuickEmail = () => {
    if (contact.basicInfo.email) {
      window.open(`mailto:${contact.basicInfo.email}`);
    }
  };

  const handleSendQuickMessage = () => {
    if (quickMessage.trim()) {
      const messageInteraction: Partial<Interaction> = {
        contactId: contact._id,
        type: 'wechat',
        content: quickMessage,
        sentiment: 'neutral',
        topics: [],
      };
      onAddInteraction(messageInteraction);
      setQuickMessage('');
      setQuickMessageOpen(false);
    }
  };

  const getInteractionIcon = (type: Interaction['type']) => {
    switch (type) {
      case 'call':
        return <PhoneIcon />;
      case 'email':
        return <EmailIcon />;
      case 'wechat':
        return <MessageIcon />;
      case 'meeting':
        return <VideoCallIcon />;
      case 'social':
        return <MessageIcon />;
      default:
        return <MessageIcon />;
    }
  };

  const getInteractionTypeLabel = (type: Interaction['type']) => {
    switch (type) {
      case 'call':
        return '电话';
      case 'email':
        return '邮件';
      case 'wechat':
        return '微信';
      case 'meeting':
        return '会议';
      case 'social':
        return '社交媒体';
      default:
        return type;
    }
  };

  const getSentimentColor = (sentiment: Interaction['sentiment']) => {
    switch (sentiment) {
      case 'positive':
        return 'success';
      case 'negative':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 头部 - 快速操作 */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          与 {contact.basicInfo.name} 的沟通
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PhoneIcon />}
            onClick={handleQuickCall}
            disabled={!contact.basicInfo.phone}
          >
            拨打电话
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EmailIcon />}
            onClick={handleQuickEmail}
            disabled={!contact.basicInfo.email}
          >
            发送邮件
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<MessageIcon />}
            onClick={() => setQuickMessageOpen(true)}
          >
            快速消息
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleAddInteraction('call')}
          >
            记录互动
          </Button>
        </Box>

        {/* 搜索和过滤 */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="搜索沟通记录..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <Button
            size="small"
            startIcon={<FilterIcon />}
            onClick={(e) => {
              // 这里可以添加过滤菜单
            }}
          >
            过滤
          </Button>
        </Box>
      </Box>

      {/* 标签页 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`全部 (${interactions.length})`} />
          <Tab label="最近互动" />
          <Tab label="待跟进" />
        </Tabs>
      </Box>

      {/* 内容区域 */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <TabPanel value={tabValue} index={0}>
          {/* 全部互动记录 */}
          <List sx={{ height: '100%', overflow: 'auto' }}>
            {sortedInteractions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? '没有找到匹配的沟通记录' : '还没有沟通记录'}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddInteraction('call')}
                  sx={{ mt: 2 }}
                >
                  添加第一条记录
                </Button>
              </Box>
            ) : (
              sortedInteractions.map((interaction, index) => (
                <React.Fragment key={interaction._id}>
                  <ListItem alignItems="flex-start">
                    <Avatar sx={{ mr: 2, bgcolor: getSentimentColor(interaction.sentiment) + '.main' }}>
                      {getInteractionIcon(interaction.type)}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle2">
                            {getInteractionTypeLabel(interaction.type)}
                          </Typography>
                          <Chip
                            label={interaction.sentiment === 'positive' ? '积极' : interaction.sentiment === 'negative' ? '消极' : '中性'}
                            size="small"
                            color={getSentimentColor(interaction.sentiment) as any}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(interaction.createdAt).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {interaction.content}
                          </Typography>
                          {interaction.topics.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {interaction.topics.map((topic, topicIndex) => (
                                <Chip
                                  key={topicIndex}
                                  label={topic}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={(e) => handleMenuClick(e, interaction)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < sortedInteractions.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* 最近互动 */}
          <Typography variant="body2" color="text.secondary">
            显示最近7天的互动记录
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* 待跟进 */}
          <Typography variant="body2" color="text.secondary">
            显示需要跟进的互动记录
          </Typography>
        </TabPanel>
      </Box>

      {/* 互动表单对话框 */}
      <InteractionForm
        open={showInteractionForm}
        onClose={() => {
          setShowInteractionForm(false);
          setEditingInteraction(null);
        }}
        onSubmit={handleInteractionSubmit}
        contact={contact}
        interaction={editingInteraction || undefined}
        loading={loading}
      />

      {/* 快速消息对话框 */}
      <Dialog open={quickMessageOpen} onClose={() => setQuickMessageOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>发送快速消息</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="消息内容"
            value={quickMessage}
            onChange={(e) => setQuickMessage(e.target.value)}
            placeholder="输入要发送的消息..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickMessageOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSendQuickMessage}
            disabled={!quickMessage.trim()}
            startIcon={<SendIcon />}
          >
            发送
          </Button>
        </DialogActions>
      </Dialog>

      {/* 操作菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedInteraction) {
            handleEditInteraction(selectedInteraction);
          }
          handleMenuClose();
        }}>
          编辑
        </MenuItem>
        <MenuItem onClick={handleDeleteInteraction}>
          删除
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default CommunicationPanel;