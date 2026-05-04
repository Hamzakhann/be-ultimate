export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Transaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  userId: string;
  action: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface UserStats {
  userId: string;
  totalTransactions: number;
  totalVolumeUSD: number;
  lastActivity: string;
}
