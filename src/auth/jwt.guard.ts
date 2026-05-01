import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from './auth.types';

// ── HTTP guard ─────────────────────────────────────────────────────────────
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('Token manquant');

    try {
      req.user = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET || 'changeme-in-production',
      });
      return true;
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }

  private extractToken(req: any): string | null {
    const auth = req.headers?.authorization;
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return req.query?.token ?? null;
  }
}

// ── WebSocket guard ────────────────────────────────────────────────────────
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const token =
      client.handshake?.auth?.token ||
      client.handshake?.query?.token;

    if (!token) throw new WsException('Token manquant');

    try {
      const payload = this.jwtService.verify<JwtPayload>(String(token), {
        secret: process.env.JWT_SECRET || 'changeme-in-production',
      });
      // Attach user to socket data for use in gateway
      (client as any).user = payload;
      return true;
    } catch {
      throw new WsException('Token invalide ou expiré');
    }
  }
}
