import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Reanimated, { FadeIn, LinearTransition, useReducedMotion } from 'react-native-reanimated';
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

// 폴더 그리드 추가/재배치 spring settle. 카테고리 추가는 저빈도라 새 카드에 FadeIn도 허용.
const GRID_LAYOUT = LinearTransition.springify().damping(20).stiffness(200).mass(0.9);

export default function LibraryScreen() {
  const router = useRouter();
  const { session, isLoading: isAuthLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const reduceMotion = useReducedMotion();
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categories, setCategories] = useState<(Category & { count: number })[]>([]);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const activeUserIdRef = useRef<string | null>(userId);

  // 계정 전환 시 이전 카테고리 잔상 제거 + 진행 중이던 stale load 결과 무시 (홈과 동일, 결정 109).
  useEffect(() => {
    activeUserIdRef.current = userId;
    setCategories([]);
    setUncategorizedCount(0);
    setLoadError(false);
    setLoading(Boolean(userId));
  }, [userId]);

  const loadData = useCallback(async () => {
    if (isAuthLoading) return;
    if (!userId) {
      setLoading(false);
      return;
    }

    const requestUserId = userId;
    setLoadError(false);
    try {
      const [cats, uncategorized] = await Promise.all([
        getCategoriesWithCounts(),
        getUncategorizedContents(),
      ]);
      if (activeUserIdRef.current !== requestUserId) return;
      setCategories(cats);
      setUncategorizedCount(uncategorized.length);
    } catch (e) {
      if (activeUserIdRef.current !== requestUserId) return;
      console.error('Library load error:', e);
      setLoadError(true);
    } finally {
      if (activeUserIdRef.current === requestUserId) setLoading(false);
    }
  }, [userId, isAuthLoading]);

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
          {categories.length >= 2 && (
            <Pressable
              onPress={() => router.push('/reorder-categories')}
              hitSlop={8}
              style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.5 }]}
            >
              <Text style={styles.editButtonText}>순서 편집</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
        ) : loadError ? (
          <ErrorState onRetry={loadData} />
        ) : (
          <View style={styles.grid}>
            <Reanimated.View style={styles.gridItem} layout={reduceMotion ? undefined : GRID_LAYOUT}>
              <AddCategoryCard onPress={() => setShowAddCategory(true)} />
            </Reanimated.View>
            {uncategorizedCount > 0 && (
              <Reanimated.View
                style={styles.gridItem}
                layout={reduceMotion ? undefined : GRID_LAYOUT}
                entering={reduceMotion ? undefined : FadeIn.duration(200)}
              >
                <FolderCard
                  name="미분류"
                  count={uncategorizedCount}
                  onPress={() => router.push('/category/uncategorized')}
                />
              </Reanimated.View>
            )}
            {categories.map((cat) => (
              <Reanimated.View
                key={cat.id}
                style={styles.gridItem}
                layout={reduceMotion ? undefined : GRID_LAYOUT}
                entering={reduceMotion ? undefined : FadeIn.duration(200)}
              >
                <FolderCard
                  name={cat.name}
                  count={cat.count}
                  color={cat.color}
                  icon={cat.icon}
                  onPress={() => router.push(`/category/${cat.id}`)}
                />
              </Reanimated.View>
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
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
  editButton: {
    paddingBottom: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 18,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  gridItem: {
    width: '47.8%',
  },
});
