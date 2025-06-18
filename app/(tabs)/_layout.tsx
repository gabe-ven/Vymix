import React, { ReactElement } from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

type IconName = 'plus' | 'user' | 'playlist';

const GradientMask = ({ 
  children, 
  width, 
  height 
}: { 
  children: ReactElement; 
  width?: number; 
  height?: number;
}) => (
  <View style={{ width, height }}>
    <MaskedView
      style={{ width: '100%', height: '100%' }}
      maskElement={children}
    >
      <LinearGradient
        colors={['#FF8C00', '#FFD700']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: '100%', height: '100%' }}
      >
        <View style={{ opacity: 0 }}>{children}</View>
      </LinearGradient>
    </MaskedView>
  </View>
);

const TabIcon = ({ focused, icon, title }: { focused: boolean; icon: IconName; title: string }) => {
  const getIcon = () => {
    const iconProps = { size: focused ? 28 : 24, color: focused ? '#FF8C00' : '#686a73' };
    
    switch (icon) {
      case 'plus':
        return <Feather name="plus-circle" {...iconProps} />;
      case 'playlist':
        return <Ionicons name="list" {...iconProps} />;
      case 'user':
        return <MaterialIcons name="person-outline" {...iconProps} />;
      default:
        return <Feather name="plus-circle" {...iconProps} />;
    }
  };

  const iconElement = getIcon();
  const textElement = (
    <Text className={`text-sm md:text-base font-semibold text-black h-6 text-center leading-6 font-poppins-bold ${focused ? 'text-base md:text-lg' : ''}`}>
      {title}
    </Text>
  );

  return (
    <View className={`flex flex-col w-full min-w-[100px] md:min-w-[130px] min-h-16 mt-8 justify-center items-center rounded-full overflow-hidden ${focused ? 'scale-110' : ''}`}>
      <View className="w-6 h-6 justify-center items-center">
        {focused ? (
          <GradientMask width={28} height={28}>
            {iconElement}
          </GradientMask>
        ) : (
          <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
            {iconElement}
          </View>
        )}
      </View>
      <View className={`h-6 justify-center items-center ${focused ? 'mt-2' : 'mt-1'}`}>
        {focused ? (
          <GradientMask height={28}>
            {textElement}
          </GradientMask>
        ) : (
          <View className="h-6 justify-center items-center">
            <Text className="text-sm md:text-base font-semibold text-[#686a73] h-6 text-center leading-6 font-poppins">
              {title}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default function TabLayout() {
  return (
    <View className="flex-1 bg-[darkPurple] shadow-lg">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarItemStyle: {
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 8,
          },
          tabBarStyle: {
            backgroundColor: '#151623',
            borderRadius: 50,
            marginHorizontal: 8,
            marginBottom: 20,
            height: 75,
            position: 'absolute',
            borderWidth: 1,
            borderColor: '#151623',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.5,
            shadowRadius: 15,
            elevation: 15,
          },
        }}
      >
        <Tabs.Screen
          name="create"
          options={{
            title: 'Create',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="plus" title="Create" />
            ),
          }}
        />
        <Tabs.Screen
          name="mixes"
          options={{
            title: 'Your Mixes',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="playlist" title="Your Mixes" />
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
      </Tabs>
    </View>
  );
}
