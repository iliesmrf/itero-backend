import { Injectable } from '@nestjs/common';
import { VaultService } from './vault.service';

/**
 * Service wrapper pour centraliser tous les secrets de l'application
 * Utilise Vault pour une gestion sécurisée
 */
@Injectable()
export class SecretsService {
  constructor(private vaultService: VaultService) {}

  /**
   * Récupérer les secrets MongoDB
   */
  async getMongoDBSecrets() {
    try {
      return await this.vaultService.getSecret('itero/mongodb');
    } catch (error) {
      console.warn('Fallback sur les variables d\'environnement pour MongoDB');
      return {
        username: process.env.MONGO_USER || 'itero',
        password: process.env.MONGO_PASSWORD || 'itero_password_2024',
        database: process.env.MONGO_DB || 'itero',
        host: 'mongodb',
        port: '27017',
      };
    }
  }

  /**
   * Récupérer les secrets JWT
   */
  async getJWTSecret(): Promise<string> {
    try {
      return await this.vaultService.getSecretValue('itero/jwt', 'secret');
    } catch (error) {
      console.warn('Fallback sur les variables d\'environnement pour JWT');
      return process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    }
  }

  /**
   * Récupérer les secrets Google OAuth
   */
  async getGoogleOAuthSecrets() {
    try {
      return await this.vaultService.getSecret('itero/oauth/google');
    } catch (error) {
      console.warn('Fallback sur les variables d\'environnement pour Google OAuth');
      return {
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/google/callback`,
      };
    }
  }

  /**
   * Récupérer les secrets GitHub OAuth
   */
  async getGitHubOAuthSecrets() {
    try {
      return await this.vaultService.getSecret('itero/oauth/github');
    } catch (error) {
      console.warn('Fallback sur les variables d\'environnement pour GitHub OAuth');
      return {
        client_id: process.env.GITHUB_CLIENT_ID || '',
        client_secret: process.env.GITHUB_CLIENT_SECRET || '',
        redirect_uri: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/github/callback`,
      };
    }
  }

  /**
   * Récupérer tous les secrets d'une catégorie
   */
  async getAllSecrets(category: string) {
    try {
      return await this.vaultService.listSecrets(`itero/${category}`);
    } catch (error) {
      console.error(`Erreur récupération secrets ${category}:`, error.message);
      return [];
    }
  }

  /**
   * Invalider le cache des secrets
   */
  invalidateCache(): void {
    this.vaultService.invalidateCache();
  }
}
