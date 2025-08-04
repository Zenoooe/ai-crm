/**
 * Socket.IO 事件处理器
 * 处理实时通信相关的事件
 */
import { Server } from 'socket.io';
import { logger } from '../utils/logger';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket) => {
    logger.info(`用户连接: ${socket.id}`);

    // 用户加入房间
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      logger.info(`用户 ${socket.id} 加入房间 ${roomId}`);
    });

    // 用户离开房间
    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
      logger.info(`用户 ${socket.id} 离开房间 ${roomId}`);
    });

    // 发送消息
    socket.on('send-message', (data: { roomId: string; message: string; userId: string }) => {
      socket.to(data.roomId).emit('new-message', {
        message: data.message,
        userId: data.userId,
        timestamp: new Date()
      });
    });

    // 通知更新
    socket.on('notification', (data: { userId: string; type: string; content: string }) => {
      socket.broadcast.emit('new-notification', {
        type: data.type,
        content: data.content,
        timestamp: new Date()
      });
    });

    // 用户断开连接
    socket.on('disconnect', () => {
      logger.info(`用户断开连接: ${socket.id}`);
    });
  });
};