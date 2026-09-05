import React, { useState } from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { useRazorGate } from '../../context/RazorGateContext';
import { PurchaseIntent } from '../../lib/razorgate/types';

export const EditIntentModal: React.FC = () => {
  const {
    editIntentModalOpen,
    setEditIntentModalOpen,
    currentIntent,
    updateParsedIntent,
  } = useRazorGate();

  if (!editIntentModalOpen || !currentIntent) return null;

  const [maxBudget, setMaxBudget] = useState<number>(currentIntent.maxBudget);
  const [preferredBrand, setPreferredBrand] = useState<string>(currentIntent.preferredBrand || '');
  const [category, setCategory] = useState<string>(currentIntent.category);
  const [quantity, setQuantity] = useState<number>(currentIntent.quantity);
  const [merchantRequirement, setMerchantRequirement] = useState<'verified_only' | 'any'>(
    currentIntent.merchantRequirement
  );
  const [paymentAuthorization, setPaymentAuthorization] = useState<
    'autonomous_below_budget' | 'always_require_approval' | 'strict_budget'
  >(currentIntent.paymentAuthorization);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PurchaseIntent = {
      ...currentIntent,
      maxBudget,
      preferredBrand: preferredBrand.trim() || undefined,
      category,
      quantity,
      merchantRequirement,
      paymentAuthorization,
      parsedTimestamp: new Date().toISOString(),
    };
    updateParsedIntent(updated);
    setEditIntentModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden font-sans">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Edit Purchase Intent</h3>
          </div>
          <button
            onClick={() => setEditIntentModalOpen(false)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Maximum Authorized Budget (₹)
            </label>
            <input
              type="number"
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono focus:border-blue-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
            >
              <option value="Wireless Headphones">Wireless Headphones</option>
              <option value="Digital Imaging">Digital Imaging</option>
              <option value="Footwear">Footwear</option>
              <option value="Laptops">Laptops</option>
              <option value="Audio Equipment">Audio Equipment</option>
              <option value="Electronics">Electronics</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Brand</label>
              <input
                type="text"
                value={preferredBrand}
                onChange={(e) => setPreferredBrand(e.target.value)}
                placeholder="e.g. Sony, Bose"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Merchant Requirement</label>
            <select
              value={merchantRequirement}
              onChange={(e) => setMerchantRequirement(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
            >
              <option value="verified_only">Verified merchants only</option>
              <option value="any">Any merchant</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Payment Authorization
            </label>
            <select
              value={paymentAuthorization}
              onChange={(e) => setPaymentAuthorization(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
            >
              <option value="autonomous_below_budget">Autonomous ≤ budget</option>
              <option value="always_require_approval">Always require human approval</option>
              <option value="strict_budget">Strict zero tolerance</option>
            </select>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Update Intent</span>
            </button>
            <button
              type="button"
              onClick={() => setEditIntentModalOpen(false)}
              className="py-2.5 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
