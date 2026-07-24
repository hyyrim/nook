import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { FadeInDown, FadeOutDown, LinearTransition } from 'react-native-reanimated';
import { Colors, Radius } from '@/constants';
import { NavHeader } from '@/components/NavHeader';
import { EmptyState } from '@/components/EmptyState';
import { getContentsByIds } from '@/lib/api';
import { cancelReminder, formatReminderStatus, getAllReminders, scheduleReminder, type ReminderRecord } from '@/lib/reminders';
import { THUMBNAIL_PLACEHOLDER } from '@/lib/utils';
import type { Content } from '@/types';

type ReminderRow = {
  reminder: ReminderRecord;
  content: (Content & { categories: { name: string } | null }) | null;
};

type SwipeRef = ComponentRef<typeof ReanimatedSwipeable>;

const UNDO_WINDOW_MS = 4000;
// 리스트 재배치는 spring으로 정착시켜 삭제 후 빈 자리가 부드럽게 닫히게 한다(Apple: 물리적 settle).
const rowLayout = LinearTransition.springify().damping(20).stiffness(200).mass(0.9);

export default function RemindersScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<ReminderRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  // 방금 삭제한 항목. 실행취소하면 재등록해서 원위치 복원한다.
  const [pendingUndo, setPendingUndo] = useState<{ row: ReminderRow; index: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 현재 열린(스와이프된) 행. 다른 행을 열면 이전 행을 닫아 항상 하나만 열리게 한다(iOS 표준).
  const openRowRef = useRef<SwipeRef | null>(null);

  const handleRowWillOpen = useCallback((row: SwipeRef | null) => {
    if (openRowRef.current && openRowRef.current !== row) {
      openRowRef.current.close();
    }
    openRowRef.current = row;
  }, []);

  const load = useCallback(async () => {
    // setLoading(true)를 매번 하지 않는다. 첫 로드(rows===null)만 스피너, 상세 복귀 등
    // 재포커스 시엔 기존 리스트를 유지하며 조용히 갱신 → 전체 화면 깜빡임 제거.
    try {
      const reminders = await getAllReminders();
      if (reminders.length === 0) {
        setRows([]);
        return;
      }
      const ids = reminders.map((r) => r.contentId);
      const contents = await getContentsByIds(ids);
      const byId = new Map(contents.map((c) => [c.id, c]));
      setRows(
        reminders.map((reminder) => ({
          reminder,
          content: byId.get(reminder.contentId) ?? null,
        })),
      );
    } catch (e) {
      console.warn('[reminders] load failed', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  // 스와이프/탭 → 확인 없이 즉시 삭제하고 하단 undo 바로 되돌릴 여지를 준다(Apple: 마찰보다 용서).
  const handleDelete = useCallback((row: ReminderRow) => {
    openRowRef.current = null; // 삭제되는 행의 swipeable은 unmount되므로 추적 해제
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setRows((prev) => {
      const index = prev?.findIndex((r) => r.reminder.contentId === row.reminder.contentId) ?? -1;
      if (index >= 0) setPendingUndo({ row, index });
      return prev?.filter((r) => r.reminder.contentId !== row.reminder.contentId) ?? prev;
    });
    void cancelReminder(row.reminder.contentId).catch(() => {});
    undoTimer.current = setTimeout(() => setPendingUndo(null), UNDO_WINDOW_MS);
  }, []);

  const handleUndo = useCallback(async () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setPendingUndo((pending) => {
      if (!pending) return null;
      void (async () => {
        try {
          const record = await scheduleReminder({
            contentId: pending.row.reminder.contentId,
            contentTitle: pending.row.content?.title ?? '',
            remindAt: pending.row.reminder.remindAt,
          });
          const restored: ReminderRow = { ...pending.row, reminder: record };
          setRows((prev) => {
            const next = [...(prev ?? [])];
            next.splice(Math.min(pending.index, next.length), 0, restored);
            return next;
          });
        } catch {
          void load(); // 재등록 실패 시 서버 기준으로 다시 맞춤
        }
      })();
      return null;
    });
  }, [load]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerWrap}>
          <NavHeader
            title="예정된 리마인더"
            backLabel="프로필"
            onBack={() => router.back()}
          />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={Colors.tertiary} />
          </View>
        ) : rows && rows.length > 0 ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {rows.map((row) => (
              <ReminderCard
                key={row.reminder.contentId}
                row={row}
                onOpen={() => {
                  if (row.content) router.push(`/content/${row.content.id}?source=direct`);
                }}
                onDelete={() => handleDelete(row)}
                onWillOpen={handleRowWillOpen}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="notifications-outline"
              title="예정된 리마인더가 없어요"
              subtitle={'콘텐츠 상세에서 우상단 알림 아이콘을 눌러\n다시 볼 시간을 지정할 수 있어요'}
              variant="center"
            />
          </View>
        )}

        {pendingUndo && (
          <Reanimated.View
            entering={FadeInDown.duration(200)}
            exiting={FadeOutDown.duration(160)}
            style={styles.undoBar}
            pointerEvents="box-none"
          >
            <View style={styles.undoInner}>
              <Ionicons name="checkmark-circle" size={17} color={Colors.success} />
              <Text style={styles.undoText}>리마인더 삭제됨</Text>
              <Pressable
                onPress={handleUndo}
                hitSlop={10}
                style={({ pressed }) => [styles.undoBtn, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.undoAction}>실행취소</Text>
              </Pressable>
            </View>
          </Reanimated.View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function ReminderCard({
  row,
  onOpen,
  onDelete,
  onWillOpen,
}: {
  row: ReminderRow;
  onOpen: () => void;
  onDelete: () => void;
  onWillOpen: (row: SwipeRef | null) => void;
}) {
  const { reminder, content } = row;
  const title = content?.title ?? '(삭제된 콘텐츠)';
  const thumb = content?.thumbnail_url;
  const swipeRef = useRef<SwipeRef>(null);

  const renderRightActions = () => (
    <Pressable onPress={onDelete} style={styles.swipeAction}>
      <Ionicons name="trash-outline" size={17} color="#FFFFFF" />
      <Text style={styles.swipeActionText}>삭제</Text>
    </Pressable>
  );

  return (
    <Reanimated.View layout={rowLayout}>
      <ReanimatedSwipeable
        ref={swipeRef}
        renderRightActions={renderRightActions}
        // 열린 다른 행을 닫는 건 '드래그 시작' 시점에 트리거한다. willOpen(임계점 근처)은
        // 늦어서 이전 행이 갑자기 툭 닫히는 desync를 만든다. start-drag면 손가락과 동시에 물러남.
        onSwipeableOpenStartDrag={() => onWillOpen(swipeRef.current)}
        rightThreshold={40}
        overshootRight={false}
        friction={1.5}
        containerStyle={styles.swipeContainer}
      >
        <Pressable
          onPress={onOpen}
          disabled={!content}
          style={({ pressed }) => [styles.card, pressed && content && { opacity: 0.7 }]}
        >
          {thumb ? (
            <Image
              source={{ uri: thumb }}
              style={styles.thumb}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
          ) : (
            <View style={[styles.thumb, { backgroundColor: THUMBNAIL_PLACEHOLDER }]} />
          )}
          <View style={styles.cardText}>
            <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
            <View style={styles.cardTimeRow}>
              <Ionicons name="time-outline" size={11} color={Colors.accent} />
              <Text style={styles.cardTime}>{formatReminderStatus(reminder.remindAt)}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.tertiary} />
        </Pressable>
      </ReanimatedSwipeable>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerWrap: {
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  swipeContainer: {
    borderRadius: Radius.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 4,
    elevation: 2,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    backgroundColor: THUMBNAIL_PLACEHOLDER,
  },
  cardText: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: 18,
  },
  cardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cardTime: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.accent,
  },
  swipeAction: {
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    width: 76,
    gap: 3,
    marginLeft: 8,
    borderRadius: Radius.md,
  },
  swipeActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  undoBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    alignItems: 'center',
  },
  undoInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  undoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  undoBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
  },
  undoAction: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
