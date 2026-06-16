import { Animated, View, Text, TextInput, StyleSheet, Pressable, Modal } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Colors, Typography } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type CategoryBottomSheetProps = {
  visible: boolean;
  mode: 'add' | 'edit';
  initialValue?: string;
  existingNames?: string[];
  onClose: () => void;
  onSubmit?: (name: string) => void;
};

export function CategoryBottomSheet({ visible, mode, initialValue = '', existingNames = [], onClose, onSubmit }: CategoryBottomSheetProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(visible);
  const inputRef = useRef<TextInput>(null);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    setValue(initialValue);
    setError('');
  }, [initialValue, visible]);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
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
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 320,
        duration: 190,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setIsMounted(false);
    });
  }, [visible, backdropOpacity, sheetTranslateY]);

  const isEdit = mode === 'edit';
  const title = isEdit ? '카테고리 수정' : '카테고리 추가';
  const cta = isEdit ? '수정' : '추가';

  const handleValueChange = (text: string) => {
    setValue(text);
    if (error) setError('');
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const isDuplicate = existingNames.some(
      (name) => name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate && trimmed.toLowerCase() !== initialValue.trim().toLowerCase()) {
      setError('이미 같은 이름의 카테고리가 있어요');
      return;
    }
    onSubmit?.(trimmed);
    onClose();
  };

  return (
    <Modal visible={isMounted} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        pointerEvents="none"
        style={[styles.dim, { opacity: backdropOpacity }]}
      />
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[styles.sheetContainer, { transform: [{ translateY: sheetTranslateY }] }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />

            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={14} color={Colors.secondary} />
              </Pressable>
            </View>

            <View style={styles.form}>
              <View>
                <Text style={styles.label}>카테고리 이름</Text>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="예) AI, 디자인, 여행..."
                  placeholderTextColor={Colors.tertiary}
                  value={value}
                  onChangeText={handleValueChange}
                />
                {error ? <Text style={Typography.errorText}>{error}</Text> : null}
              </View>

              <Pressable
                onPress={handleSubmit}
                style={[styles.ctaButton, !value.trim() && styles.ctaDisabled]}
              >
                <Text style={styles.ctaText}>{cta}</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
    marginBottom: 22,
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
  form: {
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary,
    marginBottom: 7,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.primary,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: '#C8C8C8',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
