import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Switch,
  FormControlLabel,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  SmartToy,
  Psychology,
  Chat,
  AutoAwesome,
  Send,
  ContentCopy,
  Save,
  Refresh,
  Settings,
  History,
  Star,
  StarBorder,
  Delete,
  Edit,
  ExpandMore,
  Person,
  Business,
  TrendingUp,
  Lightbulb,
  Assignment,
  Speed,
  Analytics,
  School,
  Psychology as PsychologyIcon,
  Favorite,
  ThumbUp,
  ThumbDown,
  Share,
  Download,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux.ts';

// AI模型配置
const AI_MODELS = [
  {
    id: 'grok-4',
    name: 'Grok-4',
    description: '推理能力强，适合复杂分析',
    icon: '🧠',
    color: '#2196f3',
    strengths: ['逻辑推理', '深度分析', '创新思维'],
    bestFor: ['客户画像分析', '复杂销售策略', '市场洞察'],
  },
  {
    id: 'deepseek-reasoner',
    name: 'Deepseek Reasoner',
    description: '逻辑分析专家，数据驱动',
    icon: '🔍',
    color: '#4caf50',
    strengths: ['数据分析', '逻辑推理', '结构化思维'],
    bestFor: ['痛点分析', '需求挖掘', 'ROI计算'],
  },
  {
    id: 'moonshot-kimi-k2',
    name: 'Moonshot Kimi K2',
    description: '大参数模型，知识丰富',
    icon: '🌙',
    color: '#9c27b0',
    strengths: ['知识广度', '多领域理解', '创意生成'],
    bestFor: ['行业分析', '话术创作', '方案建议'],
  },
  {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    description: '通用AI助手，平衡性好',
    icon: '🤖',
    color: '#ff9800',
    strengths: ['通用能力', '语言理解', '对话生成'],
    bestFor: ['日常对话', '通用分析', '文本生成'],
  },
];

// 销售方法论
const SALES_METHODOLOGIES = [
  {
    id: 'spin',
    name: 'SPIN销售法',
    description: '情境-问题-影响-需求-收益',
    steps: ['Situation', 'Problem', 'Implication', 'Need-payoff'],
  },
  {
    id: 'bant',
    name: 'BANT资格认定',
    description: '预算-权限-需求-时间',
    steps: ['Budget', 'Authority', 'Need', 'Timeline'],
  },
  {
    id: 'challenger',
    name: 'Challenger销售',
    description: '教导-定制-控制',
    steps: ['Teach', 'Tailor', 'Take Control'],
  },
  {
    id: 'consultative',
    name: '顾问式销售',
    description: '发现-分析-解决-确认',
    steps: ['Discover', 'Analyze', 'Solve', 'Confirm'],
  },
];

// 分析类型
const ANALYSIS_TYPES = [
  { id: 'personality', name: '性格分析', icon: <PsychologyIcon />, color: '#e91e63' },
  { id: 'communication', name: '沟通风格', icon: <Chat />, color: '#2196f3' },
  { id: 'interests', name: '兴趣分析', icon: <Favorite />, color: '#4caf50' },
  { id: 'pain_points', name: '痛点分析', icon: <TrendingUp />, color: '#f44336' },
  { id: 'recommendations', name: '行动建议', icon: <Lightbulb />, color: '#ff9800' },
  { id: 'profile_complete', name: '完整画像', icon: <Person />, color: '#9c27b0' },
];

// 话术生成场景
const SCRIPT_SCENARIOS = [
  { id: 'cold_call', name: '陌生拜访', description: '首次接触客户' },
  { id: 'follow_up', name: '跟进沟通', description: '后续跟进对话' },
  { id: 'demo', name: '产品演示', description: '产品展示介绍' },
  { id: 'objection', name: '异议处理', description: '处理客户疑虑' },
  { id: 'closing', name: '成交促进', description: '推动签约成交' },
  { id: 'relationship', name: '关系维护', description: '客户关系管理' },
];

// Tab面板组件
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

