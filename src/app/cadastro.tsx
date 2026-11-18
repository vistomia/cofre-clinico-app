import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

import { useAuth } from '@/context/auth-context';

export default function CadastroScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [nome, setNome] = useState('');
  const [registro, setRegistro] = useState('');
  const [pin, setPin] = useState('');
  const [confirmarPin, setConfirmarPin] = useState('');

  const pinsCoincidem = pin.length > 0 && pin === confirmarPin;

  const handleFinalizarCadastro = async () => {
    if (!nome.trim() || !registro.trim() || !pin.trim() || !confirmarPin.trim()) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos.');
      return;
    }

    if (pin.length < 4) {
      Alert.alert('PIN Inválido', 'O PIN de segurança deve ter pelo menos 4 dígitos.');
      return;
    }

    if (pin !== confirmarPin) {
      Alert.alert('PIN Divergente', 'O PIN de confirmação não coincide.');
      return;
    }

    try {
      await SecureStore.setItemAsync('user_name', nome.trim());
      await SecureStore.setItemAsync('user_register', registro.trim());
      await SecureStore.setItemAsync('user_pin', pin);
      await SecureStore.setItemAsync('use_biometrics', 'true');

      Alert.alert(
        'Cofre Criado com Sucesso! 🔒',
        'Seus dados de acesso foram armazenados com segurança.',
        [
          {
            text: 'Acessar Cofre',
            onPress: () => {
              login();
              router.replace('/main');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as configurações de segurança.');
    }
  };

  return (
    <LinearGradient
      colors={['#EAF5F4', '#F4F9F8', '#E2F0EE']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
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
                <Text style={styles.label}>Nome completo</Text>
                <TextInput
                  style={styles.lineInput}
                  placeholder="Dra. Ana Silva"
                  placeholderTextColor="#A0A0A0"
                  value={nome}
                  onChangeText={setNome}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Registro Profissional (CRM/COREn)</Text>
                <TextInput
                  style={styles.lineInput}
                  placeholder="123456/CE"
                  placeholderTextColor="#A0A0A0"
                  value={registro}
                  onChangeText={setRegistro}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Criar PIN</Text>
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

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Confirmar PIN</Text>
                  {confirmarPin.length > 0 && (
                    <Text
                      style={[
                        styles.statusTag,
                        pinsCoincidem ? styles.tagSuccess : styles.tagError,
                      ]}
                    >
                      {pinsCoincidem ? 'os PINs são iguais' : 'PINs diferentes'}
                    </Text>
                  )}
                </View>
                <TextInput
                  style={styles.lineInput}
                  placeholder="••••••"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                  value={confirmarPin}
                  onChangeText={setConfirmarPin}
                />
              </View>

              <Pressable
                onPress={handleFinalizarCadastro}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>Cadastrar</Text>
              </Pressable>

              <View style={styles.footerLinks}>
                <Pressable onPress={() => router.push('/login')}>
                  <Text style={styles.linkText}>Possuo cadastro &gt;</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
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
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#006B66',
    marginBottom: 4,
  },
  statusTag: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  tagSuccess: {
    color: '#006B66',
  },
  tagError: {
    color: '#DC3545',
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
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerLinks: {
    alignItems: 'center',
    marginTop: 20,
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