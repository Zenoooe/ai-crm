import { useEffect, useRef, useState, useCallback } from 'react';

// WebSocket消息类型
interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

// WebSocket连接状态
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// WebSocket Hook配置
interface UseWebSocketOptions {
  url: string;
  clientId: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

// WebSocket Hook返回值
interface UseWebSocketReturn {
  connectionStatus: ConnectionStatus;
  sendMessage: (type: string, data: any) => void;
  lastMessage: WebSocketMessage | null;
  isConnected: boolean;
  reconnect: () => void;
  disconnect: () => void;
}

export const useWebSocket = (options: UseWebSocketOptions): UseWebSocketReturn => {
  const {
    url,
    clientId,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const isManualDisconnectRef = useRef(false);

  // 清理重连定时器
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // 连接WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      const wsUrl = `${url}/${clientId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket连接已建立');
        setConnectionStatus('connected');
        reconnectCountRef.current = 0;
        clearReconnectTimeout();
        
        // 发送ping消息保持连接
        ws.send(JSON.stringify({
          type: 'ping',
          data: { clientId },
          timestamp: new Date().toISOString()
        }));
        
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // 处理pong消息
          if (message.type === 'pong') {
            console.log('收到pong消息');
            return;
          }
          
          onMessage?.(message);
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket连接已关闭:', event.code, event.reason);
        setConnectionStatus('disconnected');
        wsRef.current = null;
        
        onDisconnect?.();
        
        // 如果不是手动断开连接，尝试重连
        if (!isManualDisconnectRef.current && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          console.log(`尝试重连 (${reconnectCountRef.current}/${reconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        setConnectionStatus('error');
        onError?.(error);
      };
    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
      setConnectionStatus('error');
    }
  }, [url, clientId, reconnectAttempts, reconnectInterval, onConnect, onMessage, onDisconnect, onError, clearReconnectTimeout]);

  // 发送消息
  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: new Date().toISOString()
      };
      
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }, []);

  // 手动重连
  const reconnect = useCallback(() => {
    isManualDisconnectRef.current = false;
    reconnectCountRef.current = 0;
    clearReconnectTimeout();
    
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    connect();
  }, [connect, clearReconnectTimeout]);

  // 断开连接
  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    clearReconnectTimeout();
    
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, [clearReconnectTimeout]);

  // 组件挂载时连接
  useEffect(() => {
    connect();
    
    // 组件卸载时断开连接
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // 定期发送ping消息保持连接
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const pingInterval = setInterval(() => {
        sendMessage('ping', { clientId });
      }, 30000); // 每30秒发送一次ping
      
      return () => clearInterval(pingInterval);
    }
  }, [connectionStatus, sendMessage, clientId]);

  return {
    connectionStatus,
    sendMessage,
    lastMessage,
    isConnected: connectionStatus === 'connected',
    reconnect,
    disconnect,
  };
};

// WebSocket消息类型常量
export const WS_MESSAGE_TYPES = {
  // 系统消息
  PING: 'ping',
  PONG: 'pong',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // 客户相关
  CUSTOMER_CREATED: 'customer_created',
  CUSTOMER_UPDATED: 'customer_updated',
  CUSTOMER_DELETED: 'customer_deleted',
  CUSTOMER_PROGRESS_UPDATED: 'customer_progress_updated',
  
  // 提醒相关
  REMINDER_CREATED: 'reminder_created',
  REMINDER_UPDATED: 'reminder_updated',
  REMINDER_TRIGGERED: 'reminder_triggered',
  REMINDER_COMPLETED: 'reminder_completed',
  
  // AI相关
  AI_ANALYSIS_STARTED: 'ai_analysis_started',
  AI_ANALYSIS_COMPLETED: 'ai_analysis_completed',
  AI_SCRIPT_GENERATED: 'ai_script_generated',
  
  // 通知相关
  NOTIFICATION: 'notification',
  ALERT: 'alert',
  
  // 订阅相关
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
} as const;

// 通知类型
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: {
    label: string;
    action: string;
    data?: any;
  }[];
}

// 实时通知Hook
export const useRealtimeNotifications = (clientId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case WS_MESSAGE_TYPES.NOTIFICATION:
        const notification: Notification = {
          id: Date.now().toString(),
          ...message.data,
          timestamp: message.timestamp,
          read: false,
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]); // 保留最近50条
        setUnreadCount(prev => prev + 1);
        
        // 显示浏览器通知
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id,
          });
        }
        break;
        
      case WS_MESSAGE_TYPES.CUSTOMER_UPDATED:
        const customerNotification: Notification = {
          id: Date.now().toString(),
          type: 'info',
          title: '客户信息更新',
          message: `客户 ${message.data.customer_name} 的信息已更新`,
          timestamp: message.timestamp,
          read: false,
        };
        
        setNotifications(prev => [customerNotification, ...prev.slice(0, 49)]);
        setUnreadCount(prev => prev + 1);
        break;
        
      case WS_MESSAGE_TYPES.REMINDER_TRIGGERED:
        const reminderNotification: Notification = {
          id: Date.now().toString(),
          type: 'warning',
          title: '提醒通知',
          message: message.data.title,
          timestamp: message.timestamp,
          read: false,
          actions: [
            { label: '完成', action: 'complete_reminder', data: { reminderId: message.data.id } },
            { label: '延迟', action: 'snooze_reminder', data: { reminderId: message.data.id } },
          ],
        };
        
        setNotifications(prev => [reminderNotification, ...prev.slice(0, 49)]);
        setUnreadCount(prev => prev + 1);
        break;
        
      case WS_MESSAGE_TYPES.AI_ANALYSIS_COMPLETED:
        const aiNotification: Notification = {
          id: Date.now().toString(),
          type: 'success',
          title: 'AI分析完成',
          message: `客户 ${message.data.customer_name} 的AI分析已完成`,
          timestamp: message.timestamp,
          read: false,
          actions: [
            { label: '查看结果', action: 'view_analysis', data: { customerId: message.data.customer_id } },
          ],
        };
        
        setNotifications(prev => [aiNotification, ...prev.slice(0, 49)]);
        setUnreadCount(prev => prev + 1);
        break;
    }
  }, []);

  const { connectionStatus, sendMessage, isConnected } = useWebSocket({
    url: 'ws://localhost:8000/ws',
    clientId,
    onMessage: handleMessage,
    onConnect: () => {
      // 订阅通知
      sendMessage(WS_MESSAGE_TYPES.SUBSCRIBE, {
        topics: ['notifications', 'customer_updates', 'reminders', 'ai_analysis']
      });
    },
  });

  // 标记通知为已读
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // 标记所有通知为已读
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // 清除通知
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.read ? Math.max(0, prev - 1) : prev;
    });
  }, [notifications]);

  // 清除所有通知
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    connectionStatus,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    sendMessage,
  };
};

// 客户实时更新Hook
export const useCustomerRealtimeUpdates = (clientId: string) => {
  const [customerUpdates, setCustomerUpdates] = useState<any[]>([]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case WS_MESSAGE_TYPES.CUSTOMER_CREATED:
      case WS_MESSAGE_TYPES.CUSTOMER_UPDATED:
      case WS_MESSAGE_TYPES.CUSTOMER_DELETED:
      case WS_MESSAGE_TYPES.CUSTOMER_PROGRESS_UPDATED:
        setCustomerUpdates(prev => [message, ...prev.slice(0, 99)]); // 保留最近100条更新
        break;
    }
  }, []);

  const { connectionStatus, sendMessage, isConnected } = useWebSocket({
    url: 'ws://localhost:8000/ws',
    clientId,
    onMessage: handleMessage,
    onConnect: () => {
      // 订阅客户更新
      sendMessage(WS_MESSAGE_TYPES.SUBSCRIBE, {
        topics: ['customer_updates']
      });
    },
  });

  return {
    customerUpdates,
    connectionStatus,
    isConnected,
    sendMessage,
  };
};

export default useWebSocket;