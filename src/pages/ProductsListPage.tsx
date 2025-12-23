import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../lib/firebase';
import {
  getAllProducts,
  getCategories,
  getSubcategoriesByCategory,
  getFabricTypesBySubcategory,
  type Product,
  type Category,
  type Subcategory,
  type FabricType,
} from '../lib/firestore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Swatch } from '../components/ui/Swatch';
import { ImageTile } from '../components/ui/ImageTile';

export function ProductsListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [selectedFabricTypeId, setSelectedFabricTypeId] = useState<string>('');
  const [colorSearch, setColorSearch] = useState<string>('');
  const [sortMode, setSortMode] = useState<'recent' | 'oldest'>('recent');

  // Dropdown data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [fabricTypes, setFabricTypes] = useState<FabricType[]>([]);

  // Image URLs cache
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [variantImages, setVariantImages] = useState<Record<string, Record<string, string>>>({});

  // Load all data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prods, cats] = await Promise.all([
          getAllProducts(),
          getCategories(),
        ]);
        setProducts(prods);
        setCategories(cats);

        // Load images for all products
        const productImageUrls: Record<string, string> = {};
        const variantImageUrls: Record<string, Record<string, string>> = {};

        for (const product of prods) {
          // Load main image
          if (product.mainImagePath) {
            try {
              const mainImageRef = ref(storage, product.mainImagePath);
              const url = await getDownloadURL(mainImageRef);
              productImageUrls[product.id || ''] = url;
            } catch (err) {
              console.error(`Failed to load main image for ${product.id}:`, err);
            }
          }

          // Load variant images
          if (product.colorVariants && product.colorVariants.length > 0) {
            variantImageUrls[product.id || ''] = {};
            for (const variant of product.colorVariants.slice(0, 4)) {
              // Only load first 4 variants for performance
              if (variant.imagePath) {
                try {
                  const variantImageRef = ref(storage, variant.imagePath);
                  const url = await getDownloadURL(variantImageRef);
                  variantImageUrls[product.id || ''][variant.id] = url;
                } catch (err) {
                  console.error(`Failed to load variant image:`, err);
                }
              }
            }
          }
        }

        setProductImages(productImageUrls);
        setVariantImages(variantImageUrls);
      } catch (err: any) {
        setError('Failed to load products: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Restore filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('productsFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedCategoryId(parsed.categoryId || '');
        setSelectedSubcategoryId(parsed.subcategoryId || '');
        setSelectedFabricTypeId(parsed.fabricTypeId || '');
        setColorSearch(parsed.colorSearch || '');
        setSortMode(parsed.sortMode || 'recent');
      } catch (e) {
        console.warn('Failed to parse saved filters', e);
      }
    }
  }, []);

  // Persist filters
  useEffect(() => {
    const payload = {
      categoryId: selectedCategoryId,
      subcategoryId: selectedSubcategoryId,
      fabricTypeId: selectedFabricTypeId,
      colorSearch,
      sortMode,
    };
    localStorage.setItem('productsFilters', JSON.stringify(payload));
  }, [selectedCategoryId, selectedSubcategoryId, selectedFabricTypeId, colorSearch, sortMode]);

  // Load subcategories when category changes
  useEffect(() => {
    if (!selectedCategoryId) {
      setSubcategories([]);
      setSelectedSubcategoryId('');
      return;
    }

    async function loadSubcategories() {
      try {
        const subs = await getSubcategoriesByCategory(selectedCategoryId);
        setSubcategories(subs);
        setSelectedSubcategoryId(''); // Reset selection
        setFabricTypes([]);
        setSelectedFabricTypeId('');
      } catch (err: any) {
        setError('Failed to load subcategories: ' + err.message);
      }
    }
    loadSubcategories();
  }, [selectedCategoryId]);

  // Load fabric types when subcategory changes
  useEffect(() => {
    if (!selectedSubcategoryId) {
      setFabricTypes([]);
      setSelectedFabricTypeId('');
      return;
    }

    async function loadFabricTypes() {
      try {
        const fabrics = await getFabricTypesBySubcategory(selectedSubcategoryId);
        setFabricTypes(fabrics);
        setSelectedFabricTypeId(''); // Reset selection
      } catch (err: any) {
        setError('Failed to load fabric types: ' + err.message);
      }
    }
    loadFabricTypes();
  }, [selectedSubcategoryId]);

  // Filter products (memoized for performance)
  const filteredProducts = useMemo(() => {
    if (!products.length) return [];

    const hasCategoryFilter = !!selectedCategoryId;
    const hasSubcategoryFilter = !!selectedSubcategoryId;
    const hasFabricFilter = !!selectedFabricTypeId;
    const trimmedColorSearch = colorSearch.trim();
    const hasColorSearch = trimmedColorSearch.length > 0;
    const colorSearchLower = trimmedColorSearch.toLowerCase();

    const filtered = products.filter((product) => {
      // Category filter
      if (hasCategoryFilter && product.categoryId !== selectedCategoryId) {
        return false;
      }

      // Subcategory filter
      if (hasSubcategoryFilter && product.subcategoryId !== selectedSubcategoryId) {
        return false;
      }

      // Fabric type filter (stored at product level)
      if (hasFabricFilter && product.fabricTypeId !== selectedFabricTypeId) {
        return false;
      }

      // Color name search (search across all variant color names)
      if (hasColorSearch) {
        const variants = Array.isArray(product.colorVariants) ? product.colorVariants : [];
        const hasMatchingColor = variants.some((variant) =>
          variant.colorName.toLowerCase().includes(colorSearchLower)
        );
        if (!hasMatchingColor) {
          return false;
        }
      }

      return true;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aTime = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate().getTime() : 0;
      const bTime = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate().getTime() : 0;
      if (sortMode === 'recent') return bTime - aTime;
      return aTime - bTime;
    });

    return sorted;
  }, [products, selectedCategoryId, selectedSubcategoryId, selectedFabricTypeId, colorSearch, sortMode]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-ivory via-white to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <SectionHeader
            overline="Collection"
            title="All Products"
            description="Filter by category, fabric, and color variants"
            actions={
              <div className="flex items-center gap-3">
                <Button onClick={() => navigate('/products/create')}>+ Create Product</Button>
                <Button variant="ghost" onClick={() => navigate('/')}>← Dashboard</Button>
              </div>
            }
          />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters Drawer-like card with subtle motion */}
        <AnimatePresence>
          <motion.div
            key="filters"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Card hover={false}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
                  <p className="text-xs text-slate-500">Refine by category, fabric, and color name</p>
                </div>
                {(selectedCategoryId ||
                  selectedSubcategoryId ||
                  selectedFabricTypeId ||
                  colorSearch) && (
                  <button
                    onClick={() => {
                      setSelectedCategoryId('');
                      setSelectedSubcategoryId('');
                      setSelectedFabricTypeId('');
                      setColorSearch('');
                    }}
                    className="text-sm text-amber-700 hover:text-amber-800"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Category Filter */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="input"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name || cat.id}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Filter */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sub-category
                  </label>
                  <select
                    value={selectedSubcategoryId}
                    onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                    className="input disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={!selectedCategoryId || subcategories.length === 0}
                  >
                    <option value="">
                      {!selectedCategoryId
                        ? 'Select Category first'
                        : subcategories.length === 0
                        ? 'Loading...'
                        : 'All Sub-categories'}
                    </option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name || sub.id}
                      </option>
                    ))}
                  </select>
                  {!selectedCategoryId && (
                    <span className="absolute top-0 right-0 text-[11px] text-slate-400">
                      tip: pick category first
                    </span>
                  )}
                </div>

                {/* Fabric Type Filter */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fabric Type
                  </label>
                  <select
                    value={selectedFabricTypeId}
                    onChange={(e) => setSelectedFabricTypeId(e.target.value)}
                    className="input disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={!selectedSubcategoryId || fabricTypes.length === 0}
                  >
                    <option value="">
                      {!selectedSubcategoryId
                        ? 'Select Sub-category first'
                        : fabricTypes.length === 0
                        ? 'Loading...'
                        : 'All Fabric Types'}
                    </option>
                    {fabricTypes.map((fabric) => (
                      <option key={fabric.id} value={fabric.id}>
                        {fabric.name || fabric.id}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color Search */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Search Color
                  </label>
                  <input
                    type="text"
                    value={colorSearch}
                    onChange={(e) => setColorSearch(e.target.value)}
                    className="input"
                    placeholder="e.g., Red, Blue"
                  />
                </div>

                {/* Sort */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sort
                  </label>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as 'recent' | 'oldest')}
                    className="input"
                  >
                    <option value="recent">Recently added</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Results Count */}
        <div className="text-sm text-slate-600">
          Showing <span className="font-semibold text-slate-800">{filteredProducts.length}</span> of{' '}
          <span className="font-semibold text-slate-800">{products.length}</span> products
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} hover={false} className="h-64 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card hover={false} className="p-12 text-center">
            <p className="text-slate-500">No products found matching your filters.</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => {
              const mainImageUrl = productImages[product.id || ''];
              const productVariantImages = variantImages[product.id || ''] || {};
              const displayVariants = product.colorVariants?.slice(0, 4) || [];

              return (
                <motion.div
                  key={product.id}
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="glass-card p-5 cursor-pointer"
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {/* Main Product Image */}
                  <ImageTile
                    src={mainImageUrl}
                    alt={product.sku}
                    className="mb-4 aspect-[4/3]"
                  />

                  {/* Product Info */}
                  <div className="mb-4 space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-600 font-semibold">SKU</p>
                    <h3 className="text-lg font-semibold text-slate-900">{product.sku}</h3>
                    {product.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Color Variants (Swatches) */}
                  {displayVariants.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-2">
                        Color Variants ({product.colorVariants?.length || 0})
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {displayVariants.map((variant) => {
                          const variantImageUrl = productVariantImages[variant.id];
                          return (
                            <Swatch
                              key={variant.id}
                              imageUrl={variantImageUrl}
                              label={variant.colorName}
                            />
                          );
                        })}
                        {product.colorVariants && product.colorVariants.length > 4 && (
                          <div className="flex items-center justify-center w-11 h-11 rounded-full border-2 border-white shadow ring-1 ring-slate-200 bg-slate-50 text-[11px] text-slate-500">
                            +{product.colorVariants.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No color variants yet</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

