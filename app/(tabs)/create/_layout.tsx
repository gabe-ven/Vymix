import { Stack } from 'expo-router';
import { View } from 'react-native';
import { ProgressBar } from '@/app/components/ProgressBar';
import { usePathname } from 'expo-router';
import { useEffect, useState } from 'react';

export default function CreateLayout() {
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (pathname.includes('/create/emoji')) {
      setCurrentStep(2);
    } else if (pathname.includes('/create/amount')) {
      setCurrentStep(3);
    } else if (pathname.includes('/create/playlist')) {
      setCurrentStep(4);
    } else {
      setCurrentStep(1);
    }
  }, [pathname]);

  return (
    <View className="flex-1">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="emoji" />
        <Stack.Screen name="amount" />
        <Stack.Screen name="playlist" />
      </Stack>

      {/* Hide progress bar on playlist page (step 4) */}
      {currentStep < 4 && (
        <View className="absolute bottom-24 left-0 right-0 z-50">
          <ProgressBar currentStep={currentStep} />
        </View>
      )}
    </View>
  );
}
