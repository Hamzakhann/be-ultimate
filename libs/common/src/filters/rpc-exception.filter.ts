import { Catch, ExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch(RpcException)
export class HttpRpcExceptionFilter implements ExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const error: any = exception.getError();

    const status = error?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = error?.message || error || 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message: message,
    });
  }
}
