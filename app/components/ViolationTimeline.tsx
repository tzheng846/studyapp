import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { getUser, UserProfile, Violation, ViolationCategory } from '../services/firebase';

interface ViolationTimelineProps {
  violations: Violation[];
  sessionStartTime?: Date | null;
  participants: string[];
}

const getCategoryColor = (category: ViolationCategory): string => {
  switch (category) {
    case 'minor':
      return COLORS.social.primary;
    case 'medium':
      return '#f5a623';
    case 'large':
      return '#ff8c00';
    case 'catastrophic':
      return COLORS.danger;
    default:
      return COLORS.social.textSecondary;
  }
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

const formatTimestamp = (
  timestamp: string,
  sessionStart?: Date | null
): string => {
  try {
    const violationTime = new Date(timestamp);

    if (sessionStart) {
      // Show relative time from session start
      const diffMs = violationTime.getTime() - sessionStart.getTime();
      const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Fallback to time of day
    return violationTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '--:--';
  }
};

const ViolationTimeline: React.FC<ViolationTimelineProps> = ({
  violations,
  sessionStartTime,
  participants,
}) => {
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());

  useEffect(() => {
    const fetchUserProfiles = async () => {
      const uniqueUserIds = [...new Set(violations.map((v) => v.userId).filter(Boolean))];
      const profileMap = new Map<string, UserProfile>();

      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          try {
            const profile = await getUser(userId);
            if (profile) {
              profileMap.set(userId, profile);
            }
          } catch (error) {
            console.error(`Error fetching profile for ${userId}:`, error);
          }
        })
      );

      setUserProfiles(profileMap);
    };

    if (violations.length > 0) {
      fetchUserProfiles();
    }
  }, [violations, participants]);

  if (!violations || violations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons
          name="verified"
          size={48}
          color={COLORS.social.primary}
        />
        <Text style={styles.emptyTitle}>Perfect Focus!</Text>
        <Text style={styles.emptySubtitle}>
          No app switches detected during this session
        </Text>
      </View>
    );
  }

  // Sort violations by timestamp
  const sortedViolations = [...violations].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Violation Timeline</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{violations.length}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedViolations.map((violation, index) => {
          const isLast = index === sortedViolations.length - 1;
          const categoryColor = getCategoryColor(violation.category);

          return (
            <View key={`${violation.timestamp}-${index}`} style={styles.item}>
              {/* Timeline Line */}
              {!isLast && <View style={styles.timelineLine} />}

              {/* Timeline Dot */}
              <View style={[styles.timelineDot, { backgroundColor: categoryColor }]} />

              {/* Content */}
              <View style={styles.itemContent}>
                {/* Time Marker */}
                <Text style={styles.timeMarker}>
                  {formatTimestamp(violation.timestamp, sessionStartTime)}
                </Text>

                {/* Violation Card */}
                <View style={styles.violationCard}>
                  <View style={styles.cardHeader}>
                    <MaterialIcons
                      name="phonelink-erase"
                      size={16}
                      color={categoryColor}
                    />
                    <Text style={[styles.categoryLabel, { color: categoryColor }]}>
                      {violation.category.toUpperCase()}
                    </Text>
                  </View>
                  {violation.userId && userProfiles.get(violation.userId) && (
                    <Text style={styles.usernameText}>
                      {userProfiles.get(violation.userId)?.username}
                    </Text>
                  )}
                  <Text style={styles.durationText}>
                    Away for {formatDuration(violation.durationSeconds)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.social.textPrimary,
  },
  countBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.lg,
  },
  countText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.danger,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.lg,
  },
  item: {
    flexDirection: 'row',
    paddingLeft: SPACING.sm,
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 11,
    top: 20,
    bottom: -SPACING.lg,
    width: 2,
    backgroundColor: COLORS.social.cardBorder,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: SPACING.md,
    zIndex: 1,
  },
  itemContent: {
    flex: 1,
  },
  timeMarker: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.social.textSecondary,
    marginBottom: SPACING.xs,
  },
  violationCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.social.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  categoryLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
  usernameText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.social.textPrimary,
    marginBottom: SPACING.xs,
  },
  durationText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.social.textPrimary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.social.primary,
    marginTop: SPACING.lg,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.social.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

export default ViolationTimeline;
