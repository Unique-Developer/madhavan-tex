import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-ivory via-white to-slate-100">
      <header className="bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-amber-600 font-semibold">Textile Studio</p>
            <h1 className="text-[28px] font-semibold tracking-[-0.01em] text-slate-900">
              Madhavan Corporation
            </h1>
            <p className="text-sm text-slate-500">
              Internal design & color library
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
              {user?.email} · {user?.role}
            </span>
            <button
              onClick={async () => {
                const { signOut } = await import('firebase/auth');
                const { auth } = await import('../lib/firebase');
                await signOut(auth);
              }}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <SectionHeader
          overline="Dashboard"
          title="A calm workspace for your textile line"
          description="Curate designs, variants, and share with clients"
          actions={
            <div className="flex items-center gap-3">
              <Button onClick={() => navigate('/products/create')} className="shadow-card">
                + Create Product
              </Button>
              <Button variant="ghost" onClick={() => navigate('/products')}>
                View Products
              </Button>
            </div>
          }
        />

        <div className="mt-4 grid grid-cols-2 gap-4 max-w-lg">
          <div className="glass-card p-3 shadow-soft">
            <p className="text-[11px] uppercase tracking-[0.2em] text-amber-600 font-semibold">Products</p>
            <p className="text-lg font-semibold text-charcoal">—</p>
          </div>
          <div className="glass-card p-3 shadow-soft">
            <p className="text-[11px] uppercase tracking-[0.2em] text-amber-600 font-semibold">Variants</p>
            <p className="text-lg font-semibold text-charcoal">—</p>
          </div>
        </div>

        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {/* Products Card */}
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 mb-2">Products</p>
            <h3 className="text-lg font-semibold mb-2 text-slate-900">Design Library</h3>
            <p className="text-sm text-slate-600 mb-4">
              Manage products, main photos, and color variants.
            </p>
            <button
              onClick={() => navigate('/products')}
              className="text-sm text-amber-700 hover:text-amber-800 font-medium"
            >
              Open library →
            </button>
          </Card>

          {/* Categories Card */}
          {(user?.role === 'admin') && (
            <Card>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 mb-2">Admin</p>
              <h3 className="text-lg font-semibold mb-2 text-slate-900">Categories & Fabrics</h3>
              <p className="text-sm text-slate-600 mb-4">
                Maintain categories, sub-categories, and fabric types.
              </p>
              <button
                onClick={() => navigate('/admin/settings')}
                className="text-sm text-amber-700 hover:text-amber-800 font-medium"
              >
                Manage settings →
              </button>
            </Card>
          )}

          {/* Info Card */}
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 mb-2">Sharing</p>
            <h3 className="text-lg font-semibold mb-2 text-slate-900">WhatsApp Ready</h3>
            <p className="text-sm text-slate-600">
              Select variants and share images directly via the native share sheet or WhatsApp links.
            </p>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

