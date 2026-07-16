import express from 'express';
import { sendNotification, generateConnectCode, disconnectTelegram } from '../controllers/telegramController.js';

const router = express.Router();

router.post('/', sendNotification);
router.post('/connect', generateConnectCode);
router.post('/disconnect', disconnectTelegram);

export default router;
