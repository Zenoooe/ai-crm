import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab/Timeline';
import { TimelineItem } from '@mui/lab/TimelineItem';
import { TimelineSeparator } from '@mui/lab/TimelineSeparator';
import { TimelineConnector } from '@mui/lab/TimelineConnector';
import { TimelineContent } from '@mui/lab/TimelineContent';
import { TimelineDot } from '@mui/lab/TimelineDot';
import {
  Phone,
  Email,
  VideoCall,
  Message,
  Event,
  Description,
  MoreVert,
  Add,
  Edit,
  Delete,
  Psychology,
  TrendingUp,
  Schedule,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { Interaction } from '../../types/interaction';
import { Contact } from '../../types/contact';

interface InteractionTimelineProps {
  interactions: Interaction[];
  contact: Contact;
  onAddInteraction: () => void;
  onEditInteraction: (interaction: Interaction) => void;
  onDeleteInteraction: (interactionId: string) => void;
  loading?: boolean;
}

interface InteractionItemProps {
  interaction: Interaction;
  onEdit: () => void;
  onDelete: () => void;
}

const InteractionItem: React.FC<InteractionItemProps> = ({
  interaction,
  onEdit,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone />;
      case 'email':
        return <Email />;
      case 'meeting':
        return <VideoCall />;
      case 'wechat':
        return <Message />;
      case 'demo':
        return <Description />;
      case 'proposal':
        return <Description />;
      default:
        return <Event />;
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'primary';
      case 'email':
        return 'secondary';
      case 'meeting':
        return 'success';
      case 'wechat':
        return 'info';
      case 'demo':
        return 'warning';
      case 'proposal':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <CheckCircle color="success" />;
      case 'negative':
        return <Warning color="error" />;
      default:
        return <Schedule color="action" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot color={getInteractionColor(interaction.type) as any}>
          {getInteractionIcon(interaction.type)}
        </TimelineDot>
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent>
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h6" component="span">
                  {interaction.type === 'call' && '电话沟通'}
                  {interaction.type === 'email' && '邮件联系'}
                  {interaction.type === 'meeting' && '会议'}
                  {interaction.type === 'wechat' && '微信沟通'}
                  {interaction.type === 'social' && '社交媒体'}
                </Typography>
                <Chip
                  size="small"
                  label={interaction.type}
                  color="primary"
                  variant="outlined"
                />
                {getSentimentIcon(interaction.sentiment)}
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatDate(interaction.createdAt)}
                {interaction.metadata?.duration && (
                  <span> • 时长: {Math.round(interaction.metadata.duration / 60)}分钟</span>
                )}
              </Typography>

              <Typography variant="body1" paragraph>
                {interaction.content}
              </Typography>

              {interaction.topics && interaction.topics.length > 0 && (
                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary">
                    讨论话题:
                  </Typography>
                  <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                    {interaction.topics.map((topic, index) => (
                      <Chip key={index} label={topic} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {interaction.aiAnalysis && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    <Psychology sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    AI分析
                  </Typography>
                  
                  {interaction.aiAnalysis.keyInsights && interaction.aiAnalysis.keyInsights.length > 0 && (
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        关键洞察:
                      </Typography>
                      <List dense>
                        {interaction.aiAnalysis.keyInsights.map((insight, index) => (
                          <ListItem key={index} sx={{ py: 0 }}>
                            <ListItemIcon sx={{ minWidth: 20 }}>
                              <TrendingUp fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={insight} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {interaction.aiAnalysis.nextSteps && interaction.aiAnalysis.nextSteps.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        建议下一步:
                      </Typography>
                      <List dense>
                        {interaction.aiAnalysis.nextSteps.map((step, index) => (
                          <ListItem key={index} sx={{ py: 0 }}>
                            <ListItemIcon sx={{ minWidth: 20 }}>
                              <Schedule fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={step} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { onEdit(); handleMenuClose(); }}>
                <Edit sx={{ mr: 1 }} /> 编辑
              </MenuItem>
              <MenuItem onClick={() => { onDelete(); handleMenuClose(); }}>
                <Delete sx={{ mr: 1 }} /> 删除
              </MenuItem>
            </Menu>
          </Box>
        </Paper>
      </TimelineContent>
    </TimelineItem>
  );
};

const InteractionTimeline: React.FC<InteractionTimelineProps> = ({
  interactions,
  contact,
  onAddInteraction,
  onEditInteraction,
  onDeleteInteraction,
  loading = false,
}) => {
  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <Typography>加载中...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          互动历史 ({interactions.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAddInteraction}
          size="small"
        >
          添加互动
        </Button>
      </Box>

      {sortedInteractions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Event sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            暂无互动记录
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            开始记录与 {contact.basicInfo.name} 的沟通历史
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={onAddInteraction}>
            添加第一条互动记录
          </Button>
        </Paper>
      ) : (
        <Timeline>
          {sortedInteractions.map((interaction) => (
            <InteractionItem
              key={interaction._id}
              interaction={interaction}
              onEdit={() => onEditInteraction(interaction)}
              onDelete={() => onDeleteInteraction(interaction._id)}
            />
          ))}
        </Timeline>
      )}
    </Box>
  );
};

export default InteractionTimeline;