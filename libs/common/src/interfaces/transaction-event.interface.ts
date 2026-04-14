export enum TransactionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface TransactionEvent {
  status: TransactionStatus;
  fromUserId: string;
  toUserId: string;
  amount: number;
  metadata: {
    ip: string;
    timestamp: string;
    error?: string;
  };
}
