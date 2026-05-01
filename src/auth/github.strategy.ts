import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { OAuthUser } from './auth.types';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID:     process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL:  process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<void> {
    const email =
      profile.emails?.find((e: any) => e.primary)?.value ||
      profile.emails?.[0]?.value ||
      '';

    const user: OAuthUser = {
      id:       String(profile.id),
      email,
      name:     profile.displayName || profile.username || 'Utilisateur',
      avatar:   profile.photos?.[0]?.value || '',
      provider: 'github',
    };
    done(null, user);
  }
}
