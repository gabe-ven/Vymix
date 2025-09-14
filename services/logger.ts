// Production-ready logging utility with Sentry integration
import * as Sentry from '@sentry/react-native';

interface LogContext {
  service?: string;
  operation?: string;
  userId?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = __DEV__;

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, context ? JSON.stringify(context) : '');
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context ? JSON.stringify(context) : '');
    }
    // In production, send important info to Sentry as breadcrumbs
    if (context) {
      Sentry.addBreadcrumb({
        message,
        level: 'info',
        data: context,
      });
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context ? JSON.stringify(context) : '');
    Sentry.addBreadcrumb({
      message,
      level: 'warning',
      data: context,
    });
  }

  error(message: string, error?: Error, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, error, context ? JSON.stringify(context) : '');
    
    // Send errors to Sentry with context
    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setTag(key, String(value));
        });
      }
      
      if (error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, 'error');
      }
    });
  }

  // For critical operations that should always be logged
  critical(message: string, context?: LogContext): void {
    console.log(`[CRITICAL] ${message}`, context ? JSON.stringify(context) : '');
    
    // Always send critical messages to Sentry
    Sentry.withScope((scope) => {
      scope.setLevel('fatal');
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setTag(key, String(value));
        });
      }
      Sentry.captureMessage(message, 'fatal');
    });
  }
}

export const logger = new Logger();
