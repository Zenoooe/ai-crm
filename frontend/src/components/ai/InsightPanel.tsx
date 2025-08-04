import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { addInsight, removeInsight } from '../../store/slices/aiSlice';
import { useGenerateInsightsMutation, useGetInsightsQuery } from '../../store/api/api';
import { Contact } from '../../types/contact';
import { Interaction } from '../../types/interaction';
import { AIInsight } from '../../store/slices/aiSlice';

interface InsightPanelProps {
  contact: Contact;
  interactions: Interaction[];
  onInsightAction?: (insight: AIInsight, action: 'save' | 'dismiss' | 'implement') => void;
}

const InsightPanel: React.FC<InsightPanelProps> = ({
  contact,
  interactions,
  onInsightAction
}) => {
  const dispatch = useAppDispatch();
  const [generateInsights, { isLoading: isGenerating }] = useGenerateInsightsMutation();
  const { data: insights = [], refetch: refetchInsights } = useGetInsightsQuery(contact._id);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    // Load existing insights for this contact
    loadInsights();
  }, [contact._id]);

  const loadInsights = async () => {
    try {
      const response = await fetch(`/api/ai/insights/${contact._id}`);
      if (response.ok) {
        const data = await response.json();
        // Dispatch to store if needed
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  };

  const handleGenerateInsights = async () => {
    try {
      await generateInsights({
        contactId: contact._id,
        interactions: interactions.slice(-10) // Last 10 interactions
      }).unwrap();
      
      // Refetch insights after generation
      await refetchInsights();
    } catch (err) {
      console.error('Failed to generate insights:', err);
    }
  };

  const handleInsightAction = (insight: AIInsight, action: 'save' | 'dismiss' | 'implement') => {
    if (action === 'dismiss') {
      dispatch(removeInsight(insight.id));
    }
    onInsightAction?.(insight, action);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return <LightbulbIcon />;
      case 'prediction':
        return <TrendingUpIcon />;
      case 'analysis':
        return <AssessmentIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'recommendation':
        return 'warning';
      case 'prediction':
        return 'info';
      case 'analysis':
        return 'success';
      default:
        return 'default';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  const renderInsightCard = (insight: AIInsight) => {
    return (
      <Card key={insight.id} sx={{ mb: 2, position: 'relative' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Box sx={{ mr: 2, color: `${getInsightColor(insight.type)}.main` }}>
                {getInsightIcon(insight.type)}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {insight.title}
                </Typography>
                <Chip
                  label={insight.type === 'recommendation' ? '建议' : insight.type === 'prediction' ? '预测' : '分析'}
                  size="small"
                  color={getInsightColor(insight.type) as any}
                  variant="outlined"
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                <Typography variant="caption" color="text.secondary">
                  置信度
                </Typography>
                <Typography 
                  variant="body2" 
                  fontWeight="bold"
                  color={`${getConfidenceColor(insight.confidence)}.main`}
                >
                  {formatConfidence(insight.confidence)}
                </Typography>
              </Box>
              
              <Tooltip title="关闭">
                <IconButton
                  size="small"
                  onClick={() => handleInsightAction(insight, 'dismiss')}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            {insight.description}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {new Date(insight.createdAt).toLocaleString()}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setSelectedInsight(insight);
                  setDetailDialogOpen(true);
                }}
              >
                详情
              </Button>
              
              {insight.type === 'recommendation' && (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={() => handleInsightAction(insight, 'implement')}
                >
                  采纳
                </Button>
              )}
              
              <Button
                size="small"
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={() => {
                  setSelectedInsight(insight);
                  setNoteDialogOpen(true);
                }}
              >
                保存
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderInsightsByType = (type: string) => {
    const typeInsights = insights.filter(insight => insight.type === type);
    if (typeInsights.length === 0) return null;

    const typeLabels = {
      recommendation: '智能建议',
      prediction: '趋势预测',
      analysis: '深度分析'
    };

    return (
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getInsightIcon(type)}
            <Typography variant="h6">
              {typeLabels[type as keyof typeof typeLabels]} ({typeInsights.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {typeInsights.map(renderInsightCard)}
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderDetailDialog = () => {
    if (!selectedInsight) return null;

    return (
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getInsightIcon(selectedInsight.type)}
            {selectedInsight.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  类型
                </Typography>
                <Chip
                  label={selectedInsight.type === 'recommendation' ? '建议' : selectedInsight.type === 'prediction' ? '预测' : '分析'}
                  color={getInsightColor(selectedInsight.type) as any}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="subtitle2" gutterBottom>
                  置信度
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={selectedInsight.confidence * 100}
                    color={getConfidenceColor(selectedInsight.confidence)}
                    sx={{ flex: 1, mr: 1 }}
                  />
                  <Typography variant="body2">
                    {formatConfidence(selectedInsight.confidence)}
                  </Typography>
                </Box>
                
                <Typography variant="subtitle2" gutterBottom>
                  生成时间
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(selectedInsight.createdAt).toLocaleString()}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  详细描述
                </Typography>
                <Typography variant="body2" paragraph>
                  {selectedInsight.description}
                </Typography>
                
                {selectedInsight.data && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      相关数据
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <pre style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(selectedInsight.data, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            关闭
          </Button>
          {selectedInsight.type === 'recommendation' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                handleInsightAction(selectedInsight, 'implement');
                setDetailDialogOpen(false);
              }}
            >
              采纳建议
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  const renderNoteDialog = () => {
    return (
      <Dialog
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>保存洞察</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="添加备注 (可选)"
            placeholder="记录您对这个洞察的想法或计划的行动..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>
            取消
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedInsight) {
                handleInsightAction(selectedInsight, 'save');
              }
              setNoteDialogOpen(false);
              setNote('');
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">AI智能洞察</Typography>
        <Button
          variant="contained"
          startIcon={isGenerating ? <CircularProgress size={16} /> : <PsychologyIcon />}
          onClick={handleGenerateInsights}
          disabled={isGenerating}
        >
          {isGenerating ? '分析中...' : '生成洞察'}
        </Button>
      </Box>



      {/* Insights Summary */}
      {insights.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            洞察概览
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {insights.filter(i => i.type === 'recommendation').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  智能建议
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {insights.filter(i => i.type === 'prediction').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  趋势预测
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {insights.filter(i => i.type === 'analysis').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  深度分析
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Insights by Type */}
      {insights.length === 0 && !isGenerating ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <LightbulbIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            暂无AI洞察
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            点击"生成洞察"按钮，让AI分析客户数据并提供智能建议
          </Typography>
          <Button
            variant="contained"
            startIcon={<PsychologyIcon />}
            onClick={handleGenerateInsights}
          >
            开始分析
          </Button>
        </Paper>
      ) : (
        <Box>
          {renderInsightsByType('recommendation')}
          {renderInsightsByType('prediction')}
          {renderInsightsByType('analysis')}
        </Box>
      )}

      {/* Dialogs */}
      {renderDetailDialog()}
      {renderNoteDialog()}
    </Box>
  );
};

export default InsightPanel;