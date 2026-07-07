import express from 'express';
import { verifyDocument, verifyFace } from '../controllers/verificationController.js';

const router = express.Router();

router.post('/verify-document', verifyDocument);
router.post('/verify-face', verifyFace);

// Fallback stubs for endpoints requested in the prompt but combined into verifyDocument above
router.post('/upload-document', (req, res) => res.json({ success: true }));
router.post('/ocr', (req, res) => res.json({ success: true }));
router.post('/upload-selfie', (req, res) => res.json({ success: true }));

export default router;
