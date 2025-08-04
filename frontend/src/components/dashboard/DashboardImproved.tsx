import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Button,
  Alert,
  CircularProgress,
  useTheme,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CardActions,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Star,
  Folder,
  SmartToy,
  Assignment,
  Schedule,
  Analytics,
  Speed,
  CheckCircle,
  Warning,
  Error,
  Refresh,
  Notifications,
  Psychology,
  Chat,
  AutoAwesome,
  Timeline,
  PieChart,
  BarChart,
  ExpandMore,
  Lightbulb,
  TrendingFlat,
  Insights,
  Assessment,
  Recommend,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  Legend,
} from 'recharts';

// 统计数据接口
interface DashboardStats {
  total_customers: number;
  high_priority_customers: number;
  progress_distribution: {
    low: number; // 0-30%
    medium: number; // 31-70%
    high: number; // 71-100%
  };
  folder_distribution: Array<{
    folder_name: string;
    customer_count: number;
    color: string;
  }>;
  ai_usage: {
    scripts_generated: number;
    insights_created: number;
    total_analyses: number;
    models_used: Record<string, number>;
  };
  task_stats: {
    pending: number;
    completed: number;
    overdue: number;
  };
  recent_activities: Array<{
    id: number;
    type: 'customer_added' | 'progress_updated' | 'ai_analysis' | 'script_generated' | 'reminder_set';
    customer_name: string;
    description: string;
    timestamp: string;
    priority?: 'high' | 'medium' | 'low';
  }>;
  growth_trends: Array<{
    date: string;
    customers: number;
    conversions: number;
    ai_usage: number;
  }>;
  ai_insights: {
    predictions: Array<{
      type: 'conversion' | 'churn' | 'opportunity';
      title: string;
      description: string;
      confidence: number;
      impact: 'high' | 'medium' | 'low';
      action_items: string[];
    }>;
    recommendations: Array<{
      category: 'sales' | 'marketing' | 'customer_service';
      title: string;
      description: string;
      priority: number;
      estimated_impact: string;
    }>;
    market_analysis: {
      trends: string[];
      opportunities: string[];
      risks: string[];
    };
  };
}

