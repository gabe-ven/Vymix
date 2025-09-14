# 🎵 Vymix

**AI-Powered Music Playlist Creation**

Vymix is a React Native mobile application that uses artificial intelligence to create personalized music playlists based on your mood, preferences, and listening history. Connect with Spotify, describe your vibe, and let AI curate the perfect soundtrack for any moment.

---

## 📊 Project Status

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/gabe-ven/Vymix)
[![Test Coverage](https://img.shields.io/badge/coverage-85%25-green.svg)](https://github.com/gabe-ven/Vymix)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-0.79.3-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~53.0.11-000020.svg)](https://expo.dev/)

---

## 📚 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Setup](#-environment-setup)
- [Running the App](#-running-the-app)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Usage](#-usage)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact & Support](#-contact--support)
- [Acknowledgments](#-acknowledgments)

---

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Playlist Generation**: Create custom playlists using OpenAI's advanced algorithms
- **Spotify Integration**: Seamlessly connect with your Spotify account to manage playlists
- **Mood-Based Creation**: Describe your vibe using emojis and text for personalized results
- **Smart Caching**: Efficient playlist caching for improved performance
- **Real-time Streaming**: Live playlist generation with progress updates

### 🔐 Authentication & Security
- **Multi-Platform Sign-In**: Google and Apple authentication support
- **Secure Token Management**: JWT tokens with automatic refresh
- **Privacy-First**: GDPR and CCPA compliant data handling
- **Firebase Integration**: Secure cloud storage and user management

### 📱 User Experience
- **Modern UI/UX**: Glass morphism design with gradient backgrounds
- **Dark Theme**: Optimized for low-light usage
- **Responsive Design**: Adaptive layouts for different screen sizes
- **Offline Support**: Cached playlists available without internet
- **Error Monitoring**: Integrated Sentry for crash reporting and performance tracking

### 🎛️ Advanced Features
- **Playlist Management**: Save, edit, and organize your music collections
- **Health Monitoring**: API health checks for external services
- **Rate Limiting**: Smart handling of Spotify API limits
- **Data Export**: Export your playlist data in JSON format
- **Custom Preferences**: Personalized settings for playlist privacy and auto-save

---

## 🛠️ Tech Stack

### **Frontend**
- **React Native** `0.79.3` - Cross-platform mobile development
- **Expo** `~53.0.11` - Development platform and build tools
- **TypeScript** `~5.8.3` - Type-safe JavaScript
- **NativeWind** `^4.1.23` - Tailwind CSS for React Native
- **React Navigation** `^7.1.6` - Navigation library
- **Reanimated** `~3.17.4` - Smooth animations and gestures

### **Backend Services**
- **Firebase** `^11.9.1` - Authentication, Firestore, and Cloud Storage
- **Spotify Web API** - Music data and playlist management
- **OpenAI API** - AI-powered playlist generation
- **Sentry** `^7.0.1` - Error monitoring and performance tracking

### **Development Tools**
- **Jest** `^29.2.1` - Testing framework
- **ESLint** `^9.35.0` - Code linting
- **Prettier** `^3.6.2` - Code formatting
- **Expo Application Services (EAS)** - Build and deployment

### **Key Libraries**
- **@react-native-firebase/*** - Firebase SDK for React Native
- **@react-native-google-signin** - Google authentication
- **@invertase/react-native-apple-authentication** - Apple Sign-In
- **react-native-toast-message** - User notifications
- **expo-auth-session** - OAuth authentication flows

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Git**
- **iOS Simulator** (for iOS development) or **Android Studio** (for Android)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gabe-ven/Vymix.git
   cd Vymix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your API keys and configuration (see [Environment Variables](#-environment-variables))

4. **Configure Firebase**
   - Add your `GoogleService-Info.plist` (iOS) to the `ios/` directory
   - Add your `google-services.json` (Android) to the `android/` directory

---

## ⚙️ Environment Setup

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Google, Apple Sign-In)
3. Create a Firestore database
4. Download configuration files and place them in the appropriate directories

### Spotify API Setup

1. Create a Spotify app at [Spotify Developer Dashboard](https://developer.spotify.com/)
2. Add your redirect URIs for authentication
3. Note your Client ID and Client Secret

### OpenAI API Setup

1. Create an account at [OpenAI Platform](https://platform.openai.com/)
2. Generate an API key
3. Set up billing and usage limits

---

## 📱 Running the App

### Development Mode

```bash
# Start the Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web (for testing)
npm run web
```

### Production Build

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both platforms
eas build --platform all
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

### Test Structure

```
__tests__/
├── auth/                 # Authentication tests
├── components/           # Component tests
├── services/            # Service layer tests
├── utils/               # Utility function tests
└── basic.test.ts        # Basic functionality tests
```

---

## 🚀 Deployment

### Expo Application Services (EAS)

1. **Configure EAS**
   ```bash
   eas build:configure
   ```

2. **Build for Production**
   ```bash
   # iOS App Store
   eas build --platform ios --profile production

   # Google Play Store
   eas build --platform android --profile production
   ```

3. **Submit to App Stores**
   ```bash
   # Submit to iOS App Store
   eas submit --platform ios

   # Submit to Google Play Store
   eas submit --platform android
   ```

### Environment Configuration

Ensure your production environment variables are set in EAS:

```bash
# Set environment variables
eas secret:create --name OPENAI_API_KEY --value "your-api-key"
eas secret:create --name SPOTIFY_CLIENT_ID --value "your-client-id"
# ... add all required secrets
```

---

## 📖 Usage

### Basic Workflow

1. **Authentication**: Sign in with Google or Apple
2. **Connect Spotify**: Link your Spotify account for playlist management
3. **Create Playlist**: 
   - Select mood emojis
   - Choose song count (5-50 songs)
   - Describe your vibe
   - Let AI generate your playlist
4. **Save & Manage**: Save playlists to Spotify or keep them local

### Example API Integration

The app integrates with several APIs:

**Spotify Web API**
```javascript
// Get user playlists
const playlists = await spotifyService.getUserPlaylists();

// Create a new playlist
const newPlaylist = await spotifyService.createPlaylist({
  name: "My AI Playlist",
  description: "Generated by Vymix AI",
  tracks: selectedTracks
});
```

**OpenAI Integration**
```javascript
// Generate playlist recommendations
const recommendations = await playlistGenerationService.generatePlaylist(
  ['🎵', '😊'], // mood emojis
  20,          // song count
  'upbeat and energetic' // vibe description
);
```

### Screenshots

<!-- Add screenshots here -->
```markdown
![Login Screen](./docs/screenshots/login.png)
![Playlist Creation](./docs/screenshots/create.png)
![Generated Playlist](./docs/screenshots/playlist.png)
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Google OAuth
GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com
GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com

# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# OpenAI API
OPENAI_API_KEY=sk-your_openai_api_key

# Sentry (Optional)
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
```

### Required Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_API_KEY` | Firebase project API key | ✅ |
| `SPOTIFY_CLIENT_ID` | Spotify app client ID | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for AI features | ✅ |
| `GOOGLE_*_CLIENT_ID` | Google OAuth client IDs | ✅ |
| `SENTRY_DSN` | Error monitoring (recommended) | ⚠️ |

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed
4. **Test your changes**
   ```bash
   npm test
   npm run type-check
   npm run lint
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Style

- **TypeScript**: Use strict typing
- **ESLint**: Follow the configured rules
- **Prettier**: Auto-format code
- **Naming**: Use camelCase for variables, PascalCase for components
- **Testing**: Write tests for new features

### Pull Request Process

1. Ensure all tests pass
2. Update documentation for API changes
3. Add screenshots for UI changes
4. Get approval from maintainers
5. Squash commits before merging

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Vymix

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 📞 Contact & Support

### Official Support
- **Email**: [support@vymix.app](mailto:support@vymix.app)
- **Privacy**: [privacy@vymix.app](mailto:privacy@vymix.app)
- **Website**: [https://gabe-ven.github.io/Vymix/](https://gabe-ven.github.io/Vymix/)

### Community & Development
- **GitHub Issues**: [Report bugs or request features](https://github.com/gabe-ven/Vymix/issues)
- **GitHub Discussions**: [Community discussions](https://github.com/gabe-ven/Vymix/discussions)
- **Pull Requests**: [Contribute to the project](https://github.com/gabe-ven/Vymix/pulls)

### Response Times
- **General inquiries**: 5 business days
- **Bug reports**: 2-3 business days
- **Security issues**: 24-48 hours

---

## 🙏 Acknowledgments

### Technologies & Services
- **[Expo](https://expo.dev/)** - Incredible development platform for React Native
- **[Firebase](https://firebase.google.com/)** - Reliable backend services
- **[Spotify Web API](https://developer.spotify.com/)** - Music data and playlist management
- **[OpenAI](https://openai.com/)** - Powerful AI for playlist generation
- **[Sentry](https://sentry.io/)** - Error monitoring and performance tracking

### Open Source Libraries
- **[React Native](https://reactnative.dev/)** - Cross-platform mobile framework
- **[NativeWind](https://www.nativewind.dev/)** - Tailwind CSS for React Native
- **[React Navigation](https://reactnavigation.org/)** - Navigation solution
- **[Reanimated](https://docs.swmansion.com/react-native-reanimated/)** - Animation library

### Design Inspiration
- **Apple Music** - UI/UX inspiration
- **Spotify** - Playlist management concepts
- **Linear** - Clean, modern design principles

### Special Thanks
- Contributors and beta testers
- The React Native community
- Open source maintainers

---

## 🎵 Made with ❤️ for Music Lovers

**Vymix** - *Where AI meets your musical soul*

---

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/gabe-ven/Vymix?style=social)](https://github.com/gabe-ven/Vymix/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/gabe-ven/Vymix?style=social)](https://github.com/gabe-ven/Vymix/network/members)
[![GitHub issues](https://img.shields.io/github/issues/gabe-ven/Vymix)](https://github.com/gabe-ven/Vymix/issues)

</div>
