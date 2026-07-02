import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants';
import { ContentCard } from '@/components/ContentCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { NavHeader } from '@/components/NavHeader';
import { getRediscoverContents } from '@/lib/api';
import { isClassifying, on } from '@/lib/events';
import { useAuth } from '@/lib/AuthProvider';
import { displayTitle, formatRelativeTime, formatSource, THUMBNAIL_PLACEHOLDER } from '@/lib/utils';
import type { Content } from '@/types';

type ContentWithCategory = Content & { categories: { name: string } | null };

export default function RediscoverScreen() {
  const router = useRouter();
  const { session, isLoading: isAuthLoading } = useAuth();
  const [items, setItems] = useState<ContentWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadData = useCallback(async () => {
    if (isAuthLoading || !session) {
      setLoading(false);
      return;
    }
    setLoadError(false);
    try {
      const data = await getRediscoverContents(20);
      setItems(data);
    } catch (e) {
      console.error('Rediscover load error:', e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [session, isAuthLoading]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (!session) return;
    return on('content-classified', loadData);
  }, [session, loadData]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <NavHeader title="발견된 콘텐츠" onBack={() => router.back()} />
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
          ) : loadError ? (
            <ErrorState onRetry={loadData} />
          ) : items.length > 0 ? (
            items.map(item => (
              <ContentCard
                key={item.id}
                title={displayTitle(item)}
                source={formatSource(item.domain)}
                tags={item.tags}
                thumbnailUrl={item.thumbnail_url}
                thumbnailColor={THUMBNAIL_PLACEHOLDER}
                savedAt={formatRelativeTime(item.saved_at)}
                isClassifying={isClassifying(item.id)}
                onPress={() => router.push({
                  pathname: '/content/[id]',
                  params: { id: item.id, source: 'rediscover' },
                })}
              />
            ))
          ) : (
            <EmptyState
              icon="sparkles-outline"
              title="지금은 발견된 콘텐츠가 없어요"
              subtitle="저장한 콘텐츠가 숙성되면 다시 여기서 보여드려요"
            />
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
  list: {
    padding: 16,
    paddingBottom: 36,
  },
});
