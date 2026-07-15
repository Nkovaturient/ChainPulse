import { prisma } from '@/lib/db';
import type { BillingPlan } from '@/lib/billing/razorpay';
import { PERIOD_MONTHS } from '@/lib/billing/razorpay';

export interface FulfillPurchaseInput {
  userId: string;
  plan: BillingPlan;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountPaise: number;
}

export interface FulfillPurchaseResult {
  alreadyFulfilled: boolean;
  premiumExpiresAt: Date | null;
  eliteExpiresAt: Date | null;
}

export async function fulfillPurchase(input: FulfillPurchaseInput): Promise<FulfillPurchaseResult> {
  const { userId, plan, razorpayOrderId, razorpayPaymentId, amountPaise } = input;

  const existing = await prisma.purchase.findUnique({ where: { razorpayOrderId } });
  if (existing) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { premiumExpiresAt: true, eliteExpiresAt: true },
    });
    return {
      alreadyFulfilled: true,
      premiumExpiresAt: user?.premiumExpiresAt ?? null,
      eliteExpiresAt: user?.eliteExpiresAt ?? null,
    };
  }

  const now = new Date();
  const months = PERIOD_MONTHS[plan];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { premiumExpiresAt: true, eliteExpiresAt: true },
  });
  if (!user) throw new Error('User not found');

  const baseField = plan === 'premium' ? 'premiumExpiresAt' : 'eliteExpiresAt';
  const existingExpiry = user[baseField];
  const base = existingExpiry && existingExpiry > now ? existingExpiry : now;

  const expiresAt = new Date(base);
  expiresAt.setMonth(expiresAt.getMonth() + months);

  await prisma.$transaction([
    prisma.purchase.create({
      data: {
        userId,
        plan,
        razorpayOrderId,
        razorpayPaymentId,
        amountPaise,
        periodMonths: months,
        startedAt: now,
        expiresAt,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { [baseField]: expiresAt },
    }),
  ]);

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    select: { premiumExpiresAt: true, eliteExpiresAt: true },
  });

  return {
    alreadyFulfilled: false,
    premiumExpiresAt: updated?.premiumExpiresAt ?? null,
    eliteExpiresAt: updated?.eliteExpiresAt ?? null,
  };
}
