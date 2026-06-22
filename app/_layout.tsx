import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useShareIntent } from 'expo-share-intent';
import { AuthProvider, useAuth } from '@/lib/AuthProvider';
import { getCategories, isDuplicateContentUrlError, saveContent } from '@/lib/api';
import { emit } from '@/lib/events';
import { onAppActive, onAppBackground } from '@/lib/analytics';
import { Toast } from '@/components/Toast';
import { Colors } from '@/constants';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

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
      // 카테고리 존재 여부 확인 후 분기
      getCategories()
        .then((categories) => {
          if (categories.length > 0) {
            router.replace('/(tabs)');
          } else if (segments[0] !== 'choose-interests') {
            router.replace('/choose-interests');
          }
        })
        .catch(() => {
          // 카테고리 조회 실패 시 choose-interests로 이동
          if (segments[0] !== 'choose-interests') {
            router.replace('/choose-interests');
          }
        });
    }
  }, [session, isLoading, segments]);

  // 세션 활성 + AppState 변화 → app_opened 발화 (analytics §12.2)
  // onAppActive 내부에서 30초 background 룰로 dedup하므로 중복 호출 안전.
  useEffect(() => {
    if (!session) return;

    const detectSource = () => (hasShareIntent ? 'share_sheet' : 'direct');
    onAppActive(detectSource());

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') onAppActive(detectSource());
      else if (status === 'background') onAppBackground();
    });

    return () => subscription.remove();
  }, [session, hasShareIntent]);

  // Share Intent 처리: 공유된 URL 자동 저장
  useEffect(() => {
    if (!hasShareIntent || !session || savingRef.current) return;

    // §040: Threads 등 일부 플랫폼은 서버 사이드 OG로 본문 캡션을 노출하지 않는다.
    // meta.title 등 share intent 페이로드에 본문이 들어오는지 실기기 진단용.
    if (__DEV__) {
      console.log('[ShareIntent payload]', JSON.stringify(shareIntent, null, 2));
    }

    const url = shareIntent?.webUrl || shareIntent?.text;
    if (!url) {
      resetShareIntent();
      return;
    }

    savingRef.current = true;

    // share intent meta는 불완전할 수 있으므로, fetchLinkMetadata에 위임
    saveContent({ url }, { entry_source: 'share_sheet' })
      .then(() => {
        emit('content-saved');
        setToast({ visible: true, message: '저장 완료!', type: 'success' });
      })
      .catch((e: unknown) => {
        const msg = isDuplicateContentUrlError(e)
          ? '이미 저장된 링크예요'
          : '저장에 실패했어요';
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
          name="search"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="account-settings"
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
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
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
