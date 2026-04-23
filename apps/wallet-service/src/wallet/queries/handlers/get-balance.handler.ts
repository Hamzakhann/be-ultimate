import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBalanceQuery } from '../impl/get-balance.query.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../../entities/wallet.entity.js';
import { BadRequestException } from '@nestjs/common';

@QueryHandler(GetBalanceQuery)
export class GetBalanceHandler implements IQueryHandler<GetBalanceQuery> {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
  ) {}

  async execute(query: GetBalanceQuery): Promise<number> {
    const { userId } = query;
    const wallet = await this.walletRepository.findOne({ where: { userId } });
    
    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }
    
    return Number(wallet.balance);
  }
}
