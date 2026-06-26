import { View, Text, ScrollView, FlatList, StyleSheet, Pressable, ActivityIndicator, Image, type ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants';
import { ContentCard } from '@/components/ContentCard';
import { RediscoverCard } from '@/components/RediscoverCard';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Ionicons } from '@expo/vector-icons';
import { getRecentContents, getRediscoverContents, getForgottenContents } from '@/lib/api';
import { isClassifying, on } from '@/lib/events';
import { useAuth } from '@/lib/AuthProvider';
import { analytics } from '@/lib/analytics';
import { formatRelativeTime, formatSource, THUMBNAIL_PLACEHOLDER } from '@/lib/utils';
import type { Content } from '@/types';

type ContentWithCategory = Content & { categories: { name: string } | null };
type HomeDevCaseId = 'live' | 'empty' | 'recent-small' | 'recent-full' | 'rediscover-only' | 'forgotten-only' | 'all';

const HOME_DEV_CASES: { id: HomeDevCaseId; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'empty', label: '빈 홈' },
  { id: 'recent-small', label: '최근 적음' },
  { id: 'recent-full', label: '최근 충분' },
  { id: 'rediscover-only', label: '발견만' },
  { id: 'forgotten-only', label: '잊음만' },
  { id: 'all', label: '전체' },
];

function makeMockContent(
  id: string,
  title: string,
  domain: string,
  categoryName: string | null,
  daysAgo: number,
  viewed = false,
): ContentWithCategory {
  const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const categoryId = categoryName ? `dev-${categoryName}` : null;
  return {
    id,
    user_id: 'dev-user',
    category_id: categoryId,
    url: `https://example.com/${id}`,
    title,
    description: null,
    thumbnail_url: null,
    domain,
    tags: categoryName ? [categoryName] : [],
    saved_at: timestamp,
    viewed_at: viewed ? timestamp : null,
    created_at: timestamp,
    updated_at: timestamp,
    categories: categoryName ? { name: categoryName } : null,
  };
}

