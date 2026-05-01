import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RetroModule } from './retro/retro.module';
import { AuthModule } from './auth/auth.module';
import { VaultModule } from './vault/vault.module';
import { VaultService } from './vault/vault.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    VaultModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule, VaultModule],
      useFactory: async (configService: ConfigService, vaultService: VaultService) => {
        // Try Vault first, fallback to env vars
        let uri: string;
        try {
          const mongodb = await vaultService.getSecret('itero/mongodb');
          uri = `mongodb://${mongodb.username}:${mongodb.password}@${mongodb.host}:${mongodb.port}/${mongodb.database}?authSource=admin`;
          console.log('✅ MongoDB URI loaded from Vault');
        } catch (error) {
          console.warn('⚠️ Vault unavailable, using env vars for MongoDB');
          uri = configService.get<string>('MONGODB_URI') || 'mongodb://itero:itero_password_2024@localhost:27017/itero?authSource=admin';
        }
        return { uri };
      },
      inject: [ConfigService, VaultService],
    }),
    AuthModule,
    RetroModule,
  ],
})
export class AppModule {}
