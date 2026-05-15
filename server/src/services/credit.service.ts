import { CreditTransaction } from '../models/CreditTransaction';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';

interface CreditChangeInput {
  userId: string;
  amount: number;
  description: string;
  type: 'grant' | 'purchase' | 'use' | 'refund';
  provider?: 'razorpay' | 'system';
  providerOrderId?: string;
  providerPaymentId?: string;
}

export const changeCredits = async (input: CreditChangeInput) => {
  const user = await User.findById(input.userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const nextBalance = user.credits + input.amount;

  if (nextBalance < 0) {
    throw new AppError('Not enough credits. Please add credits to continue.', 402);
  }

  user.credits = nextBalance;
  await user.save();

  await CreditTransaction.create({
    user: user._id,
    type: input.type,
    amount: input.amount,
    balanceAfter: nextBalance,
    description: input.description,
    provider: input.provider,
    providerOrderId: input.providerOrderId,
    providerPaymentId: input.providerPaymentId,
  });

  return user.credits;
};

export const getCreditHistory = async (userId: string, limit = 12) =>
  CreditTransaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
