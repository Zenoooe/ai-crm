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
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  ContentCopy as ContentCopyIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  useGenerateScriptMutation, 
  useGetScriptsQuery, 
  useSaveScriptMutation,
  useUpdateScriptMutation,
  useDeleteScriptMutation 
} from '../../store/api/api';
import { Contact } from '../../types/contact';
import { SalesScript } from '../../types/ai';

interface ScriptGeneratorProps {
  contact: Contact;
  onScriptSave?: (script: SalesScript) => void;
}

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({
  contact,
  onScriptSave
}) => {
  const dispatch = useAppDispatch();
  const { error } = useAppSelector(state => state.ai);
  const [generateScriptMutation, { isLoading: isGenerating }] = useGenerateScriptMutation();
  const { data: scripts = [], refetch: refetchScripts } = useGetScriptsQuery(contact._id);
  const [saveScriptMutation] = useSaveScriptMutation();
  const [updateScriptMutation] = useUpdateScriptMutation();
  const [deleteScriptMutation] = useDeleteScriptMutation();
  const [selectedMethodology, setSelectedMethodology] = useState<string>('straight-line');
  const [selectedCategory, setSelectedCategory] = useState<string>('opening');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [generatedScript, setGeneratedScript] = useState<SalesScript | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<SalesScript | null>(null);

  const methodologies = [
    { value: 'straight-line', label: '直线销售法' },
    { value: 'sandler', label: '桑德勒销售法' },
    { value: 'challenger', label: '挑战者销售法' },
    { value: 'custom', label: '自定义方法' }
  ];

  const categories = [
    { value: 'opening', label: '开场白' },
    { value: 'discovery', label: '需求发现' },
    { value: 'presentation', label: '产品展示' },
    { value: 'objection', label: '异议处理' },
    { value: 'closing', label: '成交' }
  ];



  const handleGenerateScript = async () => {
    try {
      const script = await generateScriptMutation({
        contactId: contact._id,
        methodology: selectedMethodology,
        category: selectedCategory,
        scenario: customPrompt || 'General sales conversation',
      }).unwrap();
      setGeneratedScript(script);
    } catch (error) {
      console.error('Failed to generate script:', error);
    }
  };

  const handleSaveScript = async (script: SalesScript) => {
    try {
      const savedScript = await saveScriptMutation({
        ...script,
        contactId: contact._id,
      }).unwrap();
      onScriptSave?.(savedScript);
      setGeneratedScript(null);
      refetchScripts();
    } catch (error) {
      console.error('Failed to save script:', error);
    }
  };

  const handleUpdateScript = async (script: SalesScript) => {
     try {
       await updateScriptMutation({
         scriptId: script._id!,
         data: script
       }).unwrap();
       setEditDialogOpen(false);
       setEditingScript(null);
       refetchScripts();
     } catch (error) {
       console.error('Failed to update script:', error);
     }
   };

  const handleDeleteScript = async (scriptId: string) => {
    try {
      await deleteScriptMutation(scriptId).unwrap();
      refetchScripts();
    } catch (error) {
      console.error('Failed to delete script:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getMethodologyColor = (methodology: string) => {
    const colors: Record<string, string> = {
      'wolf-of-wall-street': '#f44336',
      'sandler': '#ff9800',
      'customer-experience': '#4caf50',
      'consultative': '#2196f3',
      'solution': '#9c27b0'
    };
    return colors[methodology] || '#9e9e9e';
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'opening': '#e3f2fd',
      'rapport': '#f3e5f5',
      'discovery': '#e8f5e8',
      'presentation': '#fff3e0',
      'objection-handling': '#ffebee',
      'closing': '#e0f2f1',
      'follow-up': '#fafafa'
    };
    return colors[stage] || '#f5f5f5';
  };

  const renderScriptCard = (script: SalesScript) => {
    return (
      <Card key={script._id} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {script.script.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Chip
                  label={methodologies.find(m => m.value === script.methodology)?.label}
                  size="small"
                  sx={{ bgcolor: getMethodologyColor(script.methodology), color: 'white' }}
                />
                <Chip
                  label={categories.find(s => s.value === script.category)?.label}
                  size="small"
                  sx={{ bgcolor: getStageColor(script.category) }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                创建时间: {new Date(script.createdAt).toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Tooltip title="复制">
                <IconButton
                  size="small"
                  onClick={() => copyToClipboard(script.script.content)}
                >
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="编辑">
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditingScript(script);
                    setEditDialogOpen(true);
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="删除">
                <IconButton
                  size="small"
                  onClick={() => handleDeleteScript(script._id!)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Typography variant="body2" paragraph>
            {script.script.content}
          </Typography>
          
          {script.script.variables && script.script.variables.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                变量占位符:
              </Typography>
              <List dense>
                {script.script.variables.map((variable, index) => (
                  <ListItem key={index} sx={{ py: 0.5, pl: 0 }}>
                    <ListItemText
                      primary={`• {${variable}}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              使用统计:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              使用次数: {script.usage.timesUsed} | 成功率: {Math.round(script.usage.successRate * 100)}% | 效果评分: {script.script.effectiveness}/10
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderGeneratedScript = () => {
    if (!generatedScript) return null;

    return (
      <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="primary">
              新生成的销售脚本
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={() => copyToClipboard(generatedScript.script.content)}
                sx={{ mr: 1 }}
              >
                复制
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveScript(generatedScript)}
              >
                保存
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={methodologies.find(m => m.value === generatedScript.methodology)?.label}
              size="small"
              sx={{ bgcolor: getMethodologyColor(generatedScript.methodology), color: 'white' }}
            />
            <Chip
              label={categories.find(s => s.value === generatedScript.category)?.label}
              size="small"
              sx={{ bgcolor: getStageColor(generatedScript.category) }}
            />
          </Box>
          
          <Typography variant="body1" paragraph>
            {generatedScript.script.content}
          </Typography>
          
          {generatedScript.script.variables && generatedScript.script.variables.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                变量占位符:
              </Typography>
              <List dense>
                {generatedScript.script.variables.map((variable, index) => (
                  <ListItem key={index} sx={{ py: 0.5, pl: 0 }}>
                    <ListItemText
                      primary={`• {${variable}}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h5" gutterBottom>
        AI销售脚本生成器
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Generation Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          生成新脚本
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>销售方法论</InputLabel>
              <Select
                value={selectedMethodology}
                label="销售方法论"
                onChange={(e) => setSelectedMethodology(e.target.value)}
              >
                {methodologies.map((method) => (
                  <MenuItem key={method.value} value={method.value}>
                    {method.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>脚本类别</InputLabel>
              <Select
                value={selectedCategory}
                label="脚本类别"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={isGenerating ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
              onClick={handleGenerateScript}
              disabled={isGenerating}
              sx={{ height: 56 }}
            >
              {isGenerating ? '生成中...' : '生成脚本'}
            </Button>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="自定义提示 (可选)"
              placeholder="输入特定的要求或背景信息..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Generated Script */}
      {renderGeneratedScript()}

      {/* Saved Scripts */}
      <Box>
        <Typography variant="h6" gutterBottom>
          已保存的脚本 ({scripts.length})
        </Typography>
        
        {scripts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <AutoAwesomeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              暂无保存的脚本
            </Typography>
            <Typography variant="body2" color="text.secondary">
              生成并保存您的第一个AI销售脚本
            </Typography>
          </Paper>
        ) : (
          scripts.map(renderScriptCard)
        )}
      </Box>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>编辑销售脚本</DialogTitle>
        <DialogContent>
          {editingScript && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="标题"
                value={editingScript.script.title}
                onChange={(e) => setEditingScript({
                  ...editingScript,
                  script: {
                    ...editingScript.script,
                    title: e.target.value
                  }
                })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={8}
                label="脚本内容"
                value={editingScript.script.content}
                onChange={(e) => setEditingScript({
                  ...editingScript,
                  script: {
                    ...editingScript.script,
                    content: e.target.value
                  }
                })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            取消
          </Button>
          <Button
            variant="contained"
            onClick={() => editingScript && handleUpdateScript(editingScript)}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScriptGenerator;