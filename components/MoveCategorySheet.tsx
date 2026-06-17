import { Animated, Easing, View, Text, ScrollView, StyleSheet, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Colors } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, createCategory } from '@/lib/api';
import { CategoryBottomSheet } from '@/components/CategoryBottomSheet';
import type { Category } from '@/types';

type MoveCategorySheetProps = {
  visible: boolean;
  currentCategoryId?: string | null;
  onClose: () => void;
  onSelect: (categoryId: string | null) => void;
};

export function MoveCategorySheet({ visible, currentCategoryId, onClose, onSelect }: MoveCategorySheetProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isMounted, setIsMounted] = useState(visible);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(360)).current;

  const loadCategories = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    getCategories()
      .then(setCategories)
      .catch((error) => {
        console.error('Move category load error:', error);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (visible) loadCategories();
  }, [visible, loadCategories]);

  useEffect(() => {
    if (visible) {
      // 초기값 리셋 후 애니메이션 시작
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(300);
      setIsMounted(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(sheetTranslateY, {
            toValue: 0,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
      return;
    }
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, {
        toValue: 300,
        duration: 190,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => { if (finished) setIsMounted(false); });
  }, [visible]);

  const handleSelect = (categoryId: string | null) => {
    onSelect(categoryId);
    onClose();
  };

  const handleAddCategory = async (name: string) => {
    try {
      const created = await createCategory(name);
      setCategories((prev) => [...prev, created]);
      setShowAddSheet(false);
      handleSelect(created.id);
    } catch (error: any) {
      console.error('Inline category create error:', error);
    }
  };

  const options = [
    { id: null, name: '미분류' },
    ...categories.map(c => ({ id: c.id, name: c.name })),
  ];

  return (
    <Modal visible={isMounted} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View pointerEvents="none" style={[styles.dim, { opacity: backdropOpacity }]} />
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[styles.sheetContainer, { transform: [{ translateY: sheetTranslateY }] }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />
            <View style={styles.header}>
              <Text style={styles.title}>카테고리 변경</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={14} color={Colors.secondary} />
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color={Colors.tertiary} style={{ marginVertical: 24 }} />
            ) : loadError ? (
              <View style={styles.errorState}>
                <Ionicons name="cloud-offline-outline" size={28} color={Colors.tertiary} />
                <Text selectable style={styles.errorText}>카테고리를 불러오지 못했어요</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={loadCategories}
                  style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
                >
                  <Text style={styles.retryButtonText}>다시 시도</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
                {options.map(opt => {
                  const isSelected = opt.id === currentCategoryId;
                  return (
                    <Pressable
                      key={opt.id ?? 'uncategorized'}
                      style={styles.option}
                      onPress={() => handleSelect(opt.id)}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {opt.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color={Colors.accent} />
                      )}
                    </Pressable>
                  );
                })}
                <Pressable
                  style={[styles.option, styles.addOption]}
                  onPress={() => setShowAddSheet(true)}
                >
                  <Ionicons name="add" size={18} color={Colors.secondary} />
                  <Text style={styles.addOptionText}>새 카테고리 만들기</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </Animated.View>
      </Pressable>
      <CategoryBottomSheet
        visible={showAddSheet}
        mode="add"
        existingNames={categories.map((c) => c.name)}
        onClose={() => setShowAddSheet(false)}
        onSubmit={handleAddCategory}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0, left: 0,
    backgroundColor: 'rgba(0,0,0,0.36)',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 44,
    paddingTop: 12,
    maxHeight: 480,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 100,
    backgroundColor: '#DCDCDC',
    alignSelf: 'center',
    marginBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flexGrow: 0,
  },
  errorState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 28,
  },
  errorText: {
    fontSize: 14,
    color: Colors.secondary,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonPressed: {
    opacity: 0.7,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.surface,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  optionText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '400',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: Colors.accent,
  },
  addOption: {
    justifyContent: 'flex-start',
    gap: 8,
    borderBottomWidth: 0,
  },
  addOptionText: {
    fontSize: 15,
    color: Colors.secondary,
    fontWeight: '500',
  },
});
