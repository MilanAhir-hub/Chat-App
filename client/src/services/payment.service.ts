import { api } from './http';

export type CreditPackId = 'starter' | 'pro' | 'max';

export const creditPacks: Array<{
  id: CreditPackId;
  label: string;
  credits: number;
  price: string;
}> = [
  { id: 'starter', label: 'Starter', credits: 10, price: 'Rs. 99' },
  { id: 'pro', label: 'Pro', credits: 30, price: 'Rs. 249' },
  { id: 'max', label: 'Max', credits: 75, price: 'Rs. 499' },
];

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: 'INR';
  credits: number;
  packId: CreditPackId;
  keyId: string;
  testMode: boolean;
}

interface RazorpayVerifyPayload {
  packId: CreditPackId;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
}

export const paymentService = {
  async createOrder(packId: CreditPackId) {
    const { data } = await api.post<{ order: RazorpayOrder }>(
      '/payments/razorpay/order',
      { packId }
    );
    return data.order;
  },

  async verifyPayment(payload: RazorpayVerifyPayload) {
    const { data } = await api.post<{ message: string; credits: number }>(
      '/payments/razorpay/verify',
      payload
    );
    return data;
  },
};
