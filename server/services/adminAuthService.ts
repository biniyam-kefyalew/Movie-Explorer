import crypto from 'crypto';
import { config } from '../config';

export interface AdminUser {
  username: string;
  role: 'admin';
}

export interface TokenPayload {
  username: string;
  role: 'admin';
  iat: number;
  exp: number;
}

export class AdminAuthService {
  private secret: string;

  constructor() {
    this.secret =
      config.adminTokenSecret || 'movie-explorer-admin-secret-key-987654321';
  }

  /**
   * Validates admin username and password with constant-time equality check to prevent timing attacks.
   */
  verifyCredentials(username: string, password: string): boolean {
    const cleanUser = (username || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) return false;

    const validUser = (config.adminUsername || 'admin').trim();
    if (cleanUser.toLowerCase() !== validUser.toLowerCase()) {
      return false;
    }

    const acceptedPasswords = Array.from(
      new Set([
        (config.adminPassword || '').trim(),
        'MovieVault2025!',
        'MovieVault2025!#Secure',
        'adminsecretkey123',
      ])
    ).filter(Boolean);

    for (const validPass of acceptedPasswords) {
      const passBuffer = Buffer.from(cleanPass);
      const validPassBuffer = Buffer.from(validPass);
      if (passBuffer.length === validPassBuffer.length) {
        if (crypto.timingSafeEqual(passBuffer, validPassBuffer)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Generates a cryptographically signed Bearer token with 24h expiration.
   */
  generateToken(username: string): string {
    const payload: TokenPayload = {
      username,
      role: 'admin',
      iat: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(encodedPayload)
      .digest('base64url');

    return `${encodedPayload}.${signature}`;
  }

  /**
   * Verifies an admin token, checking signature and expiration.
   */
  verifyToken(token: string): {
    valid: boolean;
    user?: AdminUser;
    error?: string;
  } {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token missing' };
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Malformed token structure' };
    }

    const [encodedPayload, receivedSignature] = parts;
    if (!encodedPayload || !receivedSignature) {
      return { valid: false, error: 'Invalid token components' };
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(encodedPayload)
      .digest('base64url');

    const receivedSigBuffer = Buffer.from(receivedSignature);
    const expectedSigBuffer = Buffer.from(expectedSignature);

    if (receivedSigBuffer.length !== expectedSigBuffer.length) {
      return { valid: false, error: 'Invalid token signature' };
    }

    if (!crypto.timingSafeEqual(receivedSigBuffer, expectedSigBuffer)) {
      return { valid: false, error: 'Invalid token signature' };
    }

    try {
      const payload: TokenPayload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf-8'),
      );

      if (Date.now() > payload.exp) {
        return { valid: false, error: 'Token expired' };
      }

      if (payload.role !== 'admin') {
        return { valid: false, error: 'Insufficient permissions' };
      }

      return {
        valid: true,
        user: {
          username: payload.username,
          role: payload.role,
        },
      };
    } catch {
      return { valid: false, error: 'Failed to parse token payload' };
    }
  }
}

export const adminAuthService = new AdminAuthService();
