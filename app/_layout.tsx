import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useShareIntent } from 'expo-share-intent';
import { AuthProvider, useAuth } from '@/lib/AuthProvider';
import { saveContent } from '@/lib/api';
import { emit } from '@/lib/events';
import { Colors } from '@/constants';

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const savingRef = useRef(false);

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
    const title = shareIntent?.meta?.title ?? undefined;
    const thumbnail_url =
      shareIntent?.meta?.['og:image'] ??
      shareIntent?.meta?.['twitter:image'] ??
      shareIntent?.meta?.image ??
      undefined;
    const domain = (() => { try { return new URL(url).hostname; } catch { return undefined; } })();

    saveContent({ url, title, thumbnail_url, domain })
      .then(() => {
        emit('content-saved');
        Alert.alert('Saved!', 'Added to your Nook archive');
      })
      .catch((e: any) => {
        const msg = e.message?.includes('contents_user_url_unique')
          ? 'This URL is already saved.'
          : e.message;
        Alert.alert('Save Failed', msg);
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
    <>
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
          name="onboarding"
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="choose-interests"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
    </>
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
