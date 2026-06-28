import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DealerSale, DealerBike, DealerCustomer, PaymentMethod } from '@/lib/admin-types';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Plus, Search, X, TrendingUp, IndianRupee, Download,
  CheckCircle, Clock, XCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';

// ─── Status Badge ────────────────────────────────────────────────────────────
const PAY_STATUS_COLORS: Record<string, string> = {
  Completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Pending:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Failed:    'bg-red-500/20 text-red-400 border-red-500/30',
  Refunded:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

function PayBadge({ status }: { status: string }) {
  const icons: Record<string, React.ReactNode> = {
    Completed: <CheckCircle className="h-3 w-3" />,
    Pending: <Clock className="h-3 w-3" />,
    Failed: <XCircle className="h-3 w-3" />,
    Refunded: <AlertCircle className="h-3 w-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${PAY_STATUS_COLORS[status] || 'bg-white/10 text-white/60 border-white/20'}`}>
      {icons[status]} {status}
    </span>
  );
}

// ─── Sale Form ───────────────────────────────────────────────────────────────
function SaleForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [bikes, setBikes] = useState<DealerBike[]>([]);
  const [customers, setCustomers] = useState<DealerCustomer[]>([]);
  const [form, setForm] = useState({
    bike_id: '', customer_id: '', sale_price: '',
    discount: '0', gst_percentage: '18', additional_charges: '0',
    additional_charges_note: '', payment_method: 'Cash' as PaymentMethod,
    payment_status: 'Completed', notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('dealer_bikes').select('id,bike_name,brand,selling_price').eq('stock_status', 'Available')
      .then(({ data }) => setBikes(data as DealerBike[] || []));
    supabase.from('dealer_customers').select('id,full_name,mobile').order('full_name')
      .then(({ data }) => setCustomers(data as DealerCustomer[] || []));
  }, []);

  const salePrice = parseFloat(form.sale_price) || 0;
  const discount = parseFloat(form.discount) || 0;
  const afterDiscount = Math.max(0, salePrice - discount);
  const gst = (afterDiscount * (parseFloat(form.gst_percentage) || 0)) / 100;
  const additional = parseFloat(form.additional_charges) || 0;
  const finalAmount = afterDiscount + gst + additional;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bike_id || !form.customer_id || !form.sale_price) {
      toast.error('Bike, customer and sale price are required'); return;
    }
    setSaving(true);
    try {
      // 1. Create sale
      const { data: sale, error: saleErr } = await supabase.from('dealer_sales').insert({
        bike_id: form.bike_id, customer_id: form.customer_id,
        sale_price: salePrice, discount, gst_percentage: parseFloat(form.gst_percentage),
        gst_amount: gst, additional_charges: additional,
        additional_charges_note: form.additional_charges_note,
        final_amount: finalAmount, payment_method: form.payment_method,
        payment_status: form.payment_status, notes: form.notes,
      }).select().single();
      if (saleErr) throw saleErr;

      // 2. Mark bike as Sold
      await supabase.from('dealer_bikes').update({ stock_status: 'Sold', updated_at: new Date().toISOString() }).eq('id', form.bike_id);

      // 3. Create invoice record
      await supabase.from('dealer_invoices').insert({
        sale_id: sale.id, bike_id: form.bike_id, customer_id: form.customer_id,
        invoice_number: '', status: 'issued',
      });

      // 4. Log inventory change
      await supabase.from('inventory_logs').insert({
        bike_id: form.bike_id, action: 'sold', old_status: 'Available', new_status: 'Sold',
        notes: `Sale to customer ${form.customer_id}`,
      });

      toast.success('Sale created! Bike marked as Sold. Invoice generated.');
      onSave(); onClose();
    } catch (err: any) {
      toast.error(err.message || 'Sale creation failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
      {/* Bike Selection */}
      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Select Bike (Available only) *</label>
        <select value={form.bike_id} onChange={e => {
          const b = bikes.find(bk => bk.id === e.target.value);
          setForm(f => ({ ...f, bike_id: e.target.value, sale_price: b?.selling_price?.toString() || '' }));
        }} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50">
          <option value="" className="bg-gray-900">— Choose a bike —</option>
          {bikes.map(b => <option key={b.id} value={b.id} className="bg-gray-900">{b.bike_name} ({b.brand}) — ₹{b.selling_price?.toLocaleString()}</option>)}
        </select>
      </div>

      {/* Customer Selection */}
      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Select Customer *</label>
        <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50">
          <option value="" className="bg-gray-900">— Choose a customer —</option>
          {customers.map(c => <option key={c.id} value={c.id} className="bg-gray-900">{c.full_name} {c.mobile ? `(${c.mobile})` : ''}</option>)}
        </select>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Sale Price (₹) *', key: 'sale_price' },
          { label: 'Discount (₹)', key: 'discount' },
          { label: 'GST %', key: 'gst_percentage' },
          { label: 'Additional Charges (₹)', key: 'additional_charges' },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">{label}</label>
            <input type="number" value={form[key as keyof typeof form] as string}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50" />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Additional Charges Note</label>
        <input type="text" value={form.additional_charges_note} onChange={e => setForm(f => ({ ...f, additional_charges_note: e.target.value }))}
          placeholder="e.g. Insurance processing fee"
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-indigo-500/50" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Payment Method</label>
          <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value as PaymentMethod }))}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50">
            {['Cash', 'UPI', 'Card', 'Bank Transfer', 'Finance'].map(m => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Payment Status</label>
          <select value={form.payment_status} onChange={e => setForm(f => ({ ...f, payment_status: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50">
            {['Completed', 'Pending', 'Failed'].map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
          </select>
        </div>
      </div>

      {/* Invoice Summary */}
      {form.sale_price && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Invoice Preview</p>
          {[
            { label: 'Sale Price', val: `₹${salePrice.toLocaleString()}` },
            { label: `Discount`, val: `-₹${discount.toLocaleString()}`, cls: 'text-emerald-400' },
            { label: `GST (${form.gst_percentage}%)`, val: `+₹${gst.toLocaleString()}` },
            { label: 'Additional Charges', val: `+₹${additional.toLocaleString()}` },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-xs text-white/60">
              <span>{r.label}</span><span className={r.cls}>{r.val}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-white/10 flex justify-between">
            <span className="text-sm font-bold text-white">Final Amount</span>
            <span className="text-sm font-black text-indigo-400">₹{finalAmount.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Notes</label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
          placeholder="Any additional notes..."
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-indigo-500/50 resize-none" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} className="text-white/50 hover:text-white">Cancel</Button>
        <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 gap-2">
          {saving ? 'Processing...' : <><CheckCircle className="h-4 w-4" /> Create Sale</>}
        </Button>
      </div>
    </form>
  );
}

// ─── Main Sales Page ──────────────────────────────────────────────────────────
export default function Sales() {
  const [sales, setSales] = useState<DealerSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadSales(); }, []);

  async function loadSales() {
    setLoading(true);
    const { data, error } = await supabase
      .from('dealer_sales')
      .select('*, dealer_bikes(bike_name, brand, registration_number), dealer_customers(full_name, mobile)')
      .order('sale_date', { ascending: false });
    if (error) toast.error('Failed to load sales');
    else setSales(data as DealerSale[]);
    setLoading(false);
  }

  function exportCSV() {
    const rows = filtered.map(s => ({
      'Sale Date': new Date(s.sale_date).toLocaleDateString(),
      Bike: (s.dealer_bikes as any)?.bike_name,
      Customer: (s.dealer_customers as any)?.full_name,
      'Sale Price': s.sale_price,
      Discount: s.discount,
      'GST Amount': s.gst_amount,
      'Additional': s.additional_charges,
      'Final Amount': s.final_amount,
      'Payment Method': s.payment_method,
      'Payment Status': s.payment_status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, 'campusride-sales.xlsx');
  }

  const filtered = sales.filter(s => {
    const q = search.toLowerCase();
    const bike = (s.dealer_bikes as any);
    const cust = (s.dealer_customers as any);
    return !q || bike?.bike_name?.toLowerCase().includes(q) || cust?.full_name?.toLowerCase().includes(q) || cust?.mobile?.includes(q);
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + (Number(s.final_amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Sales</h1>
          <p className="text-white/50 text-sm mt-0.5">{sales.length} transactions · ₹{totalRevenue.toLocaleString()} total</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCSV} variant="outline" size="sm"
            className="gap-2 border-white/10 bg-white/5 text-white/70 hover:bg-white/10 text-xs">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button onClick={() => setShowForm(true)} size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
            <Plus className="h-3.5 w-3.5" /> New Sale
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Sales', val: sales.length, icon: TrendingUp, color: 'text-indigo-400' },
          { label: 'Completed', val: sales.filter(s => s.payment_status === 'Completed').length, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Pending', val: sales.filter(s => s.payment_status === 'Pending').length, icon: Clock, color: 'text-amber-400' },
          { label: 'Revenue', val: `₹${(totalRevenue / 100000).toFixed(2)}L`, icon: IndianRupee, color: 'text-pink-400' },
        ].map((c, i) => (
          <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5">
            <c.icon className={`h-5 w-5 mb-2 ${c.color}`} />
            <p className="text-lg font-black text-white">{c.val}</p>
            <p className="text-xs text-white/40">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by bike or customer..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:border-indigo-500/50" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {['Date', 'Bike', 'Customer', 'Method', 'Amount', 'Status'].map(h => (
                  <th key={h} className="p-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-white/30">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-white/30 text-sm">No sales found</td></tr>
              ) : filtered.map((s, i) => (
                <motion.tr key={s.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-xs text-white/50">{new Date(s.sale_date).toLocaleDateString()}</td>
                  <td className="p-4">
                    <p className="text-xs font-semibold text-white">{(s.dealer_bikes as any)?.bike_name || '—'}</p>
                    <p className="text-[10px] text-white/40">{(s.dealer_bikes as any)?.registration_number || ''}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-xs font-semibold text-white">{(s.dealer_customers as any)?.full_name || '—'}</p>
                    <p className="text-[10px] text-white/40">{(s.dealer_customers as any)?.mobile || ''}</p>
                  </td>
                  <td className="p-4 text-xs text-white/60">{s.payment_method}</td>
                  <td className="p-4">
                    <p className="text-xs font-bold text-white">₹{Number(s.final_amount).toLocaleString()}</p>
                    {s.discount > 0 && <p className="text-[10px] text-emerald-400">-₹{s.discount.toLocaleString()} disc.</p>}
                  </td>
                  <td className="p-4"><PayBadge status={s.payment_status} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs text-white/30">{filtered.length} of {sales.length} sales</p>
        </div>
      </div>

      {/* Create Sale Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl bg-gray-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Sale</DialogTitle>
          </DialogHeader>
          <SaleForm onSave={loadSales} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
