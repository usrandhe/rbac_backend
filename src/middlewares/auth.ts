import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { JwtUtils } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { asyncHandler } from '../utils/asyncHandler';

export const authenticate = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = JwtUtils.verifyAccessToken(token);

    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      roles: decoded.roles,
      permissions: decoded.permissions,
    };

    next();
  }
);

// Optional authentication (doesn't throw error if no token)
export const optionalAuth = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = JwtUtils.verifyAccessToken(token);
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          roles: decoded.roles,
          permissions: decoded.permissions,
        };
      } catch (error) {
        // Token invalid, but continue without user
      }
    }

    next();
  }
);