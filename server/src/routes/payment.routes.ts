import { Router } from 'express';
import {
  createRazorpayOrderHandler,
  verifyRazorpayPaymentHandler,
} from '../controllers/payment.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/razorpay/order', createRazorpayOrderHandler);
router.post('/razorpay/verify', verifyRazorpayPaymentHandler);

export default router;
