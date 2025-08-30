import { storage } from './firebase';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';

/**
 * Upload an image from a remote URL to Firebase Storage and return a download URL.
 */
export async function uploadImageFromUrlToStorage(pathInBucket: string, imageUrl: string): Promise<string> {
	if (!imageUrl) {
		throw new Error('No imageUrl provided');
	}

	const response = await fetch(imageUrl);
	if (!response.ok) {
		throw new Error(`Failed to download image: ${response.status}`);
	}

	const arrayBuffer = await response.arrayBuffer();
	const bytes = new Uint8Array(arrayBuffer);
	const contentType = response.headers.get('content-type') || 'image/jpeg';

	const ref = storageRef(storage, pathInBucket);
	await uploadBytes(ref, bytes, { contentType });
	return getDownloadURL(ref);
}

/**
 * Helper to determine if a URL is already a Firebase Storage download URL.
 */
export function isFirebaseStorageUrl(url?: string): boolean {
	if (!url) return false;
	return url.startsWith('https://firebasestorage.googleapis.com');
}