// AI模型选择卡片
const ModelCard: React.FC<{
  model: typeof AI_MODELS[0];
  selected: boolean;
  onSelect: () => void;
}> = ({ model, selected, onSelect }) => {
  return (
    <Card
      sx={{
        cursor: 'pointer',
        border: selected ? `2px solid ${model.color}` : '1px solid',
        borderColor: selected ? model.color : 'divider',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.2s ease-in-out',
      }}
      onClick={onSelect}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h3" sx={{ mr: 1 }}>
            {model.icon}
          </Typography>
          <Box flexGrow={1}>
            <Typography variant="h6" fontWeight="bold">
              {model.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {model.description}
            </Typography>
          </Box>
          {selected && (
            <Avatar sx={{ bgcolor: model.color, width: 32, height: 32 }}>
              <SmartToy />
            </Avatar>
          )}
        </Box>
        
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            核心优势
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {model.strengths.map((strength, index) => (
              <Chip
                key={index}
                label={strength}
                size="small"
                variant="outlined"
                sx={{ borderColor: model.color, color: model.color }}
              />
            ))}
          </Box>
        </Box>
        
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            适用场景
          </Typography>
          <List dense>
            {model.bestFor.map((scenario, index) => (
              <ListItem key={index} sx={{ py: 0.25, px: 0 }}>
                <ListItemText
                  primary={scenario}
                  primaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

// 话术生成组件
const ScriptGenerator: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState('grok-4');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [scenario, setScenario] = useState('cold_call');
  const [methodology, setMethodology] = useState('spin');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedScripts, setSavedScripts] = useState<any[]>([]);

  // 模拟客户数据
  const customers = [
    { id: 1, name: '张三', company: '阿里巴巴', position: '产品总监' },
    { id: 2, name: '李四', company: '中国银行', position: '风控总监' },
    { id: 3, name: '王五', company: '创新科技', position: 'CEO' },
  ];

  const handleGenerateScript = async () => {
    if (!selectedCustomer || !scenario) {
      return;
    }

    setLoading(true);
    try {
      // 这里应该调用API
      // const response = await api.post('/api/ai/generate-script', {
      //   customer_id: selectedCustomer,
      //   scenario: scenario,
      //   methodology: methodology,
      //   model_preference: selectedModel,
      //   custom_prompt: customPrompt
      // });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const customer = customers.find(c => c.id.toString() === selectedCustomer);
      const scenarioName = SCRIPT_SCENARIOS.find(s => s.id === scenario)?.name;
      const methodologyName = SALES_METHODOLOGIES.find(m => m.id === methodology)?.name;
      
      const mockScript = `
【${scenarioName} - ${methodologyName}】

尊敬的${customer?.name}${customer?.position}，您好！

我是来自[公司名称]的销售顾问。我了解到${customer?.company}在数字化转型方面一直走在行业前列，特别是在产品创新领域的投入。

根据我们对${customer?.company}的研究，我发现贵公司可能面临以下挑战：
1. 如何进一步提升产品开发效率
2. 如何更好地整合用户反馈到产品迭代中
3. 如何在激烈的市场竞争中保持创新优势

我们的解决方案已经帮助类似规模的企业：
- 提升30%的产品开发效率
- 缩短50%的用户反馈响应时间
- 增加25%的市场竞争优势

${customer?.name}总监，基于您在产品管理方面的丰富经验，我相信您一定能看到这个解决方案的价值。我们能否安排一个15分钟的简短会议，让我为您详细介绍这个方案？

期待您的回复！
      `;
      
      setGeneratedScript(mockScript.trim());
    } catch (error) {
      console.error('话术生成失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScript = () => {
    if (!generatedScript) return;
    
    const newScript = {
      id: Date.now(),
      customer_name: customers.find(c => c.id.toString() === selectedCustomer)?.name,
      scenario: SCRIPT_SCENARIOS.find(s => s.id === scenario)?.name,
      methodology: SALES_METHODOLOGIES.find(m => m.id === methodology)?.name,
      model: AI_MODELS.find(m => m.id === selectedModel)?.name,
      content: generatedScript,
      created_at: new Date().toISOString(),
      rating: 0,
    };
    
    setSavedScripts(prev => [newScript, ...prev]);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generatedScript);
  };

  return (
    <Grid container spacing={3}>
      {/* 左侧配置面板 */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            话术生成配置
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>选择客户</InputLabel>
            <Select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              label="选择客户"
            >
              {customers.map(customer => (
                <MenuItem key={customer.id} value={customer.id.toString()}>
                  {customer.name} - {customer.company}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>销售场景</InputLabel>
            <Select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              label="销售场景"
            >
              {SCRIPT_SCENARIOS.map(scenario => (
                <MenuItem key={scenario.id} value={scenario.id}>
                  {scenario.name} - {scenario.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>销售方法论</InputLabel>
            <Select
              value={methodology}
              onChange={(e) => setMethodology(e.target.value)}
              label="销售方法论"
            >
              {SALES_METHODOLOGIES.map(method => (
                <MenuItem key={method.id} value={method.id}>
                  {method.name} - {method.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="自定义要求（可选）"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="例如：语气要更正式一些，突出ROI价值..."
            sx={{ mb: 2 }}
          />
          
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleGenerateScript}
            disabled={!selectedCustomer || !scenario || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
          >
            {loading ? '生成中...' : '生成话术'}
          </Button>
        </Paper>
        
        {/* AI模型选择 */}
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            AI模型选择
          </Typography>
          <Grid container spacing={1}>
            {AI_MODELS.map(model => (
              <Grid item xs={6} key={model.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedModel === model.id ? `2px solid ${model.color}` : '1px solid',
                    borderColor: selectedModel === model.id ? model.color : 'divider',
                    p: 1,
                  }}
                  onClick={() => setSelectedModel(model.id)}
                >
                  <Box textAlign="center">
                    <Typography variant="h6">{model.icon}</Typography>
                    <Typography variant="caption" display="block">
                      {model.name}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
      
      {/* 右侧结果面板 */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3, height: 'fit-content' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">
              生成的销售话术
            </Typography>
            {generatedScript && (
              <Box display="flex" gap={1}>
                <Tooltip title="复制话术">
                  <IconButton onClick={handleCopyScript}>
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
                <Tooltip title="保存话术">
                  <IconButton onClick={handleSaveScript}>
                    <Save />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
          
          {generatedScript ? (
            <Box>
              <TextField
                fullWidth
                multiline
                minRows={5}
                maxRows={30}
                value={generatedScript}
                onChange={(e) => setGeneratedScript(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                  },
                }}
              />
              
              <Box mt={2} display="flex" alignItems="center" gap={2}>
                <Chip
                  icon={<SmartToy />}
                  label={AI_MODELS.find(m => m.id === selectedModel)?.name}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={SCRIPT_SCENARIOS.find(s => s.id === scenario)?.name}
                  variant="outlined"
                />
                <Chip
                  label={SALES_METHODOLOGIES.find(m => m.id === methodology)?.name}
                  variant="outlined"
                />
              </Box>
            </Box>
          ) : (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              sx={{ height: 300, color: 'text.secondary' }}
            >
              <AutoAwesome sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6">AI话术生成器</Typography>
              <Typography variant="body2" textAlign="center">
                选择客户和场景，让AI为您生成个性化销售话术
              </Typography>
            </Box>
          )}
        </Paper>
        
        {/* 已保存的话术 */}
        {savedScripts.length > 0 && (
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              已保存的话术 ({savedScripts.length})
            </Typography>
            <List>
              {savedScripts.slice(0, 3).map((script, index) => (
                <React.Fragment key={script.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Chat />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2">
                            {script.customer_name} - {script.scenario}
                          </Typography>
                          <Chip size="small" label={script.methodology} variant="outlined" />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(script.created_at).toLocaleString()} • {script.model}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {script.content.substring(0, 100)}...
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < savedScripts.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
      </Grid>
    </Grid>
  );
};

// 客户分析组件
const CustomerAnalysis: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState('grok-4');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [analysisType, setAnalysisType] = useState('profile_complete');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);

  // 模拟客户数据
  const customers = [
    { 
      id: 1, 
      name: '张三', 
      company: '阿里巴巴', 
      position: '产品总监',
      ai_profile: {
        personality: '理性决策者，注重数据驱动',
        communication: '直接、高效的沟通风格',
        interests: '产品创新、数字化转型',
        pain_points: '成本控制、效率提升',
        last_analysis: '2024-01-15T10:00:00Z',
        model_used: 'grok-4'
      }
    },
    { id: 2, name: '李四', company: '中国银行', position: '风控总监' },
    { id: 3, name: '王五', company: '创新科技', position: 'CEO' },
  ];

  const handleAnalyze = async () => {
    if (!selectedCustomer || !analysisType) {
      return;
    }

    setLoading(true);
    try {
      // 这里应该调用API
      // const response = await api.post('/api/ai/analyze-customer', {
      //   customer_id: selectedCustomer,
      //   analysis_type: analysisType,
      //   model_preference: selectedModel,
      //   include_history: true
      // });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const customer = customers.find(c => c.id.toString() === selectedCustomer);
      const analysisTypeName = ANALYSIS_TYPES.find(t => t.id === analysisType)?.name;
      
      const mockResult = {
        customer_id: selectedCustomer,
        customer_name: customer?.name,
        analysis_type: analysisType,
        analysis_type_name: analysisTypeName,
        model_used: selectedModel,
        model_name: AI_MODELS.find(m => m.id === selectedModel)?.name,
        timestamp: new Date().toISOString(),
        confidence_score: 0.85,
        insights: {
          personality: {
            traits: ['理性', '数据驱动', '目标导向', '效率优先'],
            description: '张三是一位典型的理性决策者，在做决策时高度依赖数据和事实。他注重效率和结果，喜欢直接、明确的沟通方式。',
            decision_style: '分析型决策者，需要充分的信息支持',
            risk_tolerance: '中等风险承受能力，偏好可控的创新'
          },
          communication: {
            preferred_style: '直接、简洁、数据支撑',
            best_time: '工作日上午9-11点，下午2-4点',
            channel_preference: '邮件 > 电话 > 微信',
            response_pattern: '通常在24小时内回复，喜欢结构化信息'
          },
          interests: {
            professional: ['产品创新', '数字化转型', '团队管理', '市场分析'],
            personal: ['科技趋势', '商业书籍', '效率工具'],
            pain_points: ['时间管理', '成本控制', '团队协作效率']
          },
          recommendations: {
            approach: '以数据和案例为主导的展示方式',
            timing: '建议在项目规划期或预算制定期接触',
            value_proposition: '强调ROI、效率提升和风险控制',
            next_steps: [
              '准备详细的ROI分析报告',
              '收集同行业成功案例',
              '安排产品演示和试用',
              '提供分阶段实施方案'
            ]
          }
        }
      };
      
      setAnalysisResult(mockResult);
      setAnalysisHistory(prev => [mockResult, ...prev]);
    } catch (error) {
      console.error('客户分析失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    const { insights } = analysisResult;

    return (
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h6">
            {analysisResult.customer_name} - {analysisResult.analysis_type_name}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              icon={<SmartToy />}
              label={analysisResult.model_name}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`置信度: ${(analysisResult.confidence_score * 100).toFixed(0)}%`}
              color={analysisResult.confidence_score > 0.8 ? 'success' : 'warning'}
              variant="outlined"
            />
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* 性格特征 */}
          <Grid item xs={12} md={6}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  🧠 性格特征
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box mb={2}>
                  <Typography variant="body2" paragraph>
                    {insights.personality.description}
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                    {insights.personality.traits.map((trait: string, index: number) => (
                      <Chip key={index} label={trait} size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>
                  <Typography variant="caption" color="textSecondary" display="block">
                    决策风格: {insights.personality.decision_style}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block">
                    风险偏好: {insights.personality.risk_tolerance}
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 沟通偏好 */}
          <Grid item xs={12} md={6}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  💬 沟通偏好
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="沟通风格"
                      secondary={insights.communication.preferred_style}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="最佳时间"
                      secondary={insights.communication.best_time}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="渠道偏好"
                      secondary={insights.communication.channel_preference}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="回复模式"
                      secondary={insights.communication.response_pattern}
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 兴趣和痛点 */}
          <Grid item xs={12} md={6}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  ❤️ 兴趣和痛点
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    专业兴趣
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                    {insights.interests.professional.map((interest: string, index: number) => (
                      <Chip key={index} label={interest} size="small" color="success" variant="outlined" />
                    ))}
                  </Box>
                </Box>
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    个人兴趣
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                    {insights.interests.personal.map((interest: string, index: number) => (
                      <Chip key={index} label={interest} size="small" color="info" variant="outlined" />
                    ))}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    主要痛点
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {insights.interests.pain_points.map((pain: string, index: number) => (
                      <Chip key={index} label={pain} size="small" color="error" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 行动建议 */}
          <Grid item xs={12} md={6}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  💡 行动建议
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    接触策略
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {insights.recommendations.approach}
                  </Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    最佳时机
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {insights.recommendations.timing}
                  </Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    价值主张
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {insights.recommendations.value_proposition}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    下一步行动
                  </Typography>
                  <List dense>
                    {insights.recommendations.next_steps.map((step: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={step}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>

        <Box mt={3} display="flex" justifyContent="center" gap={2}>
          <Button variant="outlined" startIcon={<ContentCopy />}>
            复制分析结果
          </Button>
          <Button variant="outlined" startIcon={<Save />}>
            保存到客户档案
          </Button>
          <Button variant="outlined" startIcon={<Share />}>
            分享给团队
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Grid container spacing={3}>
      {/* 左侧配置面板 */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            客户分析配置
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>选择客户</InputLabel>
            <Select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              label="选择客户"
            >
              {customers.map(customer => (
                <MenuItem key={customer.id} value={customer.id.toString()}>
                  {customer.name} - {customer.company}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>分析类型</InputLabel>
            <Select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              label="分析类型"
            >
              {ANALYSIS_TYPES.map(type => (
                <MenuItem key={type.id} value={type.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {type.icon}
                    {type.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleAnalyze}
            disabled={!selectedCustomer || !analysisType || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Psychology />}
          >
            {loading ? '分析中...' : '开始分析'}
          </Button>
          
          {loading && (
            <Box mt={2}>
              <Typography variant="caption" color="textSecondary" display="block" textAlign="center">
                AI正在深度分析客户信息...
              </Typography>
              <LinearProgress sx={{ mt: 1 }} />
            </Box>
          )}
        </Paper>
        
        {/* AI模型选择 */}
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            选择AI模型
          </Typography>
          <Grid container spacing={2}>
            {AI_MODELS.map(model => (
              <Grid item xs={12} key={model.id}>
                <ModelCard
                  model={model}
                  selected={selectedModel === model.id}
                  onSelect={() => setSelectedModel(model.id)}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
      
      {/* 右侧结果面板 */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3, minHeight: 600 }}>
          {analysisResult ? (
            renderAnalysisResult()
          ) : (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              sx={{ height: 400, color: 'text.secondary' }}
            >
              <Psychology sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6">AI客户分析</Typography>
              <Typography variant="body2" textAlign="center">
                选择客户和分析类型，让AI为您深度分析客户特征
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

// 主AI助手页面
const AIAssistantPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* 页面标题 */}
      <Box sx={{ p: 3, pb: 0 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          AI销售助手
        </Typography>
        <Typography variant="body1" color="textSecondary">
          利用多种AI模型为您提供智能销售支持
        </Typography>
      </Box>

      {/* 标签页 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab
            label="话术生成"
            icon={<Chat />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            label="客户分析"
            icon={<Psychology />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            label="AI模型"
            icon={<SmartToy />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>

      {/* 标签页内容 */}
      <TabPanel value={currentTab} index={0}>
        <ScriptGenerator />
      </TabPanel>
      
      <TabPanel value={currentTab} index={1}>
        <CustomerAnalysis />
      </TabPanel>
      
      <TabPanel value={currentTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              可用的AI模型
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              选择最适合您需求的AI模型，每个模型都有其独特的优势和适用场景。
            </Typography>
          </Grid>
          {AI_MODELS.map(model => (
            <Grid item xs={12} md={6} lg={4} key={model.id}>
              <ModelCard
                model={model}
                selected={false}
                onSelect={() => {}}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default AIAssistantPage;