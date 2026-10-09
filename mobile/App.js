import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LeadsScreen from './src/screens/LeadsScreen';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <LeadsScreen />
    </View>
  );
}
