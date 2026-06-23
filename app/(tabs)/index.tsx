import { View, Text, ScrollView, FlatList, StyleSheet, Pressable, ActivityIndicator, Image, type ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants';
import { ContentCard } from '@/components/ContentCard';
import { RediscoverCard } from '@/components/RediscoverCard';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Ionicons } from '@expo/vector-icons';
import { getRecentContents, getRediscoverContents } from '@/lib/api';
import { isClassifying, on } from '@/lib/events';
import { useAuth } from '@/lib/AuthProvider';
import { analytics } from '@/lib/analytics';
import { formatRelativeTime, formatSource, THUMBNAIL_PLACEHOLDER } from '@/lib/utils';
import type { Content } from '@/types';

type ContentWithCategory = Content & { categories: { name: string } | null };

export default function HomeScreen() {
  const router = useRouter();
  const { session, isLoading: isAuthLoading } = useAuth();
  const [recentItems, setRecentItems] = useState<ContentWithCategory[]>([]);
  const [rediscoverItems, setRediscoverItems] = useState<ContentWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // §12.4 Rediscover impression — viewport 진입 시 발화. 세션당 같은 content_id는 1회만(라이브러리 dedup).
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    for (const v of viewableItems) {
      if (v.isViewable && v.item?.id) void analytics.rediscoverImpression(v.item.id);
    }
  }).current;

  const loadData = useCallback(async () => {
    if (isAuthLoading) return;
    if (!session) {
      setLoading(false);
      return;
    }

    setLoadError(false);
    try {
      const [recent, rediscover] = await Promise.all([
        getRecentContents(3),
        getRediscoverContents(10),
      ]);
      setRecentItems(recent);
      setRediscoverItems(rediscover);
    } catch (e) {
      console.error('Home load error:', e);
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
    const offSaved = on('content-saved', loadData);
    const offClassified = on('content-classified', loadData);
    return () => {
      offSaved();
      offClassified();
    };
  }, [session, loadData]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/logo.png')}
            style={styles.appLogo}
            resizeMode="cover"
          />
          <Pressable
            onPress={() => router.push('/search')}
            style={styles.searchButton}
            hitSlop={8}
          >
            <Ionicons name="search-outline" size={21} color={Colors.secondary} />
          </Pressable>
        </View>
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
          ) : loadError ? (
            <ErrorState onRetry={loadData} />
          ) : recentItems.length === 0 && rediscoverItems.length === 0 ? (
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeIconWrap}>
                <Ionicons name="bookmark" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.welcomeTitle}>Nook 시작하기</Text>
              <Text style={styles.welcomeSubtitle}>
                관심 있는 콘텐츠를 모아{'\n'}잊지 않고 다시 발견해보세요
              </Text>

              <View style={styles.tipsList}>
                <View style={styles.tipRow}>
                  <View style={styles.tipIconWrap}>
                    <Ionicons name="share-outline" size={16} color={Colors.secondary} />
                  </View>
                  <View style={styles.tipText}>
                    <Text style={styles.tipTitle}>공유하기 → Nook</Text>
                    <Text style={styles.tipDesc}>Safari, Instagram 등에서 빠르게 저장</Text>
                  </View>
                </View>

                <View style={styles.tipRow}>
                  <View style={styles.tipIconWrap}>
                    <Ionicons name="add" size={18} color={Colors.secondary} />
                  </View>
                  <View style={styles.tipText}>
                    <Text style={styles.tipTitle}>+ 버튼으로 직접 저장</Text>
                    <Text style={styles.tipDesc}>URL을 입력하거나 클립보드에서 붙여넣기</Text>
                  </View>
                </View>

                <View style={styles.tipRow}>
                  <View style={styles.tipIconWrap}>
                    <Ionicons name="sparkles-outline" size={15} color={Colors.secondary} />
                  </View>
                  <View style={styles.tipText}>
                    <Text style={styles.tipTitle}>AI 자동 분류</Text>
                    <Text style={styles.tipDesc}>저장하면 폴더와 태그를 자동으로 정리해요</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <>
              {/* Recent Saved */}
              <View style={styles.section}>
                <SectionHeader icon="time-outline" label="최근 저장" />
                {recentItems.length > 0 ? (
                  recentItems.map((item) => (
                    <ContentCard
                      key={item.id}
                      title={item.title ?? item.url}
                      source={formatSource(item.domain)}
                      tags={item.tags}
                      thumbnailUrl={item.thumbnail_url}
                      thumbnailColor={THUMBNAIL_PLACEHOLDER}
                      savedAt={formatRelativeTime(item.saved_at)}
                      isClassifying={isClassifying(item.id)}
                      onPress={() => router.push({
                        pathname: '/content/[id]',
                        params: { id: item.id, source: 'recent' },
                      })}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon="bookmark-outline"
                    title="첫 콘텐츠를 저장해보세요"
                    subtitle="공유하기로 링크를 빠르게 모을 수 있어요"
                  />
                )}
                {recentItems.length > 0 && (
                  <Pressable
                    onPress={() => router.push('/recent-saved')}
                    style={styles.seeAllRow}
                  >
                    <Text style={styles.seeAllText}>전체 보기</Text>
                    <Ionicons name="chevron-forward" size={12} color={Colors.secondary} />
                  </Pressable>
                )}
              </View>

              {/* Rediscover */}
              {rediscoverItems.length > 0 ? (
                <View style={styles.section}>
                  <SectionHeader
                    icon="sparkles"
                    label="발견된 콘텐츠"
                    dot
                  />
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rediscoverScroll}
                    data={rediscoverItems}
                    keyExtractor={(item) => item.id}
                    viewabilityConfig={viewabilityConfig}
                    onViewableItemsChanged={onViewableItemsChanged}
                    renderItem={({ item }) => (
                      <RediscoverCard
                        title={item.title ?? item.url}
                        source={formatSource(item.domain)}
                        hint={item.categories?.name ?? '미분류'}
                        thumbnailUrl={item.thumbnail_url}
                        placeholderColor={THUMBNAIL_PLACEHOLDER}
                        onPress={() => router.push({
                          pathname: '/content/[id]',
                          params: { id: item.id, source: 'rediscover' },
                        })}
                      />
                    )}
                  />
                </View>
              ) : recentItems.length > 0 ? (
                <View style={styles.rediscoverPlaceholder}>
                  <Ionicons name="sparkles-outline" size={28} color={Colors.tertiary} />
                  <Text style={styles.placeholderTitle}>지금은 발견된 콘텐츠가 없어요</Text>
                  <Text style={styles.placeholderText}>
                    열어보지 않은 관심 콘텐츠가 생기면 여기에 나타나요.
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
  },
  appLogo: {
    height: 42,
    width: 110,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  section: {
    marginBottom: 30,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.tertiary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 4,
    paddingVertical: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.secondary,
  },
  rediscoverScroll: {
    gap: 11,
    paddingRight: 20,
  },
  rediscoverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: 4,
  },
  placeholderText: {
    fontSize: 12,
    color: Colors.tertiary,
    lineHeight: 17,
    textAlign: 'center',
  },
  welcomeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: Colors.secondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
  },
  tipsList: {
    alignSelf: 'stretch',
    gap: 14,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    gap: 2,
  },
  tipTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.primary,
  },
  tipDesc: {
    fontSize: 12,
    color: Colors.tertiary,
    lineHeight: 16,
  },
});
