import { Injectable, OnModuleInit } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface VaultSecret {
  [key: string]: string | number | boolean;
}

@Injectable()
export class VaultService implements OnModuleInit {
  private client: AxiosInstance;
  private vaultAddr: string;
  private vaultToken: string;
  private cache: Map<string, { data: VaultSecret; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.vaultAddr = process.env.VAULT_ADDR || 'http://localhost:8200';
    this.vaultToken = process.env.VAULT_TOKEN || 'myroot';

    this.client = axios.create({
      baseURL: this.vaultAddr,
      headers: {
        'X-Vault-Token': this.vaultToken,
      },
      timeout: 5000,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.healthCheck();
      console.log('✅ Vault est opérationnel');
    } catch (error) {
      console.error('❌ Erreur de connexion à Vault:', error.message);
      // En développement, on peut continuer; en production, on devrait échouer
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  /**
   * Vérifier que Vault est accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/v1/sys/health');
      return response.status === 200;
    } catch (error) {
      throw new Error(`Vault health check failed: ${error.message}`);
    }
  }

  /**
   * Récupérer un secret de Vault avec cache
   */
  async getSecret(path: string): Promise<VaultSecret> {
    // Vérifier le cache
    const cached = this.cache.get(path);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`📦 Secret récupéré du cache: ${path}`);
      return cached.data;
    }

    try {
      const response = await this.client.get(`/v1/secret/data/${path}`);
      const data = response.data.data.data;

      // Mettre en cache
      this.cache.set(path, {
        data,
        timestamp: Date.now(),
      });

      console.log(`✅ Secret récupéré de Vault: ${path}`);
      return data;
    } catch (error) {
      console.error(`❌ Erreur lecture secret Vault (${path}):`, error.message);
      throw new Error(`Failed to retrieve secret from Vault: ${path}`);
    }
  }

  /**
   * Récupérer une valeur spécifique d'un secret
   */
  async getSecretValue(path: string, key: string): Promise<string> {
    const secret = await this.getSecret(path);
    const value = secret[key];

    if (!value) {
      throw new Error(`Secret key not found: ${path}/${key}`);
    }

    return String(value);
  }

  /**
   * Créer ou mettre à jour un secret
   */
  async setSecret(path: string, data: VaultSecret): Promise<void> {
    try {
      await this.client.post(`/v1/secret/data/${path}`, { data });

      // Invalider le cache
      this.cache.delete(path);

      console.log(`✅ Secret créé/mis à jour: ${path}`);
    } catch (error) {
      console.error(`❌ Erreur écriture secret Vault (${path}):`, error.message);
      throw new Error(`Failed to set secret in Vault: ${path}`);
    }
  }

  /**
   * Supprimer un secret
   */
  async deleteSecret(path: string): Promise<void> {
    try {
      await this.client.delete(`/v1/secret/data/${path}`);

      // Invalider le cache
      this.cache.delete(path);

      console.log(`✅ Secret supprimé: ${path}`);
    } catch (error) {
      console.error(`❌ Erreur suppression secret Vault (${path}):`, error.message);
      throw new Error(`Failed to delete secret from Vault: ${path}`);
    }
  }

  /**
   * Lister tous les secrets sous un chemin
   */
  async listSecrets(path: string): Promise<string[]> {
    try {
      const response = await this.client.request({
        method: 'LIST',
        url: `/v1/secret/metadata/${path}`,
      });

      return response.data.data.keys || [];
    } catch (error) {
      console.error(`❌ Erreur listing secrets Vault (${path}):`, error.message);
      return [];
    }
  }

  /**
   * Invalider complètement le cache (utile après mise à jour)
   */
  invalidateCache(): void {
    this.cache.clear();
    console.log('🔄 Cache Vault invalidé');
  }

  /**
   * Récupérer les statistiques du cache
   */
  getCacheStats(): {
    size: number;
    entries: string[];
  } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}
