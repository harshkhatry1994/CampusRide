import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { Download, TrendingUp, IndianRupee, Bike, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHART_TOOLTIP = {
  backgroundColor: 'rgba(15,15,25,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px', color: '#fff', fontSize: '12px',
};

type ReportType = 'daily-sales' | 'monthly-sales' | 'revenue' | 'inventory';

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>('daily-sales');
  const [loading, setLoading] = useState(false);
  const [dailySalesData, setDailySalesData] = useState<any[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [rawSales, setRawSales] = useState<any[]>([]);
  const [rawBikes, setRawBikes] = useState<any[]>([]);
  const [rawCustomers, setRawCustomers] = useState<any[]>([]);

  useEffect(() => { loadReportData(); }, []);

  async function loadReportData() {
    setLoading(true);
    try {
      // 1. Fetch Sales
      const { data: sales } = await supabase
        .from('dealer_sales')
        .select('*, dealer_bikes(bike_name, brand), dealer_customers(full_name)')
        .order('sale_date', { ascending: true });
      setRawSales(sales || []);

      // 2. Fetch Bikes
      const { data: bikes } = await supabase.from('dealer_bikes').select('*');
      setRawBikes(bikes || []);

      // 3. Fetch Customers
      const { data: customers } = await supabase.from('dealer_customers').select('*');
      setRawCustomers(customers || []);

      // Group Daily Sales (last 30 days)
      const dailyMap: Record<string, { date: string; count: number; amount: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        dailyMap[key] = { date: key, count: 0, amount: 0 };
      }

      sales?.forEach(s => {
        const sd = new Date(s.sale_date);
        const key = sd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        if (dailyMap[key]) {
          dailyMap[key].count += 1;
          dailyMap[key].amount += Number(s.sale_price || s.final_amount || 0);
        }
      });
      setDailySalesData(Object.values(dailyMap));

      // Group Monthly Sales (last 12 months)
      const now = new Date();
      const months12: any[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = `${MONTHS[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
        const monthSales = (sales || []).filter(s => {
          const sd = new Date(s.sale_date);
          return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
        });
        const revenue = monthSales.reduce((sum: number, s: any) => sum + (Number(s.sale_price || s.final_amount) || 0), 0);
        months12.push({ month: label, count: monthSales.length, revenue });
      }
      setMonthlySalesData(months12);

      // Group Inventory by Brand
      const brandMap: Record<string, number> = {};
      (bikes || []).forEach((b: any) => {
        brandMap[b.brand] = (brandMap[b.brand] || 0) + 1;
      });
      setInventoryData(Object.entries(brandMap).map(([brand, count]) => ({ brand, count })));

    } catch (e) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }

  function getExportData() {
    if (reportType === 'daily-sales') {
      return dailySalesData.map(d => ({
        Date: d.date,
        'Sales Count': d.count,
        'Revenue Generated (₹)': d.amount
      }));
    } else if (reportType === 'monthly-sales' || reportType === 'revenue') {
      return monthlySalesData.map(m => ({
        Month: m.month,
        'Sales Count': m.count,
        'Revenue Generated (₹)': m.revenue
      }));
    } else if (reportType === 'inventory') {
      return rawBikes.map(b => ({
        Name: b.bike_name, Brand: b.brand, Model: b.model, Year: b.model_year,
        'Reg No': b.registration_number, Color: b.color, Status: b.stock_status,
        'KMs': b.kms_driven, 'Purchase Price (₹)': b.purchase_price, 'Selling Price (₹)': b.selling_price
      }));
    }
    return [];
  }

  function exportExcel() {
    const data = getExportData();
    const sheetName = reportType.replace('-', ' ').toUpperCase();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `campusride-${reportType}-report.xlsx`);
    toast.success('Excel report exported!');
  }

  function exportCSV() {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `campusride-${reportType}-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV report exported!');
  }

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 297, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(`CampusRide — ${reportType.replace('-', ' ').toUpperCase()}`, 10, 13);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 200, 13, { align: 'right' });

    let head: string[] = [];
    let body: any[][] = [];

    if (reportType === 'daily-sales') {
      head = ['Date', 'Sales Count', 'Revenue'];
      body = dailySalesData.map(d => [d.date, d.count, `₹${d.amount.toLocaleString()}`]);
    } else if (reportType === 'monthly-sales' || reportType === 'revenue') {
      head = ['Month', 'Sales Count', 'Revenue'];
      body = monthlySalesData.map(m => [m.month, m.count, `₹${m.revenue.toLocaleString()}`]);
    } else if (reportType === 'inventory') {
      head = ['Name', 'Brand', 'Model', 'Year', 'Reg No', 'Status', 'Selling Price'];
      body = rawBikes.map(b => [b.bike_name, b.brand, b.model, b.model_year, b.registration_number || '—', b.stock_status, `₹${b.selling_price?.toLocaleString() || '—'}`]);
    }

    autoTable(doc, {
      startY: 25, head: [head], body,
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      margin: { left: 10, right: 10 },
    });
    doc.save(`campusride-${reportType}-report.pdf`);
    toast.success('PDF report exported!');
  }

  const TABS: { id: ReportType; label: string; icon: React.ElementType }[] = [
    { id: 'daily-sales', label: 'Daily Sales', icon: Clock },
    { id: 'monthly-sales', label: 'Monthly Sales', icon: TrendingUp },
    { id: 'revenue', label: 'Revenue Report', icon: IndianRupee },
    { id: 'inventory', label: 'Inventory Report', icon: Bike },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-white/50 text-sm font-medium">Loading report data...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Reports & Analytics</h1>
          <p className="text-white/50 text-sm mt-0.5">Generate, visualize, and export business reports</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCSV} variant="outline" size="sm"
            className="gap-2 border-white/10 bg-white/5 text-white/70 hover:bg-white/10 text-xs">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button onClick={exportExcel} variant="outline" size="sm"
            className="gap-2 border-white/10 bg-white/5 text-white/70 hover:bg-white/10 text-xs">
            <Download className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button onClick={exportPDF} size="sm"
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
            <Download className="h-3.5 w-3.5" /> PDF Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setReportType(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${reportType === tab.id ? 'bg-indigo-600 text-white' : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/8 hover:text-white'}`}>
            <tab.icon className="h-3.5 w-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-base font-bold text-white mb-1">
          {TABS.find(t => t.id === reportType)?.label}
        </h2>
        <p className="text-xs text-white/40 mb-5">
          {reportType === 'daily-sales' ? 'Daily metrics for the last 30 days' : 'Business insights and trends'}
        </p>
        
        <ResponsiveContainer width="100%" height={260}>
          {reportType === 'daily-sales' ? (
            <BarChart data={dailySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Sales Count" />
            </BarChart>
          ) : reportType === 'monthly-sales' ? (
            <BarChart data={monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP} />
              <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} name="Sales Count" />
            </BarChart>
          ) : reportType === 'revenue' ? (
            <LineChart data={monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} name="Revenue" />
            </LineChart>
          ) : (
            <BarChart data={inventoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="brand" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Units" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-bold text-white">Dealership Summary</h3>
        </div>
        <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Sales', val: rawSales.length, icon: TrendingUp, color: 'text-indigo-400' },
            { label: 'Total Revenue', val: `₹${(rawSales.reduce((s, r) => s + (Number(r.sale_price || r.final_amount) || 0), 0) / 100000).toFixed(2)}L`, icon: IndianRupee, color: 'text-emerald-400' },
            { label: 'Total Bikes', val: rawBikes.length, icon: Bike, color: 'text-amber-400' },
            { label: 'Total Customers', val: rawCustomers.length, icon: Users, color: 'text-cyan-400' },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <c.icon className={`h-5 w-5 flex-shrink-0 ${c.color}`} />
              <div>
                <p className="text-sm font-black text-white">{c.val}</p>
                <p className="text-[10px] text-white/40">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
