import { Controller, Get, Param, Query, HttpException, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { DiscoveryService } from '@app/common';
import axios from 'axios';
import { JwtAuthGuard } from '@app/common';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('logs/:userId')
  async getLogs(@Param('userId') userId: string, @Query('limit') limit?: string) {
    try {
      const { address, port } = await this.discoveryService.discoverService('audit-service');
      const response = await axios.get(`http://${address}:${port}/api/v1/audit/logs/${userId}`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to proxy audit logs: ${error.message}`);
      throw new HttpException(
        error.response?.data?.message || 'Audit service unavailable',
        error.response?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('stats/:userId')
  async getStats(@Param('userId') userId: string) {
    try {
      const { address, port } = await this.discoveryService.discoverService('audit-service');
      const response = await axios.get(`http://${address}:${port}/api/v1/audit/stats/${userId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to proxy audit stats: ${error.message}`);
      throw new HttpException(
        error.response?.data?.message || 'Audit service unavailable',
        error.response?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
