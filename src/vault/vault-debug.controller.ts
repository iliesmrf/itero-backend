import { Controller, Get } from '@nestjs/common';
import { VaultService } from './vault.service';
import { SecretsService } from './secrets.service';

/**
 * Contrôleur d'exemple pour tester Vault (à usage local uniquement!)
 * À SUPPRIMER en production
 */
@Controller('vault-debug')
export class VaultDebugController {
  constructor(
    private vaultService: VaultService,
    private secretsService: SecretsService,
  ) {}

  /**
   * GET /vault-debug/health
   * Vérifier que Vault est opérationnel
   */
  @Get('health')
  async health() {
    try {
      const isHealthy = await this.vaultService.healthCheck();
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        vault_addr: process.env.VAULT_ADDR,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * GET /vault-debug/cache-stats
   * Voir les statistiques du cache
   */
  @Get('cache-stats')
  cacheStats() {
    return this.vaultService.getCacheStats();
  }

  /**
   * GET /vault-debug/mongodb
   * Récupérer les secrets MongoDB (test)
   */
  @Get('mongodb')
  async getMongoDBSecrets() {
    try {
      const secrets = await this.secretsService.getMongoDBSecrets();
      return {
        status: 'success',
        data: secrets,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * GET /vault-debug/jwt
   * Récupérer le secret JWT (test)
   */
  @Get('jwt')
  async getJWTSecret() {
    try {
      const secret = await this.secretsService.getJWTSecret();
      return {
        status: 'success',
        data: {
          secret: secret.substring(0, 10) + '...', // Masquer la vraie valeur
        },
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * GET /vault-debug/all-secrets
   * Lister tous les secrets (test)
   */
  @Get('all-secrets')
  async listAllSecrets() {
    try {
      const secrets = await this.vaultService.listSecrets('itero');
      return {
        status: 'success',
        secrets,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }
}
