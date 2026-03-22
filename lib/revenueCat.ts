import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? '';
const isExpoGo = Constants.appOwnership === 'expo';

let initialized = false;

export async function initializePurchases(userId?: string) {
  if (initialized) return;
  if (Platform.OS === 'web') return;
  if (isExpoGo) {
    console.log('RevenueCat skipped in Expo Go');
    return;
  }
  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    if (userId) {
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userId });
    } else {
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    }
    initialized = true;
  } catch (e) {
    console.error('RevenueCat init error:', e);
  }
}

export function isRevenueCatReady(): boolean {
  return initialized;
}

export async function checkPremiumStatus(): Promise<boolean> {
  if (Platform.OS === 'web' || !initialized) return false;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch (e) {
    console.error('Error checking premium status:', e);
    return false;
  }
}

export async function getOfferings() {
  if (Platform.OS === 'web' || !initialized) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    console.error('Error fetching offerings:', e);
    return null;
  }
}

export async function purchasePackage(pkg: any): Promise<boolean> {
  if (Platform.OS === 'web' || !initialized) return false;
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch (e: any) {
    if (!e.userCancelled) console.error('Purchase error:', e);
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (Platform.OS === 'web' || !initialized) return false;
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch (e) {
    console.error('Restore error:', e);
    return false;
  }
}
