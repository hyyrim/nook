import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radius } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { NavHeader } from '@/components/NavHeader';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import { deleteAccount } from '@/lib/api';

function SettingRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed && { backgroundColor: 'rgba(0,0,0,0.02)' }]}
    >
      <View style={styles.iconBubble}>
        <Ionicons name={icon} size={16} color={Colors.secondary} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={Colors.tertiary} />
    </Pressable>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const email = session?.user?.email ?? '';
  const provider = session?.user?.app_metadata?.provider;
  const providerLabel = provider === 'apple' ? 'Apple' : provider === 'google' ? 'Google' : '이메일';

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃', style: 'destructive',
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '계정을 삭제할까요?',
      '저장한 콘텐츠와 카테고리가 모두 삭제돼요. 이 작업은 되돌릴 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제하기', style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              await supabase.auth.signOut();
            } catch (e: any) {
              Alert.alert('오류', e.message || '계정 삭제에 실패했습니다.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrap}>
        <NavHeader title="계정 설정" backLabel="프로필" onBack={() => router.back()} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.content}>
          {/* Account info */}
          <View>
            <SectionLabel text="계정 정보" />
            <View style={styles.settingsCard}>
              <View style={styles.infoRow}>
                <View style={styles.iconBubble}>
                  <Ionicons name="mail-outline" size={16} color={Colors.secondary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>이메일</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{email}</Text>
                </View>
              </View>
              <Divider />
              <View style={styles.infoRow}>
                <View style={styles.iconBubble}>
                  <Ionicons name={provider === 'apple' ? 'logo-apple' : 'logo-google'} size={16} color={Colors.secondary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>로그인 방식</Text>
                  <Text style={styles.infoValue}>{providerLabel}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Account actions */}
          <View>
            <SectionLabel text="계정" />
            <View style={styles.settingsCard}>
              <SettingRow icon="log-out-outline" label="로그아웃" onPress={handleLogout} />
            </View>
          </View>
        </View>

        {/* Delete account - low emphasis footer */}
        <Pressable onPress={handleDeleteAccount} style={styles.deleteButton} hitSlop={8}>
          <Text style={styles.deleteText}>계정 삭제하기</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerWrap: {
    marginBottom: 16,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.tertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 4,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
    borderRadius: 8,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
    color: Colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.tertiary,
  },
  infoValue: {
    fontSize: 14.5,
    fontWeight: '500',
    color: Colors.primary,
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  deleteText: {
    fontSize: 13,
    color: Colors.tertiary,
    fontWeight: '400',
  },
});
