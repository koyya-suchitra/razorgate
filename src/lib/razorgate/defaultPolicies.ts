import { Policy } from './types';

export const DEFAULT_POLICY: Policy = {
  id: 'pol_enterprise_default',
  name: 'Default Autonomous Commerce Boundary',
  autonomousLimit: 10000, // ₹10,000
  dailySpendingLimit: 25000, // ₹25,000
  humanApprovalThreshold: 10000, // ₹10,000
  requireVerifiedMerchant: true,
  allowedCategories: [
    'Wireless Headphones',
    'Electronics',
    'Digital Imaging',
    'Footwear',
    'Laptops',
    'Audio Equipment',
  ],
  maxIntentDriftPercentage: 0, // Strict zero drift tolerance
  updatedAt: new Date().toISOString(),
};
