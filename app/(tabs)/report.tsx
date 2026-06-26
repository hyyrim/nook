import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants';
import { ErrorState } from '@/components/ErrorState';
import { useAuth } from '@/lib/AuthProvider';
import { getRecentContentsForReport, type ReportItem } from '@/lib/api';
import {
  computeDistribution,
  topTagsPerCategory,
  countCategorized,
  countUncategorized,
  filterWithinDays,
  type DistributionStat,
  type SubjectStat,
} from '@/lib/report';

const REPORT_WINDOW_OPTIONS = [
  { key: 'oneWeek', label: '일주일', days: 7 },
  { key: 'twoWeeks', label: '14일', days: 14 },
  { key: 'oneMonth', label: '한달', days: 30 },
] as const;
type ReportWindowOption = (typeof REPORT_WINDOW_OPTIONS)[number];
type ReportWindowKey = ReportWindowOption['key'];

const DEFAULT_WINDOW_KEY: ReportWindowKey = 'oneWeek';
const MAX_WINDOW_DAYS = 30;
const MIN_CATEGORIZED_FOR_REPORT = 3;

type ReportView = {
  windowDays: number;
  distribution: DistributionStat[];
  subjects: SubjectStat[];
  uncategorizedCount: number;
};

function getReportWindowOption(key: ReportWindowKey): ReportWindowOption {
  return REPORT_WINDOW_OPTIONS.find((option) => option.key === key) ?? REPORT_WINDOW_OPTIONS[0];
}

