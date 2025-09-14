import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './constants/colors';

const TermsOfServiceScreen: React.FC = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.ui.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: January 15, 2025</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
          <Text style={styles.text}>
            By accessing and using Vymix, you accept and agree to be bound by the terms and provision of this agreement.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Use License</Text>
          <Text style={styles.text}>
            Permission is granted to temporarily download one copy of Vymix per device for personal, non-commercial transitory viewing only.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Account</Text>
          <Text style={styles.text}>
            You are responsible for safeguarding the password and for all activities that occur under your account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prohibited Uses</Text>
          <Text style={styles.text}>
            You may not use our service for any unlawful purpose or to solicit others to perform unlawful acts.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.text}>
            If you have questions about these Terms of Service, please contact us at support@vymix.app.
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
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ui.gray.light,
  },
});

export default TermsOfServiceScreen;
