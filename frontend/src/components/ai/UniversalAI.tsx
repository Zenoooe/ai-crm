import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Article as ArticleIcon,
  Image as ImageIcon,
  Analytics as AnalyticsIcon,
  CompareArrows as CompareArrowsIcon,
  HealthAndSafety as HealthIcon
} from '@mui/icons-material';
import { apiService } from '../../services/api.ts';

interface AIService {
  name: string;
  category: string;
  description: string;
  isActive: boolean;
}

interface ServiceStats {
  totalServices: number;
  activeServices: number;
  categoryCounts: Record<string, number>;
}

interface HealthStatus {
  overall: boolean;
  services: Record<string, boolean>;
  timestamp: string;
}

const UniversalAI: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // AI聊天状态
  const [chatPrompt, setChatPrompt] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [chatResponse, setChatResponse] = useState<any>(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  
  // 金融数据状态
  const [financeService, setFinanceService] = useState('finnhub');
  const [stockSymbol, setStockSymbol] = useState('AAPL');
  const [financeData, setFinanceData] = useState<any>(null);
  
  // 新闻数据状态
  const [newsQuery, setNewsQuery] = useState('');
  const [newsCategory, setNewsCategory] = useState('');
  const [newsData, setNewsData] = useState<any>(null);
  
  // 图像生成状态
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<any>(null);
  
  // 智能分析状态
  const [analysisContent, setAnalysisContent] = useState('');
  const [analysisType, setAnalysisType] = useState('general');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // 批量分析状态
  const [batchPrompt, setBatchPrompt] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>(['deepseek', 'kimi', 'xai']);
  const [batchResults, setBatchResults] = useState<any>(null);
  
  // 服务管理状态
  const [services, setServices] = useState<AIService[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStats | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);

  useEffect(() => {
    loadServices();
    loadServiceStats();
    loadHealthStatus();
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleError = (err: any) => {
    console.error('API Error:', err);
    setError(err.response?.data?.message || err.message || '操作失败');
    setSuccess(null);
  };

  const handleSuccess = (message: string) => {
    setSuccess(message);
    setError(null);
  };

  // 加载服务列表
  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/ai/services');
      if (response.data && response.data.success) {
        setServices(response.data.data || []);
        handleSuccess('服务列表加载成功');
      } else {
        setServices([]);
        setError('服务列表为空');
      }
    } catch (err: any) {
      console.error('加载服务列表失败:', err);
      setServices([]);
      if (err.response?.status === 401) {
        setError('请先登录后再使用AI服务');
      } else {
        handleError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // 加载服务统计
  const loadServiceStats = async () => {
    try {
      const response = await apiService.get('/ai/services/statistics');
      if (response.data && response.data.success) {
        setServiceStats(response.data.data);
      } else {
        setServiceStats({ totalServices: 0, activeServices: 0, categoryCounts: {} });
      }
    } catch (err: any) {
      console.error('加载服务统计失败:', err);
      setServiceStats({ totalServices: 0, activeServices: 0, categoryCounts: {} });
      if (err.response?.status !== 401) {
        handleError(err);
      }
    }
  };

  // 加载健康状态
  const loadHealthStatus = async () => {
    try {
      const response = await apiService.get('/ai/health-check');
      if (response.data && response.data.success) {
        setHealthStatus(response.data.data);
      } else {
        setHealthStatus({ overall: false, services: {}, timestamp: new Date().toISOString() });
      }
    } catch (err: any) {
      console.error('加载健康状态失败:', err);
      setHealthStatus({ overall: false, services: {}, timestamp: new Date().toISOString() });
      if (err.response?.status !== 401) {
        handleError(err);
      }
    }
  };

  // 万能AI聊天
  const handleUniversalChat = async () => {
    if (!chatPrompt.trim()) {
      setError('请输入聊天内容');
      return;
    }

    setLoading(true);
    clearMessages();
    
    try {
      const requestData = {
        prompt: chatPrompt.trim(),
        ...(selectedService && { serviceName: selectedService }),
        ...(systemPrompt && { systemPrompt: systemPrompt.trim() }),
        temperature: Number(temperature),
        maxTokens: Number(maxTokens)
      };
      
      console.log('发送AI聊天请求:', requestData);
      const response = await apiService.post('/ai/universal-chat', requestData);
      
      if (response.data && response.data.success) {
        setChatResponse(response.data.data);
        handleSuccess('AI聊天完成');
      } else {
        setError(response.data?.message || 'AI聊天失败');
      }
    } catch (err: any) {
      console.error('AI聊天失败:', err);
      if (err.response?.status === 401) {
        setError('请先登录后再使用AI聊天功能');
      } else if (err.response?.status === 400) {
        setError(err.response.data?.message || '请求参数错误');
      } else {
        handleError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // 获取金融数据
  const handleGetFinanceData = async () => {
    if (!stockSymbol.trim()) {
      setError('请输入股票代码');
      return;
    }

    setLoading(true);
    clearMessages();
    
    try {
      const response = await apiService.get(`/ai/finance/${financeService}`, {
        params: { symbol: stockSymbol }
      });
      
      setFinanceData(response.data.data);
      handleSuccess('金融数据获取成功');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // 获取新闻数据
  const handleGetNews = async () => {
    setLoading(true);
    clearMessages();
    
    try {
      const response = await apiService.get('/ai/news', {
        params: {
          query: newsQuery || undefined,
          category: newsCategory || undefined,
          pageSize: 10
        }
      });
      
      setNewsData(response.data.data);
      handleSuccess('新闻数据获取成功');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // 生成图像
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      setError('请输入图像描述');
      return;
    }

    setLoading(true);
    clearMessages();
    
    try {
      const response = await apiService.post('/ai/generate-image', {
        prompt: imagePrompt
      });
      
      setGeneratedImage(response.data.data);
      handleSuccess('图像生成成功');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // 智能分析
  const handleIntelligentAnalysis = async () => {
    if (!analysisContent.trim()) {
      setError('请输入分析内容');
      return;
    }

    setLoading(true);
    clearMessages();
    
    try {
      const response = await apiService.post('/ai/intelligent-analysis', {
        content: analysisContent,
        analysisType
      });
      
      setAnalysisResult(response.data.data);
      handleSuccess('智能分析完成');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // 批量分析
  const handleBatchAnalysis = async () => {
    if (!batchPrompt.trim()) {
      setError('请输入分析内容');
      return;
    }

    setLoading(true);
    clearMessages();
    
    try {
      const response = await apiService.post('/ai/batch-analysis', {
        prompt: batchPrompt,
        services: selectedServices
      });
      
      setBatchResults(response.data.data);
      handleSuccess('批量分析完成');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const renderChatTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                万能AI聊天
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>选择AI服务（可选）</InputLabel>
                <Select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  <MenuItem value="">智能路由（自动选择）</MenuItem>
                  {services.filter(s => s.category === 'AI').map((service) => (
                    <MenuItem key={service.name} value={service.name.toLowerCase()}>
                      {service.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="聊天内容"
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                margin="normal"
                placeholder="请输入您想要与AI讨论的内容..."
              />

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>高级设置</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="系统提示（可选）"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    margin="normal"
                    placeholder="设置AI的角色和行为..."
                  />
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="温度参数"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        inputProps={{ min: 0, max: 2, step: 0.1 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="最大Token数"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                        inputProps={{ min: 100, max: 4000 }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Button
                fullWidth
                variant="contained"
                onClick={handleUniversalChat}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                sx={{ mt: 2 }}
              >
                {loading ? '处理中...' : '发送聊天'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {chatResponse && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  AI回复
                </Typography>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                    {chatResponse.content || chatResponse.response || JSON.stringify(chatResponse, null, 2)}
                  </Typography>
                </Paper>
                {chatResponse.service && (
                  <Chip 
                    label={`服务: ${chatResponse.service}`} 
                    size="small" 
                    sx={{ mt: 1 }} 
                  />
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const renderFinanceTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                金融数据查询
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>金融服务</InputLabel>
                <Select
                  value={financeService}
                  onChange={(e) => setFinanceService(e.target.value)}
                >
                  {services.filter(s => s.category === 'Finance').map((service) => (
                    <MenuItem key={service.name} value={service.name.toLowerCase()}>
                      {service.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="股票代码"
                value={stockSymbol}
                onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                margin="normal"
                placeholder="例如: AAPL, TSLA, MSFT"
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleGetFinanceData}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <TrendingUpIcon />}
                sx={{ mt: 2 }}
              >
                {loading ? '获取中...' : '获取金融数据'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {financeData && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  金融数据结果
                </Typography>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 400, overflow: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                    {JSON.stringify(financeData, null, 2)}
                  </pre>
                </Paper>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const renderNewsTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ArticleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                新闻数据查询
              </Typography>
              
              <TextField
                fullWidth
                label="搜索关键词（可选）"
                value={newsQuery}
                onChange={(e) => setNewsQuery(e.target.value)}
                margin="normal"
                placeholder="例如: 科技, 股市, AI"
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>新闻分类（可选）</InputLabel>
                <Select
                  value={newsCategory}
                  onChange={(e) => setNewsCategory(e.target.value)}
                >
                  <MenuItem value="">全部分类</MenuItem>
                  <MenuItem value="business">商业</MenuItem>
                  <MenuItem value="technology">科技</MenuItem>
                  <MenuItem value="sports">体育</MenuItem>
                  <MenuItem value="entertainment">娱乐</MenuItem>
                  <MenuItem value="health">健康</MenuItem>
                  <MenuItem value="science">科学</MenuItem>
                </Select>
              </FormControl>

              <Button
                fullWidth
                variant="contained"
                onClick={handleGetNews}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <ArticleIcon />}
                sx={{ mt: 2 }}
              >
                {loading ? '获取中...' : '获取新闻数据'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {newsData && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  新闻结果
                </Typography>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 400, overflow: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                    {JSON.stringify(newsData, null, 2)}
                  </pre>
                </Paper>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const renderImageTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ImageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI图像生成
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="图像描述"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                margin="normal"
                placeholder="描述您想要生成的图像..."
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleGenerateImage}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <ImageIcon />}
                sx={{ mt: 2 }}
              >
                {loading ? '生成中...' : '生成图像'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {generatedImage && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  生成的图像
                </Typography>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                    {JSON.stringify(generatedImage, null, 2)}
                  </pre>
                </Paper>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const renderAnalysisTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                智能分析
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>分析类型</InputLabel>
                <Select
                  value={analysisType}
                  onChange={(e) => setAnalysisType(e.target.value)}
                >
                  <MenuItem value="general">通用分析</MenuItem>
                  <MenuItem value="customer">客户分析</MenuItem>
                  <MenuItem value="market">市场分析</MenuItem>
                  <MenuItem value="financial">金融分析</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={6}
                label="分析内容"
                value={analysisContent}
                onChange={(e) => setAnalysisContent(e.target.value)}
                margin="normal"
                placeholder="输入需要分析的内容..."
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleIntelligentAnalysis}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <AnalyticsIcon />}
                sx={{ mt: 2 }}
              >
                {loading ? '分析中...' : '开始智能分析'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {analysisResult && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  分析结果
                </Typography>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 400, overflow: 'auto' }}>
                  {analysisResult.analysis && (
                    <Typography variant="body1" style={{ whiteSpace: 'pre-wrap', marginBottom: 16 }}>
                      {analysisResult.analysis.content || analysisResult.analysis.response || JSON.stringify(analysisResult.analysis, null, 2)}
                    </Typography>
                  )}
                  {analysisResult.marketData && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        相关市场数据:
                      </Typography>
                      <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                        {JSON.stringify(analysisResult.marketData, null, 2)}
                      </pre>
                    </Box>
                  )}
                </Paper>
                <Chip 
                  label={`分析类型: ${analysisResult.analysisType}`} 
                  size="small" 
                  sx={{ mt: 1 }} 
                />
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const renderBatchTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CompareArrowsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                批量AI对比分析
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="分析内容"
                value={batchPrompt}
                onChange={(e) => setBatchPrompt(e.target.value)}
                margin="normal"
                placeholder="输入需要多个AI服务分析的内容..."
              />

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                选择AI服务:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['deepseek', 'kimi', 'xai', 'gemini'].map((service) => (
                  <Chip
                    key={service}
                    label={service}
                    clickable
                    color={selectedServices.includes(service) ? 'primary' : 'default'}
                    onClick={() => {
                      if (selectedServices.includes(service)) {
                        setSelectedServices(selectedServices.filter(s => s !== service));
                      } else {
                        setSelectedServices([...selectedServices, service]);
                      }
                    }}
                  />
                ))}
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={handleBatchAnalysis}
                disabled={loading || selectedServices.length === 0}
                startIcon={loading ? <CircularProgress size={20} /> : <CompareArrowsIcon />}
                sx={{ mt: 2 }}
              >
                {loading ? '分析中...' : '开始批量分析'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {batchResults && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  批量分析结果
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    成功: {batchResults.summary?.successful || 0} / 
                    失败: {batchResults.summary?.failed || 0} / 
                    总计: {batchResults.summary?.total || 0}
                  </Typography>
                </Box>

                {batchResults.successful && batchResults.successful.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      成功的结果:
                    </Typography>
                    {batchResults.successful.map((result: any, index: number) => (
                      <Accordion key={index}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography>{result.serviceName}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Paper elevation={1} sx={{ p: 1, bgcolor: 'grey.50' }}>
                            <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                              {result.result?.content || result.result?.response || JSON.stringify(result.result, null, 2)}
                            </Typography>
                          </Paper>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}

                {batchResults.failed && batchResults.failed.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom color="error">
                      失败的结果:
                    </Typography>
                    {batchResults.failed.map((result: any, index: number) => (
                      <Alert key={index} severity="error" sx={{ mb: 1 }}>
                        <strong>{result.serviceName}:</strong> {result.error}
                      </Alert>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const renderServicesTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <HealthIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                服务健康状态
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1">
                  整体状态: 
                </Typography>
                <Chip 
                  label={healthStatus?.overall ? '健康' : '异常'} 
                  color={healthStatus?.overall ? 'success' : 'error'}
                  size="small"
                  sx={{ ml: 1 }}
                />
                <IconButton 
                  size="small" 
                  onClick={loadHealthStatus}
                  sx={{ ml: 1 }}
                >
                  <RefreshIcon />
                </IconButton>
              </Box>

              {healthStatus?.services && (
                <List dense>
                  {Object.entries(healthStatus.services).map(([service, status]) => (
                    <ListItem key={service}>
                      <ListItemText 
                        primary={service}
                        secondary={
                          <Chip 
                            label={status ? '正常' : '异常'} 
                            color={status ? 'success' : 'error'}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              {healthStatus?.timestamp && (
                <Typography variant="caption" color="textSecondary">
                  更新时间: {new Date(healthStatus.timestamp).toLocaleString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                服务统计
              </Typography>
              
              {serviceStats && (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    总服务数: {serviceStats.totalServices}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    活跃服务: {serviceStats.activeServices}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    分类统计:
                  </Typography>
                  {Object.entries(serviceStats.categoryCounts || {}).map(([category, count]) => (
                    <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{category}:</Typography>
                      <Typography variant="body2">{count}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              <Button
                fullWidth
                variant="outlined"
                onClick={loadServiceStats}
                startIcon={<RefreshIcon />}
                sx={{ mt: 2 }}
              >
                刷新统计
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                可用服务列表
              </Typography>
              
              <List dense>
                {services.map((service) => (
                  <ListItem key={service.name}>
                    <ListItemText 
                      primary={service.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {service.description}
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip 
                              label={service.category} 
                              size="small" 
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              label={service.isActive ? '活跃' : '停用'} 
                              color={service.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Button
                fullWidth
                variant="outlined"
                onClick={loadServices}
                startIcon={<RefreshIcon />}
                sx={{ mt: 2 }}
              >
                刷新服务列表
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        万能AI助手
      </Typography>
      
      <Typography variant="body1" color="textSecondary" gutterBottom>
        集成多种AI服务，提供聊天、数据分析、图像生成等功能
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="AI聊天" />
          <Tab label="金融数据" />
          <Tab label="新闻资讯" />
          <Tab label="图像生成" />
          <Tab label="智能分析" />
          <Tab label="批量对比" />
          <Tab label="服务管理" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderChatTab()}
      {activeTab === 1 && renderFinanceTab()}
      {activeTab === 2 && renderNewsTab()}
      {activeTab === 3 && renderImageTab()}
      {activeTab === 4 && renderAnalysisTab()}
      {activeTab === 5 && renderBatchTab()}
      {activeTab === 6 && renderServicesTab()}
    </Box>
  );
};

export default UniversalAI;