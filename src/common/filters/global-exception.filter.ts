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
      // Always log uncaught exceptions to console for forensic debugging
      // regardless of NODE_ENV. The JSON response still preserves safe
      // production messaging but the console will contain full details.
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

      // Maintain response behavior: reveal message only in non-production
      const isDevelopment = process.env.NODE_ENV !== 'production';
      error = exception.name;
      message = isDevelopment ? exception.message : 'Internal server error';
      details = isDevelopment ? exception.stack : undefined;
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
