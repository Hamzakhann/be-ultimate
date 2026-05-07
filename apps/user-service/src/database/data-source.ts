import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load user-service specific .env
config({ path: join(process.cwd(), 'apps/user-service/.env') });

/**
 * Standalone DataSource for TypeORM CLI.
 * Used by: npm run migration:generate / migration:run / migration:revert
 *
 * NOTE: entities and migrations point to compiled JS in dist/ — always
 * run `nest build user-service` before running migration commands.
 */
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.USER_DB_HOST || 'localhost',
    port: parseInt(process.env.USER_DB_PORT || '5432'),
    username: process.env.USER_DB_USERNAME || 'admin',
    password: process.env.USER_DB_PASSWORD || 'password123',
    database: process.env.USER_DB_NAME || 'fintech_user_profile',
    entities: ['dist/apps/user-service/**/*.entity.js'],
    migrations: ['dist/apps/user-service/src/database/migrations/*.js'],
    synchronize: false,
});
