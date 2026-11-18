import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/context/auth-context';
import SplashScreenView from './splash';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated, login } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    SplashScreen.hideAsync();

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showSplash || isAuthenticated) return;

    const solicitarBiometriaInicial = async () => {
      try {
        const pinGuardado = await SecureStore.getItemAsync('user_pin');
        const biometriaAtivada = await SecureStore.getItemAsync('use_biometrics');
        const temHardware = await LocalAuthentication.hasHardwareAsync();
        const temBiometriaCadastrada = await LocalAuthentication.isEnrolledAsync();

        if (pinGuardado && biometriaAtivada === 'true' && temHardware && temBiometriaCadastrada) {
          const resultado = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Desbloquear Cofre Clínico',
            fallbackLabel: 'Usar PIN',
            cancelLabel: 'Cancelar',
          });

          if (resultado.success) {
            login();
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    solicitarBiometriaInicial();
  }, [showSplash]);

  useEffect(() => {
    if (showSplash) return;

    const inAuthGroup =
      segments[0] === 'login' ||
      segments[0] === 'cadastro' ||
      segments[0] === 'login-cadastro';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login-cadastro');
    } else if (isAuthenticated && segments[0] !== '(tabs)') {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, showSplash]);

  if (showSplash) {
    return <SplashScreenView />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login-cadastro" />
      <Stack.Screen name="login" />
      <Stack.Screen name="cadastro" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <RootStack />
      </ThemeProvider>
    </AuthProvider>
  );
}