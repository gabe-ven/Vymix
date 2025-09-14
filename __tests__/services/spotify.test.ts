import { spotifyService } from '../../services/spotify';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-web-browser');

describe('SpotifyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(spotifyService).toBeDefined();
  });

  it('should have required methods', () => {
    expect(typeof spotifyService.loginToSpotify).toBe('function');
    expect(typeof spotifyService.hasConnectedSpotify).toBe('function');
    expect(typeof spotifyService.makeRequest).toBe('function');
  });

  // TODO: Add more comprehensive tests
  // - Test token refresh logic
  // - Test rate limiting
  // - Test error handling
});