function deriveReportView(items: ReportItem[], window: ReportWindowOption): ReportView | null {
  const windowDays = window.days;
  const active = filterWithinDays(items, windowDays);
  if (countCategorized(active) < MIN_CATEGORIZED_FOR_REPORT) {
    return null;
  }

  return {
    windowDays,
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
  const [entryAnimationKey, setEntryAnimationKey] = useState(0);
  const [selectedWindowKey, setSelectedWindowKey] = useState<ReportWindowKey>(DEFAULT_WINDOW_KEY);
  const [isWindowMenuOpen, setIsWindowMenuOpen] = useState(false);

  const selectedWindow = useMemo(
    () => getReportWindowOption(selectedWindowKey),
    [selectedWindowKey]
  );

  const loadData = useCallback(async () => {
    if (isAuthLoading) return;
    if (!session) {
      setLoading(false);
      return;
    }
    setLoadError(false);
    try {
      const data = await getRecentContentsForReport(MAX_WINDOW_DAYS);
      setItems(data);
    } catch (e) {
      console.error('Report load error:', e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [isAuthLoading, session]);

  useFocusEffect(
    useCallback(() => {
      setEntryAnimationKey((key) => key + 1);
      loadData();
    }, [loadData])
  );

  const view = useMemo(
    () => (items ? deriveReportView(items, selectedWindow) : null),
    [items, selectedWindow]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>리포트</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ReportWindowDropdown
          selectedWindow={selectedWindow}
          isOpen={isWindowMenuOpen}
          onToggle={() => setIsWindowMenuOpen((open) => !open)}
          onSelect={(key) => {
            setSelectedWindowKey(key);
            setIsWindowMenuOpen(false);
          }}
        />

        {loading ? (
          <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
        ) : loadError ? (
          <ErrorState onRetry={loadData} />
        ) : !view ? (
          <InsufficientCard window={selectedWindow} />
        ) : (
          <>
            <View style={styles.section}>
              <ReportSectionHeader
                icon="pie-chart-outline"
                label="관심 분포"
                description="저장한 관심사가 어떻게 나뉘는지 보여줘요."
              />
              <DistributionCard stats={view.distribution} animationKey={entryAnimationKey} />
            </View>

            {view.subjects.length > 0 && (
              <View style={styles.section}>
                <ReportSectionHeader
                  icon="shapes-outline"
                  label="관련 주제"
                  description="카테고리별로 자주 등장한 태그예요."
                />
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

function ReportWindowDropdown({
  selectedWindow,
  isOpen,
  onToggle,
  onSelect,
}: {
  selectedWindow: ReportWindowOption;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (key: ReportWindowKey) => void;
}) {
  return (
    <View style={styles.windowDropdown}>
      <Text style={styles.windowPrefix}>최근</Text>
      <View style={styles.windowDropdownBody}>
        <Pressable
          onPress={onToggle}
          style={({ pressed }) => [styles.windowButton, pressed && styles.windowButtonPressed]}
          hitSlop={6}
        >
          <Text style={styles.windowButtonText}>{selectedWindow.label}</Text>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={17}
            color={Colors.primary}
          />
        </Pressable>

        {isOpen && (
          <View style={styles.windowMenu}>
            {REPORT_WINDOW_OPTIONS.map((option) => {
              const isSelected = selectedWindow.key === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => onSelect(option.key)}
                  style={({ pressed }) => [
                    styles.windowMenuItem,
                    pressed && styles.windowMenuItemPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.windowMenuItemText,
                      isSelected && styles.windowMenuItemTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color={Colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

function ReportSectionHeader({
  icon,
  label,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
}) {
  return (
    <View style={styles.reportSectionHeader}>
      <View style={styles.reportSectionTitleRow}>
        <View style={styles.reportSectionIconBox}>
          <Ionicons name={icon} size={16} color={Colors.primary} />
        </View>
        <Text style={styles.reportSectionTitle}>{label}</Text>
      </View>
      <Text style={styles.reportSectionDescription}>{description}</Text>
    </View>
  );
}

function DistributionCard({
  stats,
  animationKey,
}: {
  stats: DistributionStat[];
  animationKey: number;
}) {
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
            <AnimatedProgressBar percentage={s.percentage} index={i} animationKey={animationKey} />
          </View>
        </View>
      ))}
    </View>
  );
}

function AnimatedProgressBar({
  percentage,
  index,
  animationKey,
}: {
  percentage: number;
  index: number;
  animationKey: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: percentage,
      duration: 620,
      delay: index * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animationKey, index, percentage, progress]);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return <Animated.View style={[styles.barFill, { width }]} />;
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

function UncategorizedNotice({ count, onPressAction }: { count: number; onPressAction: () => void }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>아직 폴더에 들어가지 않은 콘텐츠가 {count}개 있어요</Text>
      <Text style={styles.noticeText}>
        정리하면 관심사 리포트가 더 정확해져요.
      </Text>
      <Pressable
        onPress={onPressAction}
        style={({ pressed }) => [styles.noticeAction, pressed && styles.noticeActionPressed]}
        hitSlop={8}
      >
        <MaterialCommunityIcons name="broom" size={14} color={Colors.primary} />
        <Text style={styles.noticeActionText}>정리하러가기</Text>
        <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
      </Pressable>
    </View>
  );
}

function InsufficientCard({ window }: { window: ReportWindowOption }) {
  return (
    <View style={styles.insufficient}>
      <Ionicons name="bar-chart-outline" size={28} color={Colors.tertiary} />
      <Text style={styles.insufficientTitle}>최근 {window.label} 기준으로는 기록이 적어요</Text>
      <Text style={styles.insufficientText}>
        기간을 넓히거나 조금 더 저장하면{'\n'}
        관심사 분포를 보여드릴게요.
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
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 30,
  },
  windowDropdown: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginBottom: 16,
    zIndex: 1,
  },
  windowPrefix: {
    fontSize: 18,
    lineHeight: 36,
    fontWeight: '700',
    color: Colors.primary,
  },
  windowDropdownBody: {
    position: 'relative',
  },
  windowButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  windowButtonPressed: {
    opacity: 0.65,
  },
  windowButtonText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  windowMenu: {
    position: 'absolute',
    top: 38,
    left: 0,
    minWidth: 112,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  windowMenuItem: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
  },
  windowMenuItemPressed: {
    backgroundColor: Colors.background,
  },
  windowMenuItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.secondary,
  },
  windowMenuItemTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  reportSectionHeader: {
    marginBottom: 12,
  },
  reportSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  reportSectionIconBox: {
    width: 16,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportSectionTitle: {
    ...Typography.subtitle,
    color: Colors.primary,
  },
  reportSectionDescription: {
    ...Typography.caption,
    color: Colors.tertiary,
    marginTop: 3,
    marginLeft: 23,
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
    gap: 4,
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
    lineHeight: 18,
    textAlign: 'center',
  },
});
