import { View, StyleSheet, Pressable, Text, Image } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants';
import { SaveBottomSheet } from '@/components/SaveBottomSheet';

export const SIDEBAR_WIDTH = 240;

type NavItem = {
  href: '/' | '/library' | '/report' | '/profile';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

const NAV: NavItem[] = [
  { href: '/', label: '홈', icon: 'home-outline', activeIcon: 'home' },
  { href: '/library', label: '폴더', icon: 'folder-outline', activeIcon: 'folder' },
  { href: '/report', label: '리포트', icon: 'document-text-outline', activeIcon: 'document-text' },
  { href: '/profile', label: '프로필', icon: 'person-outline', activeIcon: 'person' },
];

// 데스크탑 전역 사이드바. root 레이아웃에서 Stack 옆에 상시 렌더돼 모든 화면
// (상세·카테고리 포함)에서 유지된다.
export function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [showSave, setShowSave] = useState(false);

  const isActive = (href: NavItem['href']) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <View style={styles.sidebar}>
      <Image source={require('@/assets/logo.png')} style={styles.brandLogo} resizeMode="contain" />
      <View style={styles.navList}>
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href)}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navItemActive,
                pressed && !active && { backgroundColor: Colors.pressOverlay },
              ]}
            >
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={20}
                color={active ? Colors.primary : Colors.secondary}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={() => setShowSave(true)}
        style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="add" size={19} color="#FFFFFF" />
        <Text style={styles.saveBtnText}>저장</Text>
      </Pressable>
      <SaveBottomSheet visible={showSave} onClose={() => setShowSave(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.surface,
    borderRightWidth: 0.5,
    borderRightColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 20,
  },
  brandLogo: {
    width: 112,
    height: 37,
    marginLeft: 4,
    marginBottom: 28,
  },
  navList: {
    gap: 4,
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRadius: Radius.md,
  },
  navItemActive: {
    backgroundColor: Colors.background,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.secondary,
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
