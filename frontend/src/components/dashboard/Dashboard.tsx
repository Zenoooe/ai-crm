import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  People,
  TrendingUp,
  Assignment,
  Phone,
} from '@mui/icons-material';
import { useAppSelector } from '../../hooks/redux.ts';

const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  const stats = [
    {
      title: '总客户数',
      value: '1,234',
      icon: <People />,
      color: '#1976d2',
    },
    {
      title: '本月新增',
      value: '89',
      icon: <TrendingUp />,
      color: '#2e7d32',
    },
    {
      title: '待跟进',
      value: '45',
      icon: <Assignment />,
      color: '#ed6c02',
    },
    {
      title: '今日通话',
      value: '12',
      icon: <Phone />,
      color: '#9c27b0',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: '新客户',
      description: '张三 已添加为新客户',
      time: '2分钟前',
      avatar: 'Z',
    },
    {
      id: 2,
      type: '通话记录',
      description: '与李四进行了30分钟通话',
      time: '1小时前',
      avatar: 'L',
    },
    {
      id: 3,
      type: '邮件发送',
      description: '向王五发送了产品介绍邮件',
      time: '3小时前',
      avatar: 'W',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        欢迎回来，{user?.profile?.firstName || '用户'}！
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        这是您的客户关系管理仪表板
      </Typography>

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    sx={{
                      bgcolor: stat.color,
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                    <Typography color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* 最近活动 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              最近活动
            </Typography>
            <List>
              {recentActivities.map((activity) => (
                <ListItem key={activity.id}>
                  <ListItemAvatar>
                    <Avatar>{activity.avatar}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={activity.description}
                    secondary={activity.time}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* 快速操作 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              快速操作
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                • 添加新客户
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 记录客户互动
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 查看分析报告
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 管理任务和提醒
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;