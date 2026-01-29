import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DurationPicker from '../components/DurationPicker';
import IconButton from '../components/IconButton';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import {
  auth,
  cancelSession,
  createSession,
  getUserActiveSession,
  leaveSession,
} from '../services/firebase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SessionMode = 'marathon' | 'timed';

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(25);
  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<SessionMode>('timed');
  const scrollViewRef = useRef<ScrollView>(null);
  const isRetryingRef = useRef<boolean>(false);

  const breathingAnim = useRef(new Animated.Value(1)).current;
  const clickScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnim, {
          toValue: 1.03,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );

    breathingAnimation.start();
    return () => breathingAnimation.stop();
  }, []);

  // Update mode in real-time during scroll
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
    setMode(pageIndex === 0 ? 'timed' : 'marathon');
  };

  const handleStartPress = async (): Promise<void> => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to create a session');
      return;
    }

    // Animate button press
    Animated.sequence([
      Animated.timing(clickScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(clickScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setLoading(true);
    try {
      // Check if user is already in a session
      const existingSession = await getUserActiveSession(auth.currentUser.uid);

      if (existingSession) {
        setLoading(false);
        const isHost = existingSession.hostId === auth.currentUser.uid;

        Alert.alert(
          'Already in a Session',
          isHost
            ? 'You already have an active session. Would you like to go to it or cancel it?'
            : "You're already in another session. Would you like to go to it or leave it?",
          [
            { text: 'Stay Here', style: 'cancel' },
            {
              text: 'Go to Session',
              onPress: () => {
                if (existingSession.status === 'active') {
                  router.replace({
                    pathname: '/(tabs)/ActiveSessionScreen',
                    params: { sessionId: existingSession.id },
                  });
                } else {
                  router.replace({
                    pathname: '/(tabs)/LobbyScreen',
                    params: { sessionId: existingSession.id },
                  });
                }
              },
            },
            {
              text: isHost ? 'Cancel It' : 'Leave It',
              style: 'destructive',
              onPress: async () => {
                if (isRetryingRef.current) return;
                isRetryingRef.current = true;
                try {
                  if (isHost) {
                    await cancelSession(existingSession.id);
                  } else {
                    await leaveSession(existingSession.id, auth.currentUser!.uid);
                  }
                  // Reset loading and retry flag before retrying
                  setLoading(false);
                  isRetryingRef.current = false;
                  handleStartPress();
                } catch (err) {
                  isRetryingRef.current = false;
                  Alert.alert('Error', 'Failed to leave existing session');
                }
              },
            },
          ]
        );
        return;
      }

      const isMarathon = mode === 'marathon';
      const totalDuration = hours * 60 + minutes;

      if (!isMarathon && totalDuration <= 0) {
        Alert.alert('Invalid Duration', 'Please select a duration greater than 0');
        setLoading(false);
        return;
      }

      const sessionId = await createSession(
        auth.currentUser.uid,
        [],
        totalDuration,
        isMarathon
      );

      router.replace({
        pathname: '/(tabs)/LobbyScreen',
        params: { sessionId },
      });
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Error', 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPress = (): void => {
    router.push('/(tabs)/JoinSessionScreen');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="history"
          onPress={() => router.push('/(tabs)/AccountHistoryScreen')}
          color={COLORS.timer.textSecondary}
        />
        <View style={{ width: 48 }} />
      </View>

      {/* Main Content */}
      <View style={styles.centerContent}>
        {/* Context Label */}
        <Text style={styles.contextLabel}>
          {mode === 'timed' ? 'Ready to focus?' : 'Go the distance'}
        </Text>

        {/* Swipeable Content Area */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Page 1: Timed Mode (Default) */}
          <View style={[styles.page, { width: SCREEN_WIDTH }]}>
            <View style={styles.pickerWrapper}>
              <DurationPicker
                hours={hours}
                minutes={minutes}
                onChangeHours={setHours}
                onChangeMinutes={setMinutes}
              />
            </View>
          </View>

          {/* Page 2: Marathon Mode */}
          <View style={[styles.page, { width: SCREEN_WIDTH }]}>
            <View style={styles.marathonWrapper}>
              <Text style={styles.marathonText}>MARATHON</Text>
            </View>
          </View>
        </ScrollView>

        {/* Main Button with Outer Ring - Fixed Position */}
        <Animated.View
          style={[
            styles.buttonOuterRing,
            {
              transform: [
                { scale: Animated.multiply(breathingAnim, clickScaleAnim) },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.mainButton, loading && styles.mainButtonDisabled]}
            onPress={handleStartPress}
            activeOpacity={0.9}
            disabled={loading}
          >
            <MaterialIcons name="play-arrow" size={48} color={COLORS.white} />
            <Text style={styles.mainButtonText}>
              {loading ? 'CREATING...' : mode === 'timed' ? 'START SESSION' : 'START MARATHON'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Page Indicators */}
        <View style={styles.pageIndicators}>
          <View style={[styles.dot, mode === 'timed' && styles.dotActive]} />
          <View style={[styles.dot, mode === 'marathon' && styles.dotActive]} />
        </View>
      </View>

      {/* Bottom Action - Join Lobby */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={handleJoinPress}
          activeOpacity={0.8}
        >
          <Text style={styles.joinButtonText}>JOIN LOBBY</Text>
          <MaterialIcons
            name="arrow-forward"
            size={20}
            color={COLORS.timer.textSecondary}
          />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SPACING.xl,
  },
  contextLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.timer.textSecondary,
    marginBottom: SPACING.md,
  },
  scrollView: {
    flexGrow: 0,
    height: 260,
  },
  scrollContent: {
    alignItems: 'center',
  },
  page: {
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marathonWrapper: {
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marathonText: {
    fontSize: TYPOGRAPHY.sizes['5xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: TYPOGRAPHY.letterSpacing.widest,
    color: COLORS.timer.primary,
  },
  pickerWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonOuterRing: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: COLORS.timer.ringOuter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButton: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: COLORS.timer.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.button,
  },
  mainButtonDisabled: {
    opacity: 0.6,
  },
  mainButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: TYPOGRAPHY.letterSpacing.widest,
    marginTop: SPACING.sm,
  },
  pageIndicators: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING['2xl'],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.timer.ringBackground,
  },
  dotActive: {
    backgroundColor: COLORS.timer.primary,
  },
  bottomContainer: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING['3xl'],
  },
  joinButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  joinButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: TYPOGRAPHY.letterSpacing.widest,
    color: COLORS.timer.textSecondary,
  },
});

export default HomeScreen;
