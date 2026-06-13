import { View, Text, TextInput, StyleSheet, Pressable, Modal } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Colors } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type CategoryBottomSheetProps = {
  visible: boolean;
  mode: 'add' | 'edit';
  initialValue?: string;
  onClose: () => void;
  onSubmit?: (name: string) => void;
};

export function CategoryBottomSheet({ visible, mode, initialValue = '', onClose, onSubmit }: CategoryBottomSheetProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue, visible]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => inputRef.current?.focus(), 380);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const isEdit = mode === 'edit';
  const title = isEdit ? '카테고리 수정' : '카테고리 추가';
  const cta = isEdit ? '수정' : '추가';

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit?.(value.trim());
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
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
                onChangeText={setValue}
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              style={[styles.ctaButton, !value.trim() && styles.ctaDisabled]}
            >
              <Text style={styles.ctaText}>{cta}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.36)',
    justifyContent: 'flex-end',
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
