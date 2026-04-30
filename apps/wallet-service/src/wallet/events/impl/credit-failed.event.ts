export class CreditFailedEvent {
  constructor(
    public readonly fromUserId: string,
    public readonly toUserId: string,
    public readonly amount: number,
    public readonly transactionId: string,
    public readonly reason: string,
  ) {}
}
