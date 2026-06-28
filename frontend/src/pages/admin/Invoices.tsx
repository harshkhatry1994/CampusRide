import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DealerInvoice } from '@/lib/admin-types';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { FileText, Download, Printer, Search, X, Eye, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to format date as DD-MM-YYYY
function formatDateDDMMYYYY(dateStr: string) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// ─── PDF Generator ────────────────────────────────────────────────────────────
function generateInvoicePDF(invoice: DealerInvoice) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const sale = invoice.dealer_sales as any;
  const bike = (invoice.dealer_bikes || sale?.dealer_bikes) as any;
  const customer = (invoice.dealer_customers || sale?.dealer_customers) as any;

  // Header gradient bar
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 210, 40, 'F');

  // Company / Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CampusRide Invoice', 14, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Dealership Management Portal', 14, 25);

  // Invoice label
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', 150, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoice_number, 150, 22, { align: 'center' });

  // Format Date to DD-MM-YYYY
  const formattedDate = formatDateDDMMYYYY(invoice.issued_date);
  doc.setFontSize(8);
  doc.text(`Date: ${formattedDate}`, 150, 29, { align: 'center' });

  // Reset color
  doc.setTextColor(30, 30, 30);

  // Customer details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer:', 14, 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(customer?.full_name || '—', 14, 58);
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  if (customer?.mobile) doc.text(`Phone: ${customer.mobile}`, 14, 64);
  if (customer?.email) doc.text(`Email: ${customer.email}`, 14, 69);
  doc.setTextColor(30, 30, 30);

  // Bike details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Bike:', 120, 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(bike?.bike_name || '—', 120, 58);
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Registration: ${bike?.registration_number || '—'}`, 120, 64);
  if (bike?.brand) doc.text(`Brand: ${bike.brand} ${bike.model || ''}`, 120, 69);
  if (bike?.chassis_number) doc.text(`Chassis: ${bike.chassis_number}`, 120, 74);
  doc.setTextColor(30, 30, 30);

  // Divider
  doc.setDrawColor(220, 220, 235);
  doc.line(14, 82, 196, 82);

  // Items table
  const saleData = sale || {};
  const salePrice = Number(saleData.sale_price || 0);
  const discount = Number(saleData.discount || 0);
  const gstPct = Number(saleData.gst_percentage || 18);
  const gstAmt = Number(saleData.gst_amount || 0);
  const additional = Number(saleData.additional_charges || 0);
  const finalAmt = Number(saleData.final_amount || 0);

  autoTable(doc, {
    startY: 88,
    head: [['#', 'Description', 'Qty', 'Rate (₹)', 'Amount (₹)']],
    body: [
      ['1', `${bike?.bike_name || 'Motorcycle'} (${bike?.model_year || ''})`, '1', salePrice.toLocaleString(), salePrice.toLocaleString()],
      ...(additional > 0 ? [['2', saleData.additional_charges_note || 'Additional Charges', '1', additional.toLocaleString(), additional.toLocaleString()]] : []),
    ],
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: { 0: { cellWidth: 10 }, 2: { cellWidth: 12, halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Summary
  const summaryRows = [
    ['Subtotal', `₹${salePrice.toLocaleString()}`],
    ...(discount > 0 ? [['Discount', `-₹${discount.toLocaleString()}`]] : []),
    [`GST (${gstPct}%)`, `₹${gstAmt.toLocaleString()}`],
    ...(additional > 0 ? [['Additional Charges', `₹${additional.toLocaleString()}`]] : []),
  ];

  doc.setFontSize(8.5);
  let y = finalY;
  summaryRows.forEach(([k, v]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(k, 140, y);
    doc.text(v, 196, y, { align: 'right' });
    y += 6;
  });

  // Total box
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(130, y, 66, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('GRAND TOTAL', 134, y + 7);
  doc.text(`₹${finalAmt.toLocaleString()}`, 196, y + 7, { align: 'right' });

  // Payment info
  doc.setTextColor(30, 30, 30);
  y += 18;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Method:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(saleData.payment_method || '—', 55, y);

  // Footer
  doc.setFillColor(245, 245, 250);
  doc.rect(0, 272, 210, 25, 'F');
  doc.setTextColor(120, 120, 140);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your purchase from CampusRide Dealership. This is a computer-generated invoice.', 105, 280, { align: 'center' });
  doc.text('For queries: admin@campusride.com | www.campusride.com', 105, 286, { align: 'center' });

  // Signature area
  doc.setDrawColor(180, 180, 200);
  doc.line(14, 260, 80, 260);
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 140);
  doc.text('Authorised Signatory', 14, 265);

  return doc;
}

// ─── Invoice Preview ──────────────────────────────────────────────────────────
function InvoicePreview({ invoice }: { invoice: DealerInvoice }) {
  const sale = invoice.dealer_sales as any;
  const bike = (invoice.dealer_bikes || sale?.dealer_bikes) as any;
  const customer = (invoice.dealer_customers || sale?.dealer_customers) as any;
  const finalAmt = Number(sale?.final_amount || 0);

  return (
    <div className="bg-white text-gray-900 rounded-xl overflow-hidden shadow-2xl max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="bg-indigo-600 p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black">CampusRide Invoice</h2>
            <p className="text-indigo-200 text-xs mt-0.5">Dealership Management Portal</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{invoice.invoice_number}</p>
            <p className="text-indigo-200 text-xs">{formatDateDDMMYYYY(invoice.issued_date)}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${invoice.status === 'paid' ? 'bg-emerald-400 text-emerald-900' : 'bg-white/20 text-white'}`}>
              {invoice.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Customer</p>
            <p className="font-bold text-sm">{customer?.full_name || '—'}</p>
            <p className="text-xs text-gray-500">{customer?.mobile}</p>
            <p className="text-xs text-gray-500">{customer?.email}</p>
            <p className="text-xs text-gray-500">{[customer?.city, customer?.state].filter(Boolean).join(', ')}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Vehicle</p>
            <p className="font-bold text-sm">{bike?.bike_name || '—'}</p>
            <p className="text-xs text-gray-500">Registration: {bike?.registration_number || '—'}</p>
            <p className="text-xs text-gray-500">Chassis: {bike?.chassis_number || '—'}</p>
            <p className="text-xs text-gray-500">Engine: {bike?.engine_number || '—'}</p>
          </div>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-gray-50">
            <th className="p-2 text-left text-xs text-gray-500 font-semibold">Description</th>
            <th className="p-2 text-right text-xs text-gray-500 font-semibold">Amount</th>
          </tr></thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="p-2 text-xs">{bike?.bike_name} {bike?.model_year && `(${bike.model_year})`}</td>
              <td className="p-2 text-right text-xs font-semibold">₹{Number(sale?.sale_price || 0).toLocaleString()}</td>
            </tr>
            {sale?.discount > 0 && <tr className="border-b border-gray-100">
              <td className="p-2 text-xs text-emerald-600">Discount</td>
              <td className="p-2 text-right text-xs text-emerald-600">-₹{Number(sale.discount).toLocaleString()}</td>
            </tr>}
            <tr className="border-b border-gray-100">
              <td className="p-2 text-xs">GST ({sale?.gst_percentage}%)</td>
              <td className="p-2 text-right text-xs">₹{Number(sale?.gst_amount || 0).toLocaleString()}</td>
            </tr>
            {sale?.additional_charges > 0 && <tr className="border-b border-gray-100">
              <td className="p-2 text-xs">{sale.additional_charges_note || 'Additional Charges'}</td>
              <td className="p-2 text-right text-xs">₹{Number(sale.additional_charges).toLocaleString()}</td>
            </tr>}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="bg-indigo-600 text-white px-6 py-3 rounded-xl">
            <p className="text-[10px] uppercase tracking-widest mb-0.5 text-indigo-200">Grand Total</p>
            <p className="text-xl font-black">₹{finalAmt.toLocaleString()}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <p className="text-center text-xs text-gray-400 italic">
            Thank you for your purchase. For queries: admin@campusride.com
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Invoices Page ───────────────────────────────────────────────────────
export default function Invoices() {
  const [invoices, setInvoices] = useState<DealerInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<DealerInvoice | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => { loadInvoices(); }, []);

  async function loadInvoices() {
    setLoading(true);
    const { data, error } = await supabase
      .from('dealer_invoices')
      .select(`*, dealer_sales(*, dealer_bikes(bike_name, brand, registration_number, chassis_number, engine_number, model_year), dealer_customers(full_name, mobile, email, city, state)), dealer_bikes(bike_name), dealer_customers(full_name)`)
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load invoices');
    else setInvoices(data as DealerInvoice[]);
    setLoading(false);
  }

  async function handleGenerateInvoice(inv: DealerInvoice) {
    setGeneratingId(inv.id);
    const toastId = toast.loading('Generating & uploading invoice...');
    try {
      // 1. Generate jsPDF document
      const doc = generateInvoicePDF(inv);
      const pdfBlob = doc.output('blob');

      // 2. Upload to Supabase Storage
      const fileName = `invoice_${inv.invoice_number || inv.id}.pdf`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('invoices')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadErr) throw uploadErr;

      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      // 4. Update the table in database
      const { error: updateErr } = await supabase
        .from('dealer_invoices')
        .update({ pdf_url: publicUrl })
        .eq('id', inv.id);

      if (updateErr) throw updateErr;

      toast.success('Invoice PDF uploaded & saved to database!', { id: toastId });
      await loadInvoices();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to generate invoice', { id: toastId });
    } finally {
      setGeneratingId(null);
    }
  }

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    return !q || inv.invoice_number.toLowerCase().includes(q)
      || (inv.dealer_customers as any)?.full_name?.toLowerCase().includes(q)
      || (inv.dealer_bikes as any)?.bike_name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Invoices</h1>
          <p className="text-white/50 text-sm mt-0.5">{invoices.length} invoices generated</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by invoice no., customer, bike..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:border-indigo-500/50" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {['Invoice #', 'Date', 'Customer', 'Bike', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} className="p-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-12 text-center text-white/30">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <FileText className="h-10 w-10 text-white/15 mx-auto mb-3" />
                    <p className="text-white/30 text-sm">No invoices yet — create a sale first</p>
                  </td>
                </tr>
              ) : filtered.map((inv, i) => {
                const sale = inv.dealer_sales as any;
                return (
                  <motion.tr key={inv.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-xs text-indigo-400 font-bold">{inv.invoice_number}</td>
                    <td className="p-4 text-xs text-white/50">{formatDateDDMMYYYY(inv.issued_date)}</td>
                    <td className="p-4 text-xs text-white">{(inv.dealer_customers as any)?.full_name || '—'}</td>
                    <td className="p-4 text-xs text-white/60">{(inv.dealer_bikes as any)?.bike_name || sale?.dealer_bikes?.bike_name || '—'}</td>
                    <td className="p-4 text-xs font-bold text-white">₹{Number(sale?.final_amount || 0).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${inv.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : inv.status === 'issued' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-white/10 text-white/50 border-white/20'}`}>
                        {inv.status === 'paid' ? <CheckCircle className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {inv.pdf_url ? (
                          <>
                            <a href={inv.pdf_url} target="_blank" rel="noreferrer" download
                              className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors" title="Download Uploaded PDF">
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            <button onClick={() => setPreview(inv)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Preview">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => { const pdf = generateInvoicePDF(inv); pdf.autoPrint(); pdf.output('dataurlnewwindow'); }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Print">
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <Button onClick={() => handleGenerateInvoice(inv)} size="sm" disabled={generatingId === inv.id}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1 px-2.5 rounded-xl flex items-center gap-1 h-7">
                            {generatingId === inv.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <FileText className="h-3 w-3" />
                            )}
                            Generate Invoice
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs text-white/30">{filtered.length} of {invoices.length} invoices</p>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={!!preview} onOpenChange={v => !v && setPreview(null)}>
        <DialogContent className="max-w-2xl bg-gray-950 border-white/10 p-0 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <p className="text-white font-bold text-sm">Invoice Preview</p>
            <div className="flex gap-2">
              {preview && <>
                <Button size="sm" onClick={() => { const pdf = generateInvoicePDF(preview); pdf.save(`${preview.invoice_number}.pdf`); }}
                  className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                  <Download className="h-3 w-3" /> PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => { const pdf = generateInvoicePDF(preview); pdf.autoPrint(); pdf.output('dataurlnewwindow'); }}
                  className="gap-1.5 border-white/10 text-white/60 hover:bg-white/5 text-xs">
                  <Printer className="h-3 w-3" /> Print
                </Button>
              </>}
            </div>
          </div>
          <div className="p-4">
            {preview && <InvoicePreview invoice={preview} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
