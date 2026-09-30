import { Request, Response, NextFunction } from 'express';
import { adminAuthService } from '../services/adminAuthService';

export interface AuthenticatedRequest extends Request {
  adminUser?: {
    username: string;
    role: 'admin';
  };
}

export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader =
    req.headers['authorization'] || (req.headers['x-admin-token'] as string);

  if (!authHeader) {
    res.status(401).json({
      error: 'Unauthorized',
      message:
        'Admin authentication token is required to access this endpoint.',
    });
    return;
  }

  let token = authHeader;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  const result = adminAuthService.verifyToken(token);
  if (!result.valid || !result.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: result.error || 'Invalid or expired admin authentication token.',
    });
    return;
  }

  (req as AuthenticatedRequest).adminUser = result.user;
  next();
}
