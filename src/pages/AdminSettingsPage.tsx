import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  getCategories,
  getSubcategoriesByCategory,
  getFabricTypesBySubcategory,
  addCategory,
  addSubcategory,
  addFabricType,
  deleteCategory,
  deleteSubcategory,
  deleteFabricType,
  type Category,
  type Subcategory,
  type FabricType,
} from '../lib/firestore';

type Status = { type: 'success' | 'error'; message: string } | null;

export function AdminSettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [fabricTypes, setFabricTypes] = useState<FabricType[]>([]);

  const [catName, setCatName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subName, setSubName] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [fabricName, setFabricName] = useState('');

  // Load categories initially
  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const cats = await getCategories();
      setCategories(cats);
      if (cats.length && !selectedCategory) {
        setSelectedCategory(cats[0].id);
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  // Load subcategories when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      setSelectedSubcategory('');
      return;
    }
    getSubcategoriesByCategory(selectedCategory)
      .then((subs) => {
        setSubcategories(subs);
        if (subs.length && !selectedSubcategory) {
          setSelectedSubcategory(subs[0].id);
        }
      })
      .catch((err) => setStatus({ type: 'error', message: err.message }));
  }, [selectedCategory]);

  // Load fabric types when subcategory changes
  useEffect(() => {
    if (!selectedSubcategory) {
      setFabricTypes([]);
      return;
    }
    getFabricTypesBySubcategory(selectedSubcategory)
      .then(setFabricTypes)
      .catch((err) => setStatus({ type: 'error', message: err.message }));
  }, [selectedSubcategory]);

  async function handleAddCategory() {
    if (!catName.trim()) return;
    try {
      await addCategory(catName.trim());
      setCatName('');
      setStatus({ type: 'success', message: 'Category added' });
      loadCategories();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  }

  async function handleAddSubcategory() {
    if (!subName.trim() || !selectedCategory) return;
    try {
      await addSubcategory(subName.trim(), selectedCategory);
      setSubName('');
      setStatus({ type: 'success', message: 'Sub-category added' });
      const subs = await getSubcategoriesByCategory(selectedCategory);
      setSubcategories(subs);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  }

  async function handleAddFabric() {
    if (!fabricName.trim() || !selectedSubcategory) return;
    try {
      await addFabricType(fabricName.trim(), selectedSubcategory);
      setFabricName('');
      setStatus({ type: 'success', message: 'Fabric type added' });
      const fabs = await getFabricTypesBySubcategory(selectedSubcategory);
      setFabricTypes(fabs);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!window.confirm('Delete this category? Sub-categories/fabrics linked will become orphaned.')) return;
    try {
      await deleteCategory(id);
      setStatus({ type: 'success', message: 'Category deleted' });
      loadCategories();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  }

  async function handleDeleteSubcategory(id: string) {
    if (!window.confirm('Delete this sub-category? Linked fabric types may be orphaned.')) return;
    try {
      await deleteSubcategory(id);
      setStatus({ type: 'success', message: 'Sub-category deleted' });
      if (selectedCategory) {
        const subs = await getSubcategoriesByCategory(selectedCategory);
        setSubcategories(subs);
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  }

  async function handleDeleteFabric(id: string) {
    if (!window.confirm('Delete this fabric type?')) return;
    try {
      await deleteFabricType(id);
      setStatus({ type: 'success', message: 'Fabric type deleted' });
      if (selectedSubcategory) {
        const fabs = await getFabricTypesBySubcategory(selectedSubcategory);
        setFabricTypes(fabs);
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  }

  const selectedCategoryName = useMemo(
    () => categories.find((c) => c.id === selectedCategory)?.name || '—',
    [categories, selectedCategory]
  );

  const selectedSubcategoryName = useMemo(
    () => subcategories.find((s) => s.id === selectedSubcategory)?.name || '—',
    [subcategories, selectedSubcategory]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-ivory via-white to-slate-100">
      <header className="bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <SectionHeader
            overline="Admin"
            title="Categories & Fabrics"
            description="Manage categories, sub-categories, and fabric types."
            actions={
              <Button variant="ghost" onClick={() => navigate('/')}>
                ← Back to dashboard
              </Button>
            }
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <AnimatePresence>
          {status && (
            <motion.div
              key="status"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`rounded-lg px-4 py-2 text-sm border ${
                status.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {status.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories */}
        <Card>
          <SectionHeader overline="Categories" title="Top-level categories" />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Add category</label>
              <input
                className="input"
                placeholder="e.g., Embroidery"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
              />
              <Button onClick={handleAddCategory} disabled={loading || !catName.trim()}>
                Add
              </Button>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-slate-500 mb-2">Existing categories</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <span className="text-sm text-charcoal truncate">
                      {cat.name || cat.id}
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="px-2 py-1 text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                {categories.length === 0 && <p className="text-sm text-slate-500">No categories yet.</p>}
              </div>
            </div>
          </div>
        </Card>

        {/* Sub-categories */}
        <Card>
          <SectionHeader
            overline="Sub-categories"
            title={`For category: ${selectedCategoryName}`}
          />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select
                className="input"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <label className="text-sm font-medium text-slate-700">Add sub-category</label>
              <input
                className="input"
                placeholder="e.g., Allover"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
              />
              <Button onClick={handleAddSubcategory} disabled={!subName.trim() || !selectedCategory}>
                Add
              </Button>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-slate-500 mb-2">Existing sub-categories</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {subcategories.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                    onClick={() => setSelectedSubcategory(sub.id)}
                  >
                    <span className="text-sm text-charcoal truncate">
                      {sub.name || sub.id}
                    </span>
                    <Button
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); handleDeleteSubcategory(sub.id); }}
                      className="px-2 py-1 text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                {subcategories.length === 0 && <p className="text-sm text-slate-500">No sub-categories yet.</p>}
              </div>
            </div>
          </div>
        </Card>

        {/* Fabric Types */}
        <Card>
          <SectionHeader
            overline="Fabric Types"
            title={`For sub-category: ${selectedSubcategoryName}`}
          />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Sub-category</label>
              <select
                className="input"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
              >
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>

              <label className="text-sm font-medium text-slate-700">Add fabric type</label>
              <input
                className="input"
                placeholder='e.g., Satin 44"'
                value={fabricName}
                onChange={(e) => setFabricName(e.target.value)}
              />
              <Button onClick={handleAddFabric} disabled={!fabricName.trim() || !selectedSubcategory}>
                Add
              </Button>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-slate-500 mb-2">Existing fabric types</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {fabricTypes.map((fab) => (
                  <div
                    key={fab.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <span className="text-sm text-charcoal truncate">
                      {fab.name || fab.id}
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteFabric(fab.id)}
                      className="px-2 py-1 text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                {fabricTypes.length === 0 && <p className="text-sm text-slate-500">No fabric types yet.</p>}
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

