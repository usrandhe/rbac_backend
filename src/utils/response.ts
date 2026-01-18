import { Response } from "express";
import { ApiResponse, PaginationMeta } from "../types";

export class ApiResponseHelper {
    static success<T>(
        res: Response,
        data: T,
        message: string = 'Success',
        statusCode: number = 200,
        meta?: PaginationMeta
    ): Response {
        const response: ApiResponse<T> = {
            success: true,
            message,
            data,
            ...(meta && { meta }),
        }
        return res.status(statusCode).json(response);
    }

    static error<T>(
        res: Response,
        message: string = 'Something went wrong',
        statusCode: number = 500,
        error?: any[]
    ): Response {
        const response: ApiResponse<T> = {
            success: false,
            message,
                ...(error && { error }),
        }
        return res.status(statusCode).json(response);
    }

    static created<T>(
        res: Response,
        data: T,
        message: string = 'Resource created successfully',
    ): Response {
        return this.success(res, data, message, 201);
    }

    static noContent(res: Response): Response {
        return res.status(204).send();
    }

    static badRequest(res: Response, message: string = 'Bad Request'): Response {
        return this.error(res, message, 400);
    }

    static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
        return this.error(res, message, 401);
    }

    static forbidden(res: Response, message: string = 'Forbidden'): Response {
        return this.error(res, message, 403);
    }

    static notFound(res: Response, message: string = 'Resource Not Found'): Response {
        return this.error(res, message, 404);
    }

    static conflict(res: Response, message: string = 'Resource Already Exists'): Response {
        return this.error(res, message, 409);
    }

    static internalServerError(res: Response, message: string = 'Something went wrong'): Response {
        return this.error(res, message, 500);
    }

    static serviceUnavailable(res: Response, message: string = 'Service Unavailable'): Response {
        return this.error(res, message, 503);
    }

    static validationError(res: Response, message: string = 'Validation failed'): Response {
        return this.error(res, message, 422);
    }

}
