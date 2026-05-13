'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.profile?.userId) return;

    // Connect to notification service
    // We point to port 3004 which is the Notification Service WebSocket gateway
    const socket = io('http://localhost:3004', {
      query: { userId: user.profile.userId },
      transports: ['websocket'], // Force websocket to avoid polling issues
    });

    socket.on('connect', () => {
      console.log(`[Socket] Connected to Notifications (User: ${user.profile?.userId})`);
    });

    socket.on('transfer_received', (data) => {
      console.log('[Socket] Transfer received event:', data);
      
      toast.success('Money Received! 💰', {
        description: data.message || `You just received $${data.amount}`,
        duration: 8000,
      });

      // Refetch financial data immediately so UI reflects the new balance/history
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-stats'] });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.profile?.userId, queryClient]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}
