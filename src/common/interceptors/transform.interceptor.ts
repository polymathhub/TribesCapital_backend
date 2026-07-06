import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data && 'message' in data && 'data' in data) {
          return data;
        }

        const request = context.switchToHttp().getRequest();
        const path = request?.url || '';
        const isAuthRoute = path.includes('/auth/');

        const message = this.resolveMessage(path, data);

        return {
          success: true,
          message,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private resolveMessage(path: string, data: unknown): string {
    if (path.includes('/auth/login') || path.includes('/auth/register') || path.includes('/auth/google') || path.includes('/auth/refresh')) {
      return 'Authentication successful';
    }

    if (data && typeof data === 'object' && 'message' in data && typeof (data as Record<string, unknown>).message === 'string') {
      return (data as Record<string, unknown>).message as string;
    }

    return 'Request completed successfully';
  }
}
