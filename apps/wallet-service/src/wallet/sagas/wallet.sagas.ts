import { Injectable, Logger } from '@nestjs/common';
import { Saga, ICommand, ofType } from '@nestjs/cqrs';
import { Observable } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { MoneyDeductedEvent } from '../events/impl/money-deducted.event.js';
import { CreditRecipientCommand } from '../commands/impl/credit-recipient.command.js';
import { CreditFailedEvent } from '../events/impl/credit-failed.event.js';
import { RefundSenderCommand } from '../commands/impl/refund-sender.command.js';

@Injectable()
export class WalletSagas {
  private readonly logger = new Logger(WalletSagas.name);

  @Saga()
  moneyDeducted = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(MoneyDeductedEvent),
      delay(500), // Simulate a small network delay
      map((event) => {
        this.logger.log(`Saga: Money Deducted for ${event.transactionId}. Triggering Credit...`);
        return new CreditRecipientCommand(
          event.fromUserId,
          event.toUserId,
          event.amount,
          event.transactionId,
          event.ip
        );
      }),
    );
  };

  @Saga()
  creditFailed = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(CreditFailedEvent),
      map((event) => {
        this.logger.warn(`Saga: Credit FAILED for ${event.transactionId}. Triggering REFUND for User ${event.fromUserId}...`);
        return new RefundSenderCommand(
          event.fromUserId,
          event.amount,
          event.transactionId,
          event.reason
        );
      }),
    );
  };
}
