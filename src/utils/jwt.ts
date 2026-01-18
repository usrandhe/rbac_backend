import jwt, { SignOptions } from "jsonwebtoken";
import { JwtPayload } from "../types";
import { UnauthorizedError } from './errors';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

export class JwtUtils {
    static generateAccessToken(payload: JwtPayload): string {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRE as SignOptions['expiresIn']
        });
    }

    static generateRefreshToken(payload: JwtPayload): string {
        return jwt.sign(payload, JWT_REFRESH_SECRET, {
            expiresIn: JWT_REFRESH_EXPIRE as SignOptions['expiresIn']
        });
    }

    static verifyAccessToken(token: string): JwtPayload {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedError('Token expired');
            }
            throw new UnauthorizedError('Invalid token');
        }
    }

    static verifyRefreshToken(token: string): JwtPayload {
        try {
            const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedError('Refresh Token expired');
            }
            throw new UnauthorizedError('Invalid Refresh token');
        }
    }

    static decodeToken(token: string): JwtPayload {
        try {
            const decoded = jwt.decode(token) as JwtPayload;
            return decoded;
        } catch (error) {
            throw new UnauthorizedError('Invalid token');
        }
    }

    static generateTokenPair(payload: JwtPayload): { accessToken: string, refreshToken: string } {
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);
        return { accessToken, refreshToken };
    }
}