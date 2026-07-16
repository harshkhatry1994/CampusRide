import express from 'express';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('screenshot'), async (req, res) => {
  try {
    const { bookingId, transactionId, expectedAmount, expectedUpi } = req.body;
    let screenshotBuffer = req.file?.buffer;
    let imageUrl = req.body.imageUrl; // In case the frontend sends a URL directly

    if (!screenshotBuffer && !imageUrl) {
      return res.status(400).json({ success: false, message: 'Screenshot is required' });
    }

    console.log(`Starting AI Payment Verification for Booking: ${bookingId}`);

    // Run Tesseract OCR
    let ocrText = '';
    try {
      const target = screenshotBuffer || imageUrl;
      const { data: { text } } = await Tesseract.recognize(target, 'eng');
      ocrText = text || '';
    } catch (ocrErr) {
      console.error('OCR Error:', ocrErr);
      return res.status(500).json({ success: false, message: 'Failed to process image OCR' });
    }

    const cleanText = ocrText.replace(/\s+/g, ' ').toUpperCase();

    // Verify Fields
    let transactionMatch = false;
    let amountMatch = false;
    let upiMatch = false;
    let confidence = 10;

    // Transaction ID matching (allow slight fuzziness or partial match if length >= 8)
    if (transactionId && transactionId.length >= 8) {
      const cleanTxId = transactionId.toUpperCase().trim();
      if (cleanText.includes(cleanTxId)) {
        transactionMatch = true;
        confidence += 30;
      } else {
        // Try substring match for long IDs
        const partialTxId = cleanTxId.substring(cleanTxId.length - 8);
        if (cleanText.includes(partialTxId)) {
          transactionMatch = true;
          confidence += 25;
        }
      }
    }

    // Amount matching
    if (expectedAmount) {
      const cleanAmt = expectedAmount.toString().trim();
      // Look for the exact amount or ₹amount
      if (cleanText.includes(cleanAmt) || cleanText.includes(`₹${cleanAmt}`) || cleanText.includes(`RS.${cleanAmt}`) || cleanText.includes(`RS ${cleanAmt}`)) {
        amountMatch = true;
        confidence += 30;
      }
    }

    // UPI matching
    if (expectedUpi) {
      const cleanUpi = expectedUpi.toUpperCase().trim();
      if (cleanText.includes(cleanUpi)) {
        upiMatch = true;
        confidence += 30;
      }
    }

    // Normalize confidence
    confidence = Math.min(confidence, 100);
    const isVerified = transactionMatch && amountMatch && confidence >= 60;

    const resultPayload = {
      verified: isVerified,
      confidence,
      transactionMatch,
      amountMatch,
      upiMatch,
      ocrText: ocrText.substring(0, 500) // Truncate to save DB space
    };

    // Update rental with verification results
    if (bookingId) {
       await supabase.from('rentals').update({
         ai_verification_result: resultPayload
       }).eq('id', bookingId);
    }

    res.status(200).json({
      success: true,
      ...resultPayload
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

export default router;
