import { GetBalanceHandler } from './handlers/get-balance.handler.js';
import { GetTransactionHistoryHandler } from './handlers/get-transaction-history.handler.js';
import { GetWalletStatsHandler } from './handlers/get-wallet-stats.handler.js';

export const QueryHandlers = [
  GetBalanceHandler, 
  GetTransactionHistoryHandler,
  GetWalletStatsHandler
];
