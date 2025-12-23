import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Timestamp } from 'firebase/firestore';
import {
  addColorVariant,
  updateColorVariant,
  type Product,
  type ColorVariant,
} from '../lib/firestore';
import { uploadVariantImage } from '../lib/storage';
import { Button } from './ui/Button';
import { SectionHeader } from './ui/SectionHeader';
import { ImageTile } from './ui/ImageTile';

type AddVariantModalProps = {
  productId: string;
  product: Product;
  editingVariant: ColorVariant | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddVariantModal({
  productId,
  editingVariant,
  onClose,
  onSuccess,
}: AddVariantModalProps) {
  const [colorName, setColorName] = useState('');
  const [variantSKU, setVariantSKU] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form if editing
  useEffect(() => {
    if (editingVariant) {
      setColorName(editingVariant.colorName);
      setVariantSKU(editingVariant.variantSKU || '');
      setNotes(editingVariant.notes || '');
      setIsActive(editingVariant.isActive !== false);
      // Load existing image preview if available
      if (editingVariant.imagePath) {
        // We'll load the actual image URL in the parent component
        // For now, just show a placeholder
        setImagePreview(null);
      }
    } else {
      // Reset form for new variant
      setColorName('');
      setVariantSKU('');
      setNotes('');
      setIsActive(true);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [editingVariant]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!colorName) {
      setError('Please enter a color name');
      return;
    }

    if (!editingVariant && !imageFile) {
      setError('Please select an image for the variant');
      return;
    }

    setLoading(true);

    try {
      if (editingVariant) {
        // Update existing variant
        const updates: Partial<ColorVariant> = {
          colorName,
          variantSKU: variantSKU.trim() || undefined,
          notes: notes.trim() || undefined,
          isActive,
        };

        // If new image uploaded, upload it and update path
        if (imageFile) {
          const { path: imagePath } = await uploadVariantImage(
            imageFile,
            productId,
            editingVariant.id
          );
          updates.imagePath = imagePath;
        }

        await updateColorVariant(productId, editingVariant.id, updates);
      } else {
        // Add new variant
        const variantId = crypto.randomUUID();
        const { path: imagePath } = await uploadVariantImage(
          imageFile!,
          productId,
          variantId
        );

        const newVariant: ColorVariant = {
          id: variantId,
          imagePath,
          colorName,
          variantSKU: variantSKU.trim() || undefined,
          createdAt: Timestamp.now(),
          isActive: true,
          notes: notes.trim() || undefined,
        };

        await addColorVariant(productId, newVariant);
      }

      onSuccess();
    } catch (err: any) {
      setError('Failed to save variant: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-amber-100"
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 10000, position: 'relative' }}
      >
        <div className="p-6 border-b border-amber-100 flex items-center justify-between">
          <SectionHeader
            overline={editingVariant ? 'Edit Variant' : 'Add Variant'}
            title={editingVariant ? 'Update Color Variant' : 'New Color Variant'}
          />
          <Button variant="ghost" onClick={onClose} className="px-3 py-2 text-sm">
            ✕
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Color Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Color Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={colorName}
              onChange={(e) => setColorName(e.target.value)}
              className="input"
              placeholder="e.g., Wine Red, Sky Blue"
              required
            />
          </div>

          {/* Variant SKU */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Variant SKU / Product ID (optional)
            </label>
            <input
              type="text"
              value={variantSKU}
              onChange={(e) => setVariantSKU(e.target.value)}
              className="input"
              placeholder="e.g., EMB-001-RED, SKU-123"
            />
            <p className="mt-1 text-xs text-slate-500">
              Optional: Add a unique identifier for this color variant
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input min-h-[80px]"
              placeholder="e.g., weave detail, batch code, supplier note"
            />
          </div>

          {/* Variant Image */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Variant Image {!editingVariant && <span className="text-red-500">*</span>}
            </label>
            <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/40 px-4 py-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required={!editingVariant}
              />
              {imagePreview && (
                <motion.div
                  className="mt-3 w-fit"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <ImageTile src={imagePreview} alt="Preview" className="h-48 w-48" />
                </motion.div>
              )}
              {editingVariant && !imageFile && (
                <p className="mt-2 text-xs text-slate-500">
                  Leave empty to keep existing image, or upload a new one to replace it.
                </p>
              )}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <input
              id="variant-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="variant-active" className="text-sm text-slate-700">
              Active (uncheck to hide this variant without deleting)
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading
                ? editingVariant
                  ? 'Updating...'
                  : 'Adding...'
                : editingVariant
                ? 'Update Variant'
                : 'Add Variant'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

