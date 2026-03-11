import { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
export declare class CsrfMiddleware implements NestMiddleware {
    private readonly SAFE_METHODS;
    use(req: Request, _res: Response, next: NextFunction): void;
}
export declare function issueCsrfToken(res: Response): string;
