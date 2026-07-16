import express from 'express';
import { supabase } from '../config/supabase.js';
import { sendCustomerNotification } from '../services/telegramService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.text) {
      return res.status(200).send('OK');
    }

    const chatId = message.chat.id;
    const username = message.from.username || message.from.first_name || 'User';
    const text = message.text.trim();

    // Handle /start {userId}
    if (text.startsWith('/start ')) {
      const userId = text.split(' ')[1];
      
      if (!userId) {
        return res.status(200).send('OK');
      }

      // Verify the user exists (optional, but good practice)
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        await sendCustomerNotification(chatId, '❌ Invalid user link. Please use the button from your CampusRide dashboard.');
        return res.status(200).send('OK');
      }

      // Update user profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          telegram_chat_id: chatId.toString(),
          telegram_username: username,
          connected_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Failed to link telegram account:', error);
        await sendCustomerNotification(chatId, '❌ Failed to link account. Please try again later.');
        return res.status(200).send('OK');
      }

      // Send success message
      const successMessage = `
✅ <b>Telegram Connected Successfully!</b>
Welcome, ${username}! You will now receive important updates about your CampusRide bookings here.
      `;
      await sendCustomerNotification(chatId, successMessage);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
