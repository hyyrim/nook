import { Tabs, Slot, usePathname, useRouter } from 'expo-router';
import { View, StyleSheet, Pressable, Text, Image } from 'react-native';
import { Colors, Radius } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { SaveBottomSheet } from '@/components/SaveBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsDesktopWeb } from '@/lib/useIsDesktopWeb';

// 데스크탑 웹은 하단 탭바 대신 좌측 사이드바 셸. 판별은 useIsDesktopWeb(단일 소스).
const SIDEBAR_WIDTH = 240;

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

function TabBarIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return <Ionicons name={name} size={24} color={focused ? Colors.primary : Colors.tertiary} />;
}

function FabButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.fabContainer}>
      <View style={styles.fab}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

// ─── 데스크탑 사이드바 셸 ───────────────────────────────
function DesktopShell() {
  const router = useRouter();
  const pathname = usePathname();
  const [showSave, setShowSave] = useState(false);

  const isActive = (href: NavItem['href']) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <View style={styles.desktopRoot}>
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
      </View>
      <View style={styles.main}>
        <Slot />
      </View>
      <SaveBottomSheet visible={showSave} onClose={() => setShowSave(false)} />
    </View>
  );
}

export default function TabLayout() {
  const isDesktop = useIsDesktopWeb();
  const [showSave, setShowSave] = useState(false);
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom - 2, 12);

  if (isDesktop) return <DesktopShell />;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              height: 56 + bottomInset,
              paddingBottom: bottomInset,
            },
          ],
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.tertiary,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '홈',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: '폴더',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name={focused ? 'folder' : 'folder-outline'} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="fab"
          options={{
            title: '',
            tabBarButton: () => <FabButton onPress={() => setShowSave(true)} />,
          }}
          listeners={{ tabPress: (e) => e.preventDefault() }}
        />
        <Tabs.Screen
          name="report"
          options={{
            title: '리포트',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name={focused ? 'document-text' : 'document-text-outline'} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '프로필',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
            ),
          }}
        />
      </Tabs>
      <SaveBottomSheet visible={showSave} onClose={() => setShowSave(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  // 데스크탑 셸
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background,
  },
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
  main: {
    flex: 1,
    minWidth: 0,
  },
  // 모바일 탭바 (기존)
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: 'rgba(0,0,0,0.09)',
    borderTopWidth: 0.5,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    transform: [{ translateY: -18 }],
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 7,
  },
});
