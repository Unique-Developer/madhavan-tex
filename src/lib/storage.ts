import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a product's main image to Firebase Storage
 * @param file - The image file to upload
 * @param productId - The product ID (or 'temp' if product not created yet)
 * @returns The full storage path and download URL
 */
export async function uploadProductMainImage(
  file: File,
  productId: string
): Promise<{ path: string; url: string }> {
  const fileName = `main_${Date.now()}.${file.name.split('.').pop()}`;
  const storagePath = `products/${productId}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return { path: storagePath, url };
}

/**
 * Upload a color variant image to Firebase Storage
 * @param file - The image file to upload
 * @param productId - The product ID
 * @param variantId - The variant ID (e.g., from crypto.randomUUID())
 * @returns The full storage path and download URL
 */
export async function uploadVariantImage(
  file: File,
  productId: string,
  variantId: string
): Promise<{ path: string; url: string }> {
  const fileName = `variant_${variantId}_${Date.now()}.${file.name.split('.').pop()}`;
  const storagePath = `products/${productId}/variants/${fileName}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return { path: storagePath, url };
}

