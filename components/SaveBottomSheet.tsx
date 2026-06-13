import { View, Text, TextInput, StyleSheet, Pressable, Modal, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { saveContent } from '@/lib/api';

type SaveBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function SaveBottomSheet({ visible, onClose }: SaveBottomSheetProps) {
  const [url, setUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!visible) {
      setUrl('');
      setSaved(false);
    }
  }, [visible]);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const domain = (() => { try { return new URL(trimmed).hostname; } catch { return undefined; } })();
      await saveContent({ url: trimmed, domain });
      setSaved(true);
      setTimeout(() => onClose(), 1600);
    } catch (e: any) {
      const msg = e.message?.includes('contents_user_url_unique')
        ? 'This URL is already saved.'
        : e.message;
      Alert.alert('Save Failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setUrl(text);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <Text style={styles.title}>Save to Nook</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={14} color={Colors.secondary} />
            </Pressable>
          </View>

          {saved ? (
            <View style={styles.successContainer}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={24} color={Colors.accent} />
              </View>
              <Text style={styles.successTitle}>Saved!</Text>
              <Text style={styles.successSubtitle}>Added to your Nook archive</Text>
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
                  onChangeText={setUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <Pressable
                style={({ pressed }) => [styles.pasteButton, pressed && { opacity: 0.7 }]}
                onPress={handlePaste}
              >
                <Ionicons name="clipboard-outline" size={14} color={Colors.secondary} />
                <Text style={styles.pasteText}>Paste from Clipboard</Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                style={[styles.saveButton, !url.trim() && styles.saveButtonDisabled]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </Pressable>
            </View>
          )}
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
    backgroundColor: '#FFF0F0',
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
  successSubtitle: {
    fontSize: 13,
    color: Colors.secondary,
  },
});
