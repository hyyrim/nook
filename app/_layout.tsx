import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useShareIntent } from 'expo-share-intent';
import { AuthProvider, useAuth } from '@/lib/AuthProvider';
import { getCategories, isDuplicateContentUrlError, saveContent } from '@/lib/api';
import { emit } from '@/lib/events';
import { onAppActive, onAppBackground } from '@/lib/analytics';
import { ToastProvider, useToast } from '@/lib/toast';
import { Colors } from '@/constants';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const savingRef = useRef(false);
  const toast = useToast();

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
    toast.show('저장 중...', 'loading', { duration: null });

    // Safari 공유 시 share extension이 페이지 head meta(클라이언트 렌더 후)를 전달한다.
    // 일부 플랫폼(Threads 등)은 SSR에 누락된 정보가 여기에 들어있어 saveContent에 위임.
    saveContent(
      { url },
      {
        entry_source: 'share_sheet',
        shareIntentMeta: shareIntent?.meta ?? null,
      },
    )
      .then(() => {
        emit('content-saved');
        toast.show('저장 완료!', 'success');
      })
      .catch((e: unknown) => {
        const msg = isDuplicateContentUrlError(e)
          ? '이미 저장된 링크예요'
          : '저장에 실패했어요';
        toast.show(msg, 'error');
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
        <ToastProvider>
          <RootNavigator />
        </ToastProvider>
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
