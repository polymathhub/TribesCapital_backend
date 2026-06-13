import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

/**
 * SPA Fallback Controller
 * Serves index.html for all routes not handled by API routes
 * This enables React Router and other client-side routers to work properly
 */
@Controller()
export class SpaFallbackController {
  @Get('*')
  serveIndex(@Res() res: Response) {
    // Serve index.html for all non-API routes
    // This allows React Router to handle routing on the client side
    res.sendFile(join(__dirname, '..', 'dist', 'frontend', 'index.html'));
  }
}
