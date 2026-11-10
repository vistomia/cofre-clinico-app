import { Directory, File, Paths } from 'expo-file-system';

export type SavedPhoto = {
  uri: string;
  capturedAt: string;
};

export type SavedCameraSession = {
  id: string;
  patientName: string;
  albumName: string;
  createdAt: string;
  photos: SavedPhoto[];
};

const rootDirectory = new Directory(Paths.document, 'cofre-clinico-sessoes');

function sessionDirectory(sessionId: string) {
  return new Directory(rootDirectory, sessionId);
}

export async function saveCameraSession(
  session: Omit<SavedCameraSession, 'photos'> & { photos: SavedPhoto[] },
): Promise<SavedCameraSession> {
  rootDirectory.create({ idempotent: true, intermediates: true });
  const destination = sessionDirectory(session.id);
  destination.create();

  const savedPhotos: SavedPhoto[] = [];

  try {
    for (const [index, photo] of session.photos.entries()) {
      const imageFile = new File(photo.uri);
      const destinationFile = new File(destination, `foto-${index + 1}.jpg`);
      await imageFile.copy(destinationFile);
      savedPhotos.push({ ...photo, uri: destinationFile.uri });
    }

    const savedSession: SavedCameraSession = { ...session, photos: savedPhotos };
    const metadataFile = new File(destination, 'sessao.json');
    metadataFile.create();
    await metadataFile.write(JSON.stringify(savedSession, null, 2));
    return savedSession;
  } catch (error) {
    destination.delete();
    throw error;
  }
}

export async function loadCameraSessions(): Promise<SavedCameraSession[]> {
  if (!rootDirectory.exists) return [];

  const entries = rootDirectory.list();
  const sessions: SavedCameraSession[] = [];

  for (const entry of entries) {
    if (!(entry instanceof Directory)) continue;

    const metadataFile = new File(entry, 'sessao.json');
    if (!metadataFile.exists) continue;

    try {
      const session = JSON.parse(await metadataFile.text()) as SavedCameraSession;
      if (session.id && Array.isArray(session.photos)) sessions.push(session);
    } catch {
      // Ignore incomplete or unreadable sessions and keep the remaining captures available.
    }
  }

  return sessions.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
