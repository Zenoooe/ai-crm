import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  CameraAlt,
  Upload,
  Image,
  Person,
  Business,
  Phone,
  Email,
  LocationOn,
  Language,
  Edit,
  Save,
  Cancel,
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Delete,
  Add,
  Visibility,
  VisibilityOff,
  SmartToy,
  AutoAwesome,
  ContentCopy,
  Download,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

// OCR识别结果接口
interface OCRResult {
  id: string;
  original_text: string;
  confidence: number;
  processing_time: number;
  parsed_info: {
    name?: string;
    company?: string;
    position?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    wechat?: string;
    other_info?: Record<string, string>;
  };
  ai_suggestions: {
    confidence_score: number;
    missing_fields: string[];
    data_quality: 'high' | 'medium' | 'low';
    recommendations: string[];
  };
  created_at: string;
}

// 联系人创建表单接口
interface ContactForm {
  name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
  wechat_id: string;
  address: string;
  website: string;
  industry: string;
  tags: string[];
  notes: string;
  priority: 1 | 2 | 3;
  folder_id?: number;
}

// 图片上传组件
const ImageUploader: React.FC<{
  onImageUpload: (file: File) => void;
  loading: boolean;
}> = ({ onImageUpload, loading }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onImageUpload(acceptedFiles[0]);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: false,
    disabled: loading
  });

  return (
    <Paper
      {...getRootProps()}
      sx={{
        p: 4,
        textAlign: 'center',
        cursor: loading ? 'not-allowed' : 'pointer',
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.300',
        bgcolor: isDragActive ? 'action.hover' : 'background.paper',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: loading ? 'grey.300' : 'primary.main',
          bgcolor: loading ? 'background.paper' : 'action.hover',
        },
      }}
    >
      <input {...getInputProps()} />
      
      {loading ? (
        <Box>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            正在处理图片...
          </Typography>
          <Typography variant="body2" color="textSecondary">
            AI正在识别名片信息，请稍候
          </Typography>
        </Box>
      ) : (
        <Box>
          <Image sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? '放下图片开始识别' : '上传名片图片'}
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            支持 JPG、PNG、GIF 等格式，最大 10MB
          </Typography>
          <Box display="flex" justifyContent="center" gap={2}>
            <Button
              variant="contained"
              startIcon={<Upload />}
              disabled={loading}
            >
              选择文件
            </Button>
            <Button
              variant="outlined"
              startIcon={<CameraAlt />}
              disabled={loading}
            >
              拍照上传
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

// OCR结果展示组件
const OCRResultDisplay: React.FC<{
  result: OCRResult;
  onEdit: () => void;
  onCreateContact: () => void;
}> = ({ result, onEdit, onCreateContact }) => {
  const [showOriginalText, setShowOriginalText] = useState(false);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      default: return 'default';
    }
  };

  const getQualityText = (quality: string) => {
    switch (quality) {
      case 'high': return '高质量';
      case 'medium': return '中等质量';
      case 'low': return '低质量';
      default: return '未知';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            识别结果
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              icon={<SmartToy />}
              label={`置信度: ${(result.confidence * 100).toFixed(0)}%`}
              color={result.confidence > 0.8 ? 'success' : result.confidence > 0.6 ? 'warning' : 'error'}
              variant="outlined"
            />
            <Chip
              label={getQualityText(result.ai_suggestions.data_quality)}
              color={getQualityColor(result.ai_suggestions.data_quality)}
              variant="outlined"
            />
          </Box>
        </Box>

        {/* 解析的信息 */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {result.parsed_info.name && (
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Person sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    姓名
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {result.parsed_info.name}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
          
          {result.parsed_info.company && (
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Business sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    公司
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {result.parsed_info.company}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
          
          {result.parsed_info.position && (
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Person sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    职位
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {result.parsed_info.position}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
          
          {result.parsed_info.phone && (
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Phone sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    电话
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {result.parsed_info.phone}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
          
          {result.parsed_info.email && (
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Email sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    邮箱
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {result.parsed_info.email}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
          
          {result.parsed_info.address && (
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationOn sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    地址
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {result.parsed_info.address}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* AI建议 */}
        {result.ai_suggestions.recommendations.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center">
              <AutoAwesome sx={{ mr: 1, color: 'secondary.main' }} />
              AI建议
            </Typography>
            <List dense>
              {result.ai_suggestions.recommendations.map((recommendation, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={recommendation}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* 缺失字段提醒 */}
        {result.ai_suggestions.missing_fields.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              缺失信息: {result.ai_suggestions.missing_fields.join('、')}
            </Typography>
          </Alert>
        )}

        {/* 原始文本 */}
        <Box>
          <Button
            size="small"
            onClick={() => setShowOriginalText(!showOriginalText)}
            startIcon={showOriginalText ? <VisibilityOff /> : <Visibility />}
          >
            {showOriginalText ? '隐藏' : '显示'}原始识别文本
          </Button>
          
          {showOriginalText && (
            <Box mt={1}>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={result.original_text}
                variant="outlined"
                size="small"
                InputProps={{
                  readOnly: true,
                  sx: { fontFamily: 'monospace', fontSize: '0.8rem' }
                }}
              />
            </Box>
          )}
        </Box>
      </CardContent>
      
      <CardActions>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onCreateContact}
        >
          创建联系人
        </Button>
        <Button
          variant="outlined"
          startIcon={<Edit />}
          onClick={onEdit}
        >
          编辑信息
        </Button>
        <Button
          size="small"
          startIcon={<ContentCopy />}
          onClick={() => navigator.clipboard.writeText(JSON.stringify(result.parsed_info, null, 2))}
        >
          复制数据
        </Button>
      </CardActions>
    </Card>
  );
};

// 联系人创建表单
const ContactCreateForm: React.FC<{
  open: boolean;
  initialData: Partial<ContactForm>;
  onClose: () => void;
  onSave: (data: ContactForm) => void;
}> = ({ open, initialData, onClose, onSave }) => {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    company: '',
    position: '',
    phone: '',
    email: '',
    wechat_id: '',
    address: '',
    website: '',
    industry: '',
    tags: [],
    notes: '',
    priority: 2,
    folder_id: undefined,
    ...initialData,
  });
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof ContactForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('保存联系人失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const industries = [
    '互联网/科技', '金融/保险', '制造业', '房地产', '教育/培训',
    '医疗/健康', '零售/电商', '咨询/服务', '媒体/广告', '其他'
  ];

  const folders = [
    { id: 1, name: '互联网科技' },
    { id: 2, name: '金融保险' },
    { id: 3, name: 'C级高管' },
    { id: 4, name: '重点客户' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        创建新联系人
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* 基本信息 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              基本信息
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="姓名 *"
              value={formData.name}
              onChange={handleInputChange('name')}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="公司"
              value={formData.company}
              onChange={handleInputChange('company')}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="职位"
              value={formData.position}
              onChange={handleInputChange('position')}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>行业</InputLabel>
              <Select
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                label="行业"
              >
                {industries.map(industry => (
                  <MenuItem key={industry} value={industry}>
                    {industry}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* 联系方式 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
              联系方式
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="电话"
              value={formData.phone}
              onChange={handleInputChange('phone')}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="邮箱"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="微信号"
              value={formData.wechat_id}
              onChange={handleInputChange('wechat_id')}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="网站"
              value={formData.website}
              onChange={handleInputChange('website')}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="地址"
              value={formData.address}
              onChange={handleInputChange('address')}
            />
          </Grid>
          
          {/* 分类和优先级 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
              分类和优先级
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>文件夹</InputLabel>
              <Select
                value={formData.folder_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, folder_id: e.target.value as number }))}
                label="文件夹"
              >
                <MenuItem value="">无分类</MenuItem>
                {folders.map(folder => (
                  <MenuItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>优先级</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 1 | 2 | 3 }))}
                label="优先级"
              >
                <MenuItem value={1}>高优先级</MenuItem>
                <MenuItem value={2}>中优先级</MenuItem>
                <MenuItem value={3}>低优先级</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* 标签 */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              标签
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <TextField
                size="small"
                label="添加标签"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button size="small" onClick={handleAddTag}>
                添加
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {formData.tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                />
              ))}
            </Box>
          </Grid>
          
          {/* 备注 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="备注"
              value={formData.notes}
              onChange={handleInputChange('notes')}
              placeholder="添加关于此联系人的备注信息..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          取消
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!formData.name.trim() || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Save />}
        >
          {loading ? '保存中...' : '保存联系人'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// 主OCR扫描组件
const OCRScanner: React.FC = () => {
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });
  const [processingStep, setProcessingStep] = useState(0);
  const [recentScans, setRecentScans] = useState<OCRResult[]>([]);

  const processingSteps = [
    '上传图片',
    'OCR文字识别',
    'AI信息解析',
    '完成处理'
  ];

  const handleImageUpload = async (file: File) => {
    setLoading(true);
    setProcessingStep(0);
    
    try {
      // 显示上传的图片
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);
      
      // 模拟处理步骤
      setProcessingStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStep(2);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProcessingStep(3);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 这里应该调用API
      // const formData = new FormData();
      // formData.append('image', file);
      // const response = await api.post('/api/ocr/process', formData);
      
      // 模拟OCR结果
      const mockResult: OCRResult = {
        id: Date.now().toString(),
        original_text: `张三\n阿里巴巴集团\n产品总监\n电话：+86 138 0013 8000\n邮箱：zhangsan@alibaba.com\n地址：杭州市余杭区文三西路969号\n网站：www.alibaba.com`,
        confidence: 0.92,
        processing_time: 2.5,
        parsed_info: {
          name: '张三',
          company: '阿里巴巴集团',
          position: '产品总监',
          phone: '+86 138 0013 8000',
          email: 'zhangsan@alibaba.com',
          address: '杭州市余杭区文三西路969号',
          website: 'www.alibaba.com',
        },
        ai_suggestions: {
          confidence_score: 0.88,
          missing_fields: ['微信号', '行业分类'],
          data_quality: 'high',
          recommendations: [
            '建议添加行业标签：互联网/科技',
            '可以尝试通过公司信息推断更多背景',
            '建议设置为高优先级客户（大公司高管）'
          ]
        },
        created_at: new Date().toISOString()
      };
      
      setOcrResult(mockResult);
      setRecentScans(prev => [mockResult, ...prev.slice(0, 4)]); // 保留最近5次扫描
      
      setSnackbar({
        open: true,
        message: '名片识别成功！',
        severity: 'success'
      });
    } catch (error) {
      console.error('OCR处理失败:', error);
      setSnackbar({
        open: true,
        message: 'OCR识别失败，请重试',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setProcessingStep(0);
    }
  };

  const handleCreateContact = (contactData: ContactForm) => {
    // 这里应该调用API创建联系人
    // await api.post('/api/customers/', contactData);
    
    console.log('创建联系人:', contactData);
    
    setSnackbar({
      open: true,
      message: `联系人 ${contactData.name} 创建成功！`,
      severity: 'success'
    });
    
    // 清空当前结果
    setOcrResult(null);
    setUploadedImage(null);
  };

  const handleEditResult = () => {
    if (ocrResult) {
      setCreateFormOpen(true);
    }
  };

  const handleRetry = () => {
    setOcrResult(null);
    setUploadedImage(null);
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题 */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          OCR名片识别
        </Typography>
        <Typography variant="body1" color="textSecondary">
          上传名片图片，AI自动识别并解析联系人信息
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 左侧上传区域 */}
        <Grid item xs={12} md={6}>
          {!ocrResult && (
            <ImageUploader
              onImageUpload={handleImageUpload}
              loading={loading}
            />
          )}
          
          {/* 处理进度 */}
          {loading && (
            <Paper sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                处理进度
              </Typography>
              <Stepper activeStep={processingStep} orientation="vertical">
                {processingSteps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel>
                      {label}
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="textSecondary">
                        {index === processingStep && '正在处理...'}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </Paper>
          )}
          
          {/* 上传的图片预览 */}
          {uploadedImage && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                上传的图片
              </Typography>
              <Box
                component="img"
                src={uploadedImage}
                alt="上传的名片"
                sx={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'contain',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              />
              <Box mt={1} display="flex" justifyContent="center">
                <Button
                  size="small"
                  onClick={handleRetry}
                  startIcon={<Refresh />}
                >
                  重新上传
                </Button>
              </Box>
            </Paper>
          )}
        </Grid>
        
        {/* 右侧结果区域 */}
        <Grid item xs={12} md={6}>
          {ocrResult ? (
            <OCRResultDisplay
              result={ocrResult}
              onEdit={handleEditResult}
              onCreateContact={() => setCreateFormOpen(true)}
            />
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', height: 'fit-content' }}>
              <SmartToy sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                AI名片识别
              </Typography>
              <Typography variant="body2" color="textSecondary">
                上传名片图片后，识别结果将在这里显示
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* 最近扫描记录 */}
      {recentScans.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            最近扫描记录
          </Typography>
          <Grid container spacing={2}>
            {recentScans.map((scan, index) => (
              <Grid item xs={12} sm={6} md={4} key={scan.id}>
                <Card sx={{ cursor: 'pointer' }} onClick={() => setOcrResult(scan)}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 1, width: 32, height: 32 }}>
                        {scan.parsed_info.name?.charAt(0) || '?'}
                      </Avatar>
                      <Box flexGrow={1}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {scan.parsed_info.name || '未知姓名'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {scan.parsed_info.company || '未知公司'}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(scan.created_at).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* 联系人创建表单 */}
      <ContactCreateForm
        open={createFormOpen}
        initialData={ocrResult ? {
          name: ocrResult.parsed_info.name || '',
          company: ocrResult.parsed_info.company || '',
          position: ocrResult.parsed_info.position || '',
          phone: ocrResult.parsed_info.phone || '',
          email: ocrResult.parsed_info.email || '',
          address: ocrResult.parsed_info.address || '',
          website: ocrResult.parsed_info.website || '',
          wechat_id: ocrResult.parsed_info.wechat || '',
        } : {}}
        onClose={() => setCreateFormOpen(false)}
        onSave={handleCreateContact}
      />

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
    </Box>
  );
};

export default OCRScanner;