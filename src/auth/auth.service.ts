import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuthUser, JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  /**
   * Called after successful OAuth — returns a signed JWT.
   */
  login(user: OAuthUser): string {
    const payload: JwtPayload = {
      sub:      `${user.provider}:${user.id}`,
      email:    user.email,
      name:     user.name,
      avatar:   user.avatar,
      provider: user.provider,
    };

    return this.jwtService.sign(payload, {
      secret:    process.env.JWT_SECRET || 'changeme-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }

  /**
   * Verify and decode a JWT (used in WS handshake validation).
   */
  verify(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET || 'changeme-in-production',
      });
    } catch {
      return null;
    }
  }
}
