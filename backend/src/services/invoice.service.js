/**
 * Mock Invoice Generation Service
 * In a production app, this would use pdf-lib, PDFKit, or html-pdf-node 
 * to generate a real PDF and return the buffer or file path.
 */

export const generateInvoice = async (booking, user, bike) => {
  return new Promise((resolve) => {
    console.log(`\n========================================`);
    console.log(`📄 [MOCK INVOICE GENERATOR] Started...`);
    console.log(`Generating invoice for Booking ID: ${booking.bookingId || booking._id}`);
    
    // Simulate generation time
    setTimeout(() => {
      console.log(`Customer: ${user.name} (${user.email})`);
      console.log(`Bike: ${bike.brand} ${bike.model}`);
      console.log(`Dates: ${new Date(booking.startDate).toDateString()} to ${new Date(booking.endDate).toDateString()}`);
      console.log(`Total Amount: ₹${booking.pricing?.totalAmount}`);
      console.log(`Status: ${booking.payment?.status} (${booking.payment?.method})`);
      console.log(`✅ [MOCK INVOICE GENERATOR] Invoice successfully generated.`);
      console.log(`========================================\n`);
      
      // We would normally return a path like '/invoices/INV-123.pdf'
      resolve(`/mock/invoice/${booking._id}.pdf`);
    }, 1500); // simulate 1.5s delay
  });
};
