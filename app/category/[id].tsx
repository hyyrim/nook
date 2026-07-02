import { View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants';
import { getCategoryIcon } from '@/constants/categoryStyle';
import { ContentCard } from '@/components/ContentCard';
import { GridContentCard } from '@/components/GridContentCard';
import { SearchBar } from '@/components/SearchBar';
import { ActionSheet } from '@/components/ActionSheet';
import { CategoryBottomSheet } from '@/components/CategoryBottomSheet';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { NavHeader } from '@/components/NavHeader';
import { Ionicons } from '@expo/vector-icons';
import { MoveCategorySheet } from '@/components/MoveCategorySheet';
import {
  getCategoryWithCount,
  getContentsByCategory,
  getUncategorizedContents,
  getCategories,
  updateCategory,
  deleteCategory,
  moveContents,
  deleteContents,
} from '@/lib/api';
import { isClassifying, on, emit } from '@/lib/events';
import { useAuth } from '@/lib/AuthProvider';
import { getContentViewType, setContentViewType, type ContentViewType } from '@/lib/preferences';
import { formatRelativeTime, formatSource, THUMBNAIL_PLACEHOLDER } from '@/lib/utils';
import type { Category, Content } from '@/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const REMOVE_LAYOUT_ANIMATION = {
  duration: 260,
  create: { type: 'easeInEaseOut', property: 'opacity' },
  update: { type: 'easeInEaseOut' },
  delete: { type: 'easeInEaseOut', property: 'opacity' },
} as const;

