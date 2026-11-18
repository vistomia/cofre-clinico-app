import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [registro, setRegistro] = useState('');
  const [pin, setPin] = useState('');

  const handleEntrarComPin = async () => {
    if (!registro.trim() || !pin.trim()) {
      Alert.alert('Campos Obrigatórios', 'Preencha o registro profissional e o PIN.');
      return;
    }

    try {
      const pinGuardado = await SecureStore.getItemAsync('user_pin');
      const registroGuardado = await SecureStore.getItemAsync('user_register');

      if (!pinGuardado) {
        Alert.alert(
          'Cofre Não Configurado',
          'Nenhum cofre foi encontrado neste dispositivo. Faça o primeiro acesso.'
        );
        return;
      }

      if (pin === pinGuardado && (!registroGuardado || registro.trim() === registroGuardado)) {
        login();
        router.replace('/(tabs)');
      } else {
        Alert.alert('Dados Incorretos', 'O registro ou o PIN inserido é inválido.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao validar o acesso.');
    }
  };

  const handleAutenticarBiometria = async () => {
    try {
      const comHardware = await LocalAuthentication.hasHardwareAsync();
      const temBiometriaCadastrada = await LocalAuthentication.isEnrolledAsync();

      if (!comHardware || !temBiometriaCadastrada) {
        Alert.alert(
          'Biometria Indisponível',
          'Este dispositivo não possui biometria cadastrada. Utilize o seu PIN.'
        );
        return;
      }

      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear Cofre Clínico',
        fallbackLabel: 'Usar PIN',
        cancelLabel: 'Cancelar',
      });

      if (resultado.success) {
        login();
        router.replace('/(tabs)');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível autenticar por biometria.');
    }
  };

  return (
    <LinearGradient
      colors={['#EAF5F4', '#F4F9F8', '#E2F0EE']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cardContainer}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.formContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Registro Profissional (CRM/COREn)</Text>
              <TextInput
                style={styles.lineInput}
                placeholder="Ex: 123456/CE"
                placeholderTextColor="#A0A0A0"
                value={registro}
                onChangeText={setRegistro}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PIN de Acesso</Text>
              <TextInput
                style={styles.lineInput}
                placeholder="••••••"
                placeholderTextColor="#A0A0A0"
                keyboardType="numeric"
                secureTextEntry
                maxLength={6}
                value={pin}
                onChangeText={setPin}
              />
            </View>

            <Pressable
              onPress={handleEntrarComPin}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Entrar</Text>
            </Pressable>

            <Pressable
              onPress={handleAutenticarBiometria}
              style={({ pressed }) => [
                styles.biometryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.biometryButtonText}>Digital / Face ID</Text>
            </Pressable>

            <View style={styles.footerLinks}>
              <Pressable onPress={() => router.push('/cadastro')}>
                <Text style={styles.linkText}>Primeiro acesso &gt;</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 65,
    position: 'relative',
    shadowColor: '#006B66',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 8,
  },
  logoBadge: {
    position: 'absolute',
    top: -55,
    alignSelf: 'center',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  formContent: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#006B66',
    marginBottom: 4,
  },
  lineInput: {
    width: '100%',
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#006B66',
    fontSize: 15,
    color: '#0A2528',
    paddingVertical: 4,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#006B66',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  biometryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#006B66',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 12,
  },
  biometryButtonText: {
    color: '#006B66',
    fontWeight: '600',
    fontSize: 14,
  },
  footerLinks: {
    alignItems: 'center',
    marginTop: 22,
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#006B66',
    textDecorationLine: 'underline',
  },
  buttonPressed: {
    opacity: 0.85,
  },
});