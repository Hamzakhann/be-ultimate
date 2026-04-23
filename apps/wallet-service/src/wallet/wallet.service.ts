import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity.js';

@Injectable()
export class WalletService {
  constructor(
    private readonly dataSource: DataSource,
  ) { }

  async createWallet(userId: string): Promise<Wallet> {
    const walletRepository = this.dataSource.getRepository(Wallet);

    // Idempotency check: Check if wallet already exists
    const existingWallet = await walletRepository.findOne({ where: { userId } });
    if (existingWallet) {
      return existingWallet;
    }

    const wallet = walletRepository.create({ userId, balance: 0 });
    return await walletRepository.save(wallet);
  }

  async getBalance(userId: string): Promise<number> {
    const wallet = await this.dataSource.getRepository(Wallet).findOne({ where: { userId } });
    if (!wallet) throw new BadRequestException('Wallet not found');
    return Number(wallet.balance);
  }
}
