import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
  Typography,
  Chip,
  IconButton,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Interaction } from '../../types/interaction';
import { Contact } from '../../types/contact';

interface InteractionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (interaction: Partial<Interaction>) => void;
  contact: Contact;
  interaction?: Interaction;
  loading?: boolean;
}

const InteractionForm: React.FC<InteractionFormProps> = ({
  open,
  onClose,
  onSubmit,
  contact,
  interaction,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    type: 'call' as Interaction['type'],
    content: '',
    sentiment: 'neutral' as Interaction['sentiment'],
    topics: [] as string[],
    duration: 0,
    location: '',
    platform: '',
  });
  const [newTopic, setNewTopic] = useState('');


  useEffect(() => {
    if (interaction) {
      setFormData({
        type: interaction.type,
        content: interaction.content,
        sentiment: interaction.sentiment,
        topics: interaction.topics || [],
        duration: interaction.metadata?.duration || 0,
        location: interaction.metadata?.location || '',
        platform: interaction.metadata?.platform || '',
      });
    } else {
      // Reset form for new interaction
      setFormData({
        type: 'call',
        content: '',
        sentiment: 'neutral',
        topics: [],
        duration: 0,
        location: '',
        platform: '',
      });
    }
  }, [interaction, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const interactionData: Partial<Interaction> = {
      contactId: contact._id,
      type: formData.type,
      content: formData.content,
      sentiment: formData.sentiment,
      topics: formData.topics,
      metadata: {
        duration: formData.duration,
        location: formData.location,
        platform: formData.platform,
      },
    };

    onSubmit(interactionData);
  };

  const handleAddTopic = () => {
    if (newTopic.trim() && !formData.topics.includes(newTopic.trim())) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, newTopic.trim()]
      }));
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic !== topicToRemove)
    }));
  };



  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {interaction ? '编辑互动记录' : '添加互动记录'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            {/* 基本信息 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                与 {contact.basicInfo.name} 的互动
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>互动类型</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="call">电话</MenuItem>
                  <MenuItem value="email">邮件</MenuItem>
                  <MenuItem value="meeting">会议</MenuItem>
                  <MenuItem value="wechat">微信</MenuItem>
                  <MenuItem value="social">社交媒体</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>情绪倾向</InputLabel>
                <Select
                  value={formData.sentiment}
                  onChange={(e) => setFormData(prev => ({ ...prev, sentiment: e.target.value as any }))}
                >
                  <MenuItem value="positive">积极</MenuItem>
                  <MenuItem value="neutral">中性</MenuItem>
                  <MenuItem value="negative">消极</MenuItem>
                </Select>
              </FormControl>
            </Grid>



            {(formData.type === 'call' || formData.type === 'meeting') && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="时长（分钟）"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                />
              </Grid>
            )}

            {formData.type === 'meeting' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="会议地点"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </Grid>
            )}

            {(formData.type === 'social' || formData.type === 'meeting') && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="平台/工具"
                  value={formData.platform}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  placeholder="如：腾讯会议、微信群、LinkedIn等"
                />
              </Grid>
            )}



            {/* 沟通内容 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="沟通内容"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="记录本次沟通的主要内容、客户反馈、关键信息等..."
                required
              />
            </Grid>

            {/* 讨论话题 */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                讨论话题
              </Typography>
              <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                {formData.topics.map((topic, index) => (
                  <Chip
                    key={index}
                    label={topic}
                    onDelete={() => handleRemoveTopic(topic)}
                    size="small"
                  />
                ))}
              </Box>
              <Box display="flex" gap={1}>
                <TextField
                  size="small"
                  label="添加话题"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                />
                <Button onClick={handleAddTopic} disabled={!newTopic.trim()}>
                  <AddIcon />
                </Button>
              </Box>
            </Grid>


          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.content.trim()}
          >
            {loading ? '保存中...' : (interaction ? '更新' : '添加')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default InteractionForm;