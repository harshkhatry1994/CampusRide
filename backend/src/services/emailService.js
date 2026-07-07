import { Resend } from 'resend';

export const sendBookingEmail = async (bookingDetails) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  if (!bookingDetails.customerEmail) {
    console.warn("No customer email provided, skipping email notification");
    return null;
  }

  const html = `
    <h2>Booking Confirmed!</h2>
    <p>Hi ${bookingDetails.customerName},</p>
    <p>Your booking for <b>${bookingDetails.bikeName}</b> has been received and is pending admin approval.</p>
    <ul>
      <li>Pickup Date: ${bookingDetails.pickupDate}</li>
      <li>Return Date: ${bookingDetails.returnDate}</li>
      <li>Amount Paid: ₹${bookingDetails.paymentAmount}</li>
      <li>Booking ID: ${bookingDetails.bookingId}</li>
    </ul>
    <p>Thank you for choosing CampusRide!</p>
  `;

  try {
    const data = await resend.emails.send({
      from: 'CampusRide <onboarding@resend.dev>',
      to: bookingDetails.customerEmail,
      subject: `CampusRide Booking Received - ${bookingDetails.bikeName}`,
      html: html,
    });
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
