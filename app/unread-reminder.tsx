import { View, ScrollView, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { Colors } from '@/constants';
import { ContentCard } from '@/components/ContentCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { NavHeader } from '@/components/NavHeader';
import { getContentsByIds, getNotificationLog, markNotificationOpened } from '@/lib/api';
import { useAuth } from '@/lib/AuthProvider';
import { formatRelativeTime, formatSource, THUMBNAIL_PLACEHOLDER } from '@/lib/utils';
import type { Content, NotificationLog } from '@/types';

type ContentWithCategory = Content & { categories: { name: string } | null };

export default function UnreadReminderScreen() {
  const router = useRouter();
  const { log_id } = useLocalSearchParams<{ log_id?: string }>();
  const { session, isLoading: isAuthLoading } = useAuth();

  const [log, setLog] = useState<NotificationLog | null>(null);
  const [items, setItems] = useState<ContentWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadData = useCallback(async () => {
    if (isAuthLoading || !session) {
      setLoading(false);
      return;
    }
    if (!log_id) {
      setLoading(false);
      return;
    }
    setLoadError(false);
    setLoading(true);
    try {
      const found = await getNotificationLog(log_id);
      setLog(found);
      if (!found || found.content_ids.length === 0) {
        setItems([]);
        return;
      }
      const contents = await getContentsByIds(found.content_ids);
      // notification_logs.content_ids 순서 유지 (알림 payload 톤과 일치).
      const byId = new Map(contents.map((c) => [c.id, c]));
      const ordered = found.content_ids
        .map((id) => byId.get(id))
        .filter((c): c is ContentWithCategory => Boolean(c));
      setItems(ordered);
      // opened_at 기록은 idempotent(RLS + .is('opened_at', null)) — 알림 탭 핸들러와 중복 안전.
      markNotificationOpened(log_id).catch(() => {});
    } catch (e) {
      console.error('[unread-reminder] load error', e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [log_id, session, isAuthLoading]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const missingLog = !loading && !loadError && (!log_id || !log);
  const emptyItems = !loading && !loadError && log !== null && items.length === 0;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <NavHeader title="저장하고 안 본 링크" onBack={() => router.replace('/(tabs)')} />
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {log && items.length > 0 && (
          <Text style={styles.subtitle}>
            1주일 전에 저장했는데 아직 안 열어본 링크예요.
          </Text>
        )}
        <View style={styles.list}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
          ) : loadError ? (
            <ErrorState onRetry={loadData} />
          ) : missingLog ? (
            <EmptyState
              icon="mail-open-outline"
              title="알림 정보를 찾을 수 없어요"
              subtitle="이미 열어봤거나 만료된 알림이에요"
            />
          ) : emptyItems ? (
            <EmptyState
              icon="mail-open-outline"
              title="포함된 링크가 없어요"
              subtitle="이 알림에 포함됐던 링크가 모두 삭제됐어요"
            />
          ) : (
            items.map((item) => (
              <ContentCard
                key={item.id}
                title={item.title ?? item.url}
                source={formatSource(item.domain)}
                tags={item.tags}
                thumbnailUrl={item.thumbnail_url}
                thumbnailColor={THUMBNAIL_PLACEHOLDER}
                savedAt={formatRelativeTime(item.saved_at)}
                onPress={() =>
                  router.push({
                    pathname: '/content/[id]',
                    params: { id: item.id, source: 'unread_reminder' },
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeTop: {
    backgroundColor: Colors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  scroll: {
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.secondary,
    paddingHorizontal: 16,
    paddingTop: 16,
    lineHeight: 18,
  },
  list: {
    padding: 16,
    paddingBottom: 36,
  },
});
