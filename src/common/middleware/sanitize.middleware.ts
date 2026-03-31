import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to sanitize request body strings by stripping HTML tags.
 * Prevents XSS attacks from user-supplied input.
 */
@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.body) {
      req.body = this.sanitize(req.body);
    }
    next();
  }

  private sanitize(obj: any): any {
    if (typeof obj === 'string') {
      return this.stripHtml(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitize(value);
      }
      return sanitized;
    }

    return obj;
  }

  private stripHtml(str: string): string {
    // Remove HTML tags but preserve the text content
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags with content
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove style tags with content
      .replace(/<[^>]+>/g, '')  // Remove remaining HTML tags
      .replace(/&lt;/g, '<')    // Decode common entities
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .trim();
  }
}
