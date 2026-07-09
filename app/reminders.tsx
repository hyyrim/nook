import { View, Text, ScrollView, StyleSheet, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants';
import { NavHeader } from '@/components/NavHeader';
import { getContentsByIds } from '@/lib/api';
import { cancelReminder, formatReminderStatus, getAllReminders, type ReminderRecord } from '@/lib/reminders';
import { THUMBNAIL_PLACEHOLDER } from '@/lib/utils';
import type { Content } from '@/types';

type ReminderRow = {
  reminder: ReminderRecord;
  content: (Content & { categories: { name: string } | null }) | null;
};

export default function RemindersScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<ReminderRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
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

  const handleCancel = (row: ReminderRow) => {
    Alert.alert(
      '리마인더 취소',
      row.content?.title
        ? `"${row.content.title.slice(0, 40)}${row.content.title.length > 40 ? '…' : ''}"에 대한 리마인더를 취소할까요?`
        : '이 리마인더를 취소할까요?',
      [
        { text: '유지', style: 'cancel' },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: async () => {
            await cancelReminder(row.reminder.contentId);
            void load();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrap}>
        <NavHeader title="예정된 리마인더" backLabel="프로필" onBack={() => router.back()} />
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
              key={row.reminder.notificationId}
              row={row}
              onOpen={() => {
                if (row.content) router.push(`/content/${row.content.id}?source=direct`);
              }}
              onCancel={() => handleCancel(row)}
            />
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.emptyWrap}>
          <Ionicons name="notifications-outline" size={36} color={Colors.tertiary} />
          <Text style={styles.emptyTitle}>예정된 리마인더가 없어요</Text>
          <Text style={styles.emptyBody}>
            콘텐츠 상세에서 우상단 알림 아이콘을 눌러{'\n'}다시 볼 시간을 지정할 수 있어요.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ReminderCard({
  row,
  onOpen,
  onCancel,
}: {
  row: ReminderRow;
  onOpen: () => void;
  onCancel: () => void;
}) {
  const { reminder, content } = row;
  const title = content?.title ?? '(삭제된 콘텐츠)';
  const thumb = content?.thumbnail_url;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onOpen}
        disabled={!content}
        style={({ pressed }) => [styles.cardMain, pressed && content && { opacity: 0.7 }]}
      >
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
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
      </Pressable>
      <Pressable onPress={onCancel} style={styles.cancelButton} hitSlop={8}>
        <Ionicons name="close" size={14} color={Colors.tertiary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
    paddingVertical: 96,
    paddingHorizontal: 32,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.tertiary,
    marginTop: 8,
  },
  emptyBody: {
    fontSize: 12,
    color: Colors.tertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
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
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  cardMeta: {
    fontSize: 11,
    color: Colors.tertiary,
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
  cancelButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
