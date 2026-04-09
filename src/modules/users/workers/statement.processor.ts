import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('statement-generation')
export class StatementProcessor extends WorkerHost {
    private readonly logger = new Logger(StatementProcessor.name);

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Starting Heavy PDF Generation for Job: ${job.id}`);

        // SIMULATE HEAVY WORK (10 seconds)
        for (let i = 0; i <= 100; i += 20) {
            await new Promise(res => setTimeout(res, 2000));
            this.logger.log(`Progress for ${job.id}: ${i}%`);
            await job.updateProgress(i);
        }

        this.logger.log(`Successfully generated PDF for User: ${job.data.userId}`);
        return { downloadUrl: `https://s3.aws.com/statements/${job.id}.pdf` };
    }
}