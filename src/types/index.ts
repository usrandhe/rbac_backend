import { Request } from 'express';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        roles: string[];
        permissions: string[];
    };
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: any[];
    meta?: PaginationMeta;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// Query Parameters
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}

export interface UserWithRoles {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    userRoles: {
        role: {
            id: string;
            name: string;
            description: string | null;
        };
    }[];
}

// jwt Payload
export interface JwtPayload {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
}



