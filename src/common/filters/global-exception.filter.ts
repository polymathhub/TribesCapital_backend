import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const isProduction = process.env.NODE_ENV === 'production';

    // If it's an HttpException (NestJS standard exceptions)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${exception.message}`,
      );

      response.status(status).json(exceptionResponse);
      return;
    }

    // Handle native Error types
    if (exception instanceof Error) {
      const status = HttpStatus.INTERNAL_SERVER_ERROR;

      // Log actual error for debugging
      this.logger.error(
        `Unhandled Exception: ${exception.message}`,
        exception.stack,
      );

      // Return generic message in production, details in development
      const errorMessage = isProduction
        ? 'An internal server error occurred. Please try again later.'
        : exception.message || 'An unexpected error occurred';

      response.status(status).json({
        statusCode: status,
        message: errorMessage,
        error: isProduction ? undefined : exception.name,
        timestamp: new Date().toISOString(),
      });

      return;
    }

    // Fallback for unknown exception types
    this.logger.error('Unknown exception type:', exception);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: isProduction
        ? 'An internal server error occurred. Please try again later.'
        : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    });
  }
}
