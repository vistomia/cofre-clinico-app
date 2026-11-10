import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  loadCameraSessions,
  saveCameraSession,
  type SavedCameraSession,
  type SavedPhoto,
} from '@/features/camera/storage';

type DraftPhoto = SavedPhoto & { id: string };
type Screen = 'camera' | 'review' | 'destination' | 'saved';

const teal = '#00786F';
const darkTeal = '#005F58';
const paleTeal = '#DCECE9';
const background = '#F4F8F7';

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [screen, setScreen] = useState<Screen>('camera');
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [albumName, setAlbumName] = useState('');
  const [savedSessions, setSavedSessions] = useState<SavedCameraSession[]>([]);
  const [openedSession, setOpenedSession] = useState<SavedCameraSession | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  const refreshSessions = useCallback(async () => {
    try {
      setSavedSessions(await loadCameraSessions());
    } catch {
      setStorageError('Não foi possível carregar as sessões salvas neste aparelho.');
    }
  }, []);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  useEffect(() => {
    if (screen !== 'camera') setCameraReady(false);
  }, [screen]);

  const capturePhoto = async () => {
    if (!cameraRef.current || !cameraReady || isCapturing) return;

    setIsCapturing(true);
    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!result?.uri) throw new Error('A câmera não retornou uma imagem.');
      const capturedAt = new Date().toISOString();
      const photo = { id: `${Date.now()}-${Math.random()}`, uri: result.uri, capturedAt };
      setPhotos((current) => [...current, photo]);
      setSelectedPhotoId(photo.id);
    } catch {
      Alert.alert('Não foi possível fotografar', 'Tente novamente. Se o problema continuar, feche e abra a câmera.');
    } finally {
      setIsCapturing(false);
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos((current) => {
      const remaining = current.filter((photo) => photo.id !== photoId);
      setSelectedPhotoId(remaining.at(-1)?.id ?? null);
      return remaining;
    });
  };

  const saveSession = async () => {
    const patient = patientName.trim();
    const album = albumName.trim();
    if (!patient || !album || photos.length === 0 || isSaving) return;

    setIsSaving(true);
    setStorageError(null);
    const createdAt = new Date().toISOString();
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      const saved = await saveCameraSession({
        id: sessionId,
        patientName: patient,
        albumName: album,
        createdAt,
        photos: photos.map(({ uri, capturedAt }) => ({ uri, capturedAt })),
      });
      setSavedSessions((current) => [saved, ...current]);
      setOpenedSession(saved);
      setPhotos([]);
      setSelectedPhotoId(null);
      setPatientName('');
      setAlbumName('');
      setScreen('saved');
    } catch {
      setStorageError('Não foi possível salvar as fotos no aparelho. Libere espaço e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const startNewCapture = () => {
    setPhotos([]);
    setSelectedPhotoId(null);
    setScreen('camera');
  };

  const renderPermission = () => {
    if (!permission) {
      return <CenteredMessage title="Preparando câmera" message="Aguarde enquanto verificamos a permissão do dispositivo." />;
    }
    if (permission.granted) return null;

    const permanentlyDenied = !permission.canAskAgain;
    return (
      <CenteredMessage
        title="Acesso à câmera"
        message={permanentlyDenied
          ? 'A permissão foi negada. Ative o acesso à câmera nas configurações do aparelho para fotografar.'
          : 'O Cofre Clínico precisa da câmera para registrar as fotos desta sessão.'}
        actionLabel={permanentlyDenied ? 'Abrir configurações' : 'Permitir câmera'}
        onAction={() => (permanentlyDenied ? Linking.openSettings() : requestPermission())}
      />
    );
  };

  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId) ?? photos.at(-1);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      {screen === 'camera' && (
        <View style={styles.cameraScreen}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.brand}>Cofre Clínico</Text>
              <Text style={styles.topSubtitle}>Registro fotográfico</Text>
            </View>
            <Pressable style={styles.savedButton} onPress={() => { setOpenedSession(null); setScreen('saved'); }}>
              <Text style={styles.savedButtonText}>Sessões{savedSessions.length ? ` · ${savedSessions.length}` : ''}</Text>
            </Pressable>
          </View>

          {permission?.granted ? (
            <View style={styles.cameraFrame}>
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing={facing}
                onCameraReady={() => setCameraReady(true)}
                onMountError={() => Alert.alert('Câmera indisponível', 'Não foi possível iniciar a câmera neste aparelho.')}
              />
              <View style={styles.cameraOverlay}>
                <View style={styles.cameraHeader}>
                  <Text style={styles.cameraHint}>Enquadre a área a registrar</Text>
                  <Pressable style={styles.flipButton} onPress={() => { setCameraReady(false); setFacing((value) => value === 'back' ? 'front' : 'back'); }} accessibilityLabel="Alternar câmera">
                    <Text style={styles.flipButtonText}>↻</Text>
                  </Pressable>
                </View>
                <View style={styles.captureControls}>
                  <Pressable style={styles.thumbnailShortcut} onPress={() => setScreen('review')} disabled={photos.length === 0}>
                    {photos.length > 0 ? <Image source={{ uri: photos.at(-1)?.uri }} style={styles.lastPhoto} contentFit="cover" /> : <Text style={styles.photoCount}>0</Text>}
                  </Pressable>
                  <Pressable
                    onPress={capturePhoto}
                    disabled={!cameraReady || isCapturing}
                    style={[styles.shutterOuter, (!cameraReady || isCapturing) && styles.disabledControl]}
                    accessibilityLabel="Tirar foto">
                    {isCapturing ? <ActivityIndicator color={teal} /> : <View style={styles.shutterInner} />}
                  </Pressable>
                  <Pressable style={styles.reviewShortcut} onPress={() => setScreen('review')} disabled={photos.length === 0}>
                    <Text style={styles.reviewShortcutText}>{photos.length ? `${photos.length} foto${photos.length > 1 ? 's' : ''}` : 'Revisar'}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : renderPermission()}

          {photos.length > 0 && (
            <Pressable style={styles.sessionBar} onPress={() => setScreen('review')}>
              <Text style={styles.sessionBarText}>{photos.length} foto{photos.length > 1 ? 's' : ''} nesta captura</Text>
              <Text style={styles.sessionBarAction}>Revisar e continuar ›</Text>
            </Pressable>
          )}
          {storageError && <Text style={styles.errorText}>{storageError}</Text>}
        </View>
      )}

      {screen === 'review' && (
        <View style={styles.page}>
          <Header title="Revisar fotos" onBack={() => setScreen('camera')} />
          {photos.length === 0 ? (
            <CenteredMessage title="Nenhuma foto ainda" message="Volte à câmera para iniciar uma captura." actionLabel="Abrir câmera" onAction={() => setScreen('camera')} />
          ) : (
            <>
              <Text style={styles.pageDescription}>{photos.length} foto{photos.length > 1 ? 's' : ''} na sessão · toque em uma miniatura para conferir</Text>
              <View style={styles.previewFrame}>
                {selectedPhoto && <Image source={{ uri: selectedPhoto.uri }} style={styles.previewImage} contentFit="contain" />}
              </View>
              {selectedPhoto && <Text style={styles.photoTimestamp}>Capturada em {formatDate(selectedPhoto.capturedAt)}</Text>}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailList}>
                {photos.map((photo, index) => (
                  <View key={photo.id} style={styles.thumbnailItem}>
                    <Pressable onPress={() => setSelectedPhotoId(photo.id)} style={[styles.thumbnailPressable, selectedPhotoId === photo.id && styles.thumbnailSelected]}>
                      <Image source={{ uri: photo.uri }} style={styles.thumbnailImage} contentFit="cover" />
                    </Pressable>
                    <Pressable onPress={() => removePhoto(photo.id)} style={styles.removePhotoButton} accessibilityLabel={`Remover foto ${index + 1}`}>
                      <Text style={styles.removePhotoText}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.bottomActions}>
                <Pressable style={styles.secondaryButton} onPress={() => setScreen('camera')}><Text style={styles.secondaryButtonText}>Adicionar fotos</Text></Pressable>
                <Pressable style={styles.primaryButton} onPress={() => setScreen('destination')}><Text style={styles.primaryButtonText}>Continuar</Text></Pressable>
              </View>
            </>
          )}
        </View>
      )}

      {screen === 'destination' && (
        <View style={styles.page}>
          <Header title="Salvar sessão" onBack={() => setScreen('review')} />
          <Text style={styles.pageDescription}>Informe o paciente e o álbum para identificar esta captura.</Text>
          <View style={styles.form}>
            <Text style={styles.label}>Paciente</Text>
            <TextInput value={patientName} onChangeText={setPatientName} placeholder="Nome do paciente" placeholderTextColor="#738581" style={styles.input} autoCapitalize="words" returnKeyType="next" />
            <Text style={styles.label}>Álbum</Text>
            <TextInput value={albumName} onChangeText={setAlbumName} placeholder="Ex.: acompanhamento da lesão" placeholderTextColor="#738581" style={styles.input} autoCapitalize="sentences" returnKeyType="done" />
            <Text style={styles.helperText}>As fotos serão salvas apenas na área privada deste aplicativo. A data e a hora são registradas automaticamente.</Text>
          </View>
          {storageError && <Text style={styles.errorText}>{storageError}</Text>}
          <View style={styles.bottomActions}>
            <Pressable style={styles.secondaryButton} onPress={() => setScreen('review')}><Text style={styles.secondaryButtonText}>Voltar</Text></Pressable>
            <Pressable style={[styles.primaryButton, (!patientName.trim() || !albumName.trim() || isSaving) && styles.disabledControl]} disabled={!patientName.trim() || !albumName.trim() || isSaving} onPress={saveSession}>
              {isSaving ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Salvar {photos.length} foto{photos.length > 1 ? 's' : ''}</Text>}
            </Pressable>
          </View>
        </View>
      )}

      {screen === 'saved' && (
        <View style={styles.page}>
          <Header title={openedSession ? 'Sessão salva' : 'Sessões salvas'} onBack={() => { setOpenedSession(null); setScreen('camera'); }} />
          {openedSession ? (
            <>
              <Text style={styles.sessionTitle}>{openedSession.patientName} · {openedSession.albumName}</Text>
              <Text style={styles.pageDescription}>{formatDate(openedSession.createdAt)}</Text>
              <ScrollView contentContainerStyle={styles.savedPhotoGrid}>
                {openedSession.photos.map((photo) => <Image key={photo.uri} source={{ uri: photo.uri }} style={styles.savedPhoto} contentFit="cover" />)}
              </ScrollView>
              <Pressable style={styles.primaryButton} onPress={startNewCapture}><Text style={styles.primaryButtonText}>Nova captura</Text></Pressable>
            </>
          ) : savedSessions.length === 0 ? (
            <CenteredMessage title="Ainda não há sessões" message="As sessões que você salvar neste aparelho aparecerão aqui." actionLabel="Abrir câmera" onAction={() => setScreen('camera')} />
          ) : (
            <ScrollView contentContainerStyle={styles.savedList}>
              {savedSessions.map((session) => (
                <Pressable key={session.id} style={styles.savedCard} onPress={() => setOpenedSession(session)}>
                  <Image source={{ uri: session.photos[0]?.uri }} style={styles.savedCardImage} contentFit="cover" />
                  <View style={styles.savedCardCopy}>
                    <Text style={styles.savedCardTitle}>{session.patientName}</Text>
                    <Text style={styles.savedCardSubtitle}>{session.albumName}</Text>
                    <Text style={styles.savedCardDate}>{formatDate(session.createdAt)} · {session.photos.length} foto{session.photos.length === 1 ? '' : 's'}</Text>
                  </View>
                  <Text style={styles.cardArrow}>›</Text>
                </Pressable>
              ))}
              <Pressable style={styles.primaryButton} onPress={startNewCapture}><Text style={styles.primaryButtonText}>Nova captura</Text></Pressable>
            </ScrollView>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.pageHeader}>
      <Pressable style={styles.backButton} onPress={onBack}><Text style={styles.backArrow}>‹</Text></Pressable>
      <Text style={styles.pageTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function CenteredMessage({ title, message, actionLabel, onAction }: { title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.centeredMessage}>
      <View style={styles.cameraGlyph}><Text style={styles.cameraGlyphText}>＋</Text></View>
      <Text style={styles.messageTitle}>{title}</Text>
      <Text style={styles.messageBody}>{message}</Text>
      {actionLabel && onAction && <Pressable style={styles.primaryButton} onPress={onAction}><Text style={styles.primaryButtonText}>{actionLabel}</Text></Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: background },
  cameraScreen: { flex: 1, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 },
  topBar: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  brand: { color: darkTeal, fontSize: 17, fontWeight: '700' },
  topSubtitle: { color: '#52645F', fontSize: 12, marginTop: 1 },
  savedButton: { backgroundColor: paleTeal, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  savedButtonText: { color: darkTeal, fontSize: 12, fontWeight: '700' },
  cameraFrame: { flex: 1, overflow: 'hidden', borderRadius: 20, backgroundColor: '#17201E' },
  cameraOverlay: { ...StyleSheet.absoluteFill, justifyContent: 'space-between', padding: 16 },
  cameraHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cameraHint: { overflow: 'hidden', color: 'white', fontSize: 12, backgroundColor: '#0009', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  flipButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0009', alignItems: 'center', justifyContent: 'center' },
  flipButtonText: { color: 'white', fontSize: 25, lineHeight: 29 },
  captureControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 6 },
  thumbnailShortcut: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#ffffffbb', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'white' },
  lastPhoto: { width: '100%', height: '100%' },
  photoCount: { fontSize: 16, color: darkTeal, fontWeight: '700' },
  shutterOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: 'white', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff40' },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'white' },
  reviewShortcut: { minWidth: 55, alignItems: 'flex-end' },
  reviewShortcutText: { color: 'white', fontSize: 12, fontWeight: '700', textShadowColor: '#0008', textShadowRadius: 5 },
  disabledControl: { opacity: 0.55 },
  sessionBar: { marginTop: 10, backgroundColor: paleTeal, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionBarText: { color: darkTeal, fontSize: 13, fontWeight: '600' },
  sessionBarAction: { color: teal, fontSize: 12, fontWeight: '700' },
  errorText: { color: '#A33C31', fontSize: 13, marginTop: 10, lineHeight: 19 },
  page: { flex: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 18 },
  pageHeader: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backButton: { height: 42, width: 42, justifyContent: 'center' },
  backArrow: { color: darkTeal, fontSize: 36, lineHeight: 40 },
  pageTitle: { color: darkTeal, fontSize: 19, fontWeight: '700' },
  headerSpacer: { width: 42 },
  pageDescription: { color: '#52645F', fontSize: 13, lineHeight: 19, marginBottom: 16 },
  previewFrame: { flex: 1, minHeight: 220, borderRadius: 18, backgroundColor: '#E6EBE9', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  photoTimestamp: { color: '#52645F', fontSize: 12, marginTop: 8 },
  thumbnailList: { gap: 10, paddingVertical: 12 },
  thumbnailItem: { width: 62, height: 62 },
  thumbnailPressable: { width: 58, height: 58, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbnailSelected: { borderColor: teal },
  thumbnailImage: { width: '100%', height: '100%' },
  removePhotoButton: { position: 'absolute', top: -5, right: -3, width: 22, height: 22, borderRadius: 11, backgroundColor: darkTeal, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'white' },
  removePhotoText: { color: 'white', fontSize: 17, lineHeight: 20, fontWeight: '600' },
  bottomActions: { flexDirection: 'row', gap: 10, paddingTop: 8 },
  primaryButton: { backgroundColor: teal, borderRadius: 24, minHeight: 48, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', flex: 1 },
  primaryButtonText: { color: 'white', fontSize: 14, fontWeight: '700' },
  secondaryButton: { borderColor: teal, borderWidth: 1, borderRadius: 24, minHeight: 48, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center', flex: 1 },
  secondaryButtonText: { color: darkTeal, fontSize: 14, fontWeight: '700' },
  form: { paddingTop: 12, gap: 10 },
  label: { color: darkTeal, fontSize: 14, fontWeight: '700', marginTop: 8 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#C9DBD7', borderRadius: 12, minHeight: 50, paddingHorizontal: 14, color: '#18322E', fontSize: 15 },
  helperText: { color: '#52645F', fontSize: 12, lineHeight: 18, marginTop: 8 },
  sessionTitle: { color: darkTeal, fontSize: 17, fontWeight: '700', marginBottom: 5 },
  savedPhotoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 16 },
  savedPhoto: { width: '48%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#E6EBE9' },
  savedList: { gap: 10, paddingBottom: 16 },
  savedCard: { minHeight: 88, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 15, padding: 9, gap: 12, elevation: 1 },
  savedCardImage: { width: 68, height: 68, borderRadius: 11, backgroundColor: '#E6EBE9' },
  savedCardCopy: { flex: 1, gap: 3 },
  savedCardTitle: { color: darkTeal, fontSize: 14, fontWeight: '700' },
  savedCardSubtitle: { color: '#52645F', fontSize: 12 },
  savedCardDate: { color: '#738581', fontSize: 10 },
  cardArrow: { color: teal, fontSize: 25, paddingHorizontal: 5 },
  centeredMessage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  cameraGlyph: { width: 66, height: 66, borderRadius: 24, backgroundColor: paleTeal, alignItems: 'center', justifyContent: 'center' },
  cameraGlyphText: { color: teal, fontSize: 38, fontWeight: '300', lineHeight: 44 },
  messageTitle: { color: darkTeal, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  messageBody: { color: '#52645F', fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 5 },
});
