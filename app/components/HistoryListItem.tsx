import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';

type IconType = 'person' | 'group' | 'bolt' | 'timer';

interface HistoryListItemProps {
  icon: IconType;
  title: string;
  meta: string;
  onPress: () => void;
  style?: ViewStyle;
}

const getIconName = (icon: IconType): keyof typeof MaterialIcons.glyphMap => {
  switch (icon) {
    case 'person':
      return 'person';
    case 'group':
      return 'group';
    case 'bolt':
      return 'flash-on';
    case 'timer':
      return 'timer';
    default:
      return 'person';
  }
};

const HistoryListItem: React.FC<HistoryListItemProps> = ({
  icon,
  title,
  meta,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons
          name={getIconName(icon)}
          size={24}
          color={COLORS.profile.primary}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      <View style={styles.chevronContainer}>
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={COLORS.profile.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.profile.cardBorder,
    ...SHADOWS.soft,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.profile.iconBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.profile.textPrimary,
    marginBottom: SPACING.xs,
  },
  meta: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
    color: COLORS.profile.textSecondary,
    textTransform: 'uppercase',
  },
  chevronContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HistoryListItem;
