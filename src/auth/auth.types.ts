export interface OAuthUser {
  id: string;           // provider ID
  email: string;
  name: string;
  avatar: string;
  provider: 'google' | 'github';
}

export interface JwtPayload {
  sub: string;          // user id
  email: string;
  name: string;
  avatar: string;
  provider: string;
  iat?: number;
  exp?: number;
}

export interface AnonymousUser {
  name: string;
  avatar?: string;
}
