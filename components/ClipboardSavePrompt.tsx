import { Animated, View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useEffect, useRef } from 'react';
import { Colors, Radius } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/components/PrimaryButton';

type Props = {
  visible: boolean;
  url: string;
  saving: boolean;
  onSave: () => void;
  onDismiss: () => void;
};

function truncateUrl(url: string, max = 60): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function ClipboardSavePrompt({ visible, url, saving, onSave, onDismiss }: Props) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(260)).current;

  useEffect(() => {
    if (visible) {
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
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 260,
          duration: 190,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropOpacity, sheetTranslateY]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View
        pointerEvents="none"
        style={[styles.dim, { opacity: backdropOpacity }]}
      />
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          style={[styles.sheetContainer, { transform: [{ translateY: sheetTranslateY }] }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />

            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Ionicons name="link-outline" size={16} color={Colors.secondary} />
              </View>
              <Text style={styles.title}>클립보드에 링크가 있어요</Text>
            </View>

            <View style={styles.urlCard}>
              <Text style={styles.domain}>{extractDomain(url)}</Text>
              <Text style={styles.url} numberOfLines={2}>{truncateUrl(url, 120)}</Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={onDismiss}
                style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.7 }]}
                disabled={saving}
              >
                <Text style={styles.cancelText}>지금은 아니에요</Text>
              </Pressable>
              <PrimaryButton
                label="저장"
                onPress={onSave}
                loading={saving}
                style={styles.saveButton}
              />
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
    paddingTop: 12,
    paddingBottom: 30,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: '#DCDCDC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  urlCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 4,
  },
  domain: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
  },
  url: {
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary,
  },
  saveButton: {
    flex: 1,
  },
});
