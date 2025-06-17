import React, { ReactElement } from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

type IconName = 'plus' | 'calendar' | 'user';

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
    const iconProps = { size: 24, color: focused ? '#FF8C00' : '#686a73' };
    
    switch (icon) {
      case 'plus':
        return <Feather name="plus-circle" {...iconProps} />;
      case 'calendar':
        return <Ionicons name="time-outline" {...iconProps} />;
      case 'user':
        return <MaterialIcons name="person-outline" {...iconProps} />;
      default:
        return <Feather name="plus-circle" {...iconProps} />; // Fallback icon
    }
  };

  const iconElement = getIcon();
  const textElement = (
    <Text style={{ fontSize: 16, fontWeight: '600', color: 'black' }}>
      {title}
    </Text>
  );

  return (
    <View className="flex flex-col w-full min-w-[130px] min-h-16 mt-8 justify-center items-center rounded-full overflow-hidden">
      <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
        {focused ? (
          <GradientMask width={24} height={24}>
            {iconElement}
          </GradientMask>
        ) : (
          iconElement
        )}
      </View>
      <View style={{ height: 24, justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
        {focused ? (
          <GradientMask height={24}>
            {textElement}
          </GradientMask>
        ) : (
          <Text 
            style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: '#686a73',
            }}
          >
            {title}
          </Text>
        )}
      </View>
    </View>
  );
};

export default function TabLayout() {
  return (
    <View className="flex-1 bg-[darkPurple]">
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
            backgroundColor: '#151623',
            borderRadius: 50,
            marginHorizontal: 10,
            marginBottom: 20,
            height: 65,
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
