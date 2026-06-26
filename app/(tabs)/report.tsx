import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants';
import { SectionHeader } from '@/components/SectionHeader';
import { ErrorState } from '@/components/ErrorState';
import { useAuth } from '@/lib/AuthProvider';
import { getRecentContentsForReport, type ReportItem } from '@/lib/api';
import {
  aggregateByCategory,
  computeDistribution,
  topTagsPerCategory,
  countCategorized,
  countUncategorized,
  filterWithinDays,
  type CategoryStat,
  type DistributionStat,
  type SubjectStat,
} from '@/lib/report';

const PRIMARY_WINDOW_DAYS = 7;
const FALLBACK_WINDOW_DAYS = 30;
const MIN_CATEGORIZED_FOR_REPORT = 3;
const TOP_CATEGORY_LIMIT = 5;

type ReportView = {
  windowDays: number;
  isFallback: boolean;
  topCategories: CategoryStat[];
  distribution: DistributionStat[];
  subjects: SubjectStat[];
  uncategorizedCount: number;
};

function deriveReportView(items: ReportItem[]): ReportView | null {
  const within7 = filterWithinDays(items, PRIMARY_WINDOW_DAYS);
  const within30 = filterWithinDays(items, FALLBACK_WINDOW_DAYS);

  const categorized7 = countCategorized(within7);
  const categorized30 = countCategorized(within30);

  let active: ReportItem[];
  let windowDays: number;
  let isFallback: boolean;

  if (categorized7 >= MIN_CATEGORIZED_FOR_REPORT) {
    active = within7;
    windowDays = PRIMARY_WINDOW_DAYS;
    isFallback = false;
  } else if (categorized30 >= MIN_CATEGORIZED_FOR_REPORT) {
    active = within30;
    windowDays = FALLBACK_WINDOW_DAYS;
    isFallback = true;
  } else {
    return null;
  }

  return {
    windowDays,
    isFallback,
    topCategories: aggregateByCategory(active).slice(0, TOP_CATEGORY_LIMIT),
    distribution: computeDistribution(active),
    subjects: topTagsPerCategory(active),
    uncategorizedCount: countUncategorized(active),
  };
}

