// Health check service for external API dependencies
import { logger } from './logger';
import { spotifyService } from './spotify';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  error?: string;
}

export class HealthCheckService {
  async checkSpotifyHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Simple health check - try to authenticate
      const isAuth = await spotifyService.isAuthenticated();
      const responseTime = Date.now() - startTime;
      
      if (isAuth) {
        return {
          service: 'Spotify',
          status: 'healthy',
          responseTime,
        };
      } else {
        return {
          service: 'Spotify',
          status: 'degraded',
          responseTime,
          error: 'Not authenticated',
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.warn('Spotify health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      });
      
      return {
        service: 'Spotify',
        status: 'down',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async checkOpenAIHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Simple ping to OpenAI API with timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'HEAD', // Just check if endpoint is reachable
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          service: 'OpenAI',
          status: 'healthy',
          responseTime,
        };
      } else {
        return {
          service: 'OpenAI',
          status: 'degraded',
          responseTime,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.warn('OpenAI health check failed', {
        error: errorMessage,
        responseTime,
      });
      
      return {
        service: 'OpenAI',
        status: 'down',
        responseTime,
        error: errorMessage.includes('aborted') ? 'Request timeout' : errorMessage,
      };
    }
  }

  async runAllHealthChecks(): Promise<HealthStatus[]> {
    logger.info('Running health checks for external services');
    
    const checks = await Promise.allSettled([
      this.checkSpotifyHealth(),
      this.checkOpenAIHealth(),
    ]);

    const results = checks.map((check) => {
      if (check.status === 'fulfilled') {
        return check.value;
      } else {
        return {
          service: 'Unknown',
          status: 'down' as const,
          error: 'Health check failed to run',
        };
      }
    });

    // Log overall health status
    const healthyServices = results.filter(r => r.status === 'healthy').length;
    const totalServices = results.length;
    
    logger.info('Health check completed', {
      healthyServices,
      totalServices,
      overallHealth: healthyServices === totalServices ? 'healthy' : 'degraded',
    });

    return results;
  }
}

export const healthCheckService = new HealthCheckService();