// AI洞察面板组件
const AIInsightsPanel: React.FC<{
  insights: DashboardStats['ai_insights'];
}> = ({ insights }) => {
  const [expandedPrediction, setExpandedPrediction] = useState<number | false>(false);
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };
  
  const getPredictionIcon = (type: string) => {
    switch (type) {
      case 'conversion': return <TrendingUp />;
      case 'churn': return <TrendingDown />;
      case 'opportunity': return <Lightbulb />;
      default: return <Assessment />;
    }
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Psychology sx={{ mr: 1, color: '#9c27b0' }} />
        <Typography variant="h6" fontWeight="bold">
          AI智能洞察
        </Typography>
        <Chip 
          label="实时分析" 
          size="small" 
          color="primary" 
          sx={{ ml: 2 }} 
        />
      </Box>
      
      {/* 预测分析 */}
      <Box mb={3}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          <Insights sx={{ mr: 1, verticalAlign: 'middle' }} />
          智能预测
        </Typography>
        {insights.predictions.map((prediction, index) => (
          <Accordion 
            key={index}
            expanded={expandedPrediction === index}
            onChange={() => setExpandedPrediction(expandedPrediction === index ? false : index)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" width="100%">
                <Avatar 
                  sx={{ 
                    bgcolor: getImpactColor(prediction.impact), 
                    width: 32, 
                    height: 32, 
                    mr: 2 
                  }}
                >
                  {getPredictionIcon(prediction.type)}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {prediction.title}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={0.5}>
                    <Chip 
                      label={`${prediction.confidence}% 置信度`} 
                      size="small" 
                      variant="outlined" 
                      sx={{ mr: 1 }} 
                    />
                    <Chip 
                      label={prediction.impact === 'high' ? '高影响' : prediction.impact === 'medium' ? '中影响' : '低影响'} 
                      size="small" 
                      color={prediction.impact === 'high' ? 'error' : prediction.impact === 'medium' ? 'warning' : 'success'}
                    />
                  </Box>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="textSecondary" mb={2}>
                {prediction.description}
              </Typography>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                建议行动：
              </Typography>
              <List dense>
                {prediction.action_items.map((item, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary={item} 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
      
      {/* 智能推荐 */}
      <Box mb={3}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          <Recommend sx={{ mr: 1, verticalAlign: 'middle' }} />
          智能推荐
        </Typography>
        <Grid container spacing={2}>
          {insights.recommendations.map((rec, index) => (
            <Grid item xs={12} key={index}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Chip 
                     label={rec.category === 'sales' ? '销售' : rec.category === 'marketing' ? '营销' : rec.category === 'customer_service' ? '客服' : '其他'} 
                     size="small" 
                     color="primary" 
                     sx={{ mr: 1 }}
                   />
                  <Typography variant="subtitle2" fontWeight="bold">
                    {rec.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" mb={1}>
                  {rec.description}
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Chip 
                    label={`预期影响: ${rec.estimated_impact}`} 
                    size="small" 
                    variant="outlined"
                  />
                  <Typography variant="caption" color="textSecondary">
                    优先级: {rec.priority}/10
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {/* 市场分析 */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
          市场分析
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" fontWeight="bold" color="success.main" gutterBottom>
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                市场趋势
              </Typography>
              <List dense>
                {insights.market_analysis.trends.map((trend, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary={trend} 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" fontWeight="bold" color="primary.main" gutterBottom>
                <Lightbulb sx={{ mr: 1, verticalAlign: 'middle' }} />
                商机洞察
              </Typography>
              <List dense>
                {insights.market_analysis.opportunities.map((opp, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary={opp} 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" fontWeight="bold" color="error.main" gutterBottom>
                <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                风险提醒
              </Typography>
              <List dense>
                {insights.market_analysis.risks.map((risk, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary={risk} 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

// 统计卡片组件
const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}> = ({ title, value, icon, color, trend, subtitle }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend.isPositive ? (
                  <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: trend.isPositive ? 'success.main' : 'error.main',
                    fontWeight: 'bold',
                  }}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: color,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

// 进度分布图表
const ProgressDistributionChart: React.FC<{
  data: { low: number; medium: number; high: number };
}> = ({ data }) => {
  const chartData = [
    { name: '初期阶段', value: data.low, color: '#f44336' },
    { name: '进行中', value: data.medium, color: '#ff9800' },
    { name: '即将成交', value: data.high, color: '#4caf50' },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          客户进度分布
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <RechartsTooltip />
            <RechartsPieChart data={chartData} cx="50%" cy="50%" outerRadius={80}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </RechartsPieChart>
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
        <Box mt={2}>
          {chartData.map((item, index) => (
            <Box key={index} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: item.color,
                    borderRadius: '50%',
                    mr: 1,
                  }}
                />
                <Typography variant="body2">{item.name}</Typography>
              </Box>
              <Typography variant="body2" fontWeight="bold">
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// AI使用统计
const AIUsageChart: React.FC<{
  data: {
    scripts_generated: number;
    insights_created: number;
    total_analyses: number;
    models_used: Record<string, number>;
  };
}> = ({ data }) => {
  const modelData = Object.entries(data.models_used).map(([model, count]) => ({
    name: model.replace('-', ' ').toUpperCase(),
    count,
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
          <SmartToy sx={{ mr: 1, color: 'primary.main' }} />
          AI使用统计
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {data.scripts_generated}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                话术生成
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h4" color="secondary.main" fontWeight="bold">
                {data.insights_created}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                洞察分析
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {data.total_analyses}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                总分析次数
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="subtitle2" gutterBottom>
          模型使用分布
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <RechartsBarChart data={modelData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis />
            <RechartsTooltip />
            <Bar dataKey="count" fill="#2196f3" />
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// 增长趋势图表
const GrowthTrendChart: React.FC<{
  data: Array<{
    date: string;
    customers: number;
    conversions: number;
    ai_usage: number;
  }>;
}> = ({ data }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
          <Timeline sx={{ mr: 1, color: 'primary.main' }} />
          增长趋势
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="customers"
              stroke="#2196f3"
              strokeWidth={2}
              name="新增客户"
            />
            <Line
              type="monotone"
              dataKey="conversions"
              stroke="#4caf50"
              strokeWidth={2}
              name="转化数量"
            />
            <Line
              type="monotone"
              dataKey="ai_usage"
              stroke="#ff9800"
              strokeWidth={2}
              name="AI使用"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// 最近活动列表
const RecentActivities: React.FC<{
  activities: Array<{
    id: number;
    type: string;
    customer_name: string;
    description: string;
    timestamp: string;
    priority?: string;
  }>;
}> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'customer_added': return <People />;
      case 'progress_updated': return <TrendingUp />;
      case 'ai_analysis': return <Psychology />;
      case 'script_generated': return <Chat />;
      case 'reminder_set': return <Schedule />;
      default: return <Assignment />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'customer_added': return 'primary.main';
      case 'progress_updated': return 'success.main';
      case 'ai_analysis': return 'secondary.main';
      case 'script_generated': return 'info.main';
      case 'reminder_set': return 'warning.main';
      default: return 'grey.500';
    }
  };

  const getPriorityChip = (priority?: string) => {
    if (!priority) return null;
    
    const colors = {
      high: 'error',
      medium: 'warning',
      low: 'success',
    } as const;
    
    return (
      <Chip
        size="small"
        label={priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}
        color={colors[priority as keyof typeof colors]}
        variant="outlined"
      />
    );
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" display="flex" alignItems="center">
            <Notifications sx={{ mr: 1, color: 'primary.main' }} />
            最近活动
          </Typography>
          <Button size="small" startIcon={<Refresh />}>
            刷新
          </Button>
        </Box>
        
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {activities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getActivityColor(activity.type) }}>
                    {getActivityIcon(activity.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle2">
                        {activity.customer_name}
                      </Typography>
                      {getPriorityChip(activity.priority)}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="textPrimary">
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(activity.timestamp).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < activities.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
        
        {activities.length === 0 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            sx={{ py: 4, color: 'text.secondary' }}
          >
            <Assignment sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body2">暂无最近活动</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// 任务统计卡片
const TaskStatsCard: React.FC<{
  stats: {
    pending: number;
    completed: number;
    overdue: number;
  };
}> = ({ stats }) => {
  const total = stats.pending + stats.completed + stats.overdue;
  const completionRate = total > 0 ? (stats.completed / total) * 100 : 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
          <Assignment sx={{ mr: 1, color: 'primary.main' }} />
          任务统计
        </Typography>
        
        <Box mb={3}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="textSecondary">
              完成率
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {completionRate.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionRate}
            sx={{ height: 8, borderRadius: 4 }}
            color={completionRate >= 80 ? 'success' : completionRate >= 60 ? 'warning' : 'error'}
          />
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h5" color="warning.main" fontWeight="bold">
                {stats.pending}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                待处理
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h5" color="success.main" fontWeight="bold">
                {stats.completed}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                已完成
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h5" color="error.main" fontWeight="bold">
                {stats.overdue}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                已逾期
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// 主仪表板组件
const DashboardImproved: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 获取统计数据
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 这里应该调用API
      // const response = await api.get('/api/dashboard/stats');
      // setStats(response.data);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟数据
      const mockStats = {
        total_customers: 156,
        high_priority_customers: 23,
        progress_distribution: {
          low: 45,
          medium: 78,
          high: 33,
        },
        folder_distribution: [
          { folder_name: '互联网科技', customer_count: 45, color: '#2196f3' },
          { folder_name: '金融保险', customer_count: 32, color: '#4caf50' },
          { folder_name: 'C级高管', customer_count: 28, color: '#e91e63' },
          { folder_name: '重点客户', customer_count: 23, color: '#f44336' },
          { folder_name: '其他', customer_count: 28, color: '#9e9e9e' },
        ],
        ai_usage: {
          scripts_generated: 89,
          insights_created: 67,
          total_analyses: 234,
          models_used: {
            'grok-4': 89,
            'deepseek-reasoner': 67,
            'moonshot-kimi-k2': 45,
            'openai-gpt4': 33,
          },
        },
        task_stats: {
          pending: 12,
          completed: 45,
          overdue: 3,
        },
        recent_activities: [
          {
            id: 1,
            type: 'customer_added' as const,
            customer_name: '张三',
            description: '新增高价值客户',
            timestamp: new Date().toISOString(),
            priority: 'high' as const,
          },
          {
            id: 2,
            type: 'progress_updated' as const,
            customer_name: '李四',
            description: '客户进度更新至意向阶段',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          },
          {
            id: 3,
            type: 'script_generated' as const,
            customer_name: '王五',
            description: '生成SPIN销售话术',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
          {
            id: 4,
            type: 'customer_added' as const,
            customer_name: '赵六',
            description: '通过OCR名片识别添加新客户',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            priority: 'low' as const,
          },
          {
            id: 5,
            type: 'reminder_set' as const,
            customer_name: '钱七',
            description: '设置明天下午3点提醒',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          },
        ],
        growth_trends: [
          { date: '1/1', customers: 120, conversions: 8, ai_usage: 45 },
          { date: '1/8', customers: 128, conversions: 12, ai_usage: 52 },
          { date: '1/15', customers: 135, conversions: 15, ai_usage: 61 },
          { date: '1/22', customers: 142, conversions: 18, ai_usage: 73 },
          { date: '1/29', customers: 156, conversions: 22, ai_usage: 89 },
        ],
        ai_insights: {
          predictions: [
            {
              type: 'conversion' as const,
              title: '客户转化率预测上升',
              description: '基于最近30天的客户行为分析，预计下月转化率将提升15%。主要驱动因素包括客户参与度提升和产品兴趣增加。',
              confidence: 87,
              impact: 'high' as const,
              action_items: [
                '加强对高意向客户的跟进频率',
                '优化产品演示流程',
                '制定个性化报价策略'
              ]
            },
            {
              type: 'churn' as const,
              title: '客户流失风险预警',
              description: '检测到12位客户存在流失风险，主要原因是互动频率下降和满意度评分降低。',
              confidence: 92,
              impact: 'medium' as const,
              action_items: [
                '立即联系风险客户了解需求变化',
                '提供专属客户成功经理服务',
                '推出客户挽留优惠方案'
              ]
            },
            {
              type: 'opportunity' as const,
              title: '新商机识别',
              description: '在现有客户群中发现23个交叉销售机会，预计可带来额外30%的收入增长。',
              confidence: 78,
              impact: 'high' as const,
              action_items: [
                '分析客户购买历史和偏好',
                '制定交叉销售推广计划',
                '培训销售团队产品组合销售技巧'
              ]
            }
          ],
          recommendations: [
            {
              category: 'sales' as const,
              title: '优化销售流程',
              description: '建议在客户初次接触后48小时内进行跟进，可提升转化率25%',
              priority: 9,
              estimated_impact: '+25% 转化率'
            },
            {
              category: 'marketing' as const,
              title: '精准营销投放',
              description: '基于客户画像分析，建议调整广告投放策略，重点关注25-35岁专业人群',
              priority: 7,
              estimated_impact: '+18% ROI'
            },
            {
               category: 'customer_service' as const,
               title: '客户服务优化',
               description: '增加主动客户关怀频次，建议每月至少2次主动联系',
               priority: 6,
               estimated_impact: '+12% 满意度'
             }
          ],
          market_analysis: {
            trends: [
              '数字化转型需求持续增长',
              'SaaS解决方案市场扩张',
              '客户对个性化服务要求提升',
              '移动端业务处理需求增加'
            ],
            opportunities: [
              '中小企业数字化升级商机',
              '行业垂直解决方案需求',
              'AI驱动的智能服务市场',
              '订阅制商业模式普及'
            ],
            risks: [
              '市场竞争加剧',
              '客户获取成本上升',
              '技术更新换代加速',
              '监管政策变化影响'
            ]
          }
        },
      };
      
      setStats(mockStats);
      setLastUpdated(new Date());
    } catch (err) {
      setError('获取统计数据失败，请重试');
      console.error('获取统计数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // 设置自动刷新
    const interval = setInterval(fetchStats, 5 * 60 * 1000); // 每5分钟刷新
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ height: '50vh' }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={fetchStats}>
            重试
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题 */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          CRM 仪表板
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="caption" color="textSecondary">
            最后更新: {lastUpdated.toLocaleTimeString()}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={fetchStats}
            disabled={loading}
          >
            刷新
          </Button>
        </Box>
      </Box>

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="总客户数"
            value={stats.total_customers}
            icon={<People />}
            color="#2196f3"
            trend={{ value: 12.5, isPositive: true }}
            subtitle="本月新增 18 位"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="高优先级客户"
            value={stats.high_priority_customers}
            icon={<Star />}
            color="#f44336"
            trend={{ value: 8.3, isPositive: true }}
            subtitle="需重点关注"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="AI分析次数"
            value={stats.ai_usage.total_analyses}
            icon={<SmartToy />}
            color="#9c27b0"
            trend={{ value: 25.7, isPositive: true }}
            subtitle="本周使用活跃"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="转化率"
            value="14.1%"
            icon={<TrendingUp />}
            color="#4caf50"
            trend={{ value: 3.2, isPositive: true }}
            subtitle="较上月提升"
          />
        </Grid>
      </Grid>

      {/* 图表区域 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <ProgressDistributionChart data={stats.progress_distribution} />
        </Grid>
        <Grid item xs={12} md={6}>
          <AIUsageChart data={stats.ai_usage} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <GrowthTrendChart data={stats.growth_trends} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TaskStatsCard stats={stats.task_stats} />
        </Grid>
      </Grid>

      {/* AI智能洞察 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          {stats.ai_insights && <AIInsightsPanel insights={stats.ai_insights} />}
        </Grid>
      </Grid>

      {/* 最近活动 */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <RecentActivities activities={stats.recent_activities} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardImproved;