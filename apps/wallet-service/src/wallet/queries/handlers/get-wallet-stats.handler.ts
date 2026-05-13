import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetWalletStatsQuery } from '../impl/get-wallet-stats.query.js';
import { SearchService } from '@app/search';

@QueryHandler(GetWalletStatsQuery)
export class GetWalletStatsHandler implements IQueryHandler<GetWalletStatsQuery> {
  constructor(private readonly searchService: SearchService) {}

  async execute(query: GetWalletStatsQuery) {
    return this.searchService.getFinancialStats(query.userId);
  }
}
