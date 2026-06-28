import { jsPDF } from "jspdf";
import "jspdf-autotable";

export const generateReceipt = (booking: any) => {
  if (!booking || !booking._id) {
    console.error("Invalid booking data for receipt");
    return;
  }

  try {
    const doc = new jsPDF();
    const bike = booking.rides || booking.bike || {};
    const rider = booking.users || booking.riderDetails || {};
    const pricing = booking.pricing || {
      basePrice: booking.total_price ? Math.round(booking.total_price / 1.18 - 1049) : 0, // Roughly reverse engineer base price if not stored
      securityDeposit: 1000,
      gst: booking.total_price ? Math.round((booking.total_price / 1.18 - 1049) * 0.18) : 0,
      platformFee: 49,
      totalAmount: booking.total_price || 0,
    };
    const bookingIdStr = (booking.bookingId || String(booking.id || booking._id).split('-')[0]).toUpperCase();

    // Header Branding
    doc.setFillColor(38, 38, 38);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(245, 158, 11); // Amber-500
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("RentZ", 20, 25);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Premium Motorcycle Rentals", 20, 32);

    doc.setFontSize(16);
    doc.text("INVOICE / RECEIPT", 140, 25);

    // Invoice Details
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.text(`Booking ID: #${bookingIdStr}`, 20, 55);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 55);

    // Customer & Bike Info
    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER DETAILS", 20, 70);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${rider.name || "N/A"}`, 20, 78);
    doc.text(`Email: ${rider.email || "N/A"}`, 20, 84);
    doc.text(`Phone: ${rider.phone || "N/A"}`, 20, 90);

    doc.setFont("helvetica", "bold");
    doc.text("MOTORCYCLE DETAILS", 120, 70);
    doc.setFont("helvetica", "normal");
    doc.text(`Bike: ${bike.name || "Motorcycle"}`, 120, 78);
    doc.text(`Model: ${bike.brand || ""} ${bike.model || ""}`, 120, 84);
    doc.text(`Fuel: ${bike.fuel_type || bike.fuelType || "Petrol"}`, 120, 90);

    // Rental Timing Table
    (doc as any).autoTable({
      startY: 100,
      head: [["Pickup Location", "Pickup Time", "Return Time", "Duration"]],
      body: [
        [
          bike.pickup_location || bike.pickupLocation || "Campus Hub",
          booking.start_date || booking.startDate
            ? `${new Date(booking.start_date || booking.startDate).toLocaleDateString()} ${new Date(booking.start_date || booking.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : "N/A",
          booking.end_date || booking.endDate
            ? `${new Date(booking.end_date || booking.endDate).toLocaleDateString()} ${new Date(booking.end_date || booking.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : "N/A",
          "1 Day",
        ],
      ],
      headStyles: { fillStyle: "F", fillColor: [38, 38, 38], textColor: [245, 158, 11] },
    });

    // Pricing Breakdown
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("PRICE BREAKDOWN", 20, finalY);

    const pricingData = [
      ["Rental Charge", `INR ${pricing.basePrice || 0}`],
      ["Security Deposit (Refundable)", `INR ${pricing.securityDeposit || 0}`],
      ["GST (18%)", `INR ${pricing.gst || 0}`],
      ["Platform Fee", `INR ${pricing.platformFee || 0}`],
      [
        { content: "TOTAL PAID", styles: { fontStyle: "bold", textColor: [245, 158, 11] } },
        {
          content: `INR ${pricing.totalAmount || 0}`,
          styles: { fontStyle: "bold", textColor: [245, 158, 11] },
        },
      ],
    ];

    (doc as any).autoTable({
      startY: finalY + 5,
      body: pricingData,
      theme: "striped",
      styles: { cellPadding: 3, fontSize: 10 },
      columnStyles: { 0: { cellWidth: 100 }, 1: { halign: "right" } },
    });

    // Verification & Signatures
    const footerY = (doc as any).lastAutoTable.finalY + 20;

    // QR Placeholder
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, footerY, 30, 30);
    doc.setFontSize(8);
    doc.text("SCAN TO VERIFY", 20, footerY + 35);

    // Signature Area
    doc.setFontSize(10);
    doc.text("Authorized Signature", 140, footerY + 20);
    doc.setDrawColor(38, 38, 38);
    doc.line(140, footerY + 22, 190, footerY + 22);

    doc.setFont("courier", "italic");
    doc.text("RentZ Admin", 150, footerY + 15);

    // Stamp Style
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1);
    doc.roundedRect(145, footerY + 30, 40, 15, 2, 2, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(245, 158, 11);
    doc.text("VERIFIED BY", 153, footerY + 36);
    doc.text("RENTZ ADMIN", 152, footerY + 41);

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("RentZ Motorcycle Rentals — Ride with Freedom", 105, 285, { align: "center" });
    doc.text("Support: +91 98765 43210 | support@rentz.com", 105, 290, { align: "center" });

    doc.save(`RentZ_Receipt_${bookingIdStr}.pdf`);
  } catch (err) {
    console.error("Error generating PDF:", err);
  }
};
