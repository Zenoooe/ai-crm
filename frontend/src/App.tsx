import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store/store.ts';
import Layout from './components/common/Layout/Layout.tsx';
import Dashboard from './components/dashboard/Dashboard.tsx';
import ContactsPage from './components/contacts/ContactsPage.tsx';
import AnalyticsPage from './components/analytics/AnalyticsPage.tsx';
import SettingsPage from './components/settings/SettingsPage.tsx';
import LoginPage from './components/auth/LoginPage.tsx';
import UniversalAI from './components/ai/UniversalAI.tsx';
import AISalesAssistant from './components/ai/AISalesAssistant.tsx';
import FolderManagementPage from './pages/FolderManagementPage.tsx';
import GainOptimization from './components/gain/GainOptimization.tsx';
import { useAppSelector } from './hooks/redux.ts';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function AppContent() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/ai" element={<UniversalAI />} />
        <Route path="/ai-assistant" element={<AISalesAssistant customer={{ id: 1, name: '示例客户', progress: 50, priority: 2 }} />} />
        <Route path="/folder-management" element={<FolderManagementPage />} />
        <Route path="/gain-optimization" element={<GainOptimization />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;