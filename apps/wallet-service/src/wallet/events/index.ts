import { MoneyTransferredHandler } from './handlers/money-transferred.handler.js';
import { MoneyRefundedHandler } from './handlers/money-refunded.handler.js';

export const EventHandlers = [
  MoneyTransferredHandler,
  MoneyRefundedHandler,
];
