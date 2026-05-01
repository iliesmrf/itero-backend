import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { GithubStrategy } from './github.strategy';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard, WsJwtGuard } from './jwt.guard';
import { VaultModule } from '../vault/vault.module';
import { VaultService } from '../vault/vault.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule, VaultModule],
      useFactory: async (configService: ConfigService, vaultService: VaultService) => {
        // Try Vault first, fallback to env vars
        let secret: string;
        let expiresIn: string;
        try {
          const jwt = await vaultService.getSecret('itero/jwt');
          secret = jwt.secret as string;
          expiresIn = jwt.expiration as string || '7d';
          console.log('✅ JWT config loaded from Vault');
        } catch (error) {
          console.warn('⚠️ Vault unavailable, using env vars for JWT');
          secret = configService.get<string>('JWT_SECRET') || 'changeme-in-production';
          expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';
        }
        return { secret, signOptions: { expiresIn } };
      },
      inject: [ConfigService, VaultService],
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
