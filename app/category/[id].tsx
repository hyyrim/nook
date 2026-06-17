import { View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants';
import { ContentCard } from '@/components/ContentCard';
import { SearchBar } from '@/components/SearchBar';
import { ActionSheet } from '@/components/ActionSheet';
import { CategoryBottomSheet } from '@/components/CategoryBottomSheet';
import { Ionicons } from '@expo/vector-icons';
import { MoveCategorySheet } from '@/components/MoveCategorySheet';
import {
  getCategoryWithCount,
  getContentsByCategory,
  getUncategorizedContents,
  getCategories,
  updateCategory,
  deleteCategory,
  updateContent,
  deleteContent,
} from '@/lib/api';
import { isClassifying, on, emit } from '@/lib/events';
import { useAuth } from '@/lib/AuthProvider';
import { formatRelativeTime, formatSource, placeholderColor } from '@/lib/utils';
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

  const [category, setCategory] = useState<Category | null>(null);
  const [count, setCount] = useState(0);
  const [articles, setArticles] = useState<Content[]>([]);
  const [allCategoryNames, setAllCategoryNames] = useState<string[]>([]);

  const isUncategorized = id === 'uncategorized';

  const loadData = useCallback(async () => {
    if (isAuthLoading) return;
    if (!session) {
      setLoading(false);
      return;
    }

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

  const catName = isUncategorized ? '미분류' : (category?.name ?? 'Category');

  const filtered = query.trim() === ''
    ? articles
    : articles.filter(a =>
        (a.title ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (a.domain ?? '').toLowerCase().includes(query.toLowerCase()) ||
        a.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
      );

  const handleUpdate = async (name: string) => {
    if (!category) return;
    try {
      await updateCategory(category.id, name);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const enterSelectionMode = () => {
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

    Promise.all(ids.map((cid) => updateContent(cid, { category_id: categoryId })))
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

            Promise.all(ids.map((cid) => deleteContent(cid)))
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
          <View style={styles.nav}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={22} color={Colors.primary} />
              <Text style={styles.backLabel}>폴더</Text>
            </Pressable>
            <Text style={styles.navTitle} numberOfLines={1}>{catName}</Text>
            {isUncategorized ? (
              <Pressable onPress={enterSelectionMode} style={styles.textButton}>
                <Text style={styles.textButtonLabel}>선택</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => setShowActionSheet(true)} style={styles.moreButton}>
                <Ionicons name="ellipsis-horizontal" size={22} color={Colors.primary} />
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.headerSection}>
          <Text style={styles.subtitle}>{count}개 저장됨</Text>
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
        <View style={[styles.list, selectionMode && styles.listSelectionMode]}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
          ) : filtered.length > 0 ? (
            filtered.map(a => (
              <ContentCard
                key={a.id}
                title={a.title ?? a.url}
                source={formatSource(a.domain)}
                tags={a.tags}
                thumbnailUrl={a.thumbnail_url}
                thumbnailColor={placeholderColor(a.id)}
                savedAt={formatRelativeTime(a.saved_at)}
                isClassifying={isClassifying(a.id)}
                selectionMode={selectionMode}
                selected={selectedIds.has(a.id)}
                onPress={() =>
                  selectionMode ? toggleSelect(a.id) : router.push(`/content/${a.id}`)
                }
              />
            ))
          ) : articles.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={36} color={Colors.tertiary} />
              <Text style={styles.emptyTitle}>아직 저장된 콘텐츠가 없어요</Text>
              <Text style={styles.emptySubtitle}>이 카테고리에 콘텐츠를 저장해보세요</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
              <Text style={styles.emptySubtitle}>다른 검색어를 입력해보세요</Text>
            </View>
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
            actions={[
              { label: '선택', onPress: enterSelectionMode },
              { label: '수정', onPress: () => setShowEditSheet(true) },
              { label: '삭제', danger: true, onPress: handleDelete },
            ]}
          />
          <CategoryBottomSheet
            visible={showEditSheet}
            mode="edit"
            initialValue={category?.name ?? ''}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 44,
    borderRadius: 8,
    minWidth: 70,
  },
  backLabel: {
    fontSize: 17,
    color: Colors.primary,
    fontWeight: '500',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    flex: 1,
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  navRight: {
    minWidth: 70,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.secondary,
    marginBottom: 14,
  },
  scroll: {
    flex: 1,
  },
  list: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 32,
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
