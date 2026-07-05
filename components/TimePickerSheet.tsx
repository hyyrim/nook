import { View, Text, StyleSheet, Pressable, Modal, ScrollView, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Colors, Radius } from '@/constants';

// iOS 알람 스타일 3-column wheel picker.
// 오전/오후 · 시(1~12) · 분(00 or 30) — 30분 단위 스펙.

const ROW_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const CONTAINER_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS;
const CENTER_OFFSET = ROW_HEIGHT * 2; // padding to allow first/last items reach center

const PERIODS = ['오전', '오후'] as const;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 30] as const;

type Period = typeof PERIODS[number];

type Props = {
  visible: boolean;
  hour: number; // 0~23
  minute: number; // 0 or 30
  onClose: () => void;
  onSelect: (next: { hour: number; minute: number }) => void;
};

function to12Hour(hour24: number): { period: Period; hour12: number } {
  const period: Period = hour24 < 12 ? '오전' : '오후';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { period, hour12 };
}

function to24Hour(period: Period, hour12: number): number {
  if (period === '오전') return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

type WheelProps<T> = {
  items: readonly T[];
  selectedIndex: number;
  onChange: (index: number) => void;
  render: (item: T) => string;
  width: number;
};

function Wheel<T>({ items, selectedIndex, onChange, render, width }: WheelProps<T>) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  useEffect(() => {
    // Sync when parent selection changes (e.g. sheet reopened with different value)
    scrollRef.current?.scrollTo({ y: selectedIndex * ROW_HEIGHT, animated: false });
    setActiveIndex(selectedIndex);
  }, [selectedIndex]);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const raw = Math.round(y / ROW_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, raw));
    setActiveIndex(clamped);
    onChange(clamped);
    // Snap correction if scroll landed off-grid (rare on iOS but safe)
    if (Math.abs(y - clamped * ROW_HEIGHT) > 0.5) {
      scrollRef.current?.scrollTo({ y: clamped * ROW_HEIGHT, animated: true });
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const raw = Math.round(y / ROW_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, raw));
    if (clamped !== activeIndex) setActiveIndex(clamped);
  };

  return (
    <View style={[styles.wheelCol, { width }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: CENTER_OFFSET }}
      >
        {items.map((item, i) => {
          const distance = Math.abs(i - activeIndex);
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.55 : distance === 2 ? 0.28 : 0.14;
          return (
            <View key={i} style={styles.row}>
              <Text style={[styles.rowText, { opacity }]}>{render(item)}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function TimePickerSheet({ visible, hour, minute, onClose, onSelect }: Props) {
  const initial = useMemo(() => to12Hour(hour), [hour]);
  const initialPeriodIndex = PERIODS.indexOf(initial.period);
  const initialHourIndex = HOURS.indexOf(initial.hour12);
  const initialMinuteIndex = MINUTES.indexOf(minute as (typeof MINUTES)[number]);

  const [periodIndex, setPeriodIndex] = useState(initialPeriodIndex);
  const [hourIndex, setHourIndex] = useState(initialHourIndex);
  const [minuteIndex, setMinuteIndex] = useState(
    initialMinuteIndex >= 0 ? initialMinuteIndex : 0,
  );

  // Reset internal state when sheet becomes visible with new props
  useEffect(() => {
    if (visible) {
      setPeriodIndex(initialPeriodIndex);
      setHourIndex(initialHourIndex);
      setMinuteIndex(initialMinuteIndex >= 0 ? initialMinuteIndex : 0);
    }
  }, [visible, initialPeriodIndex, initialHourIndex, initialMinuteIndex]);

  const handleDone = () => {
    const period = PERIODS[periodIndex];
    const hour12 = HOURS[hourIndex];
    const nextHour = to24Hour(period, hour12);
    const nextMinute = MINUTES[minuteIndex];
    onSelect({ hour: nextHour, minute: nextMinute });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/*
        Backdrop을 절대 위치 TouchableOpacity로 두고 sheet를 그 위에 배치해야
        sheet 안 ScrollView pan 제스처가 살아있음. 예전엔 Pressable을 감싸서 pan을 삼켰음.
      */}
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={8} style={styles.headerButton}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Text style={styles.title}>발송 시간</Text>
            <Pressable onPress={handleDone} hitSlop={8} style={styles.headerButton}>
              <Text style={styles.doneText}>완료</Text>
            </Pressable>
          </View>

          <View style={styles.wheelContainer}>
            {/* Center highlight overlay (behind wheels) */}
            <View pointerEvents="none" style={styles.centerHighlight} />

            <View style={styles.wheelRow}>
              <Wheel
                items={PERIODS}
                selectedIndex={periodIndex}
                onChange={setPeriodIndex}
                render={(p) => p}
                width={80}
              />
              <Wheel
                items={HOURS}
                selectedIndex={hourIndex}
                onChange={setHourIndex}
                render={(h) => pad(h)}
                width={70}
              />
              <View style={styles.colon}>
                <Text style={styles.colonText}>:</Text>
              </View>
              <Wheel
                items={MINUTES as readonly number[]}
                selectedIndex={minuteIndex}
                onChange={setMinuteIndex}
                render={(m) => pad(m)}
                width={70}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.07)',
  },
  headerButton: {
    minWidth: 50,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: Colors.secondary,
    fontWeight: '500',
  },
  doneText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'right',
  },
  wheelContainer: {
    height: CONTAINER_HEIGHT,
    justifyContent: 'center',
    marginTop: 8,
  },
  centerHighlight: {
    position: 'absolute',
    top: CENTER_OFFSET,
    left: 20,
    right: 20,
    height: ROW_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.045)',
    borderRadius: Radius.md,
  },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: CONTAINER_HEIGHT,
  },
  wheelCol: {
    height: CONTAINER_HEIGHT,
  },
  row: {
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    fontSize: 22,
    fontWeight: '500',
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
  },
  colon: {
    width: 12,
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colonText: {
    fontSize: 22,
    fontWeight: '500',
    color: Colors.primary,
    lineHeight: 24,
  },
});
