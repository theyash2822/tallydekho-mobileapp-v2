import React, { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from './src/store/authStore';
import RootNavigator from './src/navigation/RootNavigator';
import type { RootStackParamList } from './src/types';

// Disable system font scaling globally
const TextAny = Text as any;
const TextInputAny = TextInput as any;
if (!TextAny.defaultProps) TextAny.defaultProps = {};
TextAny.defaultProps.allowFontScaling = false;
if (!TextInputAny.defaultProps) TextInputAny.defaultProps = {};
TextInputAny.defaultProps.allowFontScaling = false;

export default function App() {
  const { hydrate, isAuthenticated, isNewUser } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Splash');

  useEffect(() => {
    const init = async () => {
      await hydrate();
      const store = useAuthStore.getState();
      if (store.isAuthenticated && !store.isNewUser) {
        setInitialRoute('MainTabs');
      } else if (store.isAuthenticated && store.isNewUser) {
        setInitialRoute('GetStarted');
      } else {
        setInitialRoute('Login');
      }
      setReady(true);
    };
    init();
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator initialRoute={initialRoute} />
        </NavigationContainer>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
