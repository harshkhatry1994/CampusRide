import express from 'express';
import { sendNotification } from '../controllers/telegramController.js';

const router = express.Router();

router.post('/', sendNotification);

export default router;
