import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

type ColorVariant = 'timer' | 'social' | 'profile';

interface StatCardProps {
  label: string;
  value: string;
  variant?: ColorVariant;
  valueColor?: string;
  style?: ViewStyle;
}

const getColors = (variant: ColorVariant) => {
  switch (variant) {
    case 'timer':
      return {
        labelColor: COLORS.timer.textSecondary,
        valueColor: COLORS.timer.primary,
        borderColor: COLORS.timer.ringBackground,
      };
    case 'social':
      return {
        labelColor: COLORS.social.textSecondary,
        valueColor: COLORS.social.primary,
        borderColor: COLORS.social.cardBorder,
      };
    case 'profile':
      return {
        labelColor: COLORS.profile.textSecondary,
        valueColor: COLORS.profile.primary,
        borderColor: COLORS.profile.cardBorder,
      };
    default:
      return {
        labelColor: COLORS.timer.textSecondary,
        valueColor: COLORS.timer.primary,
        borderColor: COLORS.timer.ringBackground,
      };
  }
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  variant = 'timer',
  valueColor,
  style,
}) => {
  const colors = getColors(variant);

  return (
    <View style={[styles.card, { borderColor: colors.borderColor }, style]}>
      <Text style={[styles.label, { color: colors.labelColor }]}>{label}</Text>
      <Text style={[styles.value, { color: valueColor || colors.valueColor }]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.soft,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  value: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});

export default StatCard;
