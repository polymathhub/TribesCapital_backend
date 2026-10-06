import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { SocialProfileImportService } from './social-profile-import.service';

@Controller('users/social-profiles')
@UseGuards(JwtAuthGuard)
export class SocialProfileImportController {
  constructor(private readonly socialProfiles: SocialProfileImportService) {}

  @Get('connect/:provider')
  connect(@CurrentUser() user: any, @Param('provider') provider: string) {
    return this.socialProfiles.createAuthorizationUrl(user.id, provider);
  }

  @Get('callback')
  @Public()
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') providerError: string,
    @Res() response: Response,
  ) {
    let provider = 'unknown';
    let result: 'connected' | 'error' = 'error';
    try {
      if (providerError) throw new Error('Provider authorization was declined');
      const completed = await this.socialProfiles.complete(code, state);
      provider = completed.provider;
      result = 'connected';
    } catch (error) {
      try {
        provider = this.socialProfiles.readProviderFromState(state);
      } catch {
        provider = 'unknown';
      }
    }

    const targetOrigin = new URL(this.socialProfiles.getFrontendOrigin()).origin;
    const message = JSON.stringify({ type: 'tribes:social-profile-connected', provider, result }).replace(/</g, '\\u003c');
    const target = JSON.stringify(targetOrigin);
    response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");
    return response.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><title>Profile connection</title></head><body><p>Profile connection ${result === 'connected' ? 'complete' : 'did not complete'}. You may close this window.</p><script>if(window.opener){window.opener.postMessage(${message},${target});window.close();}</script></body></html>`);
  }
}