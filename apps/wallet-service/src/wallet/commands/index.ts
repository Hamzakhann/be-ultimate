import { TransferMoneyHandler } from './handlers/transfer-money.handler.js';
import { CreditRecipientHandler } from './handlers/credit-recipient.handler.js';
import { RefundSenderHandler } from './handlers/refund-sender.handler.js';

export const CommandHandlers = [
  TransferMoneyHandler,
  CreditRecipientHandler,
  RefundSenderHandler,
];
