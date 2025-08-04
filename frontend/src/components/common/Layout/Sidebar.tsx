import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  Contacts,
  Analytics,
  Settings,
  Psychology,
  TrendingUp,
  People,
  Assessment,
  AutoAwesome,
  BusinessCenter,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onItemClick?: () => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: <Contacts />,
    path: '/contacts',
    badge: 'AI',
  },
  {
    id: 'ai',
    label: '万能AI',
    icon: <AutoAwesome />,
    path: '/ai',
    badge: 'NEW',
  },
  {
    id: 'ai-assistant',
    label: 'AI销售助手',
    icon: <Psychology />,
    path: '/ai-assistant',
    badge: 'HOT',
  },
  {
    id: 'folder-management',
    label: '文件夹管理',
    icon: <Assessment />,
    path: '/folder-management',
    badge: 'NEW',
  },
  {
    id: 'gain-optimization',
    label: '获客优化',
    icon: <BusinessCenter />,
    path: '/gain-optimization',
    badge: 'HOT',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <Analytics />,
    path: '/analytics',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings />,
    path: '/settings',
  },
];

const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography
          variant="h5"
          component="div"
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          AI CRM
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Sales Enhancement Platform
        </Typography>
      </Box>

      <Divider />

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, p: 1 }}>
        <List>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                    },
                    '& .MuiListItemIcon-root': {
                      color: isActive ? 'primary.contrastText' : 'text.secondary',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                  {item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        bgcolor: isActive ? 'rgba(255,255,255,0.2)' : 'primary.main',
                        color: isActive ? 'primary.contrastText' : 'primary.contrastText',
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider />

      {/* Quick Stats */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Quick Stats
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <People fontSize="small" color="primary" />
              <Typography variant="body2">Contacts</Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold">156</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp fontSize="small" color="success" />
              <Typography variant="body2">Conversion</Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold" color="success.main">23%</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology fontSize="small" color="secondary" />
              <Typography variant="body2">AI Score</Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold" color="secondary.main">8.7</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;