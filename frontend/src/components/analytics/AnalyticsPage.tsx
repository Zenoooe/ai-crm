import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Warning,
  Assessment,
  ExpandMore,
  AutoAwesome,
  Insights,
  Recommend,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const AnalyticsPage: React.FC = () => {
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [expandedInsight, setExpandedInsight] = useState<number | false>(false);

  // AI分析函数
  const generateAIAnalysis = async () => {
    setAiAnalysisLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockInsights = {
        summary: {
          trend: 'positive',
          growth_rate: 15.3,
          key_metrics: {
            conversion_rate: 14.2,
            customer_lifetime_value: 8500,
            churn_rate: 3.8
          }
        },
        insights: [
          {
            type: 'trend',
            title: '客户增长趋势分析',
            description: '过去6个月客户增长呈现稳定上升趋势，5月份增长最为显著，达到96个成交客户。',
            recommendations: [
              '继续加强5月份采用的营销策略',
              '分析5月份成功案例，复制到其他月份',
              '优化客户转化流程，提升整体转化率'
            ],
            confidence: 92
          },
          {
            type: 'opportunity',
            title: '客户来源优化建议',
            description: '线上推广和客户推荐是主要客户来源，但展会活动转化率较低，建议重新评估投入产出比。',
            recommendations: [
              '增加线上推广预算，扩大覆盖面',
              '建立客户推荐激励机制',
              '优化展会活动策略或考虑减少投入'
            ],
            confidence: 87
          },
          {
            type: 'risk',
            title: '销售额波动风险',
            description: '销售额存在较大波动，3月份出现明显下降，需要关注市场变化和竞争态势。',
            recommendations: [
              '建立销售预警机制',
              '加强市场竞争分析',
              '制定应对市场波动的策略'
            ],
            confidence: 78
          }
        ],
        predictions: {
          next_month: {
            new_customers: 72,
            conversion_rate: 16.8,
            revenue: 2650000
          },
          confidence: 85
        }
      };
      
      setAiInsights(mockInsights);
    } catch (error) {
      console.error('AI分析失败:', error);
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  // 模拟数据
  const monthlyData = [
    { name: '1月', 新增客户: 65, 成交客户: 28 },
    { name: '2月', 新增客户: 59, 成交客户: 48 },
    { name: '3月', 新增客户: 80, 成交客户: 40 },
    { name: '4月', 新增客户: 81, 成交客户: 19 },
    { name: '5月', 新增客户: 56, 成交客户: 96 },
    { name: '6月', 新增客户: 55, 成交客户: 27 },
  ];

  const customerSourceData = [
    { name: '线上推广', value: 400, color: '#0088FE' },
    { name: '客户推荐', value: 300, color: '#00C49F' },
    { name: '电话营销', value: 300, color: '#FFBB28' },
    { name: '展会活动', value: 200, color: '#FF8042' },
  ];

  const salesTrendData = [
    { name: '1月', 销售额: 4000 },
    { name: '2月', 销售额: 3000 },
    { name: '3月', 销售额: 2000 },
    { name: '4月', 销售额: 2780 },
    { name: '5月', 销售额: 1890 },
    { name: '6月', 销售额: 2390 },
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        数据分析
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        客户数据和业务表现分析
      </Typography>

      {/* AI智能分析面板 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <Psychology sx={{ mr: 1, color: '#9c27b0' }} />
            <Typography variant="h6" fontWeight="bold">
              AI智能分析
            </Typography>
            <Chip 
              label="Beta" 
              size="small" 
              color="secondary" 
              sx={{ ml: 2 }} 
            />
          </Box>
          <Button
            variant="contained"
            startIcon={aiAnalysisLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
            onClick={generateAIAnalysis}
            disabled={aiAnalysisLoading}
            sx={{ bgcolor: '#9c27b0', '&:hover': { bgcolor: '#7b1fa2' } }}
          >
            {aiAnalysisLoading ? '分析中...' : '生成AI分析'}
          </Button>
        </Box>
        
        {aiInsights && (
          <Grid container spacing={3}>
            {/* 分析摘要 */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    分析摘要
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      整体趋势
                    </Typography>
                    <Chip 
                      label={aiInsights.summary.trend === 'positive' ? '积极向上' : '需要关注'}
                      color={aiInsights.summary.trend === 'positive' ? 'success' : 'warning'}
                      size="small"
                      icon={aiInsights.summary.trend === 'positive' ? <TrendingUp /> : <TrendingDown />}
                    />
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">
                      增长率: <strong>{aiInsights.summary.growth_rate}%</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      转化率: <strong>{aiInsights.summary.key_metrics.conversion_rate}%</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      客户生命周期价值: <strong>¥{aiInsights.summary.key_metrics.customer_lifetime_value.toLocaleString()}</strong>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* 预测分析 */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    <Insights sx={{ mr: 1, verticalAlign: 'middle' }} />
                    下月预测
                  </Typography>
                  <Box mb={1}>
                    <Typography variant="body2" color="textSecondary">
                      预计新增客户: <strong>{aiInsights.predictions.next_month.new_customers}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      预计转化率: <strong>{aiInsights.predictions.next_month.conversion_rate}%</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      预计收入: <strong>¥{(aiInsights.predictions.next_month.revenue / 10000).toFixed(1)}万</strong>
                    </Typography>
                  </Box>
                  <Chip 
                    label={`${aiInsights.predictions.confidence}% 置信度`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </CardContent>
              </Card>
            </Grid>
            
            {/* 快速洞察 */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    <Lightbulb sx={{ mr: 1, verticalAlign: 'middle' }} />
                    关键洞察
                  </Typography>
                  <List dense>
                    {aiInsights.insights.slice(0, 3).map((insight: any, index: number) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {insight.type === 'trend' ? <TrendingUp color="success" /> : 
                           insight.type === 'opportunity' ? <Lightbulb color="primary" /> : 
                           <Warning color="warning" />}
                        </ListItemIcon>
                        <ListItemText 
                          primary={insight.title}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                          secondary={`${insight.confidence}% 置信度`}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            {/* 详细洞察 */}
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                <Recommend sx={{ mr: 1, verticalAlign: 'middle' }} />
                详细分析与建议
              </Typography>
              {aiInsights.insights.map((insight: any, index: number) => (
                <Accordion 
                  key={index}
                  expanded={expandedInsight === index}
                  onChange={() => setExpandedInsight(expandedInsight === index ? false : index)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" width="100%">
                      {insight.type === 'trend' ? <TrendingUp color="success" sx={{ mr: 2 }} /> : 
                       insight.type === 'opportunity' ? <Lightbulb color="primary" sx={{ mr: 2 }} /> : 
                       <Warning color="warning" sx={{ mr: 2 }} />}
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {insight.title}
                        </Typography>
                        <Chip 
                          label={`${insight.confidence}% 置信度`}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="textSecondary" mb={2}>
                      {insight.description}
                    </Typography>
                    <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                      建议行动：
                    </Typography>
                    <List dense>
                      {insight.recommendations.map((rec: string, idx: number) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemText 
                            primary={rec}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Grid>
          </Grid>
        )}
        
        {!aiInsights && !aiAnalysisLoading && (
          <Alert severity="info" sx={{ mt: 2 }}>
            点击"生成AI分析"按钮，获取基于当前数据的智能分析和建议。
          </Alert>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* 客户增长趋势 */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              客户增长趋势
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="新增客户" fill="#8884d8" />
                <Bar dataKey="成交客户" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* 客户来源分布 */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              客户来源分布
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerSourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {customerSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* 销售趋势 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              销售趋势
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="销售额"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* 关键指标 */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    客户转化率
                  </Typography>
                  <Typography variant="h4" component="div">
                    23.5%
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +2.1% 较上月
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    平均客单价
                  </Typography>
                  <Typography variant="h4" component="div">
                    ¥12,580
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +5.2% 较上月
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    客户满意度
                  </Typography>
                  <Typography variant="h4" component="div">
                    4.8/5.0
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +0.1 较上月
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    活跃客户数
                  </Typography>
                  <Typography variant="h4" component="div">
                    856
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    -1.2% 较上月
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;