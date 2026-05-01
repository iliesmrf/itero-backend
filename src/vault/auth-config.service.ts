import { Injectable } from '@nestjs/common';
import { SecretsService } from '../vault/secrets.service';
import { JwtService } from '@nestjs/jwt';

/**
 * Exemple d'utilisation du service Vault dans l'auth
 */
@Injectable()
export class AuthConfigService {
  constructor(
    private secretsService: SecretsService,
    private jwtService: JwtService,
  ) {}

  /**
   * Récupérer la configuration JWT avec secrets sécurisés de Vault
   */
  async getJWTConfig() {
    const secret = await this.secretsService.getJWTSecret();
    return {
      secret,
      signOptions: { expiresIn: '24h' },
    };
  }

  /**
   * Récupérer la configuration Google OAuth
   */
  async getGoogleConfig() {
    return await this.secretsService.getGoogleOAuthSecrets();
  }

  /**
   * Récupérer la configuration GitHub OAuth
   */
  async getGitHubConfig() {
    return await this.secretsService.getGitHubOAuthSecrets();
  }

  /**
   * Récupérer la configuration MongoDB
   */
  async getMongoDBConfig() {
    return await this.secretsService.getMongoDBSecrets();
  }
}
