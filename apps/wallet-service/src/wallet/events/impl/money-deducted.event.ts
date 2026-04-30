export class MoneyDeductedEvent {
  constructor(
    public readonly fromUserId: string,
    public readonly toUserId: string,
    public readonly amount: number,
    public readonly transactionId: string,
    public readonly ip: string,
  ) {}
}
