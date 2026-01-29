import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconButton from '../components/IconButton';
import ViolationTimeline from '../components/ViolationTimeline';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import {
  auth,
  db,
  Session,
  updateUserStats,
} from '../services/firebase';

const SessionSuccessScreen: React.FC = () => {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async (): Promise<void> => {
    try {
      if (!sessionId) return;

      const docSnap = await getDoc(doc(db, 'sessions', sessionId));
      if (docSnap.exists()) {
        const sessionData = { id: docSnap.id, ...docSnap.data() } as Session;
        setSession(sessionData);
        if (auth.currentUser) {
          await updateUserStats(auth.currentUser.uid, sessionData);
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = (): void => {
    router.replace('/(tabs)/HomeScreen');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Session not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Parse startTime for violation timeline
  const sessionStartTime = session.startTime
    ? (session.startTime as any).toDate
      ? (session.startTime as any).toDate()
      : new Date(session.startTime as any)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - Just back arrow */}
      <View style={styles.header}>
        <IconButton
          icon="chevron-left"
          onPress={handleGoHome}
          color={COLORS.social.textPrimary}
        />
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.successIconBg}>
            <MaterialIcons
              name="check-circle"
              size={64}
              color={COLORS.social.primary}
            />
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Session Complete!</Text>
        <Text style={styles.subtitle}>Great work staying focused</Text>

        {/* Violation Timeline */}
        <View style={styles.timelineContainer}>
          <ViolationTimeline
            violations={session.violations || []}
            sessionStartTime={sessionStartTime}
            participants={session.participants || []}
          />
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGoHome}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={24} color={COLORS.social.textPrimary} />
          <Text style={styles.primaryButtonText}>Start New Session</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.social.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.social.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: SPACING['2xl'],
    marginBottom: SPACING.xl,
  },
  successIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.social.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes['3xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.social.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.social.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
  },
  timelineContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.social.cardBorder,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING['3xl'],
  },
  primaryButton: {
    height: 56,
    backgroundColor: COLORS.social.primary,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.greenButton,
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.social.textPrimary,
  },
});

export default SessionSuccessScreen;
