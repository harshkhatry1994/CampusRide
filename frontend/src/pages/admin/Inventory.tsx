import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { DealerBike, StockStatus } from '@/lib/admin-types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Edit2, Trash2, Eye, Download,
  QrCode, Copy, ChevronUp, ChevronDown, X, Upload,
  CheckSquare, Square, MoreHorizontal, Star, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';

// ─── Status Badge ───────────────────────────────────────────────────────────
const STATUS_COLORS: Record<StockStatus, string> = {
  Available:         'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Sold:              'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Reserved:          'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Under Maintenance': 'bg-red-500/20 text-red-400 border-red-500/30',
};

function StatusBadge({ status }: { status: StockStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[status] || 'bg-white/10 text-white/60 border-white/20'}`}>
      {status}
    </span>
  );
}

// ─── Bike Form ──────────────────────────────────────────────────────────────
function BikeForm({ bike, onSave, onClose }: { bike?: DealerBike | null; onSave: () => void; onClose: () => void }) {
  const isEdit = !!bike;
  const [form, setForm] = useState({
    bike_name: bike?.bike_name || '',
    brand: bike?.brand || '',
    model: bike?.model || '',
    model_year: bike?.model_year?.toString() || new Date().getFullYear().toString(),
    registration_number: bike?.registration_number || '',
    chassis_number: bike?.chassis_number || '',
    engine_number: bike?.engine_number || '',
    color: bike?.color || '',
    fuel_type: bike?.fuel_type || 'Petrol',
    kms_driven: bike?.kms_driven?.toString() || '0',
    purchase_price: bike?.purchase_price?.toString() || '',
    selling_price: bike?.selling_price?.toString() || '',
    description: bike?.description || '',
    stock_status: bike?.stock_status || 'Available',
    is_featured: bike?.is_featured || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bike_name || !form.brand || !form.model) {
      toast.error('Bike name, brand and model are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        model_year: form.model_year ? parseInt(form.model_year) : null,
        kms_driven: parseInt(form.kms_driven) || 0,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
        selling_price: form.selling_price ? parseFloat(form.selling_price) : null,
        updated_at: new Date().toISOString(),
      };
      let error;
      if (isEdit) {
        ({ error } = await supabase.from('dealer_bikes').update(payload).eq('id', bike!.id));
      } else {
        ({ error } = await supabase.from('dealer_bikes').insert(payload));
      }
      if (error) throw error;
      toast.success(isEdit ? 'Bike updated!' : 'Bike added!');
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        {field('Bike Name *', 'bike_name', 'text', 'e.g. KTM Duke 390')}
        {field('Brand *', 'brand', 'text', 'e.g. KTM')}
        {field('Model *', 'model', 'text', 'e.g. Duke')}
        {field('Model Year', 'model_year', 'number', '2024')}
        {field('Registration No.', 'registration_number', 'text', 'MH01AB1234')}
        {field('Chassis Number', 'chassis_number', 'text', '')}
        {field('Engine Number', 'engine_number', 'text', '')}
        {field('Color', 'color', 'text', 'e.g. Orange')}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Fuel Type</label>
          <select value={form.fuel_type} onChange={e => setForm(f => ({ ...f, fuel_type: e.target.value as any }))}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50">
            {['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'].map(o => <option key={o} value={o} className="bg-gray-900">{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Stock Status</label>
          <select value={form.stock_status} onChange={e => setForm(f => ({ ...f, stock_status: e.target.value as any }))}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50">
            {['Available', 'Reserved', 'Sold', 'Under Maintenance'].map(o => <option key={o} value={o} className="bg-gray-900">{o}</option>)}
          </select>
        </div>
        {field('KMs Driven', 'kms_driven', 'number', '0')}
        {field('Purchase Price (₹)', 'purchase_price', 'number', '0')}
        {field('Selling Price (₹)', 'selling_price', 'number', '0')}
      </div>

      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
          placeholder="Bike condition, features, etc."
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
          className="h-4 w-4 rounded accent-indigo-500" />
        <span className="text-sm text-white/70">Mark as Featured Bike</span>
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} className="text-white/50 hover:text-white">Cancel</Button>
        <Button type="submit" disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">
          {saving ? 'Saving...' : isEdit ? 'Update Bike' : 'Add Bike'}
        </Button>
      </div>
    </form>
  );
}

// ─── Main Inventory Page ─────────────────────────────────────────────────────
export default function Inventory() {
  const [bikes, setBikes] = useState<DealerBike[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus | 'All'>('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [sortField, setSortField] = useState<'bike_name' | 'brand' | 'selling_price' | 'created_at'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editBike, setEditBike] = useState<DealerBike | null>(null);
  const [viewBike, setViewBike] = useState<DealerBike | null>(null);
  const [qrBike, setQrBike] = useState<DealerBike | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadBikes(); }, []);

  async function loadBikes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('dealer_bikes')
      .select('*, bike_images(*)')
      .order(sortField, { ascending: sortDir === 'asc' });
    if (error) toast.error('Failed to load bikes');
    else setBikes(data as DealerBike[]);
    setLoading(false);
  }

  async function deleteBike(id: string) {
    if (!confirm('Delete this bike? This cannot be undone.')) return;
    const { error } = await supabase.from('dealer_bikes').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Bike deleted'); loadBikes(); }
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} bike(s)?`)) return;
    const { error } = await supabase.from('dealer_bikes').delete().in('id', Array.from(selected));
    if (error) toast.error(error.message);
    else { toast.success(`${selected.size} bikes deleted`); setSelected(new Set()); loadBikes(); }
  }

  function exportCSV() {
    const rows = filtered.map(b => ({
      Name: b.bike_name, Brand: b.brand, Model: b.model, Year: b.model_year,
      'Reg No': b.registration_number, Color: b.color, 'Fuel Type': b.fuel_type,
      'KMs Driven': b.kms_driven, 'Purchase ₹': b.purchase_price,
      'Selling ₹': b.selling_price, Status: b.stock_status,
      'Added': new Date(b.created_at).toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, 'campusride-inventory.xlsx');
  }

  function downloadQR() {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `qr-${qrBike?.registration_number || qrBike?.id}.svg`;
    a.click(); URL.revokeObjectURL(url);
  }

  const brands = ['All', ...Array.from(new Set(bikes.map(b => b.brand)))];
  const filtered = bikes.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.bike_name.toLowerCase().includes(q) || b.brand.toLowerCase().includes(q)
      || b.registration_number?.toLowerCase().includes(q) || b.chassis_number?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || b.stock_status === statusFilter;
    const matchBrand = brandFilter === 'All' || b.brand === brandFilter;
    return matchSearch && matchStatus && matchBrand;
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const allSelected = filtered.length > 0 && filtered.every(b => selected.has(b.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map(b => b.id)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Bike Inventory</h1>
          <p className="text-white/50 text-sm mt-0.5">{bikes.length} bikes total · {bikes.filter(b => b.stock_status === 'Available').length} available</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button onClick={bulkDelete} variant="destructive" size="sm" className="gap-2 text-xs">
              <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.size})
            </Button>
          )}
          <Button onClick={exportCSV} variant="outline" size="sm"
            className="gap-2 border-white/10 bg-white/5 text-white/70 hover:bg-white/10 text-xs">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button onClick={() => { setEditBike(null); setShowForm(true); }} size="sm"
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
            <Plus className="h-3.5 w-3.5" /> Add Bike
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, reg no., chassis..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:border-indigo-500/50" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50">
          {['All', 'Available', 'Reserved', 'Sold', 'Under Maintenance'].map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
        </select>
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50">
          {brands.map(b => <option key={b} value={b} className="bg-gray-900">{b}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-left w-10">
                  <button onClick={toggleAll}>{allSelected ? <CheckSquare className="h-4 w-4 text-indigo-400" /> : <Square className="h-4 w-4 text-white/30" />}</button>
                </th>
                <th className="p-4 text-left">
                  <button onClick={() => toggleSort('bike_name')} className="flex items-center gap-1 text-xs font-semibold text-white/50 uppercase tracking-wider hover:text-white">
                    Bike Name {sortField === 'bike_name' ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                  </button>
                </th>
                <th className="p-4 text-left">
                  <button onClick={() => toggleSort('brand')} className="flex items-center gap-1 text-xs font-semibold text-white/50 uppercase tracking-wider hover:text-white">
                    Brand {sortField === 'brand' ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                  </button>
                </th>
                <th className="p-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Reg No</th>
                <th className="p-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Status</th>
                <th className="p-4 text-left">
                  <button onClick={() => toggleSort('selling_price')} className="flex items-center gap-1 text-xs font-semibold text-white/50 uppercase tracking-wider hover:text-white">
                    Price {sortField === 'selling_price' ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                  </button>
                </th>
                <th className="p-4 text-right text-xs font-semibold text-white/50 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-12 text-center text-white/30 text-sm">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Package className="h-10 w-10 text-white/15 mx-auto mb-3" />
                    <p className="text-white/30 text-sm">No bikes found</p>
                  </td>
                </tr>
              ) : filtered.map((bike, i) => (
                <motion.tr key={bike.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${selected.has(bike.id) ? 'bg-indigo-500/10' : ''}`}>
                  <td className="p-4">
                    <button onClick={() => toggleSelect(bike.id)}>
                      {selected.has(bike.id) ? <CheckSquare className="h-4 w-4 text-indigo-400" /> : <Square className="h-4 w-4 text-white/30" />}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {bike.main_image_url
                          ? <img src={bike.main_image_url} alt="" className="h-full w-full object-cover" />
                          : <Package className="h-5 w-5 text-white/20" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white text-xs">{bike.bike_name}</span>
                          {bike.is_featured && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                        </div>
                        <span className="text-[10px] text-white/40">{bike.model} · {bike.model_year}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-white/70 font-semibold">{bike.brand}</td>
                  <td className="p-4 text-xs text-white/50 font-mono">{bike.registration_number || '—'}</td>
                  <td className="p-4"><StatusBadge status={bike.stock_status} /></td>
                  <td className="p-4 text-xs font-bold text-white">
                    {bike.selling_price ? `₹${bike.selling_price.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewBike(bike)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="View Details">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setQrBike(bike)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="QR Code">
                        <QrCode className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { setEditBike(bike); setShowForm(true); }}
                        className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-white/40 hover:text-indigo-400 transition-colors" title="Edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteBike(bike.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
          <p className="text-xs text-white/30">{filtered.length} of {bikes.length} bikes</p>
          {selected.size > 0 && <p className="text-xs text-indigo-400">{selected.size} selected</p>}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditBike(null); }}>
        <DialogContent className="max-w-2xl bg-gray-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{editBike ? 'Edit Bike' : 'Add New Bike'}</DialogTitle>
          </DialogHeader>
          <BikeForm bike={editBike} onSave={loadBikes} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      {/* View Bike Details Dialog */}
      <Dialog open={!!viewBike} onOpenChange={v => !v && setViewBike(null)}>
        <DialogContent className="max-w-md bg-gray-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Bike Details</DialogTitle>
          </DialogHeader>
          {viewBike && (
            <div className="space-y-4 pt-2">
              <div className="h-48 w-full rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                {viewBike.main_image_url ? (
                  <img src={viewBike.main_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-12 w-12 text-white/20" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{viewBike.bike_name}</h3>
                <p className="text-xs text-white/40">{viewBike.brand} · {viewBike.model} · {viewBike.model_year}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs border-t border-white/10 pt-3">
                <div>
                  <p className="text-white/40">Status</p>
                  <p className="mt-0.5"><StatusBadge status={viewBike.stock_status} /></p>
                </div>
                <div>
                  <p className="text-white/40">Selling Price</p>
                  <p className="font-bold text-white mt-0.5">₹{viewBike.selling_price?.toLocaleString() || '—'}</p>
                </div>
                <div>
                  <p className="text-white/40">Reg Number</p>
                  <p className="font-mono text-white mt-0.5">{viewBike.registration_number || '—'}</p>
                </div>
                <div>
                  <p className="text-white/40">KMs Driven</p>
                  <p className="text-white mt-0.5">{viewBike.kms_driven?.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="text-white/40">Fuel Type</p>
                  <p className="text-white mt-0.5">{viewBike.fuel_type}</p>
                </div>
                <div>
                  <p className="text-white/40">Color</p>
                  <p className="text-white mt-0.5">{viewBike.color || '—'}</p>
                </div>
                <div>
                  <p className="text-white/40">Chassis No</p>
                  <p className="font-mono text-white mt-0.5">{viewBike.chassis_number || '—'}</p>
                </div>
                <div>
                  <p className="text-white/40">Engine No</p>
                  <p className="font-mono text-white mt-0.5">{viewBike.engine_number || '—'}</p>
                </div>
              </div>

              {viewBike.description && (
                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs text-white/40">Description</p>
                  <p className="text-xs text-white/70 mt-1 whitespace-pre-line">{viewBike.description}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={() => setViewBike(null)} className="bg-white/10 hover:bg-white/20 text-white text-xs">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrBike} onOpenChange={v => !v && setQrBike(null)}>
        <DialogContent className="max-w-sm bg-gray-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">QR Code</DialogTitle>
          </DialogHeader>
          {qrBike && (
            <div className="flex flex-col items-center gap-5 pt-2">
              <p className="text-xs text-white/50 text-center">{qrBike.bike_name} — {qrBike.registration_number}</p>
              <div ref={qrRef} className="p-4 bg-white rounded-2xl">
                <QRCodeSVG value={`https://campusride.com/bike/${qrBike.id}`} size={200} level="H" includeMargin />
              </div>
              <p className="text-[10px] text-white/30 text-center font-mono break-all">
                campusride.com/bike/{qrBike.id}
              </p>
              <div className="flex gap-3 w-full">
                <Button onClick={downloadQR} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-2">
                  <Download className="h-3.5 w-3.5" /> Download SVG
                </Button>
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`https://campusride.com/bike/${qrBike.id}`); toast.success('Link copied!'); }}
                  className="flex-1 border-white/10 text-white/60 hover:bg-white/5 text-xs gap-2">
                  <Copy className="h-3.5 w-3.5" /> Copy Link
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
