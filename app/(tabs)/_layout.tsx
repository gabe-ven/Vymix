import React, { ReactElement } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, ImageBackground } from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Glass } from '../components/Glass';
import { COLORS } from '../constants/colors';

type IconName =
  | 'plus'
  | 'user'
  | 'playlist'
  | 'library'
  | 'musical-notes'
  | 'person';

const GradientMask = ({
  children,
  width,
  height,
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
        colors={COLORS.gradients.wave}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: '100%', height: '100%' }}
      >
        <View style={{ opacity: 0 }}>{children}</View>
      </LinearGradient>
    </MaskedView>
  </View>
);

const TabIcon = ({
  focused,
  icon,
  title,
}: {
  focused: boolean;
  icon: IconName;
  title: string;
}) => {
  const getIcon = () => {
    const iconProps = {
      size: focused ? 28 : 24,
      color: focused ? COLORS.states.focused : COLORS.states.inactive,
    };

    switch (icon) {
      case 'plus':
        return <Feather name="plus-circle" {...iconProps} />;
      case 'musical-notes':
        return <Ionicons name="musical-notes" {...iconProps} />;
      case 'playlist':
        return <Ionicons name="list" {...iconProps} />;
      case 'library':
        return <Ionicons name="library" {...iconProps} />;
      case 'person':
        return <Ionicons name="person" {...iconProps} />;
      case 'user':
        return <MaterialIcons name="person-outline" {...iconProps} />;
      default:
        return <Feather name="plus-circle" {...iconProps} />;
    }
  };

  const iconElement = getIcon();
  const textElement = (
    <Text
      className={`text-sm md:text-base font-semibold text-black h-6 text-center leading-6 font-poppins-bold ${focused ? 'text-base md:text-lg' : ''}`}
    >
      {title}
    </Text>
  );

  return (
    <View
      className={`flex flex-col w-full min-w-[100px] md:min-w-[130px] min-h-16 mt-8 justify-center items-center rounded-full overflow-hidden ${focused ? 'scale-110' : ''}`}
    >
      <View className="w-6 h-6 justify-center items-center">
        <View
          style={{
            width: focused ? 28 : 24,
            height: focused ? 28 : 24,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {iconElement}
        </View>
      </View>
      <View
        className={`h-6 justify-center items-center ${focused ? 'mt-2' : 'mt-1'}`}
      >
        <View className="h-6 justify-center items-center">
          <Text
            className="text-sm md:text-base font-semibold h-6 text-center leading-6 font-poppins"
            style={{
              color: focused ? COLORS.states.focused : COLORS.states.inactive,
            }}
          >
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function TabLayout() {
  return (
    <View className="flex-1">
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
            borderRadius: 50,
            marginHorizontal: 8,
            marginBottom: 20,
            height: 75,
            position: 'absolute',
            borderWidth: 1,
            borderColor: COLORS.transparent.white[10],
            shadowColor: COLORS.ui.black,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 5,
            overflow: 'hidden',
          },
          tabBarBackground: () => (
            <Glass style={{ flex: 1, borderRadius: 50 }} blurAmount={10}>
              <View style={{ flex: 1 }} />
            </Glass>
          ),
        }}
      >
        <Tabs.Screen
          name="create"
          options={{
            title: 'Create',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="musical-notes" title="Create" />
            ),
          }}
        />
        <Tabs.Screen
          name="mixes"
          options={{
            title: 'Your Mixes',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="library" title="Your Mixes" />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="person" title="Profile" />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
