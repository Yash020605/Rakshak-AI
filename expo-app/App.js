import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { connectSocket, disconnectSocket, getSocket } from './src/services/socketService';
import { getProfile } from './src/services/storageService';

import HomeScreen    from './src/screens/HomeScreen';
import SendingScreen from './src/screens/SendingScreen';
import MapScreen     from './src/screens/MapScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    connectSocket();
    getProfile().then(profile => {
      if (profile?.userId) getSocket().emit('join-user-channel', profile.userId);
    });
    return () => disconnectSocket();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Home"    component={HomeScreen} />
        <Stack.Screen name="Sending" component={SendingScreen} />
        <Stack.Screen name="Map"     component={MapScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
