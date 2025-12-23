import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// TYPES (matching our schema from Step 5)
// ============================================

export type Category = {
  id: string;
  name: string;
  active: boolean;
};

export type Subcategory = {
  id: string;
  name: string;
  categoryId: string;
  active: boolean;
};

export type FabricType = {
  id: string;
  name: string;
  subcategoryId: string;
  active: boolean;
};

export type ColorVariant = {
  id: string;
  imagePath: string;
  colorName: string;
  variantSKU?: string; // Optional variant-specific SKU/identifier
  createdAt: Timestamp;
  isActive?: boolean;
  notes?: string;
  // Note: price and fabricTypeId are inherited from product, not stored per variant
};

export type Product = {
  id?: string; // Firestore doc ID
  sku: string;
  categoryId: string;
  subcategoryId: string;
  fabricTypeId: string; // Fabric type applies to all variants
  price: number; // Base price applies to all variants
  mainImagePath: string;
  colorVariants: ColorVariant[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  description?: string;
  panno?: string; // Only for embroidery category
};

// ============================================
// CATEGORIES
// ============================================

export async function getCategories(): Promise<Category[]> {
  try {
    // First, try to get all categories (in case active field doesn't exist)
    const q = query(collection(db, 'categories'));
    const snapshot = await getDocs(q);
    
    console.log('Firestore: Found', snapshot.docs.length, 'categories');
    
    const categories = snapshot.docs.map((doc) => {
      const data = doc.data();
      console.log('Category doc:', doc.id, data);
      return {
        id: doc.id,
        name: data.name || doc.id, // fallback to id so UI is never blank
        active: data.active !== undefined ? data.active : true, // Default to true if missing
      };
    });
    
    // Filter to only active ones (if active field exists and is false, exclude it)
    return categories.filter((cat) => cat.active);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

export async function addCategory(name: string) {
  return addDoc(collection(db, 'categories'), { name, active: true });
}

export async function deleteCategory(id: string) {
  return deleteDoc(doc(db, 'categories', id));
}

// ============================================
// SUBCATEGORIES
// ============================================

export async function getSubcategoriesByCategory(
  categoryId: string
): Promise<Subcategory[]> {
  const q = query(
    collection(db, 'subcategories'),
    where('categoryId', '==', categoryId),
    where('active', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name || doc.id, // fallback to id
    categoryId: doc.data().categoryId,
    active: doc.data().active !== undefined ? doc.data().active : true,
  })) as Subcategory[];
}

export async function addSubcategory(name: string, categoryId: string) {
  return addDoc(collection(db, 'subcategories'), { name, categoryId, active: true });
}

export async function deleteSubcategory(id: string) {
  return deleteDoc(doc(db, 'subcategories', id));
}

// ============================================
// FABRIC TYPES
// ============================================

export async function getFabricTypesBySubcategory(
  subcategoryId: string
): Promise<FabricType[]> {
  const q = query(
    collection(db, 'fabricTypes'),
    where('subcategoryId', '==', subcategoryId),
    where('active', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name || doc.id, // fallback to id
    subcategoryId: doc.data().subcategoryId,
    active: doc.data().active !== undefined ? doc.data().active : true,
  })) as FabricType[];
}

export async function addFabricType(name: string, subcategoryId: string) {
  return addDoc(collection(db, 'fabricTypes'), { name, subcategoryId, active: true });
}

export async function deleteFabricType(id: string) {
  return deleteDoc(doc(db, 'fabricTypes', id));
}

// ============================================
// PRODUCTS
// ============================================

export async function createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = Timestamp.now();
  
  // Filter out undefined values (Firestore doesn't allow them)
  const cleanedProduct = Object.fromEntries(
    Object.entries(product).filter(([_, value]) => value !== undefined)
  ) as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
  
  const productData = {
    ...cleanedProduct,
    createdAt: now,
    updatedAt: now,
  };
  
  const docRef = await addDoc(collection(db, 'products'), productData);
  return docRef.id;
}

export async function getProductById(productId: string): Promise<Product | null> {
  const docRef = doc(db, 'products', productId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Product;
}

/**
 * Get all products (for listing page)
 */
export async function getAllProducts(): Promise<Product[]> {
  const snapshot = await getDocs(collection(db, 'products'));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];
}

/**
 * Add a new color variant to an existing product
 */
export async function addColorVariant(
  productId: string,
  variant: ColorVariant
): Promise<void> {
  const productRef = doc(db, 'products', productId);
  const productSnap = await getDoc(productRef);
  
  if (!productSnap.exists()) {
    throw new Error('Product not found');
  }

  const currentVariants = (productSnap.data().colorVariants || []) as ColorVariant[];
  const updatedVariants = [...currentVariants, variant];

  await updateDoc(productRef, {
    colorVariants: updatedVariants,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update an existing color variant in a product
 */
export async function updateColorVariant(
  productId: string,
  variantId: string,
  updates: Partial<ColorVariant>
): Promise<void> {
  const productRef = doc(db, 'products', productId);
  const productSnap = await getDoc(productRef);
  
  if (!productSnap.exists()) {
    throw new Error('Product not found');
  }

  const currentVariants = (productSnap.data().colorVariants || []) as ColorVariant[];
  const updatedVariants = currentVariants.map((v) =>
    v.id === variantId ? { ...v, ...updates } : v
  );

  await updateDoc(productRef, {
    colorVariants: updatedVariants,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a color variant from a product
 */
export async function deleteColorVariant(
  productId: string,
  variantId: string
): Promise<void> {
  const productRef = doc(db, 'products', productId);
  const productSnap = await getDoc(productRef);
  
  if (!productSnap.exists()) {
    throw new Error('Product not found');
  }

  const currentVariants = (productSnap.data().colorVariants || []) as ColorVariant[];
  const updatedVariants = currentVariants.filter((v) => v.id !== variantId);

  await updateDoc(productRef, {
    colorVariants: updatedVariants,
    updatedAt: Timestamp.now(),
  });
}

