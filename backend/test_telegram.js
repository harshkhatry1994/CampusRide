import dotenv from 'dotenv';
dotenv.config();

import { sendBookingNotification } from './src/services/telegramService.js';

const runTest = async () => {
  try {
    await sendBookingNotification({
        customerName: "Harsh",
        phoneNumber: "9876543210",
        bikeName: "Royal Enfield",
        pickupDate: "06-07-2026",
        returnDate: "07-07-2026",
        paymentAmount: 2500,
        bookingId: "BK101",
        paymentId: "PAY999"
    });
    console.log("Success!");
  } catch (err) {
    console.log("Test failed.");
  }
};

runTest();
