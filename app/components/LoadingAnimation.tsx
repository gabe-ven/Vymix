import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { COLORS } from '../constants/colors';
import { Layout } from './Layout';

interface LoadingAnimationProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  mood?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  message = 'Loading...',
  size = 'medium',
  mood = 'chill'
}) => {
  // Animation values
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Typing text state
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [displayText, setDisplayText] = useState('');

  // Loading phrases based on mood
  const getLoadingPhrases = () => {
    const genericPhrases = [
      '🎵 Finding the perfect tracks...',
      '✨ Crafting your playlist...',
      '🎧 Analyzing your vibe...',
      '🌟 Discovering amazing music...',
      '🎶 Curating something special...',
      '💫 Mixing the right energy...',
      '🎼 Creating your soundtrack...',
      '🔥 Building the perfect flow...'
    ];

    return genericPhrases;
  };

  const loadingPhrases = getLoadingPhrases();

  useEffect(() => {
    // Typing text animation
    const typeText = () => {
      const phrase = loadingPhrases[currentPhrase];
      let index = 0;
      
      const typeInterval = setInterval(() => {
        if (index <= phrase.length) {
          setDisplayText(phrase.slice(0, index));
          index++;
        } else {
          clearInterval(typeInterval);
          // Wait before next phrase
          setTimeout(() => {
            setCurrentPhrase((prev) => (prev + 1) % loadingPhrases.length);
          }, 2000);
        }
      }, 100);
    };

    typeText();

    // Continuous rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Pulsing animation for the main circle
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    // Start animations
    rotateAnimation.start();
    pulseAnimation.start();

    return () => {
      rotateAnimation.stop();
      pulseAnimation.stop();
    };
  }, [currentPhrase]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 60, height: 60, borderRadius: 30 };
      case 'large':
        return { width: 120, height: 120, borderRadius: 60 };
      default:
        return { width: 100, height: 100, borderRadius: 50 };
    }
  };

  // Interpolate rotation
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Interpolate pulse scale for smooth sine wave effect
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.95, 1.1, 0.95],
  });

  return (
    <Layout>
      <View className="items-center justify-center flex-1">
        {/* Main animated circle */}
        <Animated.View
          style={[
            getSizeStyles(),
            {
              backgroundColor: COLORS.primary.lime,
              transform: [
                { rotate: spin },
                { scale: pulseScale }
              ],
            },
          ]}
          className="items-center justify-center"
        >
          <Animated.View 
            style={[
              getSizeStyles(),
              { 
                backgroundColor: COLORS.primary.darkPurple,
                position: 'absolute',
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
        </Animated.View>
        
        {/* Typing text */}
        <View 
          className="mt-8 px-4 py-2 rounded-lg"
          style={{
            minHeight: 50,
            justifyContent: 'center',
          }}
        >
          <Animated.Text 
            className="text-xl font-poppins text-center text-ui-white"
            style={{
              minHeight: 30,
            }}
          >
            {displayText}
            <Text className="text-ui-white">|</Text>
          </Animated.Text>
        </View>
      </View>
    </Layout>
  );
}; 