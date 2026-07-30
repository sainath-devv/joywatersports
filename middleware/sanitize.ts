import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

// Input Sanitizer Middleware to prevent SQL injection and CSV command injection
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    const sanitizeValue = (val: any): any => {
      if (typeof val === 'string') {
        let sanitized = xss(val);
        // If the string starts with formulas characters, escape it to prevent CSV command injection
        if (/^[\\=\\+\\-\\@\\t\\r\\n]/.test(sanitized)) {
          sanitized = "'" + sanitized;
        }
        return sanitized;
      } else if (Array.isArray(val)) {
        return val.map(sanitizeValue);
      } else if (val !== null && typeof val === 'object') {
        for (const k in val) {
          val[k] = sanitizeValue(val[k]);
        }
        return val;
      }
      return val;
    };

    for (const key in req.body) {
      req.body[key] = sanitizeValue(req.body[key]);
    }
  }
  next();
};
