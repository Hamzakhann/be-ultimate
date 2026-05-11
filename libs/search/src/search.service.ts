import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

const TRANSACTIONS_INDEX = 'fintech-transactions';

/**
 * Index mapping for `fintech-transactions`.
 *
 * Field design rationale:
 *  - keyword  → exact-match filtering / aggregations (IDs, status, currency)
 *  - text     → full-text search with standard analyser (description)
 *  - double   → financial amounts (no precision loss)
 *  - date     → time-range queries / Kibana time series
 */
const TRANSACTIONS_MAPPING = {
  mappings: {
    properties: {
      id:          { type: 'keyword' as const },
      sender_id:   { type: 'keyword' as const },
      receiver_id: { type: 'keyword' as const },
      amount:      { type: 'double'  as const },
      currency:    { type: 'keyword' as const },
      status:      { type: 'keyword' as const },
      event_type:  { type: 'keyword' as const },
      description: {
        type:     'text' as const,
        analyzer: 'standard',
        // Sub-field for sorting / exact-match on description
        fields: {
          keyword: { type: 'keyword' as const, ignore_above: 256 },
        },
      },
      timestamp: { type: 'date' as const },
    },
  },
  settings: {
    number_of_shards:   1,
    number_of_replicas: 0, // Single-node dev setup
  },
};

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly esService: ElasticsearchService) {}

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    await this.ensureIndex();
  }

  /**
   * Idempotently creates the transactions index.
   * Safe to call on every startup — skips creation if already exists.
   */
  private async ensureIndex(): Promise<void> {
    try {
      const exists = await this.esService.indices.exists({
        index: TRANSACTIONS_INDEX,
      });

      if (!exists) {
        await this.esService.indices.create({
          index: TRANSACTIONS_INDEX,
          ...TRANSACTIONS_MAPPING,
        });
        this.logger.log(`Index "${TRANSACTIONS_INDEX}" created successfully.`);
      } else {
        this.logger.log(`Index "${TRANSACTIONS_INDEX}" already exists — skipping creation.`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to ensure index "${TRANSACTIONS_INDEX}": ${error.message}`,
        error.stack,
      );
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Index (or upsert) a single transaction document.
   * Uses the transaction's own `id` as the ES document ID for idempotency.
   */
  async indexTransaction(doc: {
    id: string;
    sender_id: string;
    receiver_id?: string;
    amount: number;
    currency?: string;
    status?: string;
    event_type?: string;
    description?: string;
    timestamp: string | Date;
  }): Promise<void> {
    try {
      await this.esService.index({
        index: TRANSACTIONS_INDEX,
        id:    doc.id,
        document: {
          ...doc,
          timestamp: doc.timestamp instanceof Date
            ? doc.timestamp.toISOString()
            : doc.timestamp,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to index transaction ${doc.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Full-text search across the description field.
   * Also supports optional keyword filters (status, sender_id).
   */
  async searchTransactions(opts: {
    query?: string;
    status?: string;
    sender_id?: string;
    from?: number;
    size?: number;
  }): Promise<{ hits: any[]; total: number }> {
    const must: any[] = [];
    const filter: any[] = [];

    if (opts.query) {
      must.push({ match: { description: opts.query } });
    } else {
      must.push({ match_all: {} });
    }

    if (opts.status)    filter.push({ term: { status:    opts.status } });
    if (opts.sender_id) filter.push({ term: { sender_id: opts.sender_id } });

    const result = await this.esService.search({
      index: TRANSACTIONS_INDEX,
      from:  opts.from ?? 0,
      size:  opts.size ?? 10,
      query: { bool: { must, filter } },
      sort:  [{ timestamp: { order: 'desc' } }],
    });

    const hits  = result.hits.hits.map((h) => ({ ...(h._source as Record<string, unknown>), _score: h._score }));
    const total = typeof result.hits.total === 'number'
      ? result.hits.total
      : (result.hits.total as any)?.value ?? 0;

    return { hits, total };
  }

  /**
   * Ping Elasticsearch — useful for health checks.
   */
  async ping(): Promise<boolean> {
    try {
      await this.esService.ping();
      return true;
    } catch {
      return false;
    }
  }
}
