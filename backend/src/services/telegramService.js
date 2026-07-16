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
    throw error;
  }
};

export const sendCustomerNotification = async (chatId, message) => {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_BOT_TOKEN || !chatId) return null;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
    return response.data;
  } catch (error) {
    console.error("Telegram Error Status:", error.response?.status);
    console.error("Telegram Error Data:", error.response?.data);
    throw error;
  }
};
