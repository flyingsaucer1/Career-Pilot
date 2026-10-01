import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.utils';
import { MulterError } from 'multer';
import { MAX_RESUME_FILE_MB } from '../services/resumeFile.service';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (res.headersSent) return;
  console.error(JSON.stringify({ event: 'request_error', requestId: res.locals.requestId, method: req.method, status: err.statusCode ?? 500, errorType: err.name }));
  if (err instanceof MulterError) {
    sendError(res,
      err.code === 'LIMIT_FILE_SIZE' ? `File size must be ${MAX_RESUME_FILE_MB} MB or less.` : 'Attach exactly one PDF or DOCX file in the resume field.',
      err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    );
    return;
  }
  const statusCode = err.statusCode ?? 500;
  const message = err.isOperational ? err.message : 'An unexpected error occurred';

  if (process.env.NODE_ENV === 'development') {
    console.error('🔥 Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  sendError(res, message, statusCode);
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  sendError(res, 'The requested resource was not found', 404);
};
