import { logger } from '../../services/logger';

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback) => callback({
    setTag: jest.fn(),
    setLevel: jest.fn(),
  })),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log debug messages in development', () => {
    logger.debug('Test debug message', { service: 'test' });
    // In development, should call console.log
    expect(console.log).toHaveBeenCalled();
  });

  it('should log info messages and send breadcrumbs', () => {
    const Sentry = require('@sentry/react-native');
    
    logger.info('Test info message', { service: 'test', operation: 'test-op' });
    
    expect(console.log).toHaveBeenCalled();
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      message: 'Test info message',
      level: 'info',
      data: { service: 'test', operation: 'test-op' },
    });
  });

  it('should log warnings and send breadcrumbs', () => {
    const Sentry = require('@sentry/react-native');
    
    logger.warn('Test warning message');
    
    expect(console.warn).toHaveBeenCalled();
    expect(Sentry.addBreadcrumb).toHaveBeenCalled();
  });

  it('should log errors and send to Sentry', () => {
    const Sentry = require('@sentry/react-native');
    const testError = new Error('Test error');
    
    logger.error('Test error message', testError, { userId: '123' });
    
    expect(console.error).toHaveBeenCalled();
    expect(Sentry.withScope).toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(testError);
  });

  it('should handle critical messages', () => {
    const Sentry = require('@sentry/react-native');
    
    logger.critical('Critical issue', { service: 'auth' });
    
    expect(console.log).toHaveBeenCalled();
    expect(Sentry.withScope).toHaveBeenCalled();
    expect(Sentry.captureMessage).toHaveBeenCalledWith('Critical issue', 'fatal');
  });
});
