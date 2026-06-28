import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DealerCustomer } from '@/lib/admin-types';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Plus, Search, X, Edit2, Trash2, User, Phone, Mail,
  MapPin, FileText, ChevronDown, ChevronUp, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

// ─── Customer Form ──────────────────────────────────────────────────────────
function CustomerForm({ customer, onSave, onClose }: {
  customer?: DealerCustomer | null; onSave: () => void; onClose: () => void;
}) {
  const isEdit = !!customer;
  const [form, setForm] = useState({
    full_name: customer?.full_name || '',
    mobile: customer?.mobile || '',
    email: customer?.email || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    pincode: customer?.pincode || '',
    aadhaar_number: customer?.aadhaar_number || '',
    licence_number: customer?.licence_number || '',
    pan_number: customer?.pan_number || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name) { toast.error('Full name is required'); return; }
    setSaving(true);
    try {
      let error;
      if (isEdit) {
        ({ error } = await supabase.from('dealer_customers').update({ ...form, updated_at: new Date().toISOString() }).eq('id', customer!.id));
      } else {
        ({ error } = await supabase.from('dealer_customers').insert(form));
      }
      if (error) throw error;
      toast.success(isEdit ? 'Customer updated!' : 'Customer added!');
      onSave(); onClose();
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-all" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Personal Info</p>
        <div className="grid grid-cols-2 gap-4">
          {field('Full Name *', 'full_name', 'text', 'e.g. Rahul Sharma')}
          {field('Mobile', 'mobile', 'tel', '+91 9876543210')}
          {field('Email', 'email', 'email', 'rahul@example.com')}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Address</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">{field('Address', 'address', 'text', 'Street, Area')}</div>
          {field('City', 'city', 'text', 'Mumbai')}
          {field('State', 'state', 'text', 'Maharashtra')}
          {field('Pincode', 'pincode', 'text', '400001')}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Identity (KYC)</p>
        <div className="grid grid-cols-2 gap-4">
          {field('Aadhaar Number', 'aadhaar_number', 'text', 'XXXX XXXX XXXX')}
          {field('Driving Licence No.', 'licence_number', 'text', 'MH0120XX000000')}
          {field('PAN Card No.', 'pan_number', 'text', 'ABCDE1234F')}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} className="text-white/50 hover:text-white">Cancel</Button>
        <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">
          {saving ? 'Saving...' : isEdit ? 'Update Customer' : 'Add Customer'}
        </Button>
      </div>
    </form>
  );
}

// ─── Customer Row ────────────────────────────────────────────────────────────
function CustomerRow({ customer, onEdit, onDelete, delay }: {
  customer: DealerCustomer; onEdit: () => void; onDelete: () => void; delay: number;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}
        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{customer.full_name}</p>
              <p className="text-[10px] text-white/40">{customer.city}{customer.state ? `, ${customer.state}` : ''}</p>
            </div>
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Phone className="h-3 w-3" /> {customer.mobile || '—'}
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Mail className="h-3 w-3" /> {customer.email || '—'}
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-1.5">
            {customer.aadhaar_number && <span className="h-2 w-2 rounded-full bg-emerald-400" title="Aadhaar" />}
            {customer.licence_number && <span className="h-2 w-2 rounded-full bg-blue-400" title="Licence" />}
            {customer.pan_number && <span className="h-2 w-2 rounded-full bg-amber-400" title="PAN" />}
            {!customer.aadhaar_number && !customer.licence_number && !customer.pan_number && (
              <span className="text-[10px] text-white/25">None</span>
            )}
          </div>
        </td>
        <td className="p-4 text-xs text-white/30">{new Date(customer.created_at).toLocaleDateString()}</td>
        <td className="p-4">
          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
            {expanded
              ? <ChevronUp className="h-3.5 w-3.5 text-white/30 mr-1" />
              : <ChevronDown className="h-3.5 w-3.5 text-white/30 mr-1" />}
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-white/40 hover:text-indigo-400 transition-colors">
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </motion.tr>
      {expanded && (
        <tr className="border-b border-white/5 bg-white/2">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid sm:grid-cols-3 gap-4 text-xs text-white/60">
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Address</p>
                <p>{[customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ') || '—'}</p>
              </div>
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">KYC Numbers</p>
                <p>Aadhaar: {customer.aadhaar_number || '—'}</p>
                <p>DL: {customer.licence_number || '—'}</p>
                <p>PAN: {customer.pan_number || '—'}</p>
              </div>
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Registered</p>
                <p>{new Date(customer.created_at).toLocaleString()}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Customers Page ─────────────────────────────────────────────────────
export default function Customers() {
  const [customers, setCustomers] = useState<DealerCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<DealerCustomer | null>(null);

  useEffect(() => { loadCustomers(); }, []);

  async function loadCustomers() {
    setLoading(true);
    const { data, error } = await supabase.from('dealer_customers').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Failed to load customers');
    else setCustomers(data as DealerCustomer[]);
    setLoading(false);
  }

  async function deleteCustomer(id: string) {
    if (!confirm('Delete this customer?')) return;
    const { error } = await supabase.from('dealer_customers').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Customer deleted'); loadCustomers(); }
  }

  function exportCSV() {
    const rows = filtered.map(c => ({
      Name: c.full_name, Mobile: c.mobile, Email: c.email,
      City: c.city, State: c.state, Pincode: c.pincode,
      Aadhaar: c.aadhaar_number, DL: c.licence_number, PAN: c.pan_number,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, 'campusride-customers.xlsx');
  }

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || c.full_name.toLowerCase().includes(q) || c.mobile?.includes(q) || c.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Customers</h1>
          <p className="text-white/50 text-sm mt-0.5">{customers.length} registered customers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCSV} variant="outline" size="sm"
            className="gap-2 border-white/10 bg-white/5 text-white/70 hover:bg-white/10 text-xs">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button onClick={() => { setEditCustomer(null); setShowForm(true); }} size="sm"
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
            <Plus className="h-3.5 w-3.5" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, mobile, email..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:border-indigo-500/50" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Customer</th>
                <th className="p-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Mobile</th>
                <th className="p-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Email</th>
                <th className="p-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">KYC Docs</th>
                <th className="p-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Added</th>
                <th className="p-4 text-right text-xs font-semibold text-white/50 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-white/30 text-sm">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Users className="h-10 w-10 text-white/15 mx-auto mb-3" />
                    <p className="text-white/30 text-sm">No customers found</p>
                  </td>
                </tr>
              ) : filtered.map((c, i) => (
                <CustomerRow key={c.id} customer={c} delay={i * 0.02}
                  onEdit={() => { setEditCustomer(c); setShowForm(true); }}
                  onDelete={() => deleteCustomer(c.id)} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs text-white/30">{filtered.length} of {customers.length} customers</p>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditCustomer(null); }}>
        <DialogContent className="max-w-2xl bg-gray-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{editCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          </DialogHeader>
          <CustomerForm customer={editCustomer} onSave={loadCustomers} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
