import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
interface EmojiSelectionProps {
  onNext: (selectedEmojis: string[]) => void;
  maxSelection?: number;
}

const EmojiSelection: React.FC<EmojiSelectionProps> = ({ 
  onNext, 
  maxSelection = 3 
}) => {
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);

  const moodEmojis = [
    '😄', '😆', '🤩', '🥳', '😎', '✨',
    '😌', '🌿', '🌊', '🧘', '☁️', '🌅',
    '🥰', '😘', '💖', 
    '😔', '😞', '🌧️', '🖤', '🫥',
    '😠', '😤', '💢', '🌩️', '🔥', '👿',
    '😵', '😶‍🌫️', '🤯', '🤔',
  ];

  const toggleEmoji = (emoji: string) => {
    try {
      setSelectedEmojis(prev => {
        if (prev.includes(emoji)) {
          return prev.filter(e => e !== emoji);
        } else {
          if (prev.length < maxSelection) {
            return [...prev, emoji];
          }
          return prev; 
        }
      });
    } catch (error) {
      console.error('Error toggling emoji:', error);
    }
  };

  const handleNext = () => {
    try {
      onNext(selectedEmojis);
    } catch (error) {
      console.error('Error in handleNext:', error);
    }
  };

  const handleSkip = () => {
    try {
      onNext([]);
    } catch (error) {
      console.error('Error in handleSkip:', error);
    }
  };

  return (
    <View className="flex-1 pt-20 px-4 pb-20">
      <Text className="text-white text-2xl font-poppins-bold mb-4 text-center">
        Select up to {maxSelection} emojis
      </Text>
      
      {/* Emoji grid */}
      <View>
        <View className="flex-row flex-wrap justify-center">
          {moodEmojis.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => toggleEmoji(emoji)}
              className={`w-16 h-16 m-2 rounded-lg items-center justify-center ${
                selectedEmojis.includes(emoji) 
                  ? 'bg-white/20 border-2 border-white' 
                  : 'bg-white/10'
              }`}
            >
              <Text className="text-3xl">{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="items-center mt-6">
        {selectedEmojis.length > 0 ? (
          <TouchableOpacity
            onPress={handleNext}
            className="bg-darkBlue rounded-full w-24 h-16 items-center justify-center"
          >
            <Ionicons name="arrow-forward" size={28} color="#FFFFFF" />
            </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSkip}
            className="rounded-full px-6 py-3"
          >
            <Text className="text-gray-400 text-xl font-poppins-bold">Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default EmojiSelection;
