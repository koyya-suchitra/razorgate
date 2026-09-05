import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ShieldCheck,
  RotateCcw,
  Check,
  Building2,
  DollarSign,
  Scale,
} from 'lucide-react';
import { useRazorGate } from '../../context/RazorGateContext';

export const PoliciesScreen: React.FC = () => {
  const { policies, updatePolicies, resetPoliciesToDefault } = useRazorGate();

  const [autonomousLimit, setAutonomousLimit] = useState(policies.autonomousLimit);
  const [dailySpendingLimit, setDailySpendingLimit] = useState(policies.dailySpendingLimit);
  const [humanApprovalThreshold, setHumanApprovalThreshold] = useState(
    policies.humanApprovalThreshold
  );
  const [requireVerifiedMerchant, setRequireVerifiedMerchant] = useState(
    policies.requireVerifiedMerchant
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const availableCategories = [
    'Wireless Headphones',
    'Electronics',
    'Digital Imaging',
    'Footwear',
    'Laptops',
    'Audio Equipment',
  ];

  const [selectedCats, setSelectedCats] = useState<string[]>(policies.allowedCategories);

  const toggleCategory = (cat: string) => {
    if (selectedCats.includes(cat)) {
      setSelectedCats(selectedCats.filter((c) => c !== cat));
    } else {
      setSelectedCats([...selectedCats, cat]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePolicies({
      autonomousLimit,
      dailySpendingLimit,
      humanApprovalThreshold,
      requireVerifiedMerchant,
      allowedCategories: selectedCats,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-blue-600" />
            Policies
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Control what your AI buyer is allowed to purchase.
          </p>
        </div>

        <button
          onClick={resetPoliciesToDefault}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset to Defaults</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: SPENDING & AUTHORIZATION */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Spending & Authorization
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block text-slate-800 font-semibold mb-1">
                Autonomous purchase limit (₹)
              </label>
              <input
                type="number"
                value={autonomousLimit}
                onChange={(e) => setAutonomousLimit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono text-sm focus:border-blue-600 focus:outline-none"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Purchases up to this amount can be completed automatically.
              </span>
            </div>

            <div>
              <label className="block text-slate-800 font-semibold mb-1">
                Daily spending limit (₹)
              </label>
              <input
                type="number"
                value={dailySpendingLimit}
                onChange={(e) => setDailySpendingLimit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono text-sm focus:border-blue-600 focus:outline-none"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Maximum total spending allowed per day.
              </span>
            </div>

            <div>
              <label className="block text-slate-800 font-semibold mb-1">
                Human approval threshold (₹)
              </label>
              <input
                type="number"
                value={humanApprovalThreshold}
                onChange={(e) => setHumanApprovalThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono text-sm focus:border-blue-600 focus:outline-none"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Transactions at or above this amount require approval.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: MERCHANT PROTECTION */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Merchant Protection
            </h3>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
            <div>
              <div className="text-xs font-bold text-slate-900">
                Require verified merchants only
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Prevent transactions through unverified merchants.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRequireVerifiedMerchant(!requireVerifiedMerchant)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                requireVerifiedMerchant ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  requireVerifiedMerchant ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Section 3: ALLOWED CATEGORIES */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Allowed Categories
            </h3>
          </div>

          <p className="text-xs text-slate-500">
            Specify which commercial categories your AI buyer is authorized to purchase.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            {availableCategories.map((cat) => {
              const isSelected = selectedCats.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 text-blue-900 border-blue-300'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Footer */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 font-mono">
              <Check className="w-4 h-4" />
              Policy changes saved and applied.
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              Changes take effect immediately on new transactions.
            </span>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            Save Policy Changes
          </button>
        </div>
      </form>
    </div>
  );
};