function makeHomeDevData(caseId: HomeDevCaseId) {
  const recent = [
    makeMockContent('dev-recent-1', '건강한 식습관을 위한 작은 루틴', 'Threads', null, 1),
    makeMockContent('dev-recent-2', '채용 한파에 8년차 경력직 이직기', 'Velog', '커리어', 2),
    makeMockContent('dev-recent-3', 'UI Design Direction 2026-2027', 'Medium', '디자인', 3),
    makeMockContent('dev-recent-4', 'AI 에이전트 제품 설계 노트', 'Substack', 'AI', 4),
    makeMockContent('dev-recent-5', '주말에 다시 가고 싶은 동네 식당', 'Instagram', '음식', 5),
    makeMockContent('dev-recent-6', '작은 집을 넓게 쓰는 수납 아이디어', 'Pinterest', '인테리어', 6),
  ];
  const rediscover = [
    makeMockContent('dev-rediscover-1', 'IKEA HACK: Side tab', 'Instagram', '디자인', 5),
    makeMockContent('dev-rediscover-2', '읽어두면 좋은 커리어 회고', 'Velog', '커리어', 8),
    makeMockContent('dev-rediscover-3', 'AI 워크플로우 자동화 사례', 'LinkedIn', 'AI', 10),
    makeMockContent('dev-rediscover-4', '하체 스트레칭 루틴', 'Instagram', '운동', 11),
  ];
  const forgotten = [
    makeMockContent('dev-forgotten-1', '다시 읽어볼 만한 제품 전략 글', 'Substack', '비즈니스', 26, true),
    makeMockContent('dev-forgotten-2', '요즘 참고하는 모바일 UI 패턴', 'Medium', '디자인', 31, true),
    makeMockContent('dev-forgotten-3', '여행 전 저장해둔 도쿄 카페 리스트', 'Notion', '여행', 40, true),
  ];

  switch (caseId) {
    case 'empty':
      return { recentItems: [], rediscoverItems: [], forgottenItems: [] };
    case 'recent-small':
      return { recentItems: recent.slice(0, 2), rediscoverItems: [], forgottenItems: [] };
    case 'recent-full':
      return { recentItems: recent, rediscoverItems: [], forgottenItems: [] };
    case 'rediscover-only':
      return { recentItems: recent.slice(0, 3), rediscoverItems: rediscover, forgottenItems: [] };
    case 'forgotten-only':
      return { recentItems: recent.slice(0, 3), rediscoverItems: [], forgottenItems: forgotten };
    case 'all':
      return { recentItems: recent.slice(0, 3), rediscoverItems: rediscover, forgottenItems: forgotten };
    case 'live':
    default:
      return null;
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const { session, isLoading: isAuthLoading } = useAuth();
  const [homeDevCase, setHomeDevCase] = useState<HomeDevCaseId>('live');
  const [recentItems, setRecentItems] = useState<ContentWithCategory[]>([]);
  const [rediscoverItems, setRediscoverItems] = useState<ContentWithCategory[]>([]);
  const [forgottenItems, setForgottenItems] = useState<ContentWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const retainedRediscoverIdsRef = useRef(new Set<string>());

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
      const [recent, rediscover, forgotten] = await Promise.all([
        getRecentContents(6),
        getRediscoverContents(10),
        getForgottenContents(10),
      ]);
      setRecentItems(recent);
      setRediscoverItems((prev) => {
        const fetchedIds = new Set(rediscover.map((item) => item.id));
        const retained = prev.filter(
          (item) => retainedRediscoverIdsRef.current.has(item.id) && !fetchedIds.has(item.id)
        );
        return [...rediscover, ...retained].slice(0, 10);
      });
      setForgottenItems(forgotten);
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
    const handleContentDeleted = () => {
      retainedRediscoverIdsRef.current.clear();
      void loadData();
    };
    const offSaved = on('content-saved', loadData);
    const offClassified = on('content-classified', loadData);
    const offDeleted = on('content-deleted', handleContentDeleted);
    return () => {
      offSaved();
      offClassified();
      offDeleted();
    };
  }, [session, loadData]);

  const devData = useMemo(
    () => (__DEV__ ? makeHomeDevData(homeDevCase) : null),
    [homeDevCase]
  );
  const isDevPreview = Boolean(devData);
  const activeRecentItems = devData?.recentItems ?? recentItems;
  const activeRediscoverItems = devData?.rediscoverItems ?? rediscoverItems;
  const activeForgottenItems = devData?.forgottenItems ?? forgottenItems;
  const secondarySectionCount =
    (activeRediscoverItems.length > 0 ? 1 : 0) +
    (activeForgottenItems.length > 0 ? 1 : 0);
  const visibleRecentLimit =
    secondarySectionCount === 0 ? 6 :
    secondarySectionCount === 1 ? 4 :
    3;
  const visibleRecentItems = activeRecentItems.slice(0, visibleRecentLimit);
  const shouldShowDensityHint =
    activeRecentItems.length > 0 && visibleRecentItems.length < visibleRecentLimit;
  const showLoading = loading && !isDevPreview;
  const showLoadError = loadError && !isDevPreview;

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
          {__DEV__ && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.devCaseList}
            >
              {HOME_DEV_CASES.map((item) => {
                const selected = homeDevCase === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setHomeDevCase(item.id)}
                    style={[styles.devCaseChip, selected && styles.devCaseChipSelected]}
                  >
                    <Text style={[styles.devCaseText, selected && styles.devCaseTextSelected]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {showLoading ? (
            <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
          ) : showLoadError ? (
            <ErrorState onRetry={loadData} />
          ) : activeRecentItems.length === 0 && activeRediscoverItems.length === 0 && activeForgottenItems.length === 0 ? (
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
                {visibleRecentItems.length > 0 ? (
                  visibleRecentItems.map((item) => (
                    <ContentCard
                      key={item.id}
                      title={item.title ?? item.url}
                      source={formatSource(item.domain)}
                      tags={item.tags}
                      thumbnailUrl={item.thumbnail_url}
                      thumbnailColor={THUMBNAIL_PLACEHOLDER}
                      savedAt={formatRelativeTime(item.saved_at)}
                      isClassifying={!isDevPreview && isClassifying(item.id)}
                      onPress={() => {
                        if (isDevPreview) return;
                        router.push({
                          pathname: '/content/[id]',
                          params: { id: item.id, source: 'recent' },
                        });
                      }}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon="bookmark-outline"
                    title="첫 콘텐츠를 저장해보세요"
                    subtitle="공유하기로 링크를 빠르게 모을 수 있어요"
                  />
                )}
                {activeRecentItems.length > 0 && (
                  <Pressable
                    onPress={() => {
                      if (isDevPreview) return;
                      router.push('/recent-saved');
                    }}
                    style={styles.seeAllRow}
                  >
                    <Text style={styles.seeAllText}>전체 보기</Text>
                    <Ionicons name="chevron-forward" size={12} color={Colors.secondary} />
                  </Pressable>
                )}
              </View>

              {/* Rediscover */}
              {activeRediscoverItems.length > 0 && (
                <View style={[
                  styles.discoverySection,
                  activeForgottenItems.length > 0 && styles.discoverySectionWithNext,
                ]}>
                  <SectionHeader
                    icon="sparkles"
                    label="발견된 콘텐츠"
                    subtitle="아직 열어보지 않은 관심 콘텐츠예요"
                  />
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rediscoverScroll}
                    data={activeRediscoverItems}
                    keyExtractor={(item) => item.id}
                    viewabilityConfig={viewabilityConfig}
                    onViewableItemsChanged={isDevPreview ? undefined : onViewableItemsChanged}
                    renderItem={({ item }) => (
                      <RediscoverCard
                        title={item.title ?? item.url}
                        source={formatSource(item.domain)}
                        hint={item.categories?.name ?? '미분류'}
                        thumbnailUrl={item.thumbnail_url}
                        placeholderColor={THUMBNAIL_PLACEHOLDER}
                        onPress={() => {
                          if (isDevPreview) return;
                          retainedRediscoverIdsRef.current.add(item.id);
                          router.push({
                            pathname: '/content/[id]',
                            params: { id: item.id, source: 'rediscover' },
                          });
                        }}
                      />
                    )}
                  />
                </View>
              )}

              {/* Forgotten — 14일 이상 다시 보지 않은 콘텐츠 (§055, §062) */}
              {activeForgottenItems.length > 0 && (
                <View style={styles.discoverySection}>
                  <SectionHeader
                    icon="hourglass-outline"
                    label="잊고 있던 콘텐츠"
                    subtitle="다시 꺼내보기 좋은 콘텐츠예요"
                  />
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rediscoverScroll}
                    data={activeForgottenItems}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <RediscoverCard
                        title={item.title ?? item.url}
                        source={formatSource(item.domain)}
                        hint={item.categories?.name ?? '미분류'}
                        thumbnailUrl={item.thumbnail_url}
                        placeholderColor={THUMBNAIL_PLACEHOLDER}
                        onPress={() => {
                          if (isDevPreview) return;
                          router.push({
                            pathname: '/content/[id]',
                            params: { id: item.id, source: 'forgotten' },
                          });
                        }}
                      />
                    )}
                  />
                </View>
              )}

              {shouldShowDensityHint && (
                <View style={styles.densityHintCard}>
                  <View style={styles.densityHintIcon}>
                    <Ionicons name="bookmark-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.densityHintText}>
                    <Text style={styles.densityHintTitle}>더 많은 콘텐츠를 모아보세요</Text>
                    <Text style={styles.densityHintSubtitle}>
                      저장한 콘텐츠가 쌓이면 홈에서 다시 보여드려요
                    </Text>
                  </View>
                </View>
              )}
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
  devCaseList: {
    gap: 8,
    paddingBottom: 16,
  },
  devCaseChip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devCaseChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  devCaseText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
  },
  devCaseTextSelected: {
    color: Colors.surface,
  },
  section: {
    marginBottom: 30,
  },
  discoverySection: {
    marginBottom: 24,
  },
  discoverySectionWithNext: {
    marginBottom: 28,
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
  densityHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 4,
    elevation: 2,
  },
  densityHintIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  densityHintText: {
    flex: 1,
    gap: 3,
  },
  densityHintTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  densityHintSubtitle: {
    fontSize: 12,
    color: Colors.secondary,
    lineHeight: 17,
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
