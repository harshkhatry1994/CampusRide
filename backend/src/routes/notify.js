import express from 'express';
import { sendBookingEmail } from '../services/emailService.js';
import { sendBookingNotification } from '../services/telegramService.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const bookingDetails = req.body;
    const { customerEmail, userId } = bookingDetails;
    
    console.log("========== NOTIFY ==========");
    console.log(req.body);
    console.log("Customer Email:", customerEmail);
    console.log("User ID:", userId);
    console.log("RESEND API:", process.env.RESEND_API_KEY ? "FOUND" : "MISSING");
    
    // 1. Send Telegram Notification
    try {
      await sendBookingNotification(bookingDetails);
    } catch (e) {
      console.error("Telegram notification failed", e);
    }

    // 2. Send Email Notification
    if (customerEmail && process.env.RESEND_API_KEY) {
      try {
        console.log("Calling sendBookingEmail...");
        await sendBookingEmail(bookingDetails);
        console.log("Email sent successfully.");
      } catch (e) {
        console.error("Email notification failed", e);
      }
    }

    // 3. Insert into Notifications Table
    if (userId) {
      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Booking Received',
          message: `Your booking for ${bookingDetails.bikeName || 'your bike'} has been received and is pending approval.`,
          type: 'booking',
          read: false,
          created_at: new Date().toISOString()
        });
      } catch (e) {
        console.error("Failed to insert DB notification", e);
      }
    }

    res.status(200).json({ success: true, message: 'Notifications dispatched' });
  } catch (error) {
    console.error('Failed to process notifications', error);
    res.status(500).json({ success: false, message: 'Failed to process notifications' });
  }
});

export default router;
