import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../lib/firebase';
import {
  getProductById,
  type Product,
  type ColorVariant,
  getCategories,
  getSubcategoriesByCategory,
  getFabricTypesBySubcategory,
  type Category,
  type Subcategory,
  type FabricType,
} from '../lib/firestore';
import { AddVariantModal } from '../components/AddVariantModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ImageTile } from '../components/ui/ImageTile';
import { AnimatedCheckbox } from '../components/ui/AnimatedCheckbox';

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [variantImages, setVariantImages] = useState<Record<string, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ColorVariant | null>(null);
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [visibleVariantCount, setVisibleVariantCount] = useState(6);
  const reduce = useReducedMotion();

  // Lookups for names
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [fabricTypes, setFabricTypes] = useState<FabricType[]>([]);

  // Debug: Log when showAddModal changes
  useEffect(() => {
    console.log('showAddModal changed to:', showAddModal, 'productId:', productId);
  }, [showAddModal, productId]);

  // Load product data
  useEffect(() => {
    if (!productId) {
      setError('Product ID is required');
      setLoading(false);
      return;
    }

    async function loadLookups(categoryId?: string, subcategoryId?: string) {
      try {
        const cats = await getCategories();
        setCategories(cats);
        if (categoryId) {
          const subs = await getSubcategoriesByCategory(categoryId);
          setSubcategories(subs);
        } else {
          setSubcategories([]);
        }
        if (subcategoryId) {
          const fabs = await getFabricTypesBySubcategory(subcategoryId);
          setFabricTypes(fabs);
        } else {
          setFabricTypes([]);
        }
      } catch (err) {
        console.error('Failed to load lookups:', err);
      }
    }

    async function loadProduct() {
      try {
        const prod = await getProductById(productId);
        if (!prod) {
          setError('Product not found');
          setLoading(false);
          return;
        }

        // Normalize product to avoid null colorVariants
        setProduct({
          ...prod,
          colorVariants: Array.isArray(prod.colorVariants) ? prod.colorVariants : [],
        });

        // Load lookup tables for names
        await loadLookups(prod.categoryId, prod.subcategoryId);

        // Load main image URL
        if (prod.mainImagePath) {
          try {
            const mainImageRef = ref(storage, prod.mainImagePath);
            const url = await getDownloadURL(mainImageRef);
            setMainImageUrl(url);
          } catch (err) {
            console.error('Failed to load main image:', err);
          }
        }

        // Load variant image URLs
        const variantUrls: Record<string, string> = {};
        for (const variant of Array.isArray(prod.colorVariants) ? prod.colorVariants : []) {
          if (variant.imagePath) {
            try {
              const variantImageRef = ref(storage, variant.imagePath);
              const url = await getDownloadURL(variantImageRef);
              variantUrls[variant.id] = url;
            } catch (err) {
              console.error(`Failed to load variant image ${variant.id}:`, err);
            }
          }
        }
        setVariantImages(variantUrls);
      } catch (err: any) {
        setError('Failed to load product: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  // Refresh product after variant changes
  async function refreshProduct() {
    if (!productId) return;
    try {
        const prod = await getProductById(productId);
        if (prod) {
          setProduct({
            ...prod,
            colorVariants: Array.isArray(prod.colorVariants) ? prod.colorVariants : [],
          });
        // Reload variant images
        const variantUrls: Record<string, string> = {};
        for (const variant of Array.isArray(prod.colorVariants) ? prod.colorVariants : []) {
          if (variant.imagePath) {
            try {
              const variantImageRef = ref(storage, variant.imagePath);
              const url = await getDownloadURL(variantImageRef);
              variantUrls[variant.id] = url;
            } catch (err) {
              console.error(`Failed to load variant image ${variant.id}:`, err);
            }
          }
        }
        setVariantImages(variantUrls);
      }
    } catch (err) {
      console.error('Failed to refresh product:', err);
    }
  }

  const variants = useMemo(() => {
    if (!product) return [];
    return Array.isArray(product.colorVariants) ? product.colorVariants : [];
  }, [product]);
  const hasVariants = variants.length > 0;
  const visibleVariants = useMemo(() => {
    return variants.slice(0, visibleVariantCount);
  }, [variants, visibleVariantCount]);
  const allVariantIds = useMemo(() => variants.map((v) => v.id), [variants]);
  const allSelected = hasVariants && selectedVariantIds.size === allVariantIds.length;
  const anySelected = selectedVariantIds.size > 0;

  const categoryName = useMemo(
    () => categories.find((c) => c.id === product?.categoryId)?.name,
    [categories, product?.categoryId]
  );
  const updatedAtText = useMemo(() => {
    const ts = product?.updatedAt as any;
    if (!ts?.toDate) return '';
    const d: Date = ts.toDate();
    return d.toLocaleString();
  }, [product?.updatedAt]);
  const subcategoryName = useMemo(
    () => subcategories.find((s) => s.id === product?.subcategoryId)?.name,
    [subcategories, product?.subcategoryId]
  );
  const fabricTypeName = useMemo(
    () => fabricTypes.find((f) => f.id === product?.fabricTypeId)?.name,
    [fabricTypes, product?.fabricTypeId]
  );

  function toggleVariantSelection(variantId: string) {
    setSelectedVariantIds((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) {
        next.delete(variantId);
      } else {
        next.add(variantId);
      }
      return next;
    });
  }

  function selectAllVariants() {
    if (!hasVariants) return;
    setSelectedVariantIds(new Set(allVariantIds));
  }

  function clearSelectedVariants() {
    setSelectedVariantIds(new Set());
  }

  async function handleShareSelected() {
    if (!product || !anySelected) return;
    setShareError(null);
    setSharing(true);
    setShareToast('Preparing share…');

    try {
      const selectedVariants = product.colorVariants.filter((v) =>
        selectedVariantIds.has(v.id)
      );

      // Build share text
      const lines: string[] = [];
      lines.push(`SKU: ${product.sku}`);
      if (product.description) {
        lines.push(product.description);
      }
      lines.push('Selected colors:');

      for (const variant of selectedVariants) {
        const imageUrl = variantImages[variant.id];
        const parts = [`- ${variant.colorName}`];
        if (variant.variantSKU) {
          parts.push(`(SKU: ${variant.variantSKU})`);
        }
        if (imageUrl) {
          parts.push(imageUrl);
        }
        lines.push(parts.join(' '));
      }

      const shareText = lines.join('\n');

      // Try Web Share API with files first (mobile, modern browsers)
      const canShareFiles =
        typeof navigator !== 'undefined' &&
        // @ts-ignore - navigator.canShare may not be typed with files support
        typeof navigator.canShare === 'function' &&
        typeof navigator.share === 'function';

      if (canShareFiles) {
        const files: File[] = [];

        for (const variant of selectedVariants) {
          const imageUrl = variantImages[variant.id];
          if (!imageUrl) continue;

          try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            const fileExt = blob.type.split('/')[1] || 'jpg';
            const fileName = `${product.sku}-${variant.colorName}.${fileExt}`.replace(
              /\s+/g,
              '_'
            );

            files.push(new File([blob], fileName, { type: blob.type }));
          } catch (fetchErr) {
            console.error('Failed to fetch image for sharing, will fall back to text URL:', fetchErr);
            // Skip this image for file-based sharing; it will still appear in the text as URL
          }
        }

        if (files.length > 0) {
          // @ts-ignore
          if (navigator.canShare({ files })) {
            // @ts-ignore
            await navigator.share({
              files,
              text: shareText,
            });
            setShareToast('Shared via device sheet');
            setSharing(false);
            return;
          }
        }
      }

      // Fallback: WhatsApp link with text (includes image URLs)
      const encodedText = encodeURIComponent(shareText);
      const waUrl = `https://wa.me/?text=${encodedText}`;
      // Small confirmation animation before redirect
      await new Promise((resolve) => setTimeout(resolve, 180));
      window.open(waUrl, '_blank');
      setShareToast('Opened WhatsApp share');
    } catch (err: any) {
      console.error('Failed to share variants:', err);
      setShareError(
        'Unable to share images using the native share sheet. A WhatsApp text message with image links has been opened instead (or please try again on a mobile phone).'
      );
    } finally {
      setSharing(false);
      setTimeout(() => setShareToast(null), 1500);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <p className="text-slate-600">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="glass-card p-6 text-center space-y-3">
          <p className="text-red-600">{error || 'Product not found'}</p>
          <Button variant="ghost" onClick={() => navigate('/')}>← Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ivory via-white to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <SectionHeader
            overline="Product"
            title={product.sku}
            description="Rich textile variants for your clients"
            actions={
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => navigate('/products')}>
                  ← Products
                </Button>
                <Button onClick={() => navigate('/')}>Dashboard</Button>
              </div>
            }
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-700">
            <span className="rounded-full bg-slate-100 px-3 py-1 border border-slate-200">
              Category: {categoryName || '—'}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 border border-slate-200">
              Sub-category: {subcategoryName || '—'}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 border border-slate-200">
              Fabric: {fabricTypeName || '—'}
            </span>
            {product.panno && (
              <span className="rounded-full bg-amber-50 px-3 py-1 border border-amber-200 text-amber-800">
                Panno: {product.panno}
              </span>
            )}
            {updatedAtText && (
              <span className="rounded-full bg-white px-3 py-1 border border-slate-200 text-slate-600">
                Updated: {updatedAtText}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Main Product Image */}
          <Card hover>
            <SectionHeader overline="Hero" title="Main Product Image" />
            <ImageTile src={mainImageUrl || undefined} alt="Main product" className="mt-4 aspect-[4/3]" />
            <div className="mt-4 space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">SKU</p>
              <p className="text-sm font-medium text-slate-800">{product.sku}</p>
              {product.description && (
                <p className="text-sm text-slate-600">{product.description}</p>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-700">Category</p>
                <p className="text-slate-800">{categoryName || '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Sub-category</p>
                <p className="text-slate-800">{subcategoryName || '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Fabric Type</p>
                <p className="text-slate-800">{fabricTypeName || '—'}</p>
              </div>
              {product.panno && (
                <div>
                  <p className="font-semibold text-slate-700">Panno</p>
                  <p className="text-slate-800">{product.panno}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Color Variants */}
          <Card hover>
            <SectionHeader
              overline="Variants"
              title="Color Variants"
              actions={
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  {hasVariants && (
                    <>
                      <Button
                        variant="ghost"
                        onClick={allSelected ? clearSelectedVariants : selectAllVariants}
                      >
                        {allSelected ? 'Clear selection' : 'Select all'}
                      </Button>
                      <Button
                        onClick={handleShareSelected}
                        disabled={!anySelected || sharing}
                        icon={<span>💬</span>}
                      >
                        {sharing ? 'Preparing…' : `Share (${selectedVariantIds.size})`}
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" onClick={() => { setEditingVariant(null); setShowAddModal(true); }}>
                    + Add Variant
                  </Button>
                </div>
              }
            />

            {shareError && (
              <motion.div
                className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {shareError}
              </motion.div>
            )}
            {shareToast && (
              <motion.div
                className="mt-2 inline-block rounded-full bg-slate-900 text-white text-xs px-3 py-1"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {shareToast}
              </motion.div>
            )}

            {!product.colorVariants || product.colorVariants.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="mb-2">No color variants yet</p>
                <p className="text-sm">Click "Add Variant" to add your first color variant</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                {visibleVariants.map((variant, idx) => {
                  const imageUrl = variantImages[variant.id];
                  const isSelected = selectedVariantIds.has(variant.id);
                  const inactive = variant.isActive === false;
                  return (
                    <motion.div
                      key={variant.id}
                      className={`border rounded-xl p-3 transition-shadow ${
                        inactive
                          ? 'border-slate-200 bg-slate-50 opacity-75'
                          : isSelected
                          ? 'ring-2 ring-gold border-gold-soft shadow-glow'
                          : 'border-slate-200 shadow-soft'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05, ease: 'easeOut' }}
                      whileHover={!reduce ? { y: -3, scale: 1.01, rotateX: 2 } : undefined}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <button
                          type="button"
                          onClick={() => { setEditingVariant(variant); setShowAddModal(true); }}
                          className="text-[10px] text-slate-500 hover:text-slate-700 underline"
                        >
                          Edit
                        </button>
                        <AnimatedCheckbox
                          checked={isSelected}
                          onChange={() => toggleVariantSelection(variant.id)}
                          disabled={inactive}
                          label="Select"
                        />
                      </div>

                      <ImageTile src={imageUrl} alt={variant.colorName} className="aspect-[4/3] mb-2" />
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {variant.colorName}
                        </p>
                        {inactive && (
                          <p className="text-[11px] text-amber-700 mt-1">Inactive</p>
                        )}
                        {variant.variantSKU && (
                          <p className="text-xs text-slate-500 mt-1">
                            SKU: {variant.variantSKU}
                          </p>
                        )}
                        {variant.notes && (
                          <p className="text-xs text-slate-500 mt-1">
                            {variant.notes}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            {variants.length > visibleVariantCount && (
              <div className="mt-4">
                <Button variant="ghost" onClick={() => setVisibleVariantCount((c) => c + 6)}>
                  Show more
                </Button>
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Add/Edit Variant Modal */}
      {showAddModal && productId && (
        <AddVariantModal
          productId={productId}
          product={product}
          editingVariant={editingVariant}
          onClose={() => {
            setShowAddModal(false);
            setEditingVariant(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingVariant(null);
            refreshProduct();
          }}
        />
      )}
    </div>
  );
}

