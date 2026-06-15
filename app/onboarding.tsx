import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Colors } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useGoogleAuth, signInWithApple } from '@/lib/auth';

export default function OnboardingScreen() {
  const { signInWithGoogle, isReady } = useGoogleAuth();
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading('google');
    const result = await signInWithGoogle();
    setLoading(null);

    if (result.error) {
      Alert.alert('Sign In Failed', result.error);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading('apple');
    const result = await signInWithApple();
    setLoading(null);

    if (result.error) {
      Alert.alert('Sign In Failed', result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Brand section — 소셜 로그인 버튼 위 영역의 정중앙 */}
        <View style={styles.brandSection}>
          <Image source={require('@/assets/icon.png')} style={styles.appIcon} resizeMode="contain" />
          <Text style={styles.sloganAccent}>every nook and cranny!</Text>
        </View>

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          <Pressable
            onPress={handleAppleSignIn}
            disabled={loading !== null}
            style={({ pressed }) => [
              styles.appleButton,
              pressed && styles.appleButtonPressed,
            ]}
          >
            {loading === 'apple' ? (
              <ActivityIndicator size="small" color={Colors.surface} />
            ) : (
              <>
                <Ionicons name="logo-apple" size={20} color={Colors.surface} />
                <Text style={styles.appleButtonText}>Apple로 계속하기</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={handleGoogleSignIn}
            disabled={loading !== null}
            style={({ pressed }) => [
              styles.googleButton,
              pressed && styles.googleButtonPressed,
            ]}
          >
            {loading === 'google' ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color={Colors.primary} />
                <Text style={styles.googleButtonText}>Google로 계속하기</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.caption}>
            계속하면{' '}
            <Text style={styles.captionLink} onPress={() => Linking.openURL('https://nookarchive.notion.site/Nook-3800026abaeb80588420ca47be19d904')}>서비스 이용약관</Text>
            {' '}및{' '}
            <Text style={styles.captionLink} onPress={() => Linking.openURL('https://nookarchive.notion.site/Nook-3800026abaeb808e9547d64c065bae52')}>개인정보 처리방침</Text>
            에 동의하게 됩니다.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appIcon: {
    height: 230,
    width: 230,
    borderRadius: 46,
  },
  sloganAccent: {
    fontSize: 17,
    color: Colors.accent,
    fontWeight: '700',
  },
  bottomSection: {
    justifyContent: 'flex-end',
    paddingBottom: 20,
    gap: 16,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
  },
  appleButtonPressed: {
    opacity: 0.85,
  },
  appleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.surface,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 15,
  },
  googleButtonPressed: {
    backgroundColor: Colors.background,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  caption: {
    fontSize: 11.5,
    color: Colors.tertiary,
    textAlign: 'center',
    lineHeight: 17,
  },
  captionLink: {
    color: Colors.secondary,
    textDecorationLine: 'underline',
  },
});
