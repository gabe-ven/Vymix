import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../../app/(auth)/login';

// Mock dependencies specific to this test
jest.mock('../../services/spotify', () => ({
  spotifyService: {
    hasConnectedSpotify: jest.fn(() => Promise.resolve(false)),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

describe('LoginScreen', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<LoginScreen />);
    // Add basic assertion - you can expand this
    expect(getByText).toBeDefined();
  });

  // TODO: Add more specific tests:
  // - Test Google sign-in flow
  // - Test Spotify connection check
  // - Test navigation after successful auth
});
