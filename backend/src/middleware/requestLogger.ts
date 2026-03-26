import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Create a listener for when the request finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, path } = req;
    const statusCode = res.statusCode;
    
    // Attempt to extract session ID from various places
    const sessionId = (req as any).body?.sessionId || 
                      req.params?.sessionId || 
                      req.query?.sessionId || 
                      (req as any).sessionId || 
                      '-';

    const logMessage = `${method} ${path} ${statusCode} ${duration}ms session:${sessionId}`;
    
    if (statusCode >= 400) {
      logger.error(logMessage);
    } else {
      logger.info(logMessage);
    }
  });

  next();
};
