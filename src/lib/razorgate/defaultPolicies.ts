import { Policy } from './types';

export const DEFAULT_PROHIBITED_CATEGORIES: string[] = [
  'Weapons & Firearms',
  'Ammunition & Explosives',
  'Illegal Drugs & Controlled Substances',
  'Adult & Explicit Content',
  'Tobacco, Vaping & Nicotine',
  'Hazardous & Toxic Chemicals',
  'Gambling & Betting',
  'Counterfeit & Stolen Goods',
];

export const DEFAULT_POLICY: Policy = {
  id: 'pol_enterprise_default',
  name: 'Default Autonomous Commerce Boundary',
  autonomousLimit: 10000, // ₹10,000
  dailySpendingLimit: 100000, // ₹100,000
  humanApprovalThreshold: 10000, // ₹10,000
  requireVerifiedMerchant: true,
  allowedCategories: [], // Normal retail categories permitted by default
  blockedCategories: DEFAULT_PROHIBITED_CATEGORIES,
  maxIntentDriftPercentage: 0, // Strict zero drift tolerance
  updatedAt: new Date().toISOString(),
};
