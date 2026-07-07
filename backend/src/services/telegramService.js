import axios from 'axios';

export const sendBookingNotification = async (bookingDetails) => {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  const message = `
🎉 <b>New Booking Received!</b>
<b>Customer:</b> ${bookingDetails.customerName}
<b>Phone:</b> ${bookingDetails.phoneNumber || 'N/A'}
<b>Bike:</b> ${bookingDetails.bikeName}
<b>Pickup Date:</b> ${bookingDetails.pickupDate}
<b>Return Date:</b> ${bookingDetails.returnDate}
<b>Payment Amount:</b> ₹${bookingDetails.paymentAmount}
<b>Booking ID:</b> ${bookingDetails.bookingId}
<b>Payment ID:</b> ${bookingDetails.paymentId}
`;

  console.log("Token:", TELEGRAM_BOT_TOKEN);
  console.log("Chat ID:", TELEGRAM_CHAT_ID);
  console.log("Message:", message);

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });
    return response.data;
  } catch (error) {
    console.error("Telegram Error Status:", error.response?.status);
    console.error("Telegram Error Data:", error.response?.data);
    console.error(error.message);
    throw error;
  }
};
