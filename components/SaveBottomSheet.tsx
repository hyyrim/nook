import { Animated, View, Text, TextInput, StyleSheet, Pressable, Modal, Alert, ActivityIndicator, Keyboard } from 'react-native';
import { useRef, useState, useEffect, useCallback } from 'react';
import Reanimated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { BOTTOM_SHEET_PADDING_BOTTOM, Colors, Typography } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { isDuplicateContentUrlError, saveContent } from '@/lib/api';
import { emit } from '@/lib/events';

type SaveBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function SaveBottomSheet({ visible, onClose, onSaved }: SaveBottomSheetProps) {
  const [url, setUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [isMounted, setIsMounted] = useState(visible);
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
    if (!visible) {
      setUrl('');
      setSaved(false);
      setUrlError('');
    }
  }, [visible]);

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

  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState('');

  const isValidUrl = (text: string) => {
    try {
      const parsed = new URL(text);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleUrlChange = (text: string) => {
    setUrl(text);
    if (urlError) setUrlError('');
  };

  const handleSave = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!isValidUrl(trimmed)) {
      setUrlError('올바른 URL을 입력해 주세요');
      return;
    }
    setSaving(true);
    try {
      const domain = new URL(trimmed).hostname;
      await saveContent({ url: trimmed, domain }, { entry_source: 'direct' });
      setSaved(true);
      onSaved?.();
      emit('content-saved');
      Keyboard.dismiss();
      setTimeout(() => onClose(), 1600);
    } catch (e: unknown) {
      if (isDuplicateContentUrlError(e)) {
        Alert.alert(
          '이미 저장된 링크예요',
          '검색으로 저장한 콘텐츠를 찾아볼 수 있어요.', [
            { text: '확인', style: 'default' },
          ]
        );
        return;
      }

      Alert.alert('저장에 실패했어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setUrl(text);
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
              <Text style={styles.title}>링크 저장</Text>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={14} color={Colors.secondary} />
              </Pressable>
            </View>

            {saved ? (
              <View style={styles.successContainer}>
                <View style={styles.successCircle}>
                  <Ionicons name="checkmark" size={24} color={Colors.success} />
                </View>
                <Text style={styles.successTitle}>저장 완료!</Text>
              </View>
            ) : (
              <View style={styles.form}>
                <View>
                  <Text style={styles.label}>URL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://example.com/article"
                    placeholderTextColor={Colors.tertiary}
                    value={url}
                    onChangeText={handleUrlChange}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  {urlError ? <Text style={Typography.errorText}>{urlError}</Text> : null}
                </View>

                <Pressable
                  style={({ pressed }) => [styles.pasteButton, pressed && { opacity: 0.7 }]}
                  onPress={handlePaste}
                >
                  <Ionicons name="clipboard-outline" size={14} color={Colors.secondary} />
                  <Text style={styles.pasteText}>클립보드에서 붙여넣기</Text>
                </Pressable>

                <Pressable
                  onPress={handleSave}
                  style={[styles.saveButton, !url.trim() && styles.saveButtonDisabled]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>저장</Text>
                  )}
                </Pressable>
              </View>
            )}
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
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.primary,
  },
  pasteButton: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  pasteText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#C8C8C8',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${Colors.success}22`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 5,
  },
});
