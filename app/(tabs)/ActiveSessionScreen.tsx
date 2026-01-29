import { MaterialIcons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  AppStateStatus,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CircularProgress from '../components/CircularProgress';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import {
  addViolation,
  auth,
  endSession,
  getViolationCategory,
  isSessionSuccessful,
  Session,
  subscribeToSession,
  terminateSession,
} from '../services/firebase';

const parseFirestoreTimestamp = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
};

const ActiveSessionScreen: React.FC = () => {
  // Keep screen awake during active session to prevent false violations from screen sleep
  useKeepAwake();

  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const hasAutoCompleted = useRef<boolean>(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribeToSession(sessionId, (data) => {
      setSession(data);
      if (data?.status === 'ended') {
        // Route to success or fail screen based on outcome
        const targetScreen = data.outcome === 'successful'
          ? '/(tabs)/SessionSuccessScreen'
          : '/(tabs)/SessionFailScreen';
        router.replace({
          pathname: targetScreen,
          params: { sessionId },
        });
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  useEffect(() => {
    if (session?.status === 'active' && session.startTime) {
      const calculateElapsed = (): number => {
        const startDate = parseFirestoreTimestamp(session.startTime);
        if (!startDate) return 0;
        return Math.floor((Date.now() - startDate.getTime()) / 1000);
      };

      // Set initial value immediately
      setTimer(calculateElapsed());

      // Update every second from server time
      const interval = setInterval(() => {
        setTimer(calculateElapsed());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [session?.status, session?.startTime]);

  // Auto-complete timed sessions when duration is reached (skip for marathon)
  useEffect(() => {
    if (!session || !sessionId || hasAutoCompleted.current || isCompleting)
      return;

    // Marathon sessions don't auto-complete
    if (session.isMarathon) return;

    const targetSeconds = session.duration * 60;

    if (timer >= targetSeconds && session.status === 'active') {
      hasAutoCompleted.current = true;
      setIsCompleting(true);

      const hasLowViolations = isSessionSuccessful(
        session.violations || [],
        session.participants || []
      );

      const completeSession = async () => {
        try {
          if (hasLowViolations) {
            await endSession(sessionId, 'successful');
          } else {
            await endSession(
              sessionId,
              'failed',
              'Total violations exceeded 5 minute limit'
            );
          }
        } catch (error) {
          console.error('Failed to auto-complete session:', error);
          setIsCompleting(false);
          hasAutoCompleted.current = false;
        }
      };

      completeSession();
    }
  }, [timer, session, sessionId, isCompleting]);

  useEffect(() => {
    const handleAppStateChange = async (
      nextAppState: AppStateStatus
    ): Promise<void> => {
      const currentSession = sessionRef.current;

      if (
        appState.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        backgroundTime.current = Date.now();
      }

      if (
        (appState.current === 'background' ||
          appState.current === 'inactive') &&
        nextAppState === 'active'
      ) {
        // Sync timer with server time when returning from background
        if (currentSession?.status === 'active' && currentSession.startTime) {
          const startDate = parseFirestoreTimestamp(currentSession.startTime);
          if (startDate) {
            setTimer(Math.floor((Date.now() - startDate.getTime()) / 1000));
          }
        }

        if (
          backgroundTime.current &&
          currentSession?.status === 'active' &&
          auth.currentUser &&
          sessionId
        ) {
          const timeAwayMs = Date.now() - backgroundTime.current;
          const timeAwaySeconds = Math.floor(timeAwayMs / 1000);

          if (timeAwaySeconds >= 5) {
            try {
              const category = getViolationCategory(timeAwaySeconds);

              const result = await addViolation(
                sessionId,
                auth.currentUser.uid,
                'app-switch',
                timeAwaySeconds
              );

              if (result.isCatastrophic) {
                Alert.alert(
                  'Session Terminated',
                  `You were away for over 5 minutes. This session has been terminated.`,
                  [{ text: 'OK' }]
                );
                await terminateSession(
                  sessionId,
                  `Catastrophic violation by user (${Math.floor(
                    timeAwaySeconds / 60
                  )} minutes away)`
                );
              } else {
                if (category === 'large') {
                  Alert.alert(
                    'Large Violation',
                    `You were away for ${Math.floor(
                      timeAwaySeconds / 60
                    )} minutes. One more large violation may fail the session.`,
                    [{ text: 'OK' }]
                  );
                }
              }
            } catch (error) {
              console.error('Failed to log violation:', error);
            }
          }
        }

        backgroundTime.current = null;
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [sessionId]);

  const formatTime = (seconds: number): { mins: string; secs: string } => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      mins: mins.toString().padStart(2, '0'),
      secs: secs.toString().padStart(2, '0'),
    };
  };

  const formatElapsed = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleEndSession = (): void => {
    // Prevent race condition with auto-complete
    if (hasAutoCompleted.current || isCompleting) {
      return;
    }

    const isMarathon = session?.isMarathon;
    const targetSeconds = (session?.duration || 0) * 60;
    const isCompletedDuration = isMarathon || timer >= targetSeconds;
    const hasLowViolations = isSessionSuccessful(
      session?.violations || [],
      session?.participants || []
    );

    let confirmMessage = 'Are you sure you want to end this study session?';
    if (!isMarathon && !isCompletedDuration) {
      const remainingMins = Math.ceil((targetSeconds - timer) / 60);
      confirmMessage = `You still have ${remainingMins} minute(s) left. Ending early will mark this session as FAILED. Continue?`;
    }

    Alert.alert('End Session', confirmMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Session',
        style: 'destructive',
        onPress: async () => {
          // Double-check before executing
          if (hasAutoCompleted.current || isCompleting) {
            return;
          }

          // Set flags to prevent auto-complete from firing
          hasAutoCompleted.current = true;
          setIsCompleting(true);

          try {
            if (!sessionId) return;

            // Marathon sessions always succeed
            if (isMarathon) {
              await endSession(sessionId, 'successful');
              return;
            }

            if (isCompletedDuration && hasLowViolations) {
              await endSession(sessionId, 'successful');
            } else {
              let failReason = '';
              if (!isCompletedDuration) {
                failReason = 'Session ended early';
              } else {
                failReason = 'Total violations exceeded 5 minute limit';
              }
              await endSession(sessionId, 'failed', failReason);
            }
          } catch (error) {
            // Reset flags on error so user can retry
            hasAutoCompleted.current = false;
            setIsCompleting(false);
            Alert.alert('Error', 'Failed to end session');
          }
        },
      },
    ]);
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isMarathon = session.isMarathon;
  const targetSeconds = session.duration * 60;
  const progress = isMarathon ? 0 : Math.min(timer / targetSeconds, 1);

  // For marathon: show elapsed time counting up
  // For timed: show remaining time counting down
  const displaySeconds = isMarathon ? timer : Math.max(targetSeconds - timer, 0);
  const { mins, secs } = formatTime(displaySeconds);
  const totalFormatted = `${session.duration.toString().padStart(2, '0')}:00`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Timer Section */}
      <View style={styles.timerSection}>
        <CircularProgress progress={progress} size={280} strokeWidth={4}>
          <Text style={styles.focusLabel}>
            {isMarathon ? 'MARATHON' : 'DEEP FOCUS'}
          </Text>
          <View style={styles.timerDisplay}>
            <Text style={styles.timerMinutes}>{mins}</Text>
            <Text style={styles.timerColon}>:</Text>
            <Text style={styles.timerSeconds}>{secs}</Text>
          </View>
        </CircularProgress>

        {/* Task Label */}
        <View style={styles.taskSection}>
          <Text style={styles.taskLabel}>Currently working on</Text>
          <Text style={styles.taskName}>
            {isMarathon ? 'Marathon Session' : `${session.duration} Min Session`}
          </Text>
        </View>
      </View>

      {/* Progress Bar - only show for timed sessions */}
      {!isMarathon && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarLabels}>
            <Text style={styles.progressLabel}>
              ELAPSED: {formatElapsed(timer)}
            </Text>
            <Text style={styles.progressLabel}>TOTAL: {totalFormatted}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      )}

      {/* End Session Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.endButton, isCompleting && styles.buttonDisabled]}
          onPress={handleEndSession}
          disabled={isCompleting}
          activeOpacity={0.7}
        >
          <MaterialIcons name="stop" size={24} color={COLORS.danger} />
          <Text style={styles.endButtonText}>
            {isCompleting ? 'Ending...' : 'End Session'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.timer.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.timer.textSecondary,
  },
  timerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING.xl,
  },
  focusLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: TYPOGRAPHY.letterSpacing.superwide,
    color: COLORS.timer.textSecondary,
    marginBottom: SPACING.sm,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timerMinutes: {
    fontSize: TYPOGRAPHY.sizes['8xl'],
    fontWeight: TYPOGRAPHY.weights.extrabold,
    color: COLORS.timer.textPrimary,
  },
  timerColon: {
    fontSize: TYPOGRAPHY.sizes['5xl'],
    fontWeight: TYPOGRAPHY.weights.light,
    color: COLORS.timer.textSecondary,
    marginHorizontal: 2,
  },
  timerSeconds: {
    fontSize: TYPOGRAPHY.sizes['8xl'],
    fontWeight: TYPOGRAPHY.weights.extrabold,
    color: COLORS.timer.textPrimary,
  },
  taskSection: {
    alignItems: 'center',
    marginTop: SPACING['2xl'],
  },
  taskLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.timer.textSecondary,
    marginBottom: SPACING.xs,
  },
  taskName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.timer.textPrimary,
  },
  progressBarContainer: {
    paddingHorizontal: SPACING['2xl'],
    marginBottom: SPACING['3xl'],
  },
  progressBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    color: COLORS.timer.textSecondary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.timer.ringBackground,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: COLORS.timer.primary,
    borderRadius: 3,
  },
  buttonContainer: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING['4xl'],
  },
  endButton: {
    height: 56,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    backgroundColor: COLORS.dangerLight,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  endButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.danger,
  },
});

export default ActiveSessionScreen;