export default function CategoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, isLoading: isAuthLoading } = useAuth();
  const [query, setQuery] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showMoveSheet, setShowMoveSheet] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [category, setCategory] = useState<Category | null>(null);
  const [count, setCount] = useState(0);
  const [articles, setArticles] = useState<Content[]>([]);
  const [allCategoryNames, setAllCategoryNames] = useState<string[]>([]);
  const [viewType, setViewType] = useState<ContentViewType>('list');

  const isUncategorized = id === 'uncategorized';

  useEffect(() => {
    void getContentViewType().then(setViewType);
  }, []);

  const handleToggleViewType = () => {
    const next: ContentViewType = viewType === 'list' ? 'grid' : 'list';
    setViewType(next);
    void setContentViewType(next);
  };

  const loadData = useCallback(async () => {
    if (isAuthLoading) return;
    if (!session) {
      setLoading(false);
      return;
    }

    setLoadError(false);
    try {
      if (isUncategorized) {
        const items = await getUncategorizedContents();
        setArticles(items);
        setCount(items.length);
      } else {
        const [catData, items, allCats] = await Promise.all([
          getCategoryWithCount(id),
          getContentsByCategory(id),
          getCategories(),
        ]);
        setCategory(catData.category);
        setCount(catData.count);
        setArticles(items);
        setAllCategoryNames(allCats.map((c) => c.name));
      }
    } catch (e) {
      console.error('Category load error:', e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [id, isUncategorized, session, isAuthLoading]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (!session) return;
    return on('content-classified', loadData);
  }, [session, loadData]);

  const catName = isUncategorized ? '미분류' : (category?.name ?? '');
  const categoryIcon = getCategoryIcon(category?.icon);

  const filtered = query.trim() === ''
    ? articles
    : articles.filter(a =>
        (a.title ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (a.domain ?? '').toLowerCase().includes(query.toLowerCase()) ||
        a.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
      );

  const handleUpdate = async (data: { name: string; color: string | null; icon: string | null }) => {
    if (!category) return;
    try {
      await updateCategory(category.id, data);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const enterSelectionMode = () => {
    setQuery('');
    setSelectionMode(true);
    setSelectedIds(new Set());
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (contentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contentId)) next.delete(contentId);
      else next.add(contentId);
      return next;
    });
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.delete(a.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.add(a.id));
        return next;
      });
    }
  };

  const handleBulkMove = (categoryId: string | null) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const isStayingHere = isUncategorized ? categoryId === null : categoryId === id;
    if (isStayingHere) {
      exitSelectionMode();
      return;
    }

    const idsSet = new Set(ids);
    const snapshot = articles;
    const snapshotCount = count;

    LayoutAnimation.configureNext(REMOVE_LAYOUT_ANIMATION);
    setArticles((prev) => prev.filter((a) => !idsSet.has(a.id)));
    setCount((prev) => Math.max(0, prev - ids.length));
    exitSelectionMode();

    moveContents(ids, categoryId)
      .then(() => emit('content-saved'))
      .catch((e: any) => {
        setArticles(snapshot);
        setCount(snapshotCount);
        Alert.alert('Error', e.message);
      });
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    Alert.alert(
      `${ids.length}개 콘텐츠 삭제`,
      '선택한 콘텐츠를 모두 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: () => {
            const idsSet = new Set(ids);
            const snapshot = articles;
            const snapshotCount = count;

            LayoutAnimation.configureNext(REMOVE_LAYOUT_ANIMATION);
            setArticles((prev) => prev.filter((a) => !idsSet.has(a.id)));
            setCount((prev) => Math.max(0, prev - ids.length));
            exitSelectionMode();

            deleteContents(ids)
              .then(() => emit('content-saved'))
              .catch((e: any) => {
                setArticles(snapshot);
                setCount(snapshotCount);
                Alert.alert('Error', e.message);
              });
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!category) return;
    Alert.alert(
      '카테고리 삭제',
      `"${category.name}" 카테고리를 삭제하시겠습니까?\n포함된 콘텐츠는 미분류로 이동됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              router.back();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        {selectionMode ? (
          <View style={styles.nav}>
            <Pressable onPress={exitSelectionMode} style={styles.textButton}>
              <Text style={styles.textButtonLabel}>취소</Text>
            </Pressable>
            <Text style={styles.navTitle} numberOfLines={1}>
              {selectedIds.size > 0 ? `${selectedIds.size}개 선택됨` : '항목 선택'}
            </Text>
            <Pressable
              onPress={toggleSelectAll}
              style={styles.textButton}
              disabled={filtered.length === 0}
            >
              <Text style={[styles.textButtonLabel, filtered.length === 0 && styles.textButtonDisabled]}>
                {allFilteredSelected ? '전체 해제' : '전체 선택'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <NavHeader
            title={catName}
            backLabel="폴더"
            onBack={() => router.back()}
            titleAccessory={
              !isUncategorized && categoryIcon
                ? <Ionicons name={categoryIcon} size={15} color={Colors.primary} />
                : undefined
            }
            rightAction={
              isUncategorized
                ? { type: 'text', label: '선택', onPress: enterSelectionMode }
                : { type: 'icon', icon: 'ellipsis-horizontal', onPress: () => setShowActionSheet(true) }
            }
          />
        )}

        <View style={styles.headerSection}>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>{count}개 저장됨</Text>
            {!selectionMode && (
              <Pressable
                onPress={handleToggleViewType}
                hitSlop={8}
                style={styles.viewToggle}
              >
                <Ionicons
                  name={viewType === 'grid' ? 'list-outline' : 'grid-outline'}
                  size={19}
                  color={Colors.secondary}
                />
              </Pressable>
            )}
          </View>
          {!selectionMode && (
            <SearchBar
              placeholder="이 폴더에서 찾기"
              value={query}
              onChangeText={setQuery}
              editable
            />
          )}
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[
          styles.list,
          selectionMode && styles.listSelectionMode,
          viewType === 'grid' && filtered.length > 0 && styles.listGrid,
        ]}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
          ) : loadError ? (
            <ErrorState onRetry={loadData} />
          ) : filtered.length > 0 ? (
            filtered.map(a => {
              const commonProps = {
                title: a.title ?? a.url,
                source: formatSource(a.domain),
                thumbnailUrl: a.thumbnail_url,
                thumbnailColor: THUMBNAIL_PLACEHOLDER,
                savedAt: formatRelativeTime(a.saved_at),
                isClassifying: isClassifying(a.id),
                selectionMode,
                selected: selectedIds.has(a.id),
                onPress: () =>
                  selectionMode
                    ? toggleSelect(a.id)
                    : router.push({
                        pathname: '/content/[id]' as const,
                        params: { id: a.id, source: 'category' },
                      }),
              };
              return viewType === 'grid' ? (
                <GridContentCard key={a.id} {...commonProps} />
              ) : (
                <ContentCard key={a.id} {...commonProps} tags={a.tags} />
              );
            })
          ) : articles.length === 0 ? (
            <EmptyState
              icon="document-text-outline"
              title="아직 저장된 콘텐츠가 없어요"
              subtitle="이 카테고리에 콘텐츠를 저장해보세요"
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="검색 결과가 없어요"
              subtitle="다른 검색어를 입력해보세요"
            />
          )}
        </View>
      </ScrollView>

      {selectionMode && (
        <SafeAreaView edges={['bottom']} style={styles.bulkBar}>
          <Pressable
            onPress={() => setShowMoveSheet(true)}
            style={[styles.bulkAction, selectedIds.size === 0 && styles.bulkActionDisabled]}
            disabled={selectedIds.size === 0}
          >
            <Ionicons name="folder-outline" size={18} color={selectedIds.size === 0 ? Colors.tertiary : Colors.primary} />
            <Text style={[styles.bulkActionLabel, selectedIds.size === 0 && styles.bulkActionLabelDisabled]}>
              카테고리 이동
            </Text>
          </Pressable>
          <Pressable
            onPress={handleBulkDelete}
            style={[styles.bulkAction, selectedIds.size === 0 && styles.bulkActionDisabled]}
            disabled={selectedIds.size === 0}
          >
            <Ionicons name="trash-outline" size={18} color={selectedIds.size === 0 ? Colors.tertiary : Colors.accent} />
            <Text style={[styles.bulkActionLabel, { color: Colors.accent }, selectedIds.size === 0 && styles.bulkActionLabelDisabled]}>
              삭제
            </Text>
          </Pressable>
        </SafeAreaView>
      )}

      <MoveCategorySheet
        visible={showMoveSheet}
        onClose={() => setShowMoveSheet(false)}
        onSelect={handleBulkMove}
      />

      {!isUncategorized && (
        <>
          <ActionSheet
            visible={showActionSheet}
            onClose={() => setShowActionSheet(false)}
            handoffDelay={320}
            actions={[
              { label: '선택', onPress: enterSelectionMode },
              { label: '카테고리 수정', onPress: () => setShowEditSheet(true) },
              { label: '카테고리 삭제', danger: true, onPress: handleDelete },
            ]}
          />
          <CategoryBottomSheet
            visible={showEditSheet}
            mode="edit"
            initialValue={category?.name ?? ''}
            initialColor={category?.color ?? null}
            initialIcon={category?.icon ?? null}
            existingNames={allCategoryNames}
            onClose={() => setShowEditSheet(false)}
            onSubmit={handleUpdate}
          />
        </>
      )}
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
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    marginBottom: 12,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.secondary,
  },
  viewToggle: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  list: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  listGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  listSelectionMode: {
    paddingBottom: 110,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 160,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.tertiary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.tertiary,
  },
  textButton: {
    minWidth: 70,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  textButtonLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  },
  textButtonDisabled: {
    color: Colors.tertiary,
  },
  bulkBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  bulkAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  bulkActionDisabled: {
    opacity: 0.5,
  },
  bulkActionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  bulkActionLabelDisabled: {
    color: Colors.tertiary,
  },
});
