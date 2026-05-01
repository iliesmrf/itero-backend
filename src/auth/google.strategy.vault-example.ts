import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { SecretsService } from '../vault/secrets.service';

/**
 * Exemple d'intégration Vault avec Google OAuth Strategy
 * Remplace le besoin de variables d'environnement
 */
@Injectable()
export class GoogleStrategyExample extends PassportStrategy(Strategy, 'google') {
  private googleConfig: any;

  constructor(private secretsService: SecretsService) {
    super({
      clientID: 'temp', // Sera remplacé
      clientSecret: 'temp', // Sera remplacé
      callbackURL: 'http://localhost:3000/auth/google/callback',
      scope: ['profile', 'email'],
    });

    // Charger les secrets de Vault au démarrage
    this.initializeSecrets();
  }

  private async initializeSecrets() {
    try {
      const secrets = await this.secretsService.getGoogleOAuthSecrets();
      
      // Typer correctement les valeurs
      this.googleConfig = {
        clientID: String(secrets.client_id),
        clientSecret: String(secrets.client_secret),
        callbackURL: String(secrets.redirect_uri),
      };
      
      console.log('✅ Google OAuth secrets chargés depuis Vault');
    } catch (error) {
      console.error('❌ Erreur chargement Google OAuth secrets:', error.message);
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    const { id, displayName, emails, photos } = profile;

    const user = {
      id,
      email: emails?.[0]?.value,
      firstName: displayName?.split(' ')?.[0],
      lastName: displayName?.split(' ')?.[1],
      picture: photos?.[0]?.value,
      accessToken,
    };

    return user;
  }
}
