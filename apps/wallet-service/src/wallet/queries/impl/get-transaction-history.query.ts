export class GetTransactionHistoryQuery {
  constructor(
    public readonly userId: string,
    public readonly limit: number = 10,
    public readonly offset: number = 0,
  ) {}
}
