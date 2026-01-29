import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HistoryListItem from '../components/HistoryListItem';
import IconButton from '../components/IconButton';
import StatCard from '../components/StatCard';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import {
  auth,
  getUser,
  getUserSessions,
  Session,
  UserProfile,
} from '../services/firebase';

const formatDate = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}M`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}H ${mins}M` : `${hours}H`;
};

const getSessionIcon = (session: Session): 'person' | 'group' | 'bolt' => {
  const participantCount = session.participants?.length || 1;
  if (participantCount > 1) return 'group';
  if (session.duration >= 45) return 'bolt';
  return 'person';
};

const getSessionTitle = (session: Session): string => {
  const participantCount = session.participants?.length || 1;
  if (participantCount > 1) return 'Group Study';
  if (session.duration >= 45) return 'Deep Work';
  return 'Solo Focus';
};

const formatMemberSince = (timestamp: any): string => {
  if (!timestamp) return 'Member';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return `Member since ${date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })}`;
};

const AccountHistoryScreen: React.FC = () => {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userData = await getUser(currentUser.uid);
        setUser(userData);

        const userSessions = await getUserSessions(currentUser.uid);
        setSessions(userSessions);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load sessions');
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderEmptyState = (): React.ReactElement => (
    <View style={styles.emptyState}>
      <MaterialIcons
        name="history"
        size={48}
        color={COLORS.profile.textSecondary}
      />
      <Text style={styles.emptyText}>No study sessions yet</Text>
      <Text style={styles.emptySubtext}>Start your first session!</Text>
    </View>
  );

  const renderSessionItem = ({ item }: { item: Session }) => {
    const meta = `${formatDate(item.createdAt)} • ${formatDuration(
      item.duration
    )}`;

    return (
      <HistoryListItem
        icon={getSessionIcon(item)}
        title={getSessionTitle(item)}
        meta={meta}
        onPress={() => {
          if (item.status === 'active') {
            router.push({
              pathname: '/(tabs)/ActiveSessionScreen',
              params: { sessionId: item.id },
            });
          } else if (item.status === 'ended') {
            // Navigate based on session outcome
            const targetScreen = item.outcome === 'successful'
              ? '/(tabs)/SessionSuccessScreen'
              : '/(tabs)/SessionFailScreen';
            router.push({
              pathname: targetScreen,
              params: { sessionId: item.id },
            });
          }
        }}
        style={styles.historyItem}
      />
    );
  };

  const totalHours = user?.totalHours?.toFixed(1) || '0';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - Just back arrow */}
      <View style={styles.header}>
        <IconButton
          icon="chevron-left"
          onPress={() => router.replace('/(tabs)/HomeScreen')}
          color={COLORS.profile.textPrimary}
        />
        <View style={{ width: 48 }} />
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <Text style={styles.userName}>{user?.username || 'User'}</Text>
              <Text style={styles.memberSince}>
                {formatMemberSince(user?.createdAt)}
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                label="FOCUS"
                value={`${totalHours}h`}
                variant="profile"
              />
              <StatCard
                label="SESSIONS"
                value={`${user?.sessionsCompleted || 0}`}
                variant="profile"
              />
              <StatCard
                label="STREAK"
                value="0 Days"
                variant="profile"
              />
            </View>

            {/* Recent History Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent History</Text>
            </View>
          </>
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.profile.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
  },
  avatarContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: COLORS.profile.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.profile.iconBackground,
    ...SHADOWS.elevated,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.sizes['7xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  userName: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.profile.textPrimary,
    marginTop: SPACING.lg,
  },
  memberSince: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.normal,
    color: COLORS.profile.textSecondary,
    marginTop: SPACING.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  sectionHeader: {
    paddingTop: SPACING['3xl'],
    paddingBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.profile.textPrimary,
  },
  historyItem: {
    marginBottom: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['5xl'],
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.profile.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.profile.textSecondary,
  },
});

export default AccountHistoryScreen;
