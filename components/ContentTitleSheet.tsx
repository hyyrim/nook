import { Animated, Easing, View, Text, TextInput, StyleSheet, Pressable, Modal, Keyboard } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import Reanimated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { BOTTOM_SHEET_PADDING_BOTTOM, Colors } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type ContentTitleSheetProps = {
  visible: boolean;
  initialValue?: string;
  onClose: () => void;
  onSubmit: (title: string) => void;
};

export function ContentTitleSheet({ visible, initialValue = '', onClose, onSubmit }: ContentTitleSheetProps) {
  const [value, setValue] = useState(initialValue);
  const [isMounted, setIsMounted] = useState(visible);
  const inputRef = useRef<TextInput>(null);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(280)).current;

  const keyboard = useAnimatedKeyboard();
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    paddingBottom: BOTTOM_SHEET_PADDING_BOTTOM + keyboard.height.value,
  }));

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue, visible]);

  useEffect(() => {
    if (visible) {
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(280);
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
        toValue: 280,
        duration: 190,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setIsMounted(false);
    });
  }, [visible, backdropOpacity, sheetTranslateY]);

  const trimmed = value.trim();

  const handleSubmit = () => {
    if (!trimmed) return;
    onSubmit(trimmed);
    handleClose();
  };

  return (
    <Modal visible={isMounted} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View pointerEvents="none" style={[styles.dim, { opacity: backdropOpacity }]} />
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View
          style={[styles.sheetContainer, { transform: [{ translateY: sheetTranslateY }] }]}
          onStartShouldSetResponder={() => true}
        >
          <Reanimated.View style={[styles.sheet, sheetAnimatedStyle]}>
            <View style={styles.dragHandle} />

            <View style={styles.header}>
              <Text style={styles.title}>제목 수정</Text>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={14} color={Colors.secondary} />
              </Pressable>
            </View>

            <View style={styles.form}>
              <View>
                <Text style={styles.label}>콘텐츠 제목</Text>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="저장할 제목을 입력하세요"
                  placeholderTextColor={Colors.tertiary}
                  value={value}
                  onChangeText={setValue}
                  multiline
                />
              </View>

              <Pressable
                onPress={handleSubmit}
                style={[styles.ctaButton, !trimmed && styles.ctaDisabled]}
              >
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
    minHeight: 76,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 20,
    textAlignVertical: 'top',
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
