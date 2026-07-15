export interface BillingQuota {
  used: number;
  limit: number | null;
  unlimited: boolean;
  remaining: number | null;
}

export interface BillingStatus {
  premiumActive: boolean;
  premiumExpiresAt: string | null;
  eliteActive: boolean;
  eliteExpiresAt: string | null;
  quota: BillingQuota;
}
