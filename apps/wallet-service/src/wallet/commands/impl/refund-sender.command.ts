export class RefundSenderCommand {
  constructor(
    public readonly fromUserId: string,
    public readonly amount: number,
    public readonly transactionId: string,
    public readonly reason: string,
  ) {}
}
