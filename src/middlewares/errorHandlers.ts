import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ApiResponseHelper } from '../utils/response';
import { Prisma } from '../generated/prisma/client';
import { ZodError } from 'zod';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('ERROR', err);
    }

    if (err instanceof AppError) {
        return ApiResponseHelper.error(res, err.message, err.statusCode);
    }

    if (err instanceof ZodError) {
        const errors = err.issues.map((e) => ({ field: e.path.join('.'), message: e.message }));
        return ApiResponseHelper.error(res, 'Validation failed', 422, errors);
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (err.code === 'P2002') {
            const field = (err.meta?.target as string[])?.join(', ') || 'field';
            return ApiResponseHelper.error(res, `${field} already exists`, 409);
        }
        // Record not found
        if (err.code === 'P2025') {
            return ApiResponseHelper.error(res, 'Record not found', 404);
        }
        // ForeignKey constraint violation
        if (err.code === 'P2003') {
            return ApiResponseHelper.error(res, 'Record not found', 404);
        }
    }

    //JWT errors
    if(err.name === 'JsonWebTokenError') {
        return ApiResponseHelper.error(res, 'Invalid token', 401);
    }

    if(err.name == 'TokenExpiredError') {
        return ApiResponseHelper.error(res, 'Token expired', 401);
    }

    // Default error
    const statusCode = process.env.Node_ENV === 'production' ? 500 : 400;
    const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Something went wrong';
    return ApiResponseHelper.error(res, message, statusCode);
};

export const notFoundHandler = (req: Request, res: Response) => {
    return ApiResponseHelper.error(res, `Route ${req.originalUrl} not found`, 404);
}
