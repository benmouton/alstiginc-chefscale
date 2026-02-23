import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const MAX_WIDTH = 1200;
const COMPRESSION_QUALITY = 0.7;

export async function compressPhoto(sourceUri: string): Promise<string> {
  try {
    const compressed = await manipulateAsync(
      sourceUri,
      [{ resize: { width: MAX_WIDTH } }],
      { compress: COMPRESSION_QUALITY, format: SaveFormat.JPEG }
    );
    return compressed.uri;
  } catch {
    return sourceUri;
  }
}

export async function pickPhoto(useCamera: boolean): Promise<string | null> {
  const launcher = useCamera
    ? ImagePicker.launchCameraAsync
    : ImagePicker.launchImageLibraryAsync;

  const result = await launcher({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.7,
  });

  if (result.canceled || !result.assets[0]) return null;

  return compressPhoto(result.assets[0].uri);
}

export async function pickHeroPhoto(useCamera: boolean): Promise<string | null> {
  const launcher = useCamera
    ? ImagePicker.launchCameraAsync
    : ImagePicker.launchImageLibraryAsync;

  const result = await launcher({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [16, 9],
    quality: 0.7,
  });

  if (result.canceled || !result.assets[0]) return null;

  return compressPhoto(result.assets[0].uri);
}
