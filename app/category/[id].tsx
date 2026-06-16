import { View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
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
import {
  getCategoryWithCount,
  getContentsByCategory,
  getUncategorizedContents,
  getCategories,
  updateCategory,
  deleteCategory,
} from '@/lib/api';
import { isClassifying, on } from '@/lib/events';
import { useAuth } from '@/lib/AuthProvider';
import { formatRelativeTime, formatSource, placeholderColor } from '@/lib/utils';
import type { Category, Content } from '@/types';

export default function CategoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, isLoading: isAuthLoading } = useAuth();
  const [query, setQuery] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
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
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={Colors.primary} />
            <Text style={styles.backLabel}>폴더</Text>
          </Pressable>
          <Text style={styles.navTitle} numberOfLines={1}>{catName}</Text>
          {!isUncategorized ? (
            <Pressable onPress={() => setShowActionSheet(true)} style={styles.moreButton}>
              <Ionicons name="ellipsis-horizontal" size={22} color={Colors.primary} />
            </Pressable>
          ) : (
            <View style={styles.navRight} />
          )}
        </View>

        <View style={styles.headerSection}>
          <Text style={styles.subtitle}>{count}개 저장됨</Text>
          <SearchBar
            placeholder="이 폴더에서 찾기"
            value={query}
            onChangeText={setQuery}
            editable
          />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
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
                onPress={() => router.push(`/content/${a.id}`)}
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

      {!isUncategorized && (
        <>
          <ActionSheet
            visible={showActionSheet}
            onClose={() => setShowActionSheet(false)}
            actions={[
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
});
