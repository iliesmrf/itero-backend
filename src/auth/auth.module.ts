import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { GithubStrategy } from './github.strategy';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard, WsJwtGuard } from './jwt.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    GithubStrategy,
    JwtStrategy,
    JwtAuthGuard,
    WsJwtGuard,
  ],
  exports: [AuthService, JwtAuthGuard, WsJwtGuard, JwtModule],
})
export class AuthModule {}
