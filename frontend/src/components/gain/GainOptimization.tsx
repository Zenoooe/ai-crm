import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Paper,
  LinearProgress,
  Chip,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Upload,
  TrendingUp,
  Analytics,
  Lightbulb,
  Refresh,
  FileUpload,
  Assessment
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { apiClient } from '../../services/api.ts';

interface GainStep {
  id: number | null;
  content: string;
  order: number;
  completed: boolean;
  ai_generated: boolean;
  completion_date: string | null;
}

interface GainReport {
  id: number;
  circle: string;
  conversion_rate: number;
  roi: number;
  total_contacts: number;
  successful_contacts: number;
  ai_optimized: boolean;
  optimization_suggestions: string[];
  created_at: string;
  report_data: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`gain-tabpanel-${index}`}
      aria-labelledby={`gain-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const GainOptimization: React.FC = () => {
  const [selectedCircle, setSelectedCircle] = useState<string>('MBA');
  const [gainSteps, setGainSteps] = useState<GainStep[]>([]);
  const [reports, setReports] = useState<GainReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [optimizeDialogOpen, setOptimizeDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    total_contacts: '',
    successful_contacts: '',
    conversion_rate: '',
    roi: '',
    notes: ''
  });
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const circles = [
    { value: 'MBA', label: 'MBA圈子' },
    { value: '港澳', label: '港澳圈子' },
    { value: '餐饮行会', label: '餐饮行会' },
    { value: '俱乐部', label: '俱乐部' },
    { value: '暨南大学', label: '暨南大学' }
  ];

  useEffect(() => {
    fetchGainSteps();
    fetchReports();
  }, [selectedCircle]);

  const fetchGainSteps = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/gain-steps?circle=${selectedCircle}`);
      setGainSteps(response.data.steps);
    } catch (error) {
      setError('获取获客步骤失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await apiClient.get(`/gain-reports/${selectedCircle}`);
      setReports(response.data.reports);
    } catch (error) {
      console.error('获取报告失败:', error);
    }
  };

  const handleStepToggle = (stepIndex: number) => {
    const updatedSteps = [...gainSteps];
    updatedSteps[stepIndex].completed = !updatedSteps[stepIndex].completed;
    updatedSteps[stepIndex].completion_date = updatedSteps[stepIndex].completed 
      ? new Date().toISOString() 
      : null;
    setGainSteps(updatedSteps);
  };

  const handleUploadReport = async () => {
    try {
      setLoading(true);
      const reportData = {
        circle: selectedCircle,
        total_contacts: parseInt(uploadData.total_contacts),
        successful_contacts: parseInt(uploadData.successful_contacts),
        conversion_rate: parseFloat(uploadData.conversion_rate),
        report_data: {
          roi: parseFloat(uploadData.roi),
          notes: uploadData.notes,
          upload_date: new Date().toISOString()
        }
      };

      await apiClient.post('/gain-reports', reportData);
      
      setUploadDialogOpen(false);
      setUploadData({
        total_contacts: '',
        successful_contacts: '',
        conversion_rate: '',
        roi: '',
        notes: ''
      });
      fetchReports();
      setError('');
    } catch (error) {
      setError('上传报告失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeGain = async () => {
    try {
      setLoading(true);
      const latestReport = reports[0];
      if (!latestReport) {
        setError('请先上传报告数据');
        return;
      }

      const optimizeData = {
        circle: selectedCircle,
        report_data: {
          conversion: latestReport.conversion_rate,
          total_contacts: latestReport.total_contacts,
          successful_contacts: latestReport.successful_contacts,
          roi: latestReport.roi
        }
      };

      const response = await apiClient.post('/optimize-gain', optimizeData);
      setOptimizationResult(response.data);
      setOptimizeDialogOpen(true);
      setError('');
    } catch (error) {
      setError('优化分析失败');
    } finally {
      setLoading(false);
    }
  };

  const completedSteps = gainSteps.filter(step => step.completed).length;
  const progressPercentage = gainSteps.length > 0 ? (completedSteps / gainSteps.length) * 100 : 0;

  const chartData = reports.map(report => ({
    date: new Date(report.created_at).toLocaleDateString(),
    conversion_rate: report.conversion_rate,
    roi: report.roi,
    total_contacts: report.total_contacts
  })).reverse();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        获客流程与优化模块
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 圈子选择 */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                选择圈子
              </Typography>
              <FormControl fullWidth>
                <InputLabel>圈子</InputLabel>
                <Select
                  value={selectedCircle}
                  label="圈子"
                  onChange={(e) => setSelectedCircle(e.target.value)}
                >
                  {circles.map((circle) => (
                    <MenuItem key={circle.value} value={circle.value}>
                      {circle.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  进度概览
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progressPercentage} 
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {completedSteps}/{gainSteps.length} 步骤已完成
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<Upload />}
                  fullWidth
                  onClick={() => setUploadDialogOpen(true)}
                  sx={{ mb: 1 }}
                >
                  上传报告
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Lightbulb />}
                  fullWidth
                  onClick={handleOptimizeGain}
                  disabled={reports.length === 0}
                >
                  AI优化建议
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 主要内容区域 */}
        <Grid item xs={12} md={9}>
          <Card>
            <CardContent>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="每日步骤" icon={<CheckCircle />} />
                <Tab label="报告分析" icon={<Analytics />} />
                <Tab label="趋势图表" icon={<TrendingUp />} />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Typography variant="h6" gutterBottom>
                  {selectedCircle} - 每日获客步骤
                </Typography>
                {loading ? (
                  <LinearProgress />
                ) : (
                  <List>
                    {gainSteps.map((step, index) => (
                      <ListItem key={index} divider>
                        <ListItemIcon>
                          <Checkbox
                            icon={<RadioButtonUnchecked />}
                            checkedIcon={<CheckCircle />}
                            checked={step.completed}
                            onChange={() => handleStepToggle(index)}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={step.content}
                          secondary={
                            <Box>
                              {step.ai_generated && (
                                <Chip 
                                  label="AI生成" 
                                  size="small" 
                                  color="primary" 
                                  sx={{ mr: 1 }}
                                />
                              )}
                              {step.completion_date && (
                                <Typography variant="caption" color="text.secondary">
                                  完成时间: {new Date(step.completion_date).toLocaleString()}
                                </Typography>
                              )}
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                          sx={{
                            textDecoration: step.completed ? 'line-through' : 'none',
                            opacity: step.completed ? 0.7 : 1
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>
                  报告分析
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>日期</TableCell>
                        <TableCell align="right">转化率</TableCell>
                        <TableCell align="right">ROI</TableCell>
                        <TableCell align="right">总接触</TableCell>
                        <TableCell align="right">成功接触</TableCell>
                        <TableCell align="center">AI优化</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            {new Date(report.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">
                            {report.conversion_rate.toFixed(1)}%
                          </TableCell>
                          <TableCell align="right">
                            {report.roi.toFixed(1)}%
                          </TableCell>
                          <TableCell align="right">
                            {report.total_contacts}
                          </TableCell>
                          <TableCell align="right">
                            {report.successful_contacts}
                          </TableCell>
                          <TableCell align="center">
                            {report.ai_optimized ? (
                              <Chip label="已优化" color="success" size="small" />
                            ) : (
                              <Chip label="未优化" color="default" size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom>
                  趋势分析
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        转化率趋势
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="conversion_rate" 
                            stroke="#8884d8" 
                            name="转化率(%)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        ROI趋势
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="roi" 
                            stroke="#82ca9d" 
                            name="ROI(%)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        接触人数统计
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="total_contacts" fill="#8884d8" name="总接触人数" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 上传报告对话框 */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>上传获客报告</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="总接触人数"
                type="number"
                value={uploadData.total_contacts}
                onChange={(e) => setUploadData({...uploadData, total_contacts: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="成功接触人数"
                type="number"
                value={uploadData.successful_contacts}
                onChange={(e) => setUploadData({...uploadData, successful_contacts: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="转化率 (%)"
                type="number"
                value={uploadData.conversion_rate}
                onChange={(e) => setUploadData({...uploadData, conversion_rate: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="ROI (%)"
                type="number"
                value={uploadData.roi}
                onChange={(e) => setUploadData({...uploadData, roi: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="备注"
                multiline
                rows={3}
                value={uploadData.notes}
                onChange={(e) => setUploadData({...uploadData, notes: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>取消</Button>
          <Button onClick={handleUploadReport} variant="contained" disabled={loading}>
            上传
          </Button>
        </DialogActions>
      </Dialog>

      {/* 优化建议对话框 */}
      <Dialog 
        open={optimizeDialogOpen} 
        onClose={() => setOptimizeDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>AI优化建议</DialogTitle>
        <DialogContent>
          {optimizationResult && (
            <Box>
              <Typography variant="h6" gutterBottom>
                性能分析
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {optimizationResult.performance_analysis.conversion_rate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">转化率</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="secondary">
                      {optimizationResult.performance_analysis.success_rate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">成功率</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4">
                      {optimizationResult.performance_analysis.total_contacts}
                    </Typography>
                    <Typography variant="body2">总接触</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {optimizationResult.performance_analysis.successful_contacts}
                    </Typography>
                    <Typography variant="body2">成功接触</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                优化建议
              </Typography>
              <List>
                {optimizationResult.optimization_suggestions.map((suggestion: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Lightbulb color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={suggestion} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOptimizeDialogOpen(false)}>关闭</Button>
          <Button 
            onClick={() => {
              setOptimizeDialogOpen(false);
              fetchGainSteps(); // 重新获取可能更新的步骤
            }} 
            variant="contained"
          >
            应用建议
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GainOptimization;