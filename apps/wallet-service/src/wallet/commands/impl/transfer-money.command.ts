export class TransferMoneyCommand {
  constructor(
    public readonly fromUserId: string,
    public readonly toUserId: string,
    public readonly amount: number,
    public readonly ip: string,
  ) {}
}