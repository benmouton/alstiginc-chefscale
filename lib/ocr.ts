import { Platform } from 'react-native';

interface OCRResult {
  text: string;
  method: 'on-device' | 'server-vision';
}

let mlKitModule: any = null;
let mlKitChecked = false;

async function loadMLKit(): Promise<boolean> {
  if (mlKitChecked) return !!mlKitModule;
  mlKitChecked = true;

  if (Platform.OS === 'web') return false;

  try {
    mlKitModule = await import('@react-native-ml-kit/text-recognition');
    console.log('[OCR] ML Kit text recognition available');
    return true;
  } catch (e) {
    console.log('[OCR] ML Kit not available (Expo Go or missing native module), will use server vision');
    return false;
  }
}

export async function extractTextOnDevice(imageUri: string): Promise<OCRResult | null> {
  const available = await loadMLKit();
  if (!available || !mlKitModule) return null;

  try {
    const TextRecognition = mlKitModule.default || mlKitModule;
    const result = await TextRecognition.recognize(imageUri);

    if (result?.text && result.text.trim().length > 10) {
      console.log('[OCR] On-device text extraction successful:', result.text.length, 'chars');
      return { text: result.text, method: 'on-device' };
    }

    console.log('[OCR] On-device extraction returned insufficient text, falling back');
    return null;
  } catch (e: any) {
    console.log('[OCR] On-device extraction failed:', e?.message || e);
    return null;
  }
}

export async function isOnDeviceOCRAvailable(): Promise<boolean> {
  return loadMLKit();
}