export default function ReportScreen() {
  const router = useRouter();
  const { session, isLoading: isAuthLoading } = useAuth();
  const [items, setItems] = useState<ReportItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadData = useCallback(async () => {
    if (isAuthLoading) return;
    if (!session) {
      setLoading(false);
      return;
    }
    setLoadError(false);
    try {
      const data = await getRecentContentsForReport(FALLBACK_WINDOW_DAYS);
      setItems(data);
    } catch (e) {
      console.error('Report load error:', e);
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

  const view = useMemo(() => (items ? deriveReportView(items) : null), [items]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>리포트</Text>
        {view && (
          <Text style={styles.periodLabel}>
            {view.isFallback ? '최근 한 달 기준' : '최근 7일 기준'}
          </Text>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
        ) : loadError ? (
          <ErrorState onRetry={loadData} />
        ) : !view ? (
          <InsufficientCard />
        ) : (
          <>
            {view.isFallback && <FallbackBanner />}

            <View style={styles.section}>
              <SectionHeader icon="folder-outline" label="많이 저장한 카테고리" />
              <CategoryListCard stats={view.topCategories} />
            </View>

            <View style={styles.section}>
              <SectionHeader icon="pie-chart-outline" label="관심 분포" />
              <DistributionCard stats={view.distribution} />
            </View>

            {view.subjects.length > 0 && (
              <View style={styles.section}>
                <SectionHeader icon="pricetags-outline" label="관련 주제" />
                <SubjectsCard stats={view.subjects} />
              </View>
            )}

            {view.uncategorizedCount > 0 && (
              <UncategorizedNotice
                count={view.uncategorizedCount}
                onPressAction={() => router.push('/category/uncategorized')}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryListCard({ stats }: { stats: CategoryStat[] }) {
  return (
    <View style={styles.card}>
      {stats.map((s, i) => (
        <View
          key={s.categoryId}
          style={[styles.rankRow, i < stats.length - 1 && styles.rowDivider]}
        >
          <View style={styles.rankLeft}>
            <Text style={styles.rankIndex}>{i + 1}</Text>
            <Text style={styles.rankName} numberOfLines={1}>{s.categoryName}</Text>
          </View>
          <Text style={styles.rankCount}>{s.count}개</Text>
        </View>
      ))}
    </View>
  );
}

function DistributionCard({ stats }: { stats: DistributionStat[] }) {
  return (
    <View style={styles.card}>
      {stats.map((s, i) => (
        <View
          key={s.categoryId}
          style={[styles.distRow, i < stats.length - 1 && styles.rowDivider]}
        >
          <View style={styles.distLabelRow}>
            <Text style={styles.distName} numberOfLines={1}>{s.categoryName}</Text>
            <Text style={styles.distPct}>{s.percentage}%</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${s.percentage}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function SubjectsCard({ stats }: { stats: SubjectStat[] }) {
  return (
    <View style={styles.card}>
      {stats.map((s, i) => (
        <View
          key={s.categoryId}
          style={[styles.subjectRow, i < stats.length - 1 && styles.rowDivider]}
        >
          <Text style={styles.subjectCategory}>{s.categoryName}</Text>
          <View style={styles.tagWrap}>
            {s.tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function FallbackBanner() {
  return (
    <View style={styles.banner}>
      <Ionicons name="information-circle-outline" size={16} color={Colors.secondary} />
      <Text style={styles.bannerText}>
        기록이 더 모이면 최근 7일 기준으로 보여드릴게요.
      </Text>
    </View>
  );
}

function UncategorizedNotice({ count, onPressAction }: { count: number; onPressAction: () => void }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>분류되지 않은 콘텐츠가 {count}개 있어요</Text>
      <Text style={styles.noticeText}>
        콘텐츠를 분류하면 관심사 리포트가 더 정확해져요.
      </Text>
      <Pressable
        onPress={onPressAction}
        style={({ pressed }) => [styles.noticeAction, pressed && styles.noticeActionPressed]}
        hitSlop={8}
      >
        <Text style={styles.noticeActionText}>분류하러가기</Text>
        <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
      </Pressable>
    </View>
  );
}

function InsufficientCard() {
  return (
    <View style={styles.insufficient}>
      <Ionicons name="bar-chart-outline" size={28} color={Colors.tertiary} />
      <Text style={styles.insufficientTitle}>아직 리포트를 보여드리기엔 기록이 적어요</Text>
      <Text style={styles.insufficientText}>
        조금 더 저장하면 요즘 어떤 주제에 관심이 모이는지 정리해서 보여드릴게요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 19,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  periodLabel: {
    fontSize: 12,
    color: Colors.tertiary,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 30,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  rankIndex: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.tertiary,
    width: 14,
  },
  rankName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    flex: 1,
  },
  rankCount: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: '500',
  },
  distRow: {
    paddingVertical: 12,
  },
  distLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  distName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    flex: 1,
  },
  distPct: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '500',
  },
  barTrack: {
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  subjectRow: {
    paddingVertical: 12,
  },
  subjectCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 7,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: Colors.background,
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11.5,
    color: Colors.secondary,
    fontWeight: '500',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  bannerText: {
    fontSize: 12,
    color: Colors.secondary,
    flex: 1,
    lineHeight: 17,
  },
  notice: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 12,
    color: Colors.secondary,
    lineHeight: 17,
  },
  noticeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginTop: 10,
    paddingVertical: 6,
  },
  noticeActionPressed: {
    opacity: 0.5,
  },
  noticeActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  insufficient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 10,
  },
  insufficientTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  insufficientText: {
    fontSize: 12,
    color: Colors.tertiary,
    lineHeight: 17,
    textAlign: 'center',
  },
});
