import React, { useState, useEffect } from 'react';
import { useRazorGate } from '../context/RazorGateContext';
import { useToast } from '../context/ToastContext';
import { SlidersHorizontal, Save, RotateCcw, Info } from 'lucide-react';

export const SpendingControlsPage: React.FC = () => {
  const { policies, updatePolicies, resetPoliciesToDefault } = useRazorGate();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    autonomousLimit: policies.autonomousLimit,
    dailySpendingLimit: policies.dailySpendingLimit,
    humanApprovalThreshold: policies.humanApprovalThreshold,
    requireVerifiedMerchant: policies.requireVerifiedMerchant,
    maxIntentDriftPercentage: policies.maxIntentDriftPercentage,
  });

  // Sync if context changes (e.g. from Firestore)
  useEffect(() => {
    setForm({
      autonomousLimit: policies.autonomousLimit,
      dailySpendingLimit: policies.dailySpendingLimit,
      humanApprovalThreshold: policies.humanApprovalThreshold,
      requireVerifiedMerchant: policies.requireVerifiedMerchant,
      maxIntentDriftPercentage: policies.maxIntentDriftPercentage,
    });
  }, [policies]);

  const handleSave = () => {
    updatePolicies(form);
    showToast('Spending controls saved successfully.', 'success');
  };

  const handleReset = () => {
    resetPoliciesToDefault();
    showToast('Controls reset to default values.', 'info');
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Spending Controls</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure spending limits and merchant policies enforced by the Transaction Guard.
        </p>
      </div>

      {/* Spending limits */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Authorization Limits</h3>
        </div>

        <LimitInput
          label="Autonomous Limit"
          description="AI can execute payments up to this amount without human review."
          value={form.autonomousLimit}
          onChange={(v) => setForm((f) => ({ ...f, autonomousLimit: v }))}
          min={0}
          max={form.dailySpendingLimit}
        />

        <LimitInput
          label="Daily Spending Limit"
          description="Maximum total spend per day across all AI-initiated transactions."
          value={form.dailySpendingLimit}
          onChange={(v) => setForm((f) => ({ ...f, dailySpendingLimit: v }))}
          min={form.autonomousLimit}
          max={500000}
        />

        <LimitInput
          label="Human Approval Threshold"
          description="Transactions above this amount are routed to the Approval Center."
          value={form.humanApprovalThreshold}
          onChange={(v) => setForm((f) => ({ ...f, humanApprovalThreshold: v }))}
          min={0}
          max={form.dailySpendingLimit}
        />
      </div>

      {/* Merchant & Drift Policy */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Merchant &amp; Intent Policy</h3>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-slate-800">Require Verified Merchants Only</p>
            <p className="text-xs text-slate-500 mt-0.5">Block all transactions with unverified sellers.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={form.requireVerifiedMerchant}
              onChange={(e) => setForm((f) => ({ ...f, requireVerifiedMerchant: e.target.checked }))}
            />
            <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900" />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-1">Maximum Intent Drift (%)</label>
          <p className="text-xs text-slate-500 mb-2">
            Block if final amount exceeds original intent by more than this percentage. Use 0 for strict enforcement.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={form.maxIntentDriftPercentage}
              onChange={(e) => setForm((f) => ({ ...f, maxIntentDriftPercentage: Number(e.target.value) }))}
              className="flex-1 accent-slate-900"
            />
            <span className="text-sm font-mono font-semibold text-slate-800 w-10 text-right">
              {form.maxIntentDriftPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          These controls are enforced deterministically by the Transaction Guard. The AI Buyer cannot override them.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to defaults
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Save changes
        </button>
      </div>
    </div>
  );
};

const LimitInput: React.FC<{
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}> = ({ label, description, value, onChange, min, max }) => (
  <div>
    <label className="block text-sm font-medium text-slate-800 mb-0.5">{label}</label>
    <p className="text-xs text-slate-500 mb-2">{description}</p>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">₹</span>
      <input
        type="number"
        min={min}
        max={max}
        step={1000}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full pl-7 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
      />
    </div>
    <p className="text-xs text-slate-400 mt-1 text-right">
      {value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
    </p>
  </div>
);
