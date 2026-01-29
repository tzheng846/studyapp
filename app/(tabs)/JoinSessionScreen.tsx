import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconButton from '../components/IconButton';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import {
  auth,
  cancelSession,
  getUserActiveSession,
  joinSessionByCode,
  leaveSession,
} from '../services/firebase';

const JoinSessionScreen = () => {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const isRetryingRef = useRef(false);

  const handleRoomCodeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    setRoomCode(cleaned);
  };

  const handleJoinSession = async () => {
    if (roomCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit room code');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to join a session');
      return;
    }

    setLoading(true);
    try {
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
                    await leaveSession(
                      existingSession.id,
                      auth.currentUser!.uid
                    );
                  }
                  // Reset loading and retry flag before retrying
                  setLoading(false);
                  isRetryingRef.current = false;
                  handleJoinSession();
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

      const sessionId = await joinSessionByCode(roomCode, auth.currentUser.uid);

      router.push({
        pathname: '/(tabs)/LobbyScreen',
        params: { sessionId },
      });
    } catch (error: any) {
      console.error('Error joining session:', error);
      Alert.alert('Error', error.message || 'Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - Just back arrow */}
      <View style={styles.header}>
        <IconButton
          icon="chevron-left"
          onPress={() => router.replace('/(tabs)/HomeScreen')}
          color={COLORS.social.textPrimary}
        />
        <View style={{ width: 48 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.heading}>Ready to focus?</Text>
          <Text style={styles.subtitle}>
            Enter the unique 6-digit code to join your group's study room.
          </Text>

          {/* Digit Boxes */}
          <TouchableOpacity
            style={styles.digitContainer}
            onPress={() => inputRef.current?.focus()}
            activeOpacity={1}
          >
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <View
                key={index}
                style={[
                  styles.digitBox,
                  index === roomCode.length && styles.digitBoxActive,
                  index === 3 && styles.digitBoxSpacing,
                ]}
              >
                <Text style={styles.digitText}>{roomCode[index] || ''}</Text>
              </View>
            ))}
          </TouchableOpacity>

          {/* Hidden Input */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={roomCode}
            onChangeText={handleRoomCodeChange}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          {/* Join Button */}
          <TouchableOpacity
            style={[
              styles.joinButton,
              (loading || roomCode.length !== 6) && styles.joinButtonDisabled,
            ]}
            onPress={handleJoinSession}
            disabled={loading || roomCode.length !== 6}
            activeOpacity={0.8}
          >
            <Text style={styles.joinButtonText}>
              {loading ? 'Joining...' : 'Join Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Link */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.findSessionsButton}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Coming Soon', 'Find Nearby Sessions feature is coming soon!')}
          >
            <MaterialIcons
              name="explore"
              size={20}
              color={COLORS.social.primary}
            />
            <Text style={styles.findSessionsText}>FIND NEARBY SESSIONS</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  heading: {
    fontSize: TYPOGRAPHY.sizes['5xl'],
    fontWeight: TYPOGRAPHY.weights.extrabold,
    color: COLORS.social.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.social.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    alignSelf: 'center',
    marginBottom: SPACING['4xl'],
    lineHeight: 24,
  },
  digitContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING['3xl'],
  },
  digitBox: {
    width: 48,
    height: 56,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  digitBoxActive: {
    borderWidth: 2,
    borderColor: COLORS.social.primary,
  },
  digitBoxSpacing: {
    marginLeft: SPACING.md,
  },
  digitText: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.social.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
  },
  joinButton: {
    height: 56,
    backgroundColor: COLORS.social.primary,
    borderRadius: RADIUS['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.greenButton,
  },
  joinButtonDisabled: {
    backgroundColor: COLORS.social.cardBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  joinButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  footer: {
    paddingBottom: SPACING['4xl'],
    paddingTop: SPACING.lg,
    alignItems: 'center',
  },
  findSessionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
  },
  findSessionsText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.social.primary,
    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
  },
});

export default JoinSessionScreen;
