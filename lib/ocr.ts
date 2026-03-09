import { Platform } from 'react-native';

interface OCRResult {
  text: string;
  method: 'on-device' | 'server-vision';
}

let textRecModule: any = null;
let moduleChecked = false;

async function loadTextRecognition(): Promise<boolean> {
  if (moduleChecked) return !!textRecModule;
  moduleChecked = true;

  if (Platform.OS === 'web') return false;

  try {
    textRecModule = await import('react-native-text-recognition');
    console.log('[OCR] react-native-text-recognition (Apple Vision) available');
    return true;
  } catch (e) {
    console.log('[OCR] react-native-text-recognition not available (Expo Go or missing native module), will use server vision');
    return false;
  }
}

export async function extractTextOnDevice(imageUri: string): Promise<OCRResult | null> {
  const available = await loadTextRecognition();
  if (!available || !textRecModule) return null;

  try {
    const TextRecognition = textRecModule.default || textRecModule;
    const result = await TextRecognition.recognize(imageUri);

    const text = Array.isArray(result) ? result.join('\n') : result?.text || '';

    if (text && text.trim().length > 10) {
      console.log('[OCR] On-device text extraction successful:', text.length, 'chars');
      return { text, method: 'on-device' };
    }

    console.log('[OCR] On-device extraction returned insufficient text, falling back');
    return null;
  } catch (e: any) {
    console.log('[OCR] On-device extraction failed:', e?.message || e);
    return null;
  }
}

export async function isOnDeviceOCRAvailable(): Promise<boolean> {
  return loadTextRecognition();
}
