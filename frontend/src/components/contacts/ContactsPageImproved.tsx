import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Menu,
  MenuItem,
  Slider,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Snackbar,
  CircularProgress,
  Badge,
} from '@mui/material';
import {
  Search,
  Add,
  FilterList,
  Upload,
  CameraAlt,
  Person,
  Business,
  Phone,
  Email,
  Star,
  StarBorder,
  Edit,
  Delete,
  Psychology,
  Chat,
  DragIndicator,
  Folder,
  FolderOpen,
  TrendingUp,
  Schedule,
  SmartToy,
  Analytics,
  Assignment,
  Notifications,
  Speed,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAppSelector, useAppDispatch } from '../../hooks/redux.ts';
import { Contact } from '../../types/contact';
import ContactDetailEnhanced from './ContactDetailEnhanced';

// 改进版联系人接口
interface CustomerImproved {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  wechat_id?: string;
  company?: string;
  position?: string;
  industry?: string;
  age_group?: string;
  tags: string[];
  progress: number;
  latest_notes?: string;
  folder_id?: number;
  priority: 1 | 2 | 3; // 1=高, 2=中, 3=低
  ai_profile?: {
    personality?: string;
    communication?: string;
    interests?: string;
    pain_points?: string;
    last_analysis?: string;
    model_used?: string;
  };
  social_profiles?: Record<string, string>;
  business_info?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface FolderImproved {
  id: number;
  name: string;
  order: number;
  parent_id?: number;
  folder_type: 'industry' | 'position' | 'age' | 'custom';
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

// 拖拽类型
const ItemTypes = {
  CUSTOMER: 'customer',
  FOLDER: 'folder',
};

// 客户卡片组件
const CustomerCard: React.FC<{
  customer: CustomerImproved;
  onEdit: (customer: CustomerImproved) => void;
  onDelete: (id: number) => void;
  onAnalyze: (customer: CustomerImproved) => void;
  onProgressUpdate: (id: number, progress: number) => void;
}> = ({ customer, onEdit, onDelete, onAnalyze, onProgressUpdate }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CUSTOMER,
    item: { id: customer.id, type: 'customer' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [progressMenuAnchor, setProgressMenuAnchor] = useState<null | HTMLElement>(null);
  const [tempProgress, setTempProgress] = useState(customer.progress);

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return '#f44336'; // 高优先级 - 红色
      case 2: return '#ff9800'; // 中优先级 - 橙色
      case 3: return '#4caf50'; // 低优先级 - 绿色
      default: return '#9e9e9e';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'error';
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLElement>) => {
    setProgressMenuAnchor(event.currentTarget);
  };

  const handleProgressClose = () => {
    setProgressMenuAnchor(null);
  };

  const handleProgressUpdate = () => {
    onProgressUpdate(customer.id, tempProgress);
    handleProgressClose();
  };

  return (
    <Card
      ref={drag}
      sx={{
        mb: 1,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        border: `2px solid ${getPriorityColor(customer.priority)}`,
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" mb={1}>
          <DragIndicator sx={{ color: 'grey.400', mr: 1 }} />
          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: getPriorityColor(customer.priority) }}>
            {customer.name.charAt(0)}
          </Avatar>
          <Box flexGrow={1}>
            <Typography variant="subtitle2" fontWeight="bold">
              {customer.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {customer.company} • {customer.position}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={customer.priority === 1 ? '高' : customer.priority === 2 ? '中' : '低'}
            sx={{ bgcolor: getPriorityColor(customer.priority), color: 'white' }}
          />
        </Box>

        {/* 进度条 */}
        <Box mb={1}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              进度
            </Typography>
            <Typography variant="caption" fontWeight="bold">
              {customer.progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={customer.progress}
            color={getProgressColor(customer.progress)}
            sx={{ height: 6, borderRadius: 3, cursor: 'pointer' }}
            onClick={handleProgressClick}
          />
        </Box>

        {/* 标签 */}
        <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
          {customer.tags.slice(0, 3).map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          ))}
          {customer.tags.length > 3 && (
            <Chip
              label={`+${customer.tags.length - 3}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          )}
        </Box>

        {/* AI分析状态 */}
        {customer.ai_profile && (
          <Box display="flex" alignItems="center" mb={1}>
            <SmartToy sx={{ fontSize: 16, color: 'primary.main', mr: 0.5 }} />
            <Typography variant="caption" color="primary.main">
              AI已分析 • {customer.ai_profile.model_used}
            </Typography>
          </Box>
        )}

        {/* 最新备注 */}
        {customer.latest_notes && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {customer.latest_notes.length > 50
              ? `${customer.latest_notes.substring(0, 50)}...`
              : customer.latest_notes}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
        <Box>
          <Tooltip title="AI分析">
            <IconButton size="small" onClick={() => onAnalyze(customer)} color="primary">
              <Psychology fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="编辑">
            <IconButton size="small" onClick={() => onEdit(customer)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box>
          <Tooltip title="删除">
            <IconButton size="small" onClick={() => onDelete(customer.id)} color="error">
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>

      {/* 进度更新菜单 */}
      <Menu
        anchorEl={progressMenuAnchor}
        open={Boolean(progressMenuAnchor)}
        onClose={handleProgressClose}
      >
        <Box sx={{ p: 2, width: 250 }}>
          <Typography variant="subtitle2" gutterBottom>
            更新进度
          </Typography>
          <Slider
            value={tempProgress}
            onChange={(_, value) => setTempProgress(value as number)}
            valueLabelDisplay="on"
            step={5}
            marks
            min={0}
            max={100}
            sx={{ mb: 2 }}
          />
          <Box display="flex" gap={1}>
            <Button size="small" onClick={handleProgressClose}>
              取消
            </Button>
            <Button size="small" variant="contained" onClick={handleProgressUpdate}>
              更新
            </Button>
          </Box>
        </Box>
      </Menu>
    </Card>
  );
};

// 文件夹组件
const FolderComponent: React.FC<{
  folder: FolderImproved;
  customers: CustomerImproved[];
  onDrop: (customerId: number, folderId: number) => void;
  onEdit: (folder: FolderImproved) => void;
  onDelete: (id: number) => void;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ folder, customers, onDrop, onEdit, onDelete, isExpanded, onToggle }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.CUSTOMER,
    drop: (item: { id: number; type: string }) => {
      if (item.type === 'customer') {
        onDrop(item.id, folder.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const folderCustomers = customers.filter(c => c.folder_id === folder.id);

  return (
    <Paper
      ref={drop}
      sx={{
        mb: 1,
        bgcolor: isOver ? 'action.hover' : 'background.paper',
        border: isOver ? '2px dashed' : '1px solid',
        borderColor: isOver ? 'primary.main' : 'divider',
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          bgcolor: folder.color + '20',
          borderLeft: `4px solid ${folder.color}`,
        }}
        onClick={onToggle}
      >
        {isExpanded ? <FolderOpen sx={{ color: folder.color, mr: 1 }} /> : <Folder sx={{ color: folder.color, mr: 1 }} />}
        <Typography variant="subtitle2" fontWeight="bold" flexGrow={1}>
          {folder.name}
        </Typography>
        <Badge badgeContent={folderCustomers.length} color="primary" sx={{ mr: 1 }} />
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(folder); }}>
          <Edit fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }} color="error">
          <Delete fontSize="small" />
        </IconButton>
      </Box>
      
      {isExpanded && (
        <Box sx={{ p: 1 }}>
          {folderCustomers.length === 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block', textAlign: 'center' }}>
              拖拽客户到此文件夹
            </Typography>
          ) : (
            folderCustomers.map(customer => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onEdit={() => {}}
                onDelete={() => {}}
                onAnalyze={() => {}}
                onProgressUpdate={() => {}}
              />
            ))
          )}
        </Box>
      )}
    </Paper>
  );
};

// AI分析对话框
const AIAnalysisDialog: React.FC<{
  open: boolean;
  customer: CustomerImproved | null;
  onClose: () => void;
  onAnalyze: (customerId: number, analysisType: string, modelPreference?: string) => void;
}> = ({ open, customer, onClose, onAnalyze }) => {
  const [analysisType, setAnalysisType] = useState('profile_complete');
  const [modelPreference, setModelPreference] = useState('grok-4');
  const [loading, setLoading] = useState(false);

  const analysisTypes = [
    { value: 'personality', label: '性格分析' },
    { value: 'communication', label: '沟通风格' },
    { value: 'interests', label: '兴趣分析' },
    { value: 'pain_points', label: '痛点分析' },
    { value: 'recommendations', label: '行动建议' },
    { value: 'profile_complete', label: '完整画像' },
  ];

  const aiModels = [
    { value: 'grok-4', label: 'Grok-4 (推理能力强)' },
    { value: 'deepseek-reasoner', label: 'Deepseek Reasoner (逻辑分析)' },
    { value: 'moonshot-kimi-k2', label: 'Moonshot Kimi K2 (大参数)' },
    { value: 'openai-gpt4', label: 'OpenAI GPT-4 (通用)' },
  ];

  const handleAnalyze = async () => {
    if (!customer) return;
    
    setLoading(true);
    try {
      await onAnalyze(customer.id, analysisType, modelPreference);
      onClose();
    } catch (error) {
      console.error('AI分析失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <SmartToy sx={{ mr: 1, color: 'primary.main' }} />
          AI客户分析 - {customer?.name}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>分析类型</InputLabel>
            <Select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              label="分析类型"
            >
              {analysisTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>AI模型</InputLabel>
            <Select
              value={modelPreference}
              onChange={(e) => setModelPreference(e.target.value)}
              label="AI模型"
            >
              {aiModels.map(model => (
                <MenuItem key={model.value} value={model.value}>
                  {model.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {customer?.ai_profile && (
            <Alert severity="info" sx={{ mb: 2 }}>
              上次分析时间: {customer.ai_profile.last_analysis ? new Date(customer.ai_profile.last_analysis).toLocaleString() : '未知'}
              <br />
              使用模型: {customer.ai_profile.model_used || '未知'}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          取消
        </Button>
        <Button
          onClick={handleAnalyze}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Psychology />}
        >
          {loading ? '分析中...' : '开始分析'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// 主组件
const ContactsPageImproved: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerImproved[]>([]);
  const [folders, setFolders] = useState<FolderImproved[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerImproved | null>(null);
  const [aiAnalysisOpen, setAiAnalysisOpen] = useState(false);
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>(
    { open: false, message: '', severity: 'info' }
  );
  const [loading, setLoading] = useState(false);

  // 转换CustomerImproved到Contact类型
  const convertToContact = (customer: CustomerImproved): Contact => {
    return {
      _id: customer.id.toString(),
      userId: 'user1',
      basicInfo: {
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        wechatId: customer.wechat_id || '',
        company: customer.company || '',
        position: customer.position || '',
        industry: customer.industry || '',
        ageGroup: customer.age_group || '',
      },
      photos: [],
      tags: customer.tags.map(tag => ({ name: tag, color: '#2196f3', category: 'custom' })),
      folder: '',
      priority: customer.priority,
      latest_notes: customer.latest_notes || '',
      reminder: '',
      socialProfiles: customer.social_profiles || {},
      businessInfo: {
        ...customer.business_info,
        decisionMaker: true,
      },
      aiProfile: {
        personality: customer.ai_profile?.personality,
        communicationStyle: customer.ai_profile?.communication,
        interests: customer.ai_profile?.interests ? [customer.ai_profile.interests] : [],
        painPoints: customer.ai_profile?.pain_points ? [customer.ai_profile.pain_points] : [],
        lastAnalysis: customer.ai_profile?.last_analysis,
        opportunityScore: 50,
        relationshipStrength: 5,
      },
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
    };
  };

  // 模拟数据
  useEffect(() => {
    // 模拟文件夹数据
    const mockFolders: FolderImproved[] = [
      { id: 1, name: '互联网科技', order: 1, folder_type: 'industry', color: '#2196f3', icon: 'computer', created_at: '2024-01-01', updated_at: '2024-01-01' },
      { id: 2, name: '金融保险', order: 2, folder_type: 'industry', color: '#4caf50', icon: 'account_balance', created_at: '2024-01-01', updated_at: '2024-01-01' },
      { id: 3, name: 'C级高管', order: 10, folder_type: 'position', color: '#e91e63', icon: 'star', created_at: '2024-01-01', updated_at: '2024-01-01' },
      { id: 4, name: '重点客户', order: 30, folder_type: 'custom', color: '#f44336', icon: 'priority_high', created_at: '2024-01-01', updated_at: '2024-01-01' },
    ];

    // 模拟客户数据
    const mockCustomers: CustomerImproved[] = [
      {
        id: 1,
        name: '张三',
        email: 'zhangsan@example.com',
        phone: '+86 138 0013 8000',
        company: '阿里巴巴',
        position: '产品总监',
        industry: '互联网',
        age_group: '35-45',
        tags: ['高优先级', '决策者', 'AI分析'],
        progress: 75,
        latest_notes: '对我们的产品很感兴趣，下周安排演示',
        folder_id: 1,
        priority: 1,
        ai_profile: {
          personality: '理性决策者，注重数据和ROI',
          communication: '直接、高效的沟通风格',
          interests: '产品创新、数字化转型',
          pain_points: '成本控制、效率提升',
          last_analysis: '2024-01-15T10:00:00Z',
          model_used: 'grok-4'
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        name: '李四',
        email: 'lisi@bank.com',
        phone: '+86 139 0013 9000',
        company: '中国银行',
        position: '风控总监',
        industry: '金融',
        age_group: '45+',
        tags: ['银行', '风控', '保守'],
        progress: 30,
        latest_notes: '需要更多合规性证明',
        folder_id: 2,
        priority: 2,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-10T10:00:00Z'
      },
      {
        id: 3,
        name: '王五',
        email: 'wangwu@startup.com',
        phone: '+86 137 0013 7000',
        company: '创新科技',
        position: 'CEO',
        industry: '互联网',
        age_group: '25-35',
        tags: ['创业者', 'CEO', '快速决策'],
        progress: 90,
        latest_notes: '准备签约，等待最终确认',
        folder_id: 3,
        priority: 1,
        ai_profile: {
          personality: '创新型领导者，敢于冒险',
          communication: '快节奏，喜欢简洁明了',
          interests: '新技术、市场机会',
          pain_points: '资金压力、快速扩张',
          last_analysis: '2024-01-14T15:30:00Z',
          model_used: 'deepseek-reasoner'
        },
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-14T15:30:00Z'
      }
    ];

    setFolders(mockFolders);
    setCustomers(mockCustomers);
    setExpandedFolders(new Set([1, 2, 3, 4])); // 默认展开所有文件夹
  }, []);

  // 拖拽处理
  const handleDrop = useCallback(async (customerId: number, folderId: number) => {
    try {
      setLoading(true);
      
      // 这里应该调用API
      // await api.post('/api/customers/drag-drop', {
      //   customer_ids: [customerId],
      //   target_folder_id: folderId
      // });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 更新本地状态
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, folder_id: folderId, updated_at: new Date().toISOString() }
          : customer
      ));
      
      const targetFolder = folders.find(f => f.id === folderId);
      setSnackbar({
        open: true,
        message: `客户已移动到 ${targetFolder?.name}`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: '移动失败，请重试',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [folders]);

  // 进度更新
  const handleProgressUpdate = useCallback(async (customerId: number, progress: number) => {
    try {
      setLoading(true);
      
      // 这里应该调用API
      // await api.put(`/api/customers/${customerId}/progress`, {
      //   customer_id: customerId,
      //   progress: progress,
      //   auto_tasks: true
      // });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 更新本地状态
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, progress, updated_at: new Date().toISOString() }
          : customer
      ));
      
      setSnackbar({
        open: true,
        message: `进度已更新为 ${progress}%`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: '进度更新失败',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // AI分析
  const handleAIAnalyze = useCallback(async (customerId: number, analysisType: string, modelPreference?: string) => {
    try {
      setLoading(true);
      
      // 这里应该调用API
      // const response = await api.post('/api/ai/analyze-customer', {
      //   customer_id: customerId,
      //   analysis_type: analysisType,
      //   model_preference: modelPreference,
      //   include_history: true
      // });
      
      // 模拟API调用和AI分析
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAnalysisResult = {
        personality: '理性决策者，注重数据驱动的决策过程',
        communication: '偏好直接、高效的沟通方式',
        interests: '关注产品创新和数字化转型',
        pain_points: '面临成本控制和效率提升的挑战',
        last_analysis: new Date().toISOString(),
        model_used: modelPreference || 'grok-4'
      };
      
      // 更新客户AI画像
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { 
              ...customer, 
              ai_profile: mockAnalysisResult,
              updated_at: new Date().toISOString()
            }
          : customer
      ));
      
      setSnackbar({
        open: true,
        message: 'AI分析完成',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'AI分析失败，请重试',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 文件夹展开/收起
  const toggleFolder = useCallback((folderId: number) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  // 过滤客户
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.company && customer.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    customer.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* 顶部工具栏 */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              placeholder="搜索客户、公司或标签..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {}}
            >
              添加客户
            </Button>
            <Button
              variant="outlined"
              startIcon={<CameraAlt />}
              onClick={() => {}}
            >
              扫描名片
            </Button>
            <Button
              variant="outlined"
              startIcon={<Analytics />}
              onClick={() => {}}
            >
              批量分析
            </Button>
          </Box>
        </Paper>

        {/* 主要内容区域 */}
        <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {/* 左侧文件夹树 */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper sx={{ height: '100%', overflow: 'auto', p: 1 }}>
              <Typography variant="h6" sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
                <Folder sx={{ mr: 1 }} />
                客户分类
              </Typography>
              <Divider sx={{ mb: 1 }} />
              
              {folders.map(folder => (
                <FolderComponent
                  key={folder.id}
                  folder={folder}
                  customers={filteredCustomers}
                  onDrop={handleDrop}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isExpanded={expandedFolders.has(folder.id)}
                  onToggle={() => toggleFolder(folder.id)}
                />
              ))}
            </Paper>
          </Grid>

          {/* 右侧客户列表 */}
          <Grid item xs={12} md={8} lg={9}>
            <Paper sx={{ height: '100%', overflow: 'auto', p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">
                  客户列表 ({filteredCustomers.length})
                </Typography>
                <Box display="flex" gap={1}>
                  <Chip
                    icon={<TrendingUp />}
                    label={`高优先级: ${filteredCustomers.filter(c => c.priority === 1).length}`}
                    color="error"
                    variant="outlined"
                  />
                  <Chip
                    icon={<SmartToy />}
                    label={`AI已分析: ${filteredCustomers.filter(c => c.ai_profile).length}`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                {filteredCustomers.map(customer => (
                  <Grid item xs={12} sm={6} lg={4} key={customer.id}>
                    <CustomerCard
                      customer={customer}
                      onEdit={(customer) => {
                        setSelectedCustomer(customer);
                        setCustomerDetailOpen(true);
                      }}
                      onDelete={(id) => {}}
                      onAnalyze={(customer) => {
                        setSelectedCustomer(customer);
                        setAiAnalysisOpen(true);
                      }}
                      onProgressUpdate={handleProgressUpdate}
                    />
                  </Grid>
                ))}
              </Grid>
              
              {filteredCustomers.length === 0 && (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  sx={{ height: 200, color: 'text.secondary' }}
                >
                  <Person sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="h6">暂无客户</Typography>
                  <Typography variant="body2">点击"添加客户"或"扫描名片"开始</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* AI分析对话框 */}
        <AIAnalysisDialog
          open={aiAnalysisOpen}
          customer={selectedCustomer}
          onClose={() => {
            setAiAnalysisOpen(false);
            setSelectedCustomer(null);
          }}
          onAnalyze={handleAIAnalyze}
        />

        {/* 客户详情对话框 */}
        <Dialog
          open={customerDetailOpen}
          onClose={() => {
            setCustomerDetailOpen(false);
            setSelectedCustomer(null);
          }}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            {selectedCustomer && (
              <ContactDetailEnhanced
                contact={convertToContact(selectedCustomer)}
                onEdit={() => {}}
                onDelete={() => {
                  setCustomerDetailOpen(false);
                  setSelectedCustomer(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* 消息提示 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* 加载指示器 */}
        {loading && (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bgcolor="rgba(0,0,0,0.3)"
            zIndex={9999}
          >
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography>处理中...</Typography>
            </Paper>
          </Box>
        )}
      </Box>
    </DndProvider>
  );
};

export default ContactsPageImproved;