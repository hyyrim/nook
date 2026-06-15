import { Tabs } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { SaveBottomSheet } from '@/components/SaveBottomSheet';

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

export default function TabLayout() {
  const [showSave, setShowSave] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
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
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: 'rgba(0,0,0,0.09)',
    borderTopWidth: 0.5,
    height: 84,
    paddingBottom: 20,
    paddingTop: 8,
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
