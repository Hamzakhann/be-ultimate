import { Injectable, OnModuleInit, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Consul from 'consul';

@Injectable()
export class DiscoveryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DiscoveryService.name);
  private consul: Consul;
  private serviceIds: string[] = [];

  constructor(private readonly configService: ConfigService) {
    this.consul = new Consul({
      host: this.configService.get('CONSUL_HOST', 'localhost'),
      port: Number(this.configService.get('CONSUL_PORT', 8500)),
    });
  }

  async onModuleInit() {
    const serviceName = this.configService.get('SERVICE_NAME');
    const servicePort = Number(this.configService.get('SERVICE_PORT'));
    const grpcServiceName = this.configService.get('GRPC_SERVICE_NAME');
    const grpcServicePort = Number(this.configService.get('GRPC_SERVICE_PORT'));
    const serviceAddress = this.configService.get('SERVICE_ADDRESS', 'localhost');
    
    this.serviceIds = [];

    if (serviceName && servicePort) {
      await this.register(serviceName, servicePort, serviceAddress);
    }

    if (grpcServiceName && grpcServicePort) {
      await this.register(grpcServiceName, grpcServicePort, serviceAddress, true);
    }
  }

  private async register(name: string, port: number, address: string, isGrpc = false) {
    const id = isGrpc ? `${name}-grpc` : name;
    this.serviceIds.push(id);

    const healthAddress = this.configService.get('HEALTH_CHECK_ADDRESS', address);
    const healthPath = this.configService.get('HEALTH_CHECK_PATH', '/health');
    const healthPort = this.configService.get('HEALTH_CHECK_PORT', port);
    
    // Use HTTP health check even for gRPC service for simplicity in this setup
    const healthUrl = `http://${healthAddress}:${healthPort}${healthPath}`;

    try {
      await this.consul.agent.service.register({
        id,
        name,
        address,
        port,
        check: {
          name: `${name} health check`,
          http: healthUrl,
          interval: '10s',
          timeout: '5s',
          deregistercriticalserviceafter: '1m',
        },
      });
      this.logger.log(`Service ${name} registered with Consul (ID: ${id})`);
    } catch (error) {
      this.logger.error(`Consul registration failed for ${name}: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    for (const id of this.serviceIds) {
      try {
        await this.consul.agent.service.deregister(id);
        this.logger.log(`Service ${id} deregistered from Consul`);
      } catch (error) {
        this.logger.error(`Consul deregistration failed for ${id}: ${error.message}`);
      }
    }
  }

  /**
   * Discover a healthy service by name
   */
  async discoverService(serviceName: string): Promise<{ address: string; port: number }> {
    try {
      // Use health.service to get only passing nodes
      const services = await this.consul.health.service({
        service: serviceName,
        passing: true,
      });

      if (services && services.length > 0) {
        // Pick the first healthy instance
        const entry = services[0];
        const address = entry.Service.Address || entry.Node.Address;
        const port = entry.Service.Port;
        
        this.logger.log(`Discovered healthy service ${serviceName} at ${address}:${port}`);
        
        return { address, port };
      }
      throw new Error(`No healthy instances of ${serviceName} found in Consul`);
    } catch (error) {
      this.logger.error(`Service discovery failed for ${serviceName}: ${error.message}`);
      throw error;
    }
  }
}
