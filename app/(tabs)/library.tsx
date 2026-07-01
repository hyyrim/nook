import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants';
import { FolderCard, AddCategoryCard } from '@/components/FolderCard';
import { CategoryBottomSheet } from '@/components/CategoryBottomSheet';
import { ErrorState } from '@/components/ErrorState';
import { getCategoriesWithCounts, getUncategorizedContents, createCategory } from '@/lib/api';
import { on } from '@/lib/events';
import { useAuth } from '@/lib/AuthProvider';
import type { Category } from '@/types';

export default function LibraryScreen() {
  const router = useRouter();
  const { session, isLoading: isAuthLoading } = useAuth();
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categories, setCategories] = useState<(Category & { count: number })[]>([]);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const loadData = useCallback(async () => {
    if (isAuthLoading) return;
    if (!session) {
      setLoading(false);
      return;
    }

    setLoadError(false);
    try {
      const [cats, uncategorized] = await Promise.all([
        getCategoriesWithCounts(),
        getUncategorizedContents(),
      ]);

      setCategories(cats);
      setUncategorizedCount(uncategorized.length);
    } catch (e) {
      console.error('Library load error:', e);
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

  const handleAddCategory = async (data: { name: string; color: string | null; icon: string | null }) => {
    try {
      await createCategory(data.name, { color: data.color, icon: data.icon });
      await loadData();
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    } catch (e: any) {
      console.error('Create category error:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView ref={scrollRef} style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>폴더</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
        ) : loadError ? (
          <ErrorState onRetry={loadData} />
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
                color={cat.color}
                icon={cat.icon}
                onPress={() => router.push(`/category/${cat.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <CategoryBottomSheet
        visible={showAddCategory}
        mode="add"
        existingNames={categories.map((c) => c.name)}
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
    paddingTop: 19,
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.6,
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
