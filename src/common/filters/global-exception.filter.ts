import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'InternalServerError';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      error = exception.name;
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const body = responseBody as Record<string, unknown>;
        message = (body.message as string) || message;
        details = body.details ?? body;
        error = (body.error as string) || error;
      }
    } else if (exception instanceof Error) {
      const isDevelopment = process.env.NODE_ENV !== 'production';
      if (isDevelopment) {
        // Print full exception for debugging in non-production environments
        // eslint-disable-next-line no-console
        console.error(exception);
        error = exception.name;
        message = exception.message;
        details = exception.stack;
      } else {
        // Preserve safe production behavior
        error = exception.name;
        message = 'Internal server error';
        details = undefined;
      }
    }

    const payload = {
      success: false,
      statusCode: status,
      error,
      message,
      ...(details !== undefined ? { details } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(payload);
  }
}
