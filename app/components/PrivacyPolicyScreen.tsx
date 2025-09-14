import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const PrivacyPolicyScreen: React.FC = () => {
  const router = useRouter();

  const openEmail = () => {
    Linking.openURL('mailto:support@vymix.app');
  };

  const openWebsite = () => {
    Linking.openURL('https://vymix.app');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.ui.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: December 2024</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.text}>
            Welcome to Vymix, an AI-powered music playlist creation application. This Privacy Policy explains how Vymix ("we," "our," or "us") collects, uses, discloses, and protects your information when you use our mobile application and related services.
            {'\n\n'}
            This policy applies to all users of the Vymix application. By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information We Collect</Text>
          
          <Text style={styles.subsectionTitle}>Personal Information</Text>
          <Text style={styles.text}>
            • Account information from Google or Apple Sign-In{'\n'}
            • Spotify profile and playlist data when connected{'\n'}
            • Playlist names and preferences you create
          </Text>

          <Text style={styles.subsectionTitle}>Automatically Collected</Text>
          <Text style={styles.text}>
            • Device information and identifiers{'\n'}
            • App usage patterns and analytics{'\n'}
            • Error logs and performance metrics
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Your Information</Text>
          <Text style={styles.text}>
            We use your information to:{'\n'}
            • Provide personalized music playlist recommendations{'\n'}
            • Sync playlists with your Spotify account{'\n'}
            • Improve app functionality and user experience{'\n'}
            • Provide customer support{'\n'}
            • Monitor app performance and security
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Third-Party Services</Text>
          <Text style={styles.text}>
            We integrate with:{'\n'}
            • Google/Apple Sign-In for authentication{'\n'}
            • Spotify Web API for playlist management{'\n'}
            • OpenAI for AI-powered recommendations{'\n'}
            • Firebase for app infrastructure{'\n'}
            • Sentry for error monitoring
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Security</Text>
          <Text style={styles.text}>
            We implement industry-standard security measures including data
            encryption, secure authentication, and regular security assessments
            to protect your information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights</Text>
          <Text style={styles.text}>
            You can:{'\n'}
            • Access and update your information in app settings{'\n'}
            • Delete your account and associated data{'\n'}
            • Export your playlist data{'\n'}
            • Control notification preferences
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Retention</Text>
          <Text style={styles.text}>
            • Account data: Until you delete your account{'\n'}
            • Usage data: Up to 2 years for analytics{'\n'}
            • Log data: Up to 1 year for troubleshooting{'\n'}
            • Deleted data is permanently removed within 30 days
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Children's Privacy</Text>
          <Text style={styles.text}>
            Our service is not intended for children under 13. We do not
            knowingly collect personal information from children under 13.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to This Policy</Text>
          <Text style={styles.text}>
            We may update this Privacy Policy from time to time. Material
            changes will be communicated through the app or email notifications.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.text}>
            If you have questions about this Privacy Policy:
          </Text>
          <TouchableOpacity onPress={openEmail} style={styles.contactButton}>
            <Text style={styles.contactText}>support@vymix.app</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openWebsite} style={styles.contactButton}>
            <Text style={styles.contactText}>vymix.app</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using Vymix, you acknowledge that you have read and understood
            this Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.transparent.white[20],
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.ui.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: COLORS.ui.gray.light,
    marginTop: 16,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.ui.white,
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.ui.white,
    marginTop: 12,
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ui.gray.light,
  },
  contactButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.primary.lime,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 32,
    marginBottom: 40,
    padding: 16,
    backgroundColor: COLORS.background.darker,
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.ui.gray.medium,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PrivacyPolicyScreen;
