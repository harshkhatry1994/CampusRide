import nodemailer from 'nodemailer';

/**
 * Create a reusable transporter using Gmail SMTP
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send booking confirmation email to the customer
 */
export const sendBookingConfirmation = async (booking, user, bike) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"CampusRide 🚲" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `✅ Booking Confirmed – #${booking._id.toString().slice(-8).toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #0f172a; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
            .header h1 { color: #fff; margin: 0; font-size: 28px; }
            .header p { color: #e0e7ff; margin: 8px 0 0; font-size: 14px; }
            .body { padding: 32px; color: #e2e8f0; }
            .greeting { font-size: 18px; margin-bottom: 16px; color: #f1f5f9; }
            .details-card { background: rgba(99, 102, 241, 0.1); border: 1px solid #4f46e5; border-radius: 12px; padding: 24px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.1); }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #94a3b8; font-size: 14px; }
            .detail-value { color: #f1f5f9; font-weight: 600; font-size: 14px; }
            .total { background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0; }
            .total-amount { color: #fff; font-size: 32px; font-weight: 700; }
            .total-label { color: #e0e7ff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
            .footer { background: #0f172a; padding: 24px; text-align: center; border-top: 1px solid #1e293b; }
            .footer p { color: #64748b; font-size: 12px; margin: 4px 0; }
            .support { color: #818cf8 !important; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚲 CampusRide</h1>
              <p>Your booking has been confirmed!</p>
            </div>
            <div class="body">
              <p class="greeting">Hey ${user.name} 👋,</p>
              <p>Great news! Your bike rental booking has been placed successfully. Here are your details:</p>
              
              <div class="details-card">
                <div class="detail-row">
                  <span class="detail-label">Booking ID</span>
                  <span class="detail-value">#${booking._id.toString().slice(-8).toUpperCase()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Bike</span>
                  <span class="detail-value">${bike.brand} ${bike.model}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Pickup Date</span>
                  <span class="detail-value">${new Date(booking.startDate).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Pickup Time</span>
                  <span class="detail-value">${booking.pickupTime}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Return Date</span>
                  <span class="detail-value">${new Date(booking.endDate).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Return Time</span>
                  <span class="detail-value">${booking.returnTime}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status</span>
                  <span class="detail-value" style="color: #fbbf24;">⏳ Pending Approval</span>
                </div>
              </div>

              <div class="total">
                <div class="total-label">Total Amount</div>
                <div class="total-amount">₹${booking.pricing.totalAmount.toFixed(2)}</div>
              </div>

              <p style="font-size: 14px; color: #94a3b8;">
                Our team will review your booking and licence shortly. You'll receive an update once it's approved.
              </p>
            </div>
            <div class="footer">
              <p>Need help? Contact us at <a class="support" href="mailto:support@campusride.com">support@campusride.com</a></p>
              <p>© ${new Date().getFullYear()} CampusRide. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Booking confirmation email sent to ${user.email}`);
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
  }
};

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"CampusRide 🚲" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Welcome to CampusRide, ${user.name.split(' ')[0]}! 🚲`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #0f172a; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px; text-align: center; }
            .header h1 { color: #fff; margin: 0; font-size: 32px; }
            .body { padding: 40px; color: #e2e8f0; line-height: 1.6; }
            .greeting { font-size: 20px; font-weight: 600; color: #f1f5f9; margin-bottom: 16px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); }
            .features { margin: 32px 0; }
            .feature-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
            .feature-icon { color: #818cf8; font-size: 18px; }
            .footer { background: #0f172a; padding: 32px; text-align: center; border-top: 1px solid #1e293b; }
            .footer p { color: #64748b; font-size: 12px; margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚲 CampusRide</h1>
            </div>
            <div class="body">
              <p class="greeting">Welcome to the club, ${user.name}! 🏁</p>
              <p>We're thrilled to have you with us. CampusRide is built to give you the freedom to explore the city on premium motorcycles without the hassle of ownership.</p>
              
              <div class="features">
                <div class="feature-item"><span class="feature-icon">⚡</span> Instant booking in under 30 seconds</div>
                <div class="feature-item"><span class="feature-icon">🛡️</span> Verified & safe rides</div>
                <div class="feature-item"><span class="feature-icon">💰</span> Pay only for the hours you ride</div>
              </div>

              <p>Ready to hit the road? Browse our latest KTMs, Apaches, and Royal Enfields.</p>
              
              <a href="${process.env.FRONTEND_URL}/bikes" class="cta-button">Explore Motorcycles</a>

              <p style="margin-top: 32px;">See you on the road!</p>
              <p><strong>The CampusRide Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CampusRide. All rights reserved.</p>
              <p>Main Campus, Building 7, Hub 1</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('❌ Welcome email failed:', error.message);
  }
};

/**
 * Send invoice email with PDF attachment
 */
export const sendInvoiceEmail = async (booking, user, pdfBase64) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"CampusRide 🚲" <${process.env.EMAIL_USER}>`,
      to: user.email,
      cc: process.env.EMAIL_USER, // Admin copy
      subject: `Your CampusRide Invoice – #${(booking.bookingId || booking._id).toString().slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px;">
          <h2 style="color: #6366f1;">Hello, ${user.name}!</h2>
          <p>Please find attached the official invoice for your recent bike rental with CampusRide.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> #${(booking.bookingId || booking._id).toString().slice(-8).toUpperCase()}</p>
            <p><strong>Bike:</strong> ${booking.bike?.brand} ${booking.bike?.model}</p>
            <p><strong>Total Amount:</strong> ₹${booking.pricing.totalAmount.toFixed(2)}</p>
          </div>
          <p>Thank you for riding with us!</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="font-size: 12px; color: #94a3b8;">If you have any questions, reply to this email or contact support@campusride.com</p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice-${booking.bookingId || 'CR'}.pdf`,
          content: pdfBase64.split('base64,')[1],
          encoding: 'base64',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Invoice email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Invoice email failed:', error.message);
    throw error;
  }
};

/**
 * Notify admin of new contact message
 */
export const sendContactNotification = async (contact) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"CampusRide Notifications 🔔" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Contact Message: ${contact.subject}`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px;">
          <h2 style="color: #6366f1;">New Message Received</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p><strong>From:</strong> ${contact.name} (${contact.email})</p>
            <p><strong>Phone:</strong> ${contact.phone || 'N/A'}</p>
            <p><strong>Subject:</strong> ${contact.subject}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">${contact.message}</p>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">You can manage this message in the Admin Panel.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`🔔 Admin notified of new contact message from ${contact.email}`);
  } catch (error) {
    console.error('❌ Admin notification failed:', error.message);
  }
};
