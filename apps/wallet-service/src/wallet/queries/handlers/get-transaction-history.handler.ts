import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTransactionHistoryQuery } from '../impl/get-transaction-history.query.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../entities/transaction.entity.js';

@QueryHandler(GetTransactionHistoryQuery)
export class GetTransactionHistoryHandler implements IQueryHandler<GetTransactionHistoryQuery> {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async execute(query: GetTransactionHistoryQuery) {
    const { userId, limit, offset } = query;

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: [
        { fromUserId: userId },
        { toUserId: userId },
      ],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      transactions,
      total,
      limit,
      offset,
    };
  }
}
