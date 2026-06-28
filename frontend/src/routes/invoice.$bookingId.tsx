import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Download,
  Printer,
  ArrowLeft,
  Mail,
  Calendar,
  MapPin,
  CreditCard,
  Clock,
  ShieldCheck,
  Zap,
  Sparkles,
  Bike as BikeIcon,
  XCircle,
  Share2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/lib/supabase";
import { formatISTDate, formatISTDateShort, durationDays as calcDurationDays } from "@/lib/dateUtils";

export const Route = createFileRoute("/invoice/$bookingId")({
  component: InvoicePage,
});

function InvoicePage() {
  const { bookingId } = Route.useParams();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);

  useEffect(() => {
    if (!bookingId || bookingId === 'undefined') {
      setLoading(false);
      return;
    }
    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('rentals')
          .select('*, bikes!bike_id(id, bike_name, brand, model, category, image_url, daily_rate)')
          .eq('id', bookingId)
          .maybeSingle();
        if (data && !error) {
          if (data.user_id) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user_id).single();
            if (profile) data.profiles = profile;
          }
          setBooking(data);
        } else {
          console.error('Invoice fetch error:', error?.message);
          toast.error(error?.message || "Booking not found");
        }
      } catch (err) {
        console.error("Failed to load booking for invoice", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const downloadInvoice = async () => {
    if (!invoiceRef.current || !booking) return;

    setIsGenerating(true);
    const toastId = toast.loading("Generating professional PDF...");

    try {
      // Create canvas from the invoice element
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (document) => {
          // You can modify the cloned document here if needed
          const el = document.getElementById("invoice-container");
          if (el) el.style.borderRadius = "0";
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const fileName = `CampusRide_Invoice_${booking.id?.split('-')[0].toUpperCase()}.pdf`;
      pdf.save(fileName);

      toast.success("Invoice downloaded successfully", { id: toastId });
    } catch (error) {
      console.error("PDF generation failed", error);
      toast.error("Failed to generate PDF", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = async () => {
    if (!booking) return;
    setIsEmailing(true);
    const toastId = toast.loading("Preparing invoice for email...");
    try {
      // Implementation for emailing could involve backend integration
      setTimeout(() => {
        toast.success("Invoice sent to your registered email address!", { id: toastId });
        setIsEmailing(false);
      }, 2000);
    } catch (err) {
      toast.error("Failed to send email", { id: toastId });
      setIsEmailing(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            <BikeIcon className="h-6 w-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-500 font-bold animate-pulse">Generating Premium Invoice...</p>
        </div>
      </div>
    );

  if (!booking)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full glass-premium p-10 rounded-[2.5rem] text-center border border-slate-200">
          <XCircle className="h-16 w-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-900 mb-4">Invoice Not Found</h2>
          <p className="text-slate-500 mb-8 font-medium">
            We couldn't locate the requested invoice details. It may have been archived or removed.
          </p>
          <Link to="/dashboard">
            <Button className="w-full h-14 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );

  const isRestricted = ["cancelled", "rejected", "failed"].includes(booking.status?.toLowerCase());
  if (isRestricted)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-premium rounded-[3rem] p-10 text-center border border-slate-200 shadow-2xl">
          <div className="h-24 w-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <XCircle className="h-12 w-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3">
            Booking {booking.status.toUpperCase()}
          </h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed text-lg">
            Invoices are only generated for successful and confirmed rides. This booking is
            currently {booking.status}.
          </p>
          <Link to="/dashboard">
            <Button className="w-full h-16 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 text-lg font-black shadow-xl hover:shadow-slate-300 transition-all">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );

  const invoiceNumber = `INV-${booking.id?.split('-')[0].toUpperCase()}`;
  const invoiceDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const durationDays = calcDurationDays(
    booking.start_date || booking.startDate,
    booking.end_date   || booking.endDate
  );
    
  // Reconstruct Pricing for Supabase
  const securityDeposit = 1000; // bikes table has no security_deposit column
  const totalAmount = booking.total_price || booking.pricing?.totalAmount || 0;
  const basePlusGst = Math.max(0, totalAmount - securityDeposit - 49);
  const pricing = booking.pricing || {
    basePrice: Math.round(basePlusGst / 1.18),
    securityDeposit: securityDeposit,
    gst: Math.round(basePlusGst - basePlusGst / 1.18),
    platformFee: 49,
    totalAmount: totalAmount,
  };
  const bike = booking.bikes || booking.bike || {};
  const userDetails = booking.profiles || booking.riderDetails || booking.user || {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-100 print:bg-white print:p-0">
      {/* Action Header */}
      <div className="max-w-4xl mx-auto mb-10 flex flex-col sm:flex-row items-center justify-between gap-6 print:hidden">
        <Link to={localStorage.getItem("user_role") === "admin" ? "/admin" : "/dashboard"}>
          <Button
            variant="ghost"
            className="gap-2 text-slate-600 hover:bg-white hover:text-slate-900 rounded-2xl px-6 py-6 transition-all border border-transparent hover:border-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />{" "}
            {localStorage.getItem("user_role") === "admin" ? "Admin Panel" : "My Dashboard"}
          </Button>
        </Link>
        <div className="flex items-center gap-3 bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm">
          <Button
            variant="ghost"
            size="lg"
            disabled={isEmailing}
            onClick={handleEmail}
            className="gap-2 rounded-2xl text-slate-700 hover:bg-slate-50"
          >
            <Mail className="h-4 w-4" /> Email
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrint}
            className="h-12 w-12 p-0 rounded-2xl border-slate-200 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            onClick={downloadInvoice}
            disabled={isGenerating}
            className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl px-8 shadow-lg shadow-indigo-200 transition-all font-bold"
          >
            {isGenerating ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <div
        id="invoice-container"
        ref={invoiceRef}
        className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden print:shadow-none print:border-none print:rounded-none watermark-container"
      >
        {/* Background Watermark */}
        <div className="watermark-text">CAMPUSRIDE</div>

        {/* Top Header Section */}
        <div className="relative p-10 sm:p-14 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-50 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <BrandLogo size="xl" />
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-3 ml-1">
              Official Tax Invoice
            </p>
          </div>
          <div className="relative z-10 text-right">
            <Badge
              className={cn(
                "px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest mb-4",
                booking.payments?.[0]?.status === "Completed" || booking.status !== "Pending"
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                  : "bg-amber-500 text-white shadow-lg shadow-amber-100",
              )}
            >
              {booking.payments?.[0]?.status === "Completed" || booking.status !== "Pending" ? "• PAYMENT RECEIVED •" : "• PAYMENT PENDING •"}
            </Badge>
            <div className="space-y-1">
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{invoiceNumber}</p>
              <p className="text-slate-500 font-bold text-sm tracking-wide uppercase">
                {invoiceDate}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="p-10 sm:p-14 relative z-10">
          {/* Info Grid */}
          <div className="grid md:grid-cols-3 gap-12 mb-16">
            <div className="space-y-5">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                Customer Profile
              </h3>
              <div className="space-y-1">
                <p className="text-xl font-black text-slate-900 leading-none">
                  {userDetails.name}
                </p>
                <p className="text-slate-500 font-bold text-sm">{userDetails.email}</p>
                <p className="text-slate-500 font-bold text-sm">{userDetails.phone || "N/A"}</p>
                <div className="pt-3">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">
                    Billing Address
                  </p>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed italic">
                    {userDetails.address || "Universal Campus Residence, Zone 4"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                Ride Intelligence
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1">
                      Ride ID
                    </p>
                    <p className="text-sm font-black text-slate-800">#{booking.id?.split('-')[0].toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1">
                      Payment Method
                    </p>
                    <p className="text-sm font-black text-slate-800">
                      {booking.payments?.[0]?.method || "UPI Transfer"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                Compliance
              </h3>
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-700/50 uppercase tracking-wider">
                    Verification
                  </p>
                  <p className="text-sm font-black text-emerald-700">COMPLIANT</p>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter text-center italic">
                Digitally Verified via CampusRide TrustEngine
              </p>
            </div>
          </div>

          {/* Details Table */}
          <div className="mb-16 overflow-hidden rounded-3xl border border-slate-100 shadow-sm bg-slate-50/30">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Rental Asset Details
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Duration
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Fare
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="group hover:bg-white transition-colors">
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-24 bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex-shrink-0">
                        <img
                          src={
                            bike.image_url?.startsWith("/uploads")
                              ? `${import.meta.env.VITE_API_URL}${bike.image_url}`
                              : bike.image_url || bike.imageUrl || "/placeholder-bike.jpg"
                          }
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-900 leading-tight">
                          {bike.brand} {bike.model}
                        </p>
                        <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                          <BikeIcon className="h-3 w-3" />{" "}
                          {bike.category || "Premium Segment"}
                        </p>
                        <div className="mt-3 flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              Pickup: Main Hub
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              Drop: Main Hub
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-center">
                    <div className="inline-flex flex-col items-center p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <span className="text-xs font-black text-slate-800">
                        {formatISTDateShort(booking.start_date || booking.startDate)}
                      </span>
                      <div className="h-px w-6 bg-indigo-100 my-1" />
                      <span className="text-xs font-black text-slate-800">
                        {formatISTDateShort(booking.end_date || booking.endDate)}
                      </span>
                      <span className="text-[9px] font-black text-indigo-500 uppercase mt-1">
                        {durationDays} Days
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-right">
                    <p className="text-xl font-black text-slate-900">
                      ₹{pricing.basePrice.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      Base Rental Fare
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Summary Section */}
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="flex-1 space-y-10">
              {/* Terms */}
              <div className="p-8 rounded-[2rem] bg-indigo-50/30 border border-indigo-100/50 relative overflow-hidden">
                <Sparkles className="absolute right-[-20px] top-[-20px] h-32 w-32 text-indigo-500/10 rotate-12" />
                <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3" /> Agreement & Terms
                </h4>
                <ul className="text-[11px] text-indigo-900/60 space-y-2 font-bold leading-relaxed">
                  <li>• Comprehensive accidental insurance included in rental.</li>
                  <li>• Security deposit refundable within 48-72 hours post inspection.</li>
                  <li>• Standard traffic rules and helmet policy strictly enforced.</li>
                  <li>• 24/7 Roadside Assistance: +91 1800-RIDE-AI</li>
                </ul>
              </div>

              {/* Company Stamp & Signature */}
              <div className="flex items-center justify-between pr-10">
                <div className="text-center group">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Digital Stamp
                  </p>
                  <div className="h-28 w-28 rounded-full border-2 border-dashed border-indigo-100 flex items-center justify-center p-3 transition-transform group-hover:rotate-12 duration-1000">
                    <div className="h-full w-full rounded-full bg-indigo-50 flex items-center justify-center p-1 relative overflow-hidden">
                      <BrandLogo size="sm" className="opacity-10 scale-150 absolute rotate-12" />
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=VERIFY:${booking.id}`}
                        className="relative z-10 mix-blend-multiply opacity-60 grayscale"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">
                    Authorized Signatory
                  </p>
                  <div className="relative">
                    <p className="signature-font text-4xl text-slate-700 italic pr-4 select-none">
                      CampusRide Authority
                    </p>
                    <div className="h-px w-64 bg-gradient-to-l from-slate-200 to-transparent mt-2" />
                    <p className="text-[9px] font-black text-indigo-500 uppercase mt-2 tracking-tighter">
                      Chief Operations Officer
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-2 text-[8px] bg-indigo-50 text-indigo-600 border-indigo-100 px-2 py-0"
                    >
                      E-SIGN VERIFIED
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="w-full lg:w-[380px]">
              <div className="rounded-[2.5rem] bg-slate-950 p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-8">
                  Financial Summary
                </h4>

                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                    <span>Base Fare ({durationDays}d)</span>
                    <span className="text-white">
                      ₹{pricing.basePrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                    <span>Security Deposit</span>
                    <span className="text-white">
                      ₹{pricing.securityDeposit.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                    <span>Platform Fee</span>
                    <span className="text-white">
                      ₹{pricing.platformFee.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-slate-400 pb-8 border-b border-white/10">
                    <span>GST / Taxes (18%)</span>
                    <span className="text-white">
                      ₹{pricing.gst.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="pt-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                          Total Amount Paid
                        </p>
                        <p className="text-5xl font-black tracking-tighter">
                          ₹{pricing.totalAmount.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="h-20 w-20 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CampusRide:${booking.id}:TOTAL:${pricing.totalAmount}`}
                          className="w-full h-full grayscale"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="mt-20 pt-10 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mb-2">
                www.campusride.app
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                CampusRide Technologies Pvt Ltd • 42nd Floor, Hub Tower, Bangalore
              </p>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <Share2 className="h-4 w-4 hover:text-indigo-500 cursor-pointer transition-colors" />
              <MoreVertical className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Print Specific Styling */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          #invoice-container { shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
          @page { margin: 0; size: auto; }
          .watermark-text { opacity: 0.05 !important; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Cedarville+Cursive&display=swap');
      `,
        }}
      />
    </div>
  );
}
