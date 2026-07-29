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

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      error = exception.name;
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const body = responseBody as Record<string, unknown>;
        const bodyMessage = body.message;

        if (typeof bodyMessage === 'string' && bodyMessage.trim()) {
          message = bodyMessage;
        } else if (Array.isArray(bodyMessage) && bodyMessage.length > 0) {
          message = 'Validation failed';
        }

        const bodyError = body.error;
        if (typeof bodyError === 'string' && bodyError.trim()) {
          error = bodyError;
        }
      }
    } else if (exception instanceof Error) {
      // Always log uncaught exceptions to console for forensic debugging.
      // The client response stays limited to safe, public information.
      // eslint-disable-next-line no-console
      console.error('========================================');
      // eslint-disable-next-line no-console
      console.error('UNCAUGHT EXCEPTION');
      // eslint-disable-next-line no-console
      console.error(`Time: ${new Date().toISOString()}`);
      // eslint-disable-next-line no-console
      console.error(`Route: ${request?.url ?? '<unknown>'}`);
      // eslint-disable-next-line no-console
      console.error(`Method: ${request?.method ?? '<unknown>'}`);
      // eslint-disable-next-line no-console
      console.error(`Exception Type: ${exception.name}`);
      // eslint-disable-next-line no-console
      console.error(`Message: ${exception.message}`);
      // eslint-disable-next-line no-console
      console.error(`Stack: ${exception.stack}`);
      // eslint-disable-next-line no-console
      console.error('========================================');

      error = exception.name || 'InternalServerError';
      message = process.env.NODE_ENV === 'production' ? 'Internal server error' : 'Unexpected error occurred';
    }

    const payload = {
      success: false,
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(payload);
  }
}
