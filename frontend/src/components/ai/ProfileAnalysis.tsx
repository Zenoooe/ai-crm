import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Button,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useAnalyzeProfileMutation, useGetAnalysisQuery } from '../../store/api/api';
import { Contact } from '../../types/contact';
import { Interaction } from '../../types/interaction';
import { AIAnalysis } from '../../types/ai';

interface ProfileAnalysisProps {
  contact: Contact;
  interactions: Interaction[];
  onAnalysisUpdate?: (analysis: AIAnalysis) => void;
  onRefresh?: () => void;
}

const ProfileAnalysis: React.FC<ProfileAnalysisProps> = ({
  contact,
  interactions,
  onAnalysisUpdate,
  onRefresh
}) => {
  const dispatch = useAppDispatch();
  const { analyzingProfile } = useAppSelector(state => state.ai);
  const [analyzeProfile, { isLoading: isAnalyzing }] = useAnalyzeProfileMutation();
  const { data: analysis, refetch: refetchAnalysis } = useGetAnalysisQuery(contact._id, {
    skip: !contact._id
  });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load existing analysis for this contact
    loadAnalysis();
  }, [contact._id]);

  const loadAnalysis = async () => {
    try {
      await refetchAnalysis();
      if (analysis) {
        setLastUpdated(analysis.createdAt);
      }
    } catch (error) {
      console.error('Failed to load analysis:', error);
    }
  };

  const generateAnalysis = async () => {
    try {
      await analyzeProfile({
        contactId: contact._id,
        interactions: interactions.slice(-20) // Last 20 interactions
      }).unwrap();
      
      // Refetch the analysis after successful generation
      await refetchAnalysis();
      setLastUpdated(new Date().toISOString());
      if (analysis) {
        onAnalysisUpdate?.(analysis);
      }
    } catch (error) {
      console.error('Failed to generate analysis:', error);
    }
  };

  const getPersonalityColor = (type: string) => {
    const colors: Record<string, string> = {
      'D': '#f44336', // Dominant - Red
      'I': '#ff9800', // Influential - Orange
      'S': '#4caf50', // Steady - Green
      'C': '#2196f3', // Conscientious - Blue
    };
    return colors[type] || '#9e9e9e';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const renderPersonalitySection = () => {
    if (!analysis?.output.personality) return null;

    const { type, traits, communicationStyle } = analysis.output.personality;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PsychologyIcon sx={{ mr: 1, color: getPersonalityColor(type) }} />
            <Typography variant="h6">性格分析</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: getPersonalityColor(type),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 1
                  }}
                >
                  <Typography variant="h4" color="white">
                    {type}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" color="text.secondary">
                  DISC类型
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle2" gutterBottom>
                沟通风格: {communicationStyle}
              </Typography>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  性格特征:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {traits.map((trait, index) => (
                    <Chip
                      key={index}
                      label={trait}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderBusinessSection = () => {
    if (!analysis?.output.businessProfile) return null;

    const {
      decisionAuthority,
      influenceLevel,
      budgetAuthority,
      painPoints,
      priorities
    } = analysis.output.businessProfile;

    const getAuthorityScore = (level: string) => {
      const scores = { high: 90, medium: 60, low: 30 };
      return scores[level as keyof typeof scores] || 0;
    };

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">商业画像</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                决策权威
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={getAuthorityScore(decisionAuthority)}
                  color={getScoreColor(getAuthorityScore(decisionAuthority))}
                  sx={{ flex: 1, mr: 1 }}
                />
                <Typography variant="body2">
                  {decisionAuthority}
                </Typography>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                影响力
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={getAuthorityScore(influenceLevel)}
                  color={getScoreColor(getAuthorityScore(influenceLevel))}
                  sx={{ flex: 1, mr: 1 }}
                />
                <Typography variant="body2">
                  {influenceLevel}
                </Typography>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                预算权限
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LinearProgress
                  variant="determinate"
                  value={getAuthorityScore(budgetAuthority)}
                  color={getScoreColor(getAuthorityScore(budgetAuthority))}
                  sx={{ flex: 1, mr: 1 }}
                />
                <Typography variant="body2">
                  {budgetAuthority}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                痛点分析
              </Typography>
              <List dense>
                {painPoints.map((point, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <WarningIcon color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={point}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                优先级
              </Typography>
              <List dense>
                {priorities.map((priority, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <StarIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={priority}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderRelationshipSection = () => {
    if (!analysis?.output.relationshipInsights) return null;

    const {
      rapportLevel,
      trustIndicators,
      engagementLevel,
      preferredTopics
    } = analysis.output.relationshipInsights;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PersonIcon sx={{ mr: 1, color: 'secondary.main' }} />
            <Typography variant="h6">关系洞察</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                亲和度评分
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={rapportLevel * 10}
                  color={getScoreColor(rapportLevel * 10)}
                  sx={{ flex: 1, mr: 1 }}
                />
                <Typography variant="body2">
                  {rapportLevel}/10
                </Typography>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                参与度: {engagementLevel}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                信任指标
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {trustIndicators.map((indicator, index) => (
                  <Chip
                    key={index}
                    label={indicator}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                ))}
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                偏好话题
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {preferredTopics.map((topic, index) => (
                  <Chip
                    key={index}
                    label={topic}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderSalesStrategySection = () => {
    if (!analysis?.output.salesStrategy) return null;

    const {
      currentStage,
      nextBestActions,
      timingRecommendations,
      approachStrategy
    } = analysis.output.salesStrategy;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
            <Typography variant="h6">销售策略</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                当前阶段
              </Typography>
              <Chip
                label={currentStage}
                color="primary"
                sx={{ mb: 2 }}
              />
              
              <Typography variant="subtitle2" gutterBottom>
                推荐策略
              </Typography>
              <Typography variant="body2" paragraph>
                {approachStrategy}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                时机建议
              </Typography>
              <Typography variant="body2">
                {timingRecommendations}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                下一步行动
              </Typography>
              <List dense>
                {nextBestActions.map((action, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <LightbulbIcon color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={action}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderOpportunitySection = () => {
    if (!analysis?.output.opportunityAssessment) return null;

    const {
      score,
      likelihood,
      timeline,
      potentialValue
    } = analysis.output.opportunityAssessment;

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AssessmentIcon sx={{ mr: 1, color: 'info.main' }} />
            <Typography variant="h6">机会评估</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color={getScoreColor(score)}>
                  {score}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  机会评分
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Chip
                  label={likelihood}
                  color={likelihood === 'high' ? 'success' : likelihood === 'medium' ? 'warning' : 'error'}
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  成交可能性
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" fontWeight="bold">
                  {timeline}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  预计时间线
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" fontWeight="bold">
                  {potentialValue}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  潜在价值
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">AI客户画像分析</Typography>
        <Box>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
              更新时间: {new Date(lastUpdated).toLocaleString()}
            </Typography>
          )}
          <Button
            variant="outlined"
            startIcon={analyzingProfile ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={generateAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? '分析中...' : '重新分析'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!analysis && !isAnalyzing && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PsychologyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            暂无AI分析数据
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            点击"重新分析"按钮生成AI客户画像分析
          </Typography>
          <Button
            variant="contained"
            startIcon={<PsychologyIcon />}
            onClick={generateAnalysis}
          >
            开始分析
          </Button>
        </Paper>
      )}

      {analysis && (
        <Box>
          {renderPersonalitySection()}
          {renderBusinessSection()}
          {renderRelationshipSection()}
          {renderSalesStrategySection()}
          {renderOpportunitySection()}
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              置信度: {Math.round(analysis.confidence * 100)}% | 
              模型: {analysis.model} | 
              处理时间: {analysis.processingTime}ms
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ProfileAnalysis;