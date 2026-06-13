import { View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback } from 'react';
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
  updateCategory,
  deleteCategory,
} from '@/lib/api';
import { formatRelativeTime, formatSource, placeholderColor } from '@/lib/utils';
import type { Category, Content } from '@/types';

export default function CategoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [query, setQuery] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState<Category | null>(null);
  const [count, setCount] = useState(0);
  const [articles, setArticles] = useState<Content[]>([]);

  const isUncategorized = id === 'uncategorized';

  const loadData = useCallback(async () => {
    try {
      if (isUncategorized) {
        const items = await getUncategorizedContents();
        setArticles(items);
        setCount(items.length);
      } else {
        const [catData, items] = await Promise.all([
          getCategoryWithCount(id),
          getContentsByCategory(id),
        ]);
        setCategory(catData.category);
        setCount(catData.count);
        setArticles(items);
      }
    } catch (e) {
      console.error('Category load error:', e);
    } finally {
      setLoading(false);
    }
  }, [id, isUncategorized]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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
            <Ionicons name="chevron-back" size={18} color={Colors.primary} />
            <Text style={styles.backLabel}>Library</Text>
          </Pressable>
          {!isUncategorized && (
            <Pressable onPress={() => setShowActionSheet(true)} style={styles.moreButton}>
              <Ionicons name="ellipsis-horizontal" size={18} color={Colors.primary} />
            </Pressable>
          )}
        </View>

        <View style={styles.headerSection}>
          <Text style={styles.title}>{catName}</Text>
          <Text style={styles.subtitle}>{count} saved items</Text>
          <SearchBar
            placeholder={`Search in ${catName}...`}
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
                onPress={() => router.push(`/content/${a.id}`)}
              />
            ))
          ) : articles.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={36} color={Colors.tertiary} />
              <Text style={styles.emptyTitle}>No articles yet</Text>
              <Text style={styles.emptySubtitle}>Start saving to this category</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No results</Text>
              <Text style={styles.emptySubtitle}>Try a different search term</Text>
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
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 8,
    borderRadius: 8,
  },
  backLabel: {
    fontSize: 16,
    color: Colors.primary,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 2,
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
    paddingVertical: 52,
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
