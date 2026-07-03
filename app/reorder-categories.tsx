import { View, Text, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants';
import { getCategoryColor, getCategoryIcon } from '@/constants/categoryStyle';
import { getCategories, reorderCategories } from '@/lib/api';
import { emit } from '@/lib/events';
import { useAuth } from '@/lib/AuthProvider';
import type { Category } from '@/types';

export default function ReorderCategoriesScreen() {
  const router = useRouter();
  const { session, isLoading: isAuthLoading } = useAuth();
  const [items, setItems] = useState<Category[]>([]);
  const [initialIds, setInitialIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (isAuthLoading || !session) {
      setLoading(false);
      return;
    }
    try {
      const cats = await getCategories();
      setItems(cats);
      setInitialIds(cats.map((c) => c.id));
    } catch (e: any) {
      Alert.alert('오류', e.message ?? '카테고리를 불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  }, [session, isAuthLoading]);

  useEffect(() => {
    load();
  }, [load]);

  const isDirty = items.some((c, i) => c.id !== initialIds[i]);

  const handleSave = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      await reorderCategories(items.map((c) => c.id));
      emit('content-saved');
      router.back();
    } catch (e: any) {
      Alert.alert('저장 실패', e.message ?? '순서 저장 중 문제가 발생했어요');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<Category>) => {
    const { bg } = getCategoryColor(item.color);
    const iconName = getCategoryIcon(item.icon);
    return (
      <ScaleDecorator activeScale={1.03}>
        <Pressable
          onLongPress={drag}
          delayLongPress={180}
          disabled={saving}
          style={[styles.row, isActive && styles.rowActive]}
        >
          <View style={styles.left}>
            <View style={[styles.iconWrap, { backgroundColor: bg }]}>
              {iconName ? (
                <Ionicons name={iconName} size={17} color={Colors.primary} />
              ) : (
                <Ionicons name="folder-outline" size={17} color={Colors.primary} />
              )}
            </View>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          </View>
          <Ionicons name="reorder-three" size={22} color={Colors.tertiary} />
        </Pressable>
      </ScaleDecorator>
    );
  }, [saving]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleCancel} hitSlop={8} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>취소</Text>
          </Pressable>
          <Text style={styles.headerTitle}>카테고리 순서 편집</Text>
          <Pressable
            onPress={handleSave}
            hitSlop={8}
            disabled={!isDirty || saving}
            style={styles.headerButton}
          >
            <Text
              style={[
                styles.headerButtonText,
                styles.headerButtonPrimary,
                (!isDirty || saving) && styles.headerButtonDisabled,
              ]}
            >
              저장
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>편집할 카테고리가 없어요</Text>
          </View>
        ) : (
          <DraggableFlatList
            data={items}
            onDragEnd={({ data }) => setItems(data)}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            activationDistance={8}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safe: {
    flex: 1,
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  },
  headerButton: {
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  },
  headerButtonPrimary: {
    fontWeight: '600',
  },
  headerButtonDisabled: {
    color: Colors.tertiary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  rowActive: {
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.tertiary,
  },
});
