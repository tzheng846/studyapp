import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface DurationPickerProps {
  hours: number;
  minutes: number;
  onChangeHours: (hours: number) => void;
  onChangeMinutes: (minutes: number) => void;
}

const ITEM_HEIGHT = 80;
const VISIBLE_ITEMS = 3;

// Generate arrays
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ... 55

interface WheelProps {
  data: number[];
  value: number;
  onChange: (value: number) => void;
}

const Wheel: React.FC<WheelProps> = ({ data, value, onChange }) => {
  const flatListRef = useRef<FlatList<number>>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const isProgrammaticScroll = useRef(false);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Keep refs updated
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Scroll to initial position
  useEffect(() => {
    const currentIndex = data.indexOf(value);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const initialOffset = safeIndex * ITEM_HEIGHT;
    setScrollOffset(initialOffset);

    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: initialOffset,
        animated: false,
      });
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Track scroll position in real-time
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrollOffset(event.nativeEvent.contentOffset.y);
    },
    []
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Ignore scroll end events from our own programmatic scroll
      if (isProgrammaticScroll.current) {
        isProgrammaticScroll.current = false;
        return;
      }

      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
      const newValue = data[clampedIndex];

      // Only update if value changed
      if (newValue !== valueRef.current) {
        onChangeRef.current(newValue);
      }

      // Mark as programmatic before snapping
      isProgrammaticScroll.current = true;

      // Snap to position
      flatListRef.current?.scrollToOffset({
        offset: clampedIndex * ITEM_HEIGHT,
        animated: true,
      });
    },
    [data]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: number; index: number }) => {
      // Calculate which index is currently centered based on scroll offset
      const centeredIndex = Math.round(scrollOffset / ITEM_HEIGHT);
      const isSelected = index === centeredIndex;
      const distance = Math.abs(index - centeredIndex);

      // Calculate opacity and scale based on distance from center (cylindrical effect)
      const opacity = distance === 0 ? 1 : distance === 1 ? 0.4 : 0.2;
      const scale = distance === 0 ? 1.0 : distance === 1 ? 0.85 : 0.7;

      const displayValue = item.toString().padStart(2, '0');

      return (
        <View style={styles.item}>
          <Text
            style={[
              styles.itemText,
              isSelected && styles.itemTextSelected,
              { opacity, transform: [{ scale }] },
            ]}
          >
            {displayValue}
          </Text>
        </View>
      );
    },
    [scrollOffset]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback((item: number) => item.toString(), []);

  return (
    <View style={styles.wheelContainer}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        extraData={scrollOffset}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={true}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={(e) => {
          // Only handle if no momentum (user lifted finger without flicking)
          if (e.nativeEvent.velocity?.y === 0 || !e.nativeEvent.velocity) {
            handleScrollEnd(e);
          }
        }}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
        contentContainerStyle={styles.flatListContent}
        ListHeaderComponent={<View style={{ height: ITEM_HEIGHT }} />}
        ListFooterComponent={<View style={{ height: ITEM_HEIGHT }} />}
      />
    </View>
  );
};

const DurationPicker: React.FC<DurationPickerProps> = ({
  hours,
  minutes,
  onChangeHours,
  onChangeMinutes,
}) => {
  return (
    <View style={styles.container}>
      {/* Wheels Row */}
      <View style={styles.wheelsRow}>
        {/* Hours Wheel */}
        <Wheel
          data={HOURS}
          value={hours}
          onChange={onChangeHours}
        />

        {/* Colon Separator */}
        <View style={styles.colonContainer}>
          <Text style={styles.colon}>:</Text>
        </View>

        {/* Minutes Wheel */}
        <Wheel
          data={MINUTES}
          value={minutes}
          onChange={onChangeMinutes}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wheelContainer: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: 120,
    overflow: 'hidden',
  },
  flatListContent: {
    alignItems: 'center',
  },
  item: {
    height: ITEM_HEIGHT,
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 72,
    fontWeight: TYPOGRAPHY.weights.light,
    color: COLORS.timer.textMuted,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
  },
  itemTextSelected: {
    fontWeight: TYPOGRAPHY.weights.light,
    color: COLORS.timer.primary,
  },
  colonContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colon: {
    fontSize: 72,
    fontWeight: TYPOGRAPHY.weights.light,
    color: COLORS.timer.primary,
  },
});

export default DurationPicker;
