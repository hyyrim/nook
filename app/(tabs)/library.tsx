import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants';
import { FolderCard, AddCategoryCard } from '@/components/FolderCard';
import { CategoryBottomSheet } from '@/components/CategoryBottomSheet';
import { getCategories, getUncategorizedContents, createCategory } from '@/lib/api';
import type { Category } from '@/types';

export default function LibraryScreen() {
  const router = useRouter();
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categories, setCategories] = useState<(Category & { count: number })[]>([]);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [cats, uncategorized] = await Promise.all([
        getCategories(),
        getUncategorizedContents(),
      ]);

      // TODO: 카테고리별 count를 효율적으로 가져오기 (현재는 개별 쿼리 대신 단순 표시)
      const catsWithCount = cats.map(cat => ({ ...cat, count: 0 }));
      setCategories(catsWithCount);
      setUncategorizedCount(uncategorized.length);
    } catch (e) {
      console.error('Library load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddCategory = async (name: string) => {
    try {
      await createCategory(name);
      loadData();
    } catch (e: any) {
      console.error('Create category error:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Library</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.grid}>
            <AddCategoryCard onPress={() => setShowAddCategory(true)} />
            {uncategorizedCount > 0 && (
              <FolderCard
                name="미분류"
                count={uncategorizedCount}
                onPress={() => router.push('/category/uncategorized')}
              />
            )}
            {categories.map((cat) => (
              <FolderCard
                key={cat.id}
                name={cat.name}
                count={cat.count}
                onPress={() => router.push(`/category/${cat.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <CategoryBottomSheet
        visible={showAddCategory}
        mode="add"
        onClose={() => setShowAddCategory(false)}
        onSubmit={handleAddCategory}
      />
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 18,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
});
