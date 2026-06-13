import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useShareIntent } from 'expo-share-intent';
import { AuthProvider, useAuth } from '@/lib/AuthProvider';
import { saveContent } from '@/lib/api';
import { emit } from '@/lib/events';
import { Toast } from '@/components/Toast';
import { Colors } from '@/constants';

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const savingRef = useRef(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false, message: '', type: 'success',
  });

  // Auth 라우팅 가드
  useEffect(() => {
    if (isLoading) return;

    const inAuthFlow = segments[0] === 'onboarding' || segments[0] === 'choose-interests';

    if (!session && !inAuthFlow) {
      router.replace('/onboarding');
    } else if (session && inAuthFlow) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments]);

  // Share Intent 처리: 공유된 URL 자동 저장
  useEffect(() => {
    if (!hasShareIntent || !session || savingRef.current) return;

    const url = shareIntent?.webUrl || shareIntent?.text;
    if (!url) {
      resetShareIntent();
      return;
    }

    savingRef.current = true;

    // share intent meta는 불완전할 수 있으므로, fetchLinkMetadata에 위임
    saveContent({ url })
      .then(() => {
        emit('content-saved');
        setToast({ visible: true, message: 'Saved to Nook!', type: 'success' });
      })
      .catch((e: any) => {
        const msg = e.message?.includes('contents_user_url_unique')
          ? 'Already saved'
          : 'Save failed';
        setToast({ visible: true, message: msg, type: 'error' });
      })
      .finally(() => {
        savingRef.current = false;
        resetShareIntent();
      });
  }, [hasShareIntent, session]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={Colors.tertiary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="content/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="category/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="recent-saved"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="choose-interests"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
