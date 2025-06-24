import React, { useEffect, useRef, useState } from 'react';
import {
  TextInput,
  View,
  Text,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientMask } from './GradientMask';


interface VibeInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onKeyPress?: (event: any) => void;
  onNext?: () => void;
}

const examples = [
  'Chill but Optimistic',
  'Happy and Excited',
  'Hype and Energetic',
  'Creative and Inspired',
  'Focused and Determined',
  'Playful and Carefree',
  'Adventurous and Curious',
  'Cozy and Content',
  'Peaceful and Serene',
  'Reflective and Thoughtful',
  'Passionate and Intense',
  'Whimsical and Magical',
  'Zen and Balanced',
  'Nostalgic and Bittersweet',
  'Euphoric and Free',
  'Relaxed and Mellow',
  'Productive and Motivated',
  'Confident and Strong',
  'Calm and Collected',
  'Energetic and Pumped',
  'Lazy and Comfy',
  'Festive and Celebratory',
  'Cozy and Warm',
  'Dynamic and Vibrant'
];

export const VibeInput: React.FC<VibeInputProps> = ({
  value,
  onChangeText,
  placeholder = "I'm feeling...",
  onKeyPress,
  onNext,
}) => {
  const [index, setIndex] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const { width: screenWidth } = Dimensions.get('window');

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out and slide up
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Update text and reset position
        translateY.setValue(20);
        opacity.setValue(0);
        
        // Use requestAnimationFrame to defer state update
        requestAnimationFrame(() => {
          setIndex((prev) => (prev + 1) % examples.length);
        });

        // Fade in and slide up
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [opacity, translateY]);

  const handleKeyPress = (event: any) => {
    if (event.nativeEvent.key === 'Enter' && value.trim() && onNext) {
      event.preventDefault();
      onNext();
      return;
    }
    if (onKeyPress) {
      onKeyPress(event);
    }
  };

  const handleNext = () => {
    if (value.trim() && onNext) {
      onNext();
    }
  };

  return (
    <View className="w-full h-full p-4 flex items-center justify-center">
      <Text className="text-4xl md:text-5xl font-bold text-white mb-6 text-center px-4 font-poppins-bold">
        What's your vibe?
      </Text>

      <Animated.View
        className="w-full items-center mb-3 px-4"
        style={{
          transform: [{ translateY }],
          opacity,
        }}
      >
        <View className="flex-row items-center justify-center">
          <GradientMask width={Math.min(screenWidth - 32, 350)} height={30}>
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Text className="text-lg md:text-xl font-bold text-black text-center font-poppins-bold" style={{ fontSize: 19 }}>
                {examples[index]}
              </Text>
            </View>
          </GradientMask>
        </View>
      </Animated.View>

      <TextInput
        className="bg-[#151623] rounded-2xl p-4 md:p-6 text-lg md:text-2xl text-white min-h-[80px] w-full text-left mx-4 font-poppins"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#686a73"
        multiline
        maxLength={280}
        selectionColor="#FF8C00"
        style={{ fontSize: 20, lineHeight: 28 }}
        onKeyPress={handleKeyPress}
        onSubmitEditing={() => {
          if (value.trim() && onNext) {
            onNext();
          }
        }}
        blurOnSubmit={true}
      />

      <View className="h-20 mt-6">
        {value.trim() && (
          <TouchableOpacity
            onPress={handleNext}
            className="bg-darkBlue rounded-full w-24 h-16 items-center justify-center"
          >
            <Ionicons name="arrow-forward" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
