export class AppError extends Error {
    statusCode: number;    
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
        this.isOperational = true;
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = 'Bad Request') {
        super(message, 400);
        this.name = 'BadRequestError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource Not Found') {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource Already Exists') {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

export class InternalServerError extends AppError {
    constructor(message: string) {
        super(message, 500);
        this.name = 'InternalServerError';
    }
}

export class ServiceUnavailableError extends AppError {
    constructor(message: string) {
        super(message, 503);
        this.name = 'ServiceUnavailableError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string = 'Validation failed') {
        super(message, 422);
        this.name = 'ValidationError';
    }
}
