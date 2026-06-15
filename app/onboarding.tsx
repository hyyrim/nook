import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
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
        {/* Top spacer */}
        <View style={styles.topSpacer} />

        {/* Logo & Slogan */}
        <View style={styles.brandSection}>
          <Text style={styles.logo}>Nook</Text>
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
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
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
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.caption}>
            By continuing, you agree to our{' '}
            <Text style={styles.captionLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.captionLink}>Privacy Policy</Text>
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
  topSpacer: {
    flex: 1,
  },
  brandSection: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1.5,
  },
  slogan: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.secondary,
    letterSpacing: 0.3,
  },
  sloganAccent: {
    color: Colors.accent,
    fontWeight: '600',
  },
  bottomSection: {
    flex: 1,
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
