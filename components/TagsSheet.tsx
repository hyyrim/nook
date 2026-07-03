import { Animated, View, Text, TextInput, StyleSheet, Pressable, Modal, Keyboard } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import Reanimated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { BOTTOM_SHEET_PADDING_BOTTOM, Colors, Radius, Typography } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type TagsSheetProps = {
  visible: boolean;
  initialTags?: string[];
  onClose: () => void;
  onSubmit: (tags: string[]) => void;
};

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 20;

export function TagsSheet({ visible, initialTags = [], onClose, onSubmit }: TagsSheetProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(visible);
  const inputRef = useRef<TextInput>(null);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(360)).current;

  const keyboard = useAnimatedKeyboard();
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    paddingBottom: BOTTOM_SHEET_PADDING_BOTTOM + keyboard.height.value,
  }));

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      setTags(initialTags);
      setValue('');
      setError('');
    }
  }, [visible, initialTags]);

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
        toValue: 360,
        duration: 190,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setIsMounted(false);
    });
  }, [visible, backdropOpacity, sheetTranslateY]);

  const handleAddTag = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_TAG_LENGTH) {
      setError(`태그는 ${MAX_TAG_LENGTH}자 이내로 입력해 주세요`);
      return;
    }
    if (tags.length >= MAX_TAGS) {
      setError(`태그는 최대 ${MAX_TAGS}개까지 추가할 수 있어요`);
      return;
    }
    const isDuplicate = tags.some((t) => t.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      setError('이미 추가된 태그예요');
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setValue('');
    setError('');
  };

  const handleRemoveTag = (target: string) => {
    setTags((prev) => prev.filter((t) => t !== target));
    if (error) setError('');
  };

  const handleSubmit = () => {
    onSubmit(tags);
    handleClose();
  };

  return (
    <Modal visible={isMounted} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View
        pointerEvents="none"
        style={[styles.dim, { opacity: backdropOpacity }]}
      />
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View
          style={[styles.sheetContainer, { transform: [{ translateY: sheetTranslateY }] }]}
          onStartShouldSetResponder={() => true}
        >
          <Reanimated.View style={[styles.sheet, sheetAnimatedStyle]}>
            <View style={styles.dragHandle} />

            <View style={styles.header}>
              <Text style={styles.title}>태그 수정</Text>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={14} color={Colors.secondary} />
              </Pressable>
            </View>

            <View style={styles.form}>
              <View>
                <Text style={styles.label}>현재 태그</Text>
                {tags.length > 0 ? (
                  <View style={styles.chipsWrap}>
                    {tags.map((tag) => (
                      <Pressable
                        key={tag}
                        onPress={() => handleRemoveTag(tag)}
                        style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}
                      >
                        <Text style={styles.chipText}>#{tag}</Text>
                        <Ionicons name="close" size={12} color={Colors.secondary} />
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyHint}>아직 추가된 태그가 없어요</Text>
                )}
              </View>

              <View>
                <Text style={styles.label}>새 태그 추가</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder="태그 입력 후 추가"
                    placeholderTextColor={Colors.tertiary}
                    value={value}
                    onChangeText={(text) => {
                      setValue(text);
                      if (error) setError('');
                    }}
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                    maxLength={MAX_TAG_LENGTH + 5}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={handleAddTag}
                    style={[styles.addButton, !value.trim() && styles.addButtonDisabled]}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
                {error ? <Text style={Typography.errorText}>{error}</Text> : null}
              </View>

              <Pressable onPress={handleSubmit} style={styles.ctaButton}>
                <Text style={styles.ctaText}>저장</Text>
              </Pressable>
            </View>
          </Reanimated.View>
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
    paddingBottom: BOTTOM_SHEET_PADDING_BOTTOM,
    paddingTop: 12,
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
    gap: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    paddingLeft: 11,
    paddingRight: 9,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: Colors.primary,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.tertiary,
    paddingVertical: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.primary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#C8C8C8',
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
