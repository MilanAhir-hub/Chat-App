import crypto from 'crypto';
import type { Request, RequestHandler } from 'express';
import { env } from '../config/env';
import { CreditTransaction } from '../models/CreditTransaction';
import { changeCredits } from '../services/credit.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

const CREDIT_PACKS: Record<string, { credits: number; amountInPaise: number }> = {
  starter: { credits: 10, amountInPaise: 9900 },
  pro: { credits: 30, amountInPaise: 24900 },
  max: { credits: 75, amountInPaise: 49900 },
};

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new AppError('Please login to continue.', 401);
  }

  return req.user;
};

export const createRazorpayOrderHandler: RequestHandler = asyncHandler(
  async (req, res) => {
    const user = requireUser(req);
    const packId = String(req.body.packId || 'starter');
    const pack = CREDIT_PACKS[packId];

    if (!pack) {
      throw new AppError('Invalid credit pack.', 400);
    }

    let orderId = `order_mock_${Date.now()}`;
    let testMode = true;

    if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
      const authToken = Buffer.from(
        `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
      ).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: pack.amountInPaise,
          currency: 'INR',
          receipt: `${user.id}_${packId}_${Date.now()}`.slice(0, 40),
          notes: {
            userId: user.id,
            packId,
            credits: String(pack.credits),
          },
        }),
      });

      if (!response.ok) {
        throw new AppError('Unable to create Razorpay order.', 502);
      }

      const razorpayOrder = (await response.json()) as { id?: string };
      if (!razorpayOrder.id) {
        throw new AppError('Razorpay did not return an order ID.', 502);
      }

      orderId = razorpayOrder.id;
      testMode = false;
    }

    res.status(200).json({
      success: true,
      order: {
        id: orderId,
        amount: pack.amountInPaise,
        currency: 'INR',
        credits: pack.credits,
        packId,
        keyId: env.RAZORPAY_KEY_ID || '',
        testMode,
      },
    });
  }
);

export const verifyRazorpayPaymentHandler: RequestHandler = asyncHandler(
  async (req, res) => {
    const user = requireUser(req);
    const {
      packId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body;
    const pack = CREDIT_PACKS[String(packId || 'starter')];
    const usingConfiguredRazorpay = Boolean(
      env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    );

    if (!pack) {
      throw new AppError('Invalid credit pack.', 400);
    }

    const isMockPayment = String(orderId || '').startsWith('order_mock_');

    if (isMockPayment && usingConfiguredRazorpay) {
      throw new AppError('Mock payments are disabled when Razorpay keys are configured.', 400);
    }

    if (!isMockPayment && env.RAZORPAY_KEY_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (!signature || expectedSignature !== signature) {
        throw new AppError('Payment verification failed.', 400);
      }
    }

    const duplicate = await CreditTransaction.exists({
      providerPaymentId: paymentId,
      provider: 'razorpay',
    });

    if (duplicate) {
      throw new AppError('This payment has already been credited.', 409);
    }

    const credits = await changeCredits({
      userId: user.id,
      amount: pack.credits,
      type: 'purchase',
      description: `Purchased ${pack.credits} interview credits`,
      provider: 'razorpay',
      providerOrderId: orderId,
      providerPaymentId: paymentId || `pay_mock_${Date.now()}`,
    });

    res.status(200).json({
      success: true,
      message: `${pack.credits} credits added successfully.`,
      credits,
    });
  }
);
