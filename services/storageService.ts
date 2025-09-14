import storage from '@react-native-firebase/storage';
import { Buffer } from 'buffer';

/**
 * Upload an image from a remote URL to Firebase Storage and return a download URL.
 */
export async function uploadImageFromUrlToStorage(
  pathInBucket: string,
  imageUrl: string
): Promise<string> {
  if (!imageUrl) {
    throw new Error('No imageUrl provided');
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'image/jpeg';

  // Convert to base64 to avoid Blob/ArrayBuffer issues in React Native
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const ref = storage().ref(pathInBucket);
  await ref.putString(base64, 'base64', { contentType });
  return ref.getDownloadURL();
}

/**
 * Upload an image provided as base64 (without data URL prefix) to Firebase Storage.
 * Returns a permanent download URL.
 */
export async function uploadBase64ImageToStorage(
  pathInBucket: string,
  base64Data: string,
  contentType: string = 'image/png'
): Promise<string> {
  if (!base64Data) {
    throw new Error('No base64 data provided');
  }

  // If the input accidentally includes a data URL header, strip it
  const commaIndex = base64Data.indexOf(',');
  const rawBase64 =
    commaIndex >= 0 ? base64Data.slice(commaIndex + 1) : base64Data;

  const ref = storage().ref(pathInBucket);
  await ref.putString(rawBase64, 'base64', { contentType });
  return ref.getDownloadURL();
}

/**
 * Helper to determine if a URL is already a Firebase Storage download URL.
 */
export function isFirebaseStorageUrl(url?: string): boolean {
  if (!url) return false;
  return url.startsWith('https://firebasestorage.googleapis.com');
}
