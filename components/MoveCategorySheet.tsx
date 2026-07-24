import { Animated, Easing, View, Text, ScrollView, StyleSheet, Pressable, Modal, ActivityIndicator, InteractionManager } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Colors, Radius } from '@/constants';
import { getCategoryColor, getCategoryIcon } from '@/constants/categoryStyle';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, createCategory } from '@/lib/api';
import { CategoryBottomSheet } from '@/components/CategoryBottomSheet';
import { CategoryIcon } from '@/components/CategoryIcon';
import { PrimaryButton } from '@/components/PrimaryButton';
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
  // 시트 max height(480)보다 크게 잡아 close 시 완전히 화면 밖으로 나간 뒤 unmount.
  // CategoryBottomSheet과 동일한 값으로 맞춤.
  const sheetTranslateY = useRef(new Animated.Value(600)).current;

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
    if (!visible) return;
    // 시트 등장 애니메이션과 fetch가 겹치면 첫 프레임이 잘려 버벅여 보인다.
    // 상호작용(=애니메이션) 종료 후 fetch를 실행해 등장 프레임을 우선 확보.
    const task = InteractionManager.runAfterInteractions(() => {
      loadCategories();
    });
    return () => task.cancel();
  }, [visible, loadCategories]);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      // CategoryBottomSheet과 동일한 spring 파라미터로 통일해 등장 감을 자연스럽게.
      // timing+cubic은 감쇠감이 약해 마지막 프레임이 툭 끊기는 인상.
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 22,
          stiffness: 230,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, {
        toValue: 600,
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

  const handleAddCategory = async (data: { name: string; color: string | null; icon: string | null }) => {
    try {
      const created = await createCategory(data.name, { color: data.color, icon: data.icon });
      setCategories((prev) => [...prev, created]);
      setShowAddSheet(false);
      handleSelect(created.id);
    } catch (error: any) {
      console.error('Inline category create error:', error);
    }
  };

  const options: Array<{ id: string | null; name: string; color: string | null; icon: string | null }> = [
    { id: null, name: '미분류', color: null, icon: null },
    ...categories.map(c => ({ id: c.id, name: c.name, color: c.color, icon: c.icon })),
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
                <PrimaryButton label="다시 시도" size="small" onPress={loadCategories} />
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
                {options.map(opt => {
                  const isSelected = opt.id === currentCategoryId;
                  const isUncategorized = opt.id === null;
                  const { bg } = getCategoryColor(opt.color);
                  const iconName = isUncategorized ? 'inbox' : getCategoryIcon(opt.icon);
                  return (
                    <Pressable
                      key={opt.id ?? 'uncategorized'}
                      style={styles.option}
                      onPress={() => handleSelect(opt.id)}
                    >
                      <View style={styles.optionLeft}>
                        {iconName ? (
                          <View style={[styles.optionIconWrap, { backgroundColor: bg }]}>
                            <CategoryIcon name={iconName} size={16} color={Colors.primary} />
                          </View>
                        ) : null}
                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                          {opt.name}
                        </Text>
                      </View>
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
    borderRadius: Radius.pill,
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  optionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
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
