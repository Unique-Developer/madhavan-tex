import { motion } from 'framer-motion';
import { FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
  getCategories,
  getSubcategoriesByCategory,
  getFabricTypesBySubcategory,
  createProduct,
  type Category,
  type Subcategory,
  type FabricType,
} from '../lib/firestore';
import { uploadProductMainImage } from '../lib/storage';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Button } from '../components/ui/Button';

export function CreateProductPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [fabricTypeId, setFabricTypeId] = useState('');
  const [panno, setPanno] = useState('');
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  // Dropdown data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [fabricTypes, setFabricTypes] = useState<FabricType[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isEmbroidery = selectedCategory?.name?.toLowerCase() === 'embroidery';

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      setLoadingCategories(true);
      try {
        console.log('Loading categories...');
        const cats = await getCategories();
        console.log('Loaded categories:', cats);
        setCategories(cats);
        if (cats.length === 0) {
          setError('No categories found. Please create categories in Firestore first. Make sure each category has a "name" field and optionally an "active" field set to true.');
        } else {
          setError(null); // Clear any previous errors
        }
      } catch (err: any) {
        console.error('Error loading categories:', err);
        setError('Failed to load categories: ' + err.message + '. Check browser console for details.');
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      setSubcategoryId('');
      setPanno(''); // reset panno when category cleared
      return;
    }

    async function loadSubcategories() {
      try {
        const subs = await getSubcategoriesByCategory(categoryId);
        setSubcategories(subs);
        setSubcategoryId(''); // Reset selection
        setFabricTypes([]);
        setFabricTypeId('');
      } catch (err: any) {
        setError('Failed to load subcategories: ' + err.message);
      }
    }
    loadSubcategories();
  }, [categoryId]);

  // Load fabric types when subcategory changes
  useEffect(() => {
    if (!subcategoryId) {
      setFabricTypes([]);
      setFabricTypeId('');
      return;
    }

    async function loadFabricTypes() {
      try {
        const fabrics = await getFabricTypesBySubcategory(subcategoryId);
        setFabricTypes(fabrics);
        setFabricTypeId(''); // Reset selection
      } catch (err: any) {
        setError('Failed to load fabric types: ' + err.message);
      }
    }
    loadFabricTypes();
  }, [subcategoryId]);

  // Reset panno if category is not embroidery
  useEffect(() => {
    const cat = categories.find((c) => c.id === categoryId);
    const isEmb = cat?.name?.toLowerCase() === 'embroidery';
    if (!isEmb && panno) {
      setPanno('');
    }
  }, [categoryId, categories]);

  // Handle main image selection
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setMainImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMainImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Handle form submission
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be logged in');
      return;
    }

    if (!mainImageFile) {
      setError('Please select a main product image');
      return;
    }

    if (!sku || !categoryId || !subcategoryId || !fabricTypeId) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create product document first (we need the ID for storage path)
      const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        sku,
        categoryId,
        subcategoryId,
        fabricTypeId, // Save fabric type at product level (applies to all variants)
        price: 0, // Will be set later, or you can add a price field to the form
        mainImagePath: '', // Will update after upload
        colorVariants: [], // No variants on initial creation
        createdBy: user.uid,
      };
      
      // Only include description if it's not empty
      if (description.trim()) {
        productData.description = description.trim();
      }

      // Include panno only for Embroidery category
      const selectedCategory = categories.find((c) => c.id === categoryId);
      const isEmbroidery = selectedCategory?.name?.toLowerCase() === 'embroidery';
      if (isEmbroidery && panno.trim()) {
        productData.panno = panno.trim();
      }
      
      const productId = await createProduct(productData);

      // Step 2: Upload main image
      const { path: imagePath } = await uploadProductMainImage(
        mainImageFile,
        productId
      );

      // Step 3: Update product with actual image path
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      await updateDoc(doc(db, 'products', productId), {
        mainImagePath: imagePath,
      });

      // Success! Navigate to product detail page
      navigate(`/products/${productId}`);
    } catch (err: any) {
      setError('Failed to create product: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ivory via-white to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-5">
          <SectionHeader
            overline="New Product"
            title="Create Product"
            description="Capture SKU, category, fabrics and hero image for your textile line."
            actions={
              <Button variant="ghost" onClick={() => navigate('/')}>
                ← Dashboard
              </Button>
            }
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Card hover={false}>
          <SectionHeader overline="Details" title="Product Information" />
          {error && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* SKU */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="input"
                  placeholder="e.g., EMB-001"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="input"
                  required
                  disabled={loadingCategories}
                >
                  <option value="" className="text-slate-900">
                    {loadingCategories ? 'Loading categories...' : categories.length === 0 ? 'No categories found' : 'Select Category'}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="text-slate-900">
                      {cat.name || cat.id}
                    </option>
                  ))}
                </select>
                {loadingCategories && (
                  <p className="mt-1 text-xs text-slate-500">Fetching categories from Firestore...</p>
                )}
                {!loadingCategories && categories.length > 0 && (
                  <p className="mt-1 text-xs text-emerald-600">
                    ✓ Found {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
                  </p>
                )}
                {!loadingCategories && categories.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    ⚠ No categories found. Check browser console (F12) for details.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Subcategory */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Sub-category <span className="text-red-500">*</span>
                </label>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="input disabled:bg-slate-50 disabled:text-slate-400"
                  required
                  disabled={!categoryId || subcategories.length === 0}
                >
                  <option value="" className="text-slate-900">
                    {!categoryId
                      ? 'Select Category first'
                      : subcategories.length === 0
                      ? 'Loading...'
                      : 'Select Sub-category'}
                  </option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id} className="text-slate-900">
                      {sub.name || sub.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fabric Type */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Fabric Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={fabricTypeId}
                  onChange={(e) => setFabricTypeId(e.target.value)}
                  className="input disabled:bg-slate-50 disabled:text-slate-400"
                  required
                  disabled={!subcategoryId || fabricTypes.length === 0}
                >
                  <option value="" className="text-slate-900">
                    {!subcategoryId
                      ? 'Select Sub-category first'
                      : fabricTypes.length === 0
                      ? 'Loading...'
                      : 'Select Fabric Type'}
                  </option>
                  {fabricTypes.map((fabric) => (
                    <option key={fabric.id} value={fabric.id} className="text-slate-900">
                      {fabric.name || fabric.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Panno (Embroidery only) */}
              {isEmbroidery && (
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Panno (Embroidery)
                  </label>
                  <input
                    type="text"
                    value={panno}
                    onChange={(e) => setPanno(e.target.value)}
                    className="input"
                    placeholder="Enter Panno value (optional)"
                  />
                  <p className="text-xs text-slate-500">Shown only when category is Embroidery.</p>
                </div>
              )}
            </div>

            {/* Main Image */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Main Product Image <span className="text-red-500">*</span>
              </label>
              <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/40 px-4 py-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
                {mainImagePreview && (
                  <motion.div
                    className="mt-3 w-fit"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <img
                      src={mainImagePreview}
                      alt="Preview"
                      className="h-48 w-48 rounded-lg border object-cover shadow-soft"
                    />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Description (optional) */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Internal notes about this product..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" type="button" onClick={() => navigate('/')}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}

