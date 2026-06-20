import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from './common/decorators/public.decorator';
import { join } from 'path';

/**
 * SPA Fallback Controller
 * Serves index.html for all routes not handled by API routes
 * This enables React Router and other client-side routers to work properly
 * 
 * Priority: SPA fallback runs AFTER ServeStaticModule (API routes are excluded)
 */
@Public()
@Controller()
export class SpaFallbackController {
  @Get('*')
  serveIndex(@Res() res: Response) {
    // From compiled main.js in dist/, resolve to frontend/dist/index.html
    const indexPath = join(__dirname, '..', 'frontend', 'dist', 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Failed to serve index.html:', err);
        res.status(500).json({
          success: false,
          statusCode: 500,
          message: 'Failed to load application',
          path: res.req.path,
        });
      }
    });
  }
}
