import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';

@Global() // Global so we don't have to import it in every feature module
@Module({
    providers: [CacheService],
    exports: [CacheService],
})
export class CacheModule { }