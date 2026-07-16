import express from 'express';
import { sendBookingEmail } from '../services/emailService.js';
import { sendBookingNotification, sendCustomerNotification } from '../services/telegramService.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const eventDetails = req.body;
    const { type = 'booking', userId, customerEmail, title, message: customMessage } = eventDetails;
    
    console.log("========== NOTIFY ==========");
    console.log(eventDetails);
    
    // 1. Determine Title and Message based on event details or fallback to booking details
    let notificationTitle = title || 'Update from CampusRide';
    let notificationMessage = customMessage || `You have a new update regarding your account or booking.`;

    if (!title) {
      const bName = eventDetails.bikeName || 'your bike';
      switch (type) {
        case 'booking_created':
          notificationTitle = 'Booking Received';
          notificationMessage = `Your booking for ${bName} has been received and is pending approval.`;
          break;
        case 'booking_approved':
          notificationTitle = 'Booking Approved';
          notificationMessage = `Your booking for ${bName} has been approved!`;
          break;
        case 'booking_confirmed':
          notificationTitle = 'Booking Confirmed';
          notificationMessage = `Your booking for ${bName} has been confirmed! Get ready for your ride.`;
          break;
        case 'booking_pending':
          notificationTitle = 'Payment Submitted';
          notificationMessage = `Your payment for ${bName} has been submitted and is under review.`;
          break;
        case 'booking_rejected':
          notificationTitle = 'Booking Rejected';
          notificationMessage = `Unfortunately, your booking for ${bName} was rejected. Please contact support.`;
          break;
        case 'booking_cancelled':
          notificationTitle = 'Booking Cancelled';
          notificationMessage = `Your booking for ${bName} has been cancelled successfully.`;
          break;
        case 'booking_completed':
          notificationTitle = 'Ride Completed';
          notificationMessage = `Hope you enjoyed your ride on the ${bName}! Your booking is now complete.`;
          break;
        case 'ride_started':
          notificationTitle = 'Ride Started';
          notificationMessage = `Your ride for ${bName} has officially started. Ride safe!`;
          break;
        case 'ride_returned':
          notificationTitle = 'Ride Returned';
          notificationMessage = `Your ${bName} has been returned. Awaiting final inspection.`;
          break;
        case 'payment_submitted':
          notificationTitle = 'Payment Submitted';
          notificationMessage = `Your payment for ${bName} has been submitted for verification.`;
          break;
        case 'payment_success':
        case 'payment_approved':
          notificationTitle = 'Payment Approved';
          notificationMessage = `Your payment of ₹${eventDetails.paymentAmount || ''} for ${bName} was successful.`;
          break;
        case 'payment_rejected':
          notificationTitle = 'Payment Rejected';
          notificationMessage = `Your payment for ${bName} was rejected. Please try again.`;
          break;
        case 'membership_approved':
          notificationTitle = 'Membership Approved';
          notificationMessage = `Welcome to CampusRide Premium! Your membership is now active.`;
          break;
        case 'membership_rejected':
          notificationTitle = 'Membership Rejected';
          notificationMessage = `There was an issue with your membership application. Please check your dashboard.`;
          break;
        case 'admin_message':
          notificationTitle = title || 'Admin Message';
          notificationMessage = customMessage || 'You have a new message from the Admin.';
          break;
      }
    }

    // 2. Insert into Notifications Table (In-App)
    if (userId) {
      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          title: notificationTitle,
          message: notificationMessage,
          type: type,
          read: false,
          created_at: new Date().toISOString()
        });
      } catch (e) {
        console.error("Failed to insert DB notification", e);
      }
    }

    // 3. Send Email Notification
    if (customerEmail && process.env.RESEND_API_KEY) {
      try {
        if (['booking', 'booking_created', 'booking_approved', 'booking_confirmed', 'payment_success'].includes(type)) {
           await sendBookingEmail(eventDetails);
        } else {
           console.log(`Sending generic email to ${customerEmail}: ${notificationTitle}`);
        }
      } catch (e) {
        console.error("Email notification failed", e);
      }
    }

    // 4. Send Telegram Notifications
    // Admin Telegram Notification
    if (['booking', 'booking_created'].includes(type)) {
      try {
        await sendBookingNotification(eventDetails);
      } catch (e) {
        console.error("Admin Telegram notification failed", e);
      }
    }

    // Customer Telegram Notification
    if (userId) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('telegram_chat_id')
          .eq('id', userId)
          .single();

        if (profile?.telegram_chat_id) {
          const telegramMsg = `🔔 <b>${notificationTitle}</b>\n\n${notificationMessage}`;
          await sendCustomerNotification(profile.telegram_chat_id, telegramMsg);
        }
      } catch (e) {
        console.error("Customer Telegram notification failed", e);
      }
    }

    res.status(200).json({ success: true, message: 'Notifications dispatched' });
  } catch (error) {
    console.error('Failed to process notifications', error);
    res.status(500).json({ success: false, message: 'Failed to process notifications' });
  }
});

export default router;
