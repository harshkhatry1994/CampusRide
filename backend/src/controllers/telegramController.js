import { sendBookingNotification } from '../services/telegramService.js';
import { supabase } from '../config/supabase.js';

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

export const generateConnectCode = async (req, res) => {
  // Deprecated endpoint - No longer using connection codes
  res.status(200).json({ success: true, code: 'deprecated' });
};

export const disconnectTelegram = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        telegram_chat_id: null,
        telegram_username: null
      })
      .eq('id', userId);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Disconnected successfully' });
  } catch (error) {
    console.error('Failed to disconnect telegram', error);
    res.status(500).json({ success: false, message: 'Failed to disconnect' });
  }
};
