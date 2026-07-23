import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { Colors, Radius } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import {
  computePresetTime,
  formatReminderStatus,
  getCachedUserTime,
  getUserPreferredTime,
  labelForPreset,
  type ReminderPreset,
  type ReminderRecord,
} from '@/lib/reminders';

type Props = {
  visible: boolean;
  reminder: ReminderRecord | null;
  busy: boolean;
  onClose: () => void;
  onSchedule: (remindAt: Date, preset: ReminderPreset) => void;
  onCancelReminder: () => void;
};

const PRESETS: ReminderPreset[] = ['hour', 'tomorrow', 'weekend'];

export function ReminderSheet({
  visible,
  reminder,
  busy,
  onClose,
  onSchedule,
  onCancelReminder,
}: Props) {
  // 초기값을 캐시에서 가져와 첫 open 시 loading→content 리렌더가 fade 애니메이션과 겹치지 않게 함.
  // 캐시가 비어 있으면 mount 시점(sheet 열리기 전)부터 warm up 시작.
  const [userTime, setUserTime] = useState<{ hour: number; minute: number } | null>(() => getCachedUserTime());

  useEffect(() => {
    if (userTime) return;
    let cancelled = false;
    void getUserPreferredTime().then((t) => {
      if (!cancelled) setUserTime(t);
    });
    return () => {
      cancelled = true;
    };
  }, [userTime]);

  const now = useMemo(() => new Date(), [visible]);

  const presetItems = useMemo(() => {
    if (!userTime) return null;
    return PRESETS.map((preset) => {
      const date = computePresetTime(preset, userTime, now);
      const label = labelForPreset(preset, date, now);
      return { preset, date, label };
    });
  }, [userTime, now]);

  return (
    // busy(스케줄/취소 진행) 중엔 dismiss를 막는다. 진행 중 backdrop/닫기/back으로
    // 시트를 unmount하면 iOS scheduleNotificationAsync 네이티브 호출 도중 Modal이
    // 사라져 orphan backdrop이 터치를 캡처하는 먹통을 유발한다. 완료 후 호출자가 닫는다.
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? undefined : onClose}>
      <Pressable style={styles.backdrop} onPress={busy ? undefined : onClose}>
        <View style={styles.sheetContainer}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Ionicons name="notifications-outline" size={16} color={Colors.primary} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>리마인더</Text>
                {reminder ? (
                  <Text style={styles.statusText}>
                    예약됨: {formatReminderStatus(reminder.remindAt, now)}
                  </Text>
                ) : (
                  <Text style={styles.subtitleText}>이 링크를 언제 다시 볼까요?</Text>
                )}
              </View>
            </View>

            {presetItems ? (
              <View style={styles.presetGroup}>
                {presetItems.map(({ preset, date, label }, i) => (
                  <Pressable
                    key={preset}
                    onPress={() => onSchedule(date, preset)}
                    disabled={busy}
                    style={({ pressed }) => [
                      styles.presetRow,
                      i < presetItems.length - 1 && styles.presetBorder,
                      pressed && styles.presetPressed,
                    ]}
                  >
                    <Text style={styles.presetLabel}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.loading}>
                <ActivityIndicator size="small" color={Colors.tertiary} />
              </View>
            )}

            {reminder ? (
              <Pressable
                onPress={onCancelReminder}
                disabled={busy}
                style={({ pressed }) => [styles.cancelReminderRow, pressed && styles.presetPressed]}
              >
                <Text style={styles.cancelReminderText}>리마인더 취소</Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={onClose}
            disabled={busy}
            style={({ pressed }) => [styles.dismissButton, pressed && styles.presetPressed]}
          >
            <Text style={styles.dismissText}>닫기</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'flex-end',
    padding: 12,
    paddingBottom: 20,
  },
  sheetContainer: {
    gap: 10,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  subtitleText: {
    fontSize: 12,
    color: Colors.secondary,
  },
  statusText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500',
  },
  presetGroup: {
    // no styles — rows have their own dividers
  },
  presetRow: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  presetBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  presetPressed: {
    backgroundColor: Colors.pressOverlay,
  },
  presetLabel: {
    fontSize: 16,
    color: Colors.primary,
  },
  loading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  cancelReminderRow: {
    paddingVertical: 15,
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  cancelReminderText: {
    fontSize: 15,
    color: Colors.accent,
    fontWeight: '500',
  },
  dismissButton: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  dismissText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});
