import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { VaultModule, SecretsService } from './vault';

// Exemple: Configuration avec Vault pour les modules critiques

@Module({
  imports: [
    // Config module
    ConfigModule.forRoot(),

    // Vault global
    VaultModule,

    // MongoDB avec secrets de Vault
    MongooseModule.forRootAsync({
      useFactory: async (secretsService: SecretsService) => {
        const mongoConfig = await secretsService.getMongoDBSecrets();
        
        return {
          uri: `mongodb://${mongoConfig.username}:${mongoConfig.password}@${mongoConfig.host}:${mongoConfig.port}/${mongoConfig.database}?authSource=admin`,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        };
      },
      inject: [SecretsService],
    }),

    // JWT avec secrets de Vault
    JwtModule.registerAsync({
      useFactory: async (secretsService: SecretsService) => {
        const jwtSecret = await secretsService.getJWTSecret();
        
        return {
          secret: jwtSecret,
          signOptions: { expiresIn: '24h' },
        };
      },
      inject: [SecretsService],
    }),

    // Passport authentication
    PassportModule,

    // Autres modules...
  ],
  // ...
})
export class AppModule {}
