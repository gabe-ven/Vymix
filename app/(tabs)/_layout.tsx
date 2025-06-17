import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Platform, View, Text } from 'react-native';

type IconName = 'plus' | 'calendar' | 'user';

const TabIcon = ({ focused, icon, title }: { focused: boolean; icon: IconName; title: string }) => {
  if (focused) {
    return (
      <View className="flex flex-row w-full min-w-[130px] min-h-16 mt-4 justify-center items-center rounded-full bg-[#1DCD9F]/20 overflow-hidden">
        <FontAwesome name={icon} size={20} color="#1DCD9F" />
        <Text className="text-[#1DCD9F] text-base font-semibold ml-2">{title}</Text>
      </View>
    );
  }
  return (
    <View className="size-full justify-center items-center mt-4 rounded-full">
      <FontAwesome name={icon} size={20} color="#9CA3AF" />
    </View>
  );
};

export default function TabLayout() {
  return (
    <View className="flex-1 bg-darkPurple">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarItemStyle: {
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          },
          tabBarStyle: {
            backgroundColor: '#1a1a1a',
            borderRadius: 50,
            marginHorizontal: 27,
            marginBottom: 36,
            height: 52,
            position: 'absolute',
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#1a1a1a',
          },
        }}
      >
        <Tabs.Screen
          name="create/index"
          options={{
            title: 'Create',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="plus" title="Create" />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="calendar" title="History" />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="user" title="Profile" />
            ),
          }}
        />
        <Tabs.Screen
          name="create/emoji"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="create/playlist"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}
