import { sendBookingNotification } from '../services/telegramService.js';

export const sendNotification = async (req, res) => {
  try {
    const bookingDetails = req.body;
    await sendBookingNotification(bookingDetails);
    res.status(200).json({ success: true, message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Failed to send notification', error);
    res.status(500).json({ success: false, message: 'Failed to send notification' });
  }
};
