import { View, Text } from 'react-native'
import { Layout } from '@/app/components/Layout';
import React from 'react'

const playlist = () => {
  return (
    <Layout>
      <View className="flex-1 justify-center items-center">
        <Text className="text-white font-poppins">playlist</Text>
      </View>
    </Layout>
  )
}

export default playlist