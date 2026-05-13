import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CacheService } from '@app/common';
import type { UserPayload } from '@app/common';
import { SearchService } from '@app/search';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('transactions')
  async searchTransactions(
    @CurrentUser() user: UserPayload,
    @Query('q') query?: string,
    @Query('status') status?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('from') from?: string,
    @Query('size') size?: string,
  ) {
    // 1. Generate deterministic cache key anchored to this exact user and query combo
    const cacheKey = `search:tx:${user.userId}:q_${query || ''}:st_${status || ''}:min_${minAmount || ''}:max_${maxAmount || ''}:f_${from || 0}:s_${size || 10}`;

    // 2. Wrap in cached wrapper (5 Minute TTL = 300 Seconds)
    const finalResult = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        this.logger.log(`🕵️ Cache Miss. Querying Elasticsearch for User[${user.userId}]`);
        const result = await this.searchService.searchTransactions({
          query,
          userId:    user.userId,
          status:    status,
          minAmount: minAmount ? parseFloat(minAmount) : undefined,
          maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
          startDate,
          endDate,
          from:      from ? parseInt(from, 10) : 0,
          size:      size ? parseInt(size, 10) : 10,
        });
        
        return {
          data: result.hits,
          total: result.total,
          aggregations: result.aggregations,
        };
      },
      300 // TTL 5 mins
    );

    return {
      success: true,
      message: 'Transactions fetched.',
      ...finalResult,
    };
  }
}
