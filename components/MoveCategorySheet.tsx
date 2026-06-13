import { Animated, View, Text, ScrollView, StyleSheet, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Colors } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { getCategories } from '@/lib/api';
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
  const [isMounted, setIsMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(360)).current;

  useEffect(() => {
    if (visible) {
      setLoading(true);
      getCategories()
        .then(setCategories)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      // 초기값 리셋 후 애니메이션 시작
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(300);
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.spring(sheetTranslateY, { toValue: 0, damping: 24, stiffness: 270, mass: 0.8, useNativeDriver: true }),
      ]).start();
      return;
    }
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 130, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: 300, duration: 160, useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) setIsMounted(false); });
  }, [visible]);

  const handleSelect = (categoryId: string | null) => {
    onSelect(categoryId);
    onClose();
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
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
                {options.map(opt => {
                  const isSelected = opt.id === currentCategoryId;
                  return (
                    <Pressable
                      key={opt.id ?? 'uncategorized'}
                      style={[styles.option, isSelected && styles.optionSelected]}
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
              </ScrollView>
            )}
          </View>
        </Animated.View>
      </Pressable>
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  optionSelected: {
    backgroundColor: 'transparent',
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
});
