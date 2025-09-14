import { healthCheckService } from '../../services/healthCheck';

// Mock the logger
jest.mock('../../services/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock the Spotify service
jest.mock('../../services/spotify', () => ({
  spotifyService: {
    isAuthenticated: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('HealthCheckService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return healthy status when Spotify is authenticated', async () => {
    const { spotifyService } = require('../../services/spotify');
    spotifyService.isAuthenticated.mockResolvedValue(true);

    const result = await healthCheckService.checkSpotifyHealth();

    expect(result.service).toBe('Spotify');
    expect(result.status).toBe('healthy');
    expect(typeof result.responseTime).toBe('number');
  });

  it('should return degraded status when Spotify is not authenticated', async () => {
    const { spotifyService } = require('../../services/spotify');
    spotifyService.isAuthenticated.mockResolvedValue(false);

    const result = await healthCheckService.checkSpotifyHealth();

    expect(result.service).toBe('Spotify');
    expect(result.status).toBe('degraded');
    expect(result.error).toBe('Not authenticated');
  });

  it('should return down status when Spotify check fails', async () => {
    const { spotifyService } = require('../../services/spotify');
    spotifyService.isAuthenticated.mockRejectedValue(new Error('Network error'));

    const result = await healthCheckService.checkSpotifyHealth();

    expect(result.service).toBe('Spotify');
    expect(result.status).toBe('down');
    expect(result.error).toBe('Network error');
  });

  it('should return healthy status when OpenAI API is reachable', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });

    const result = await healthCheckService.checkOpenAIHealth();

    expect(result.service).toBe('OpenAI');
    expect(result.status).toBe('healthy');
  });

  it('should run all health checks', async () => {
    const { spotifyService } = require('../../services/spotify');
    spotifyService.isAuthenticated.mockResolvedValue(true);
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });

    const results = await healthCheckService.runAllHealthChecks();

    expect(results).toHaveLength(2);
    expect(results[0].service).toBe('Spotify');
    expect(results[1].service).toBe('OpenAI');
  });
});
