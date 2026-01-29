import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconButton from '../components/IconButton';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import {
  auth,
  cancelSession,
  getUser,
  leaveSession,
  Session,
  startSession,
  subscribeToSession,
  UserProfile,
} from '../services/firebase';

const LobbyScreen = () => {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const isLeavingRef = useRef(false);

  // Pulsing animation for ready dot
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribeToSession(sessionId, (data) => {
      if (!data) {
        if (!isLeavingRef.current) {
          Alert.alert(
            'Session Cancelled',
            'The host has cancelled this session.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(tabs)/HomeScreen'),
              },
            ]
          );
        }
        return;
      }

      setSession(data);

      if (data.status === 'active') {
        router.replace({
          pathname: '/(tabs)/ActiveSessionScreen',
          params: { sessionId },
        });
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (session?.participants) {
        try {
          const userProfiles = await Promise.all(
            session.participants.map((id) => getUser(id))
          );
          setParticipants(userProfiles.filter(Boolean) as UserProfile[]);
        } catch (error) {
          console.error('Error fetching participants:', error);
        }
      }
    };

    fetchParticipants();
  }, [session?.participants]);

  const isHost = auth.currentUser?.uid === session?.hostId;

  const handleLeaveLobby = useCallback(async () => {
    if (!sessionId || !auth.currentUser) return;

    isLeavingRef.current = true;
    try {
      if (isHost) {
        await cancelSession(sessionId);
      } else {
        await leaveSession(sessionId, auth.currentUser.uid);
      }
      router.replace('/(tabs)/HomeScreen');
    } catch (error) {
      console.error('Error leaving lobby:', error);
      isLeavingRef.current = false;
      Alert.alert('Error', 'Failed to leave lobby');
    }
  }, [sessionId, isHost, router]);

  const confirmLeaveLobby = useCallback(() => {
    if (isHost) {
      Alert.alert(
        'Cancel Session?',
        'Leaving as the host will cancel this session for everyone.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave & Cancel',
            style: 'destructive',
            onPress: handleLeaveLobby,
          },
        ]
      );
    } else {
      Alert.alert(
        'Leave Session?',
        'Are you sure you want to leave this session?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: handleLeaveLobby },
        ]
      );
    }
    return true;
  }, [isHost, handleLeaveLobby]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      confirmLeaveLobby
    );
    return () => backHandler.remove();
  }, [confirmLeaveLobby]);

  const handleStartSession = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      await startSession(sessionId);
    } catch (error) {
      console.error('Error starting session:', error);
      Alert.alert('Error', 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleShareSession = async () => {
    if (!session?.roomCode) return;

    try {
      await Share.share({
        message: `Join my study session! Use code: ${session.roomCode}`,
      });
    } catch (error) {
      console.error('Error sharing session:', error);
    }
  };

  const handleCopyCode = async () => {
    if (!session?.roomCode) return;

    try {
      await Clipboard.setStringAsync(session.roomCode);
      Alert.alert('Copied!', 'Session code copied to clipboard');
    } catch (error) {
      console.error('Error copying code:', error);
      Alert.alert('Error', 'Failed to copy code');
    }
  };

  // Format room code with dash (e.g., "482-931")
  const formattedRoomCode = session?.roomCode
    ? `${session.roomCode.slice(0, 3)}-${session.roomCode.slice(3)}`
    : '------';

  const renderParticipantCard = (
    participant: UserProfile | null,
    index: number
  ) => {
    if (!participant) {
      return (
        <View key={`empty-${index}`} style={styles.participantCard}>
          <View style={styles.emptyAvatar}>
            <View style={styles.emptyDot} />
          </View>
        </View>
      );
    }

    const isSessionHost = participant.id === session?.hostId;
    const isCurrentUser = participant.id === auth.currentUser?.uid;
    const status = isSessionHost ? 'HOST' : isCurrentUser ? 'JOINED' : 'READY';

    return (
      <View
        key={participant.id}
        style={[
          styles.participantCard,
          isCurrentUser && styles.participantCardHighlight,
        ]}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, isSessionHost && styles.avatarHost]}>
            <Text style={styles.avatarInitial}>
              {participant.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          {isSessionHost && (
            <View style={styles.hostBadge}>
              <MaterialIcons name="star" size={12} color={COLORS.white} />
            </View>
          )}
        </View>
        <Text style={styles.participantName}>
          {isCurrentUser ? 'You' : participant.username}
        </Text>
        <Text style={styles.participantStatus}>{status}</Text>
      </View>
    );
  };

  // Get first host participant for ready message
  const hostParticipant = participants.find((p) => p.id === session?.hostId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - X to leave, share on right */}
      <View style={styles.header}>
        <IconButton
          icon="close"
          onPress={confirmLeaveLobby}
          variant="elevated"
          color={COLORS.social.textPrimary}
        />
        <IconButton
          icon="share"
          onPress={handleShareSession}
          variant="elevated"
          color={COLORS.social.textPrimary}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Session Code Card */}
        <View style={styles.codeSection}>
          <Text style={styles.codeLabel}>SESSION CODE</Text>
          <TouchableOpacity
            style={styles.codeCard}
            onPress={handleCopyCode}
            activeOpacity={0.7}
          >
            <Text style={styles.codeText}>{formattedRoomCode}</Text>
            <View style={styles.copyBadge}>
              <MaterialIcons
                name="content-copy"
                size={14}
                color={COLORS.white}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Study Group Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Study Group</Text>
          <View style={styles.joinedBadge}>
            <Text style={styles.joinedBadgeText}>
              {participants.length} / 10 Joined
            </Text>
          </View>
        </View>

        {/* Participant Grid */}
        <View style={styles.participantGrid}>
          {[0, 1, 2, 3].map((index) =>
            renderParticipantCard(participants[index] || null, index)
          )}
        </View>

        {/* Decorative Dots - shows number of participants */}
        <View style={styles.decorativeDots}>
          {participants.map((_, index) => (
            <View key={index} style={[styles.dot, styles.dotActive]} />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        {/* Ready Message */}
        <View style={styles.readyMessage}>
          <Animated.View style={[styles.pulsingDot, { opacity: pulseAnim }]} />
          <Text style={styles.readyText}>
            {isHost
              ? 'Ready to start when everyone is here.'
              : `Ready when you are, ${hostParticipant?.username || 'Host'}.`}
          </Text>
        </View>

        {/* Start Button (Host Only) */}
        {isHost && (
          <TouchableOpacity
            style={[styles.startButton, loading && styles.buttonDisabled]}
            onPress={handleStartSession}
            disabled={loading}
            activeOpacity={0.8}
          >
            <MaterialIcons name="play-arrow" size={24} color={COLORS.white} />
            <Text style={styles.startButtonText}>
              {loading ? 'Starting...' : 'Start Session for All'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.social.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING['2xl'],
  },
  codeSection: {
    alignItems: 'center',
    marginTop: SPACING['2xl'],
    marginBottom: SPACING['4xl'],
  },
  codeLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.extrabold,
    letterSpacing: TYPOGRAPHY.letterSpacing.widest,
    color: COLORS.social.textSecondary,
    marginBottom: SPACING.xs,
  },
  codeCard: {
    backgroundColor: COLORS.social.highlight,
    paddingHorizontal: SPACING['3xl'],
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.social.cardBorderLight,
    position: 'relative',
  },
  codeText: {
    fontSize: TYPOGRAPHY.sizes['6xl'],
    fontWeight: TYPOGRAPHY.weights.extrabold,
    letterSpacing: TYPOGRAPHY.letterSpacing.widest,
    color: COLORS.social.textPrimary,
  },
  copyBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.social.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.social.textPrimary,
  },
  joinedBadge: {
    backgroundColor: COLORS.social.highlight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
  },
  joinedBadgeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.social.primary,
  },
  participantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
  },
  participantCard: {
    width: '47%',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: COLORS.white,
    ...SHADOWS.medium,
  },
  participantCardHighlight: {
    backgroundColor: COLORS.social.highlight,
    borderColor: COLORS.social.highlightBorder,
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.social.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.social.cardBorder,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.social.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHost: {
    borderWidth: 3,
    borderColor: COLORS.social.primary,
    backgroundColor: COLORS.social.highlight,
  },
  avatarInitial: {
    fontSize: TYPOGRAPHY.sizes['4xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  hostBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.social.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  participantName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.social.textPrimary,
    marginBottom: SPACING.xs,
  },
  participantStatus: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    color: COLORS.social.textSecondary,
  },
  decorativeDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING['3xl'],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.social.cardBorder,
  },
  dotActive: {
    backgroundColor: COLORS.social.primary,
  },
  bottomContainer: {
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING['2xl'],
    paddingBottom: SPACING['4xl'],
    backgroundColor: COLORS.social.background,
  },
  readyMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.social.primary,
  },
  readyText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.social.textSecondary,
  },
  startButton: {
    height: 56,
    backgroundColor: COLORS.timer.primary,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.button,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
});

export default LobbyScreen;
