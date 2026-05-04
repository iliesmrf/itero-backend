import {
  Controller, Get, Post, Body, Req, Res, UseGuards, HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { AnonymousUser } from './auth.types';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ── Google ──────────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport redirects to Google — nothing to do here
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request, @Res() res: Response) {
    const token = this.authService.login(req.user as any);
    // Redirect to frontend with token in query param
    // Frontend will store it in localStorage
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }

  // ── GitHub ──────────────────────────────────────────────────────────────

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubCallback(@Req() req: Request, @Res() res: Response) {
    const token = this.authService.login(req.user as any);
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }

  // ── Me (protected) ──────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  getMe(@Req() req: Request) {
    return req.user;
  }

  // ── Anonymous login ─────────────────────────────────────────────────

  @Post('anonymous')
  @HttpCode(200)
  loginAnonymous(@Body() body: AnonymousUser) {
    const token = this.authService.loginAnonymous(body);
    return { token };
  }

  // ── Logout (client-side only — just returns 200) ─────────────────────

  @Get('logout')
  logout(@Res() res: Response) {
    res.json({ ok: true });
  }
}
