import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { join } from 'path';
import { Public } from './common/decorators/public.decorator';

/**
 * Catch-all controller that serves the React SPA's index.html for any route
 * that is not an API route and does not match a static file on disk.
 *
 * This enables React Router to handle client-side routing: the browser
 * requests e.g. /dashboard, the server returns index.html, and React Router
 * renders the correct component without a full-page reload.
 *
 * API routes (/api/*) are handled by their own controllers and are never
 * intercepted here because NestJS resolves more-specific routes first.
 */
@Controller()
export class SpaFallbackController {
  @Public()
  @Get('*')
  serveSpa(@Req() req: Request, @Res() res: Response): void {
    // Never intercept API calls — they should have been handled already,
    // but guard here as a safety net.
    if (req.path.startsWith('/api')) {
      res.status(404).json({ statusCode: 404, message: 'Not Found' });
      return;
    }

    res.sendFile(join(__dirname, './frontend', 'index.html'));
  }
}
