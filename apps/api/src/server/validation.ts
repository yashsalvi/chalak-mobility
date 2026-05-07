import { NextFunction, Request, Response } from 'express';
import { z, ZodTypeAny } from 'zod';

type RequestPart = 'body' | 'params' | 'query';

export function validateRequest(part: RequestPart, schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const details = z.treeifyError(result.error);
      res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload.',
        details,
      });
      return;
    }

    (req as any)[part] = result.data;
    next();
  };
}
