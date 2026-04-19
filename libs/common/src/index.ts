import { join } from 'path';
export * from './guards/jwt-auth.guard.js';
export * from './decorators/current-user.decorator.js';
export * from './interfaces/transaction-event.interface.js';
export * from './strategies/jwt.strategy.js';
export * from './filters/rpc-exception.filter.js';

export const USER_PROTO_PATH = join(process.cwd(), 'libs/common/src/proto/user.proto');