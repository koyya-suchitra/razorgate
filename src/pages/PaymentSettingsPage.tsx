import React from 'react';
import { useRazorGate } from '../context/RazorGateContext';
import { useToast } from '../context/ToastContext';
import { CreditCard, Zap, FlaskConical, Info } from 'lucide-react';

export const PaymentSettingsPage: React.FC = () => {
  const { executionMode, setExecutionMode } = useRazorGate();
  const { showToast } = useToast();

  const handleModeChange = (mode: 'DEMO_SIMULATED' | 'RAZORPAY_TEST_MODE') => {
    setExecutionMode(mode);
    showToast(
      mode === 'DEMO_SIMULATED'
        ? 'Switched to Demo Simulated mode.'
        : 'Switched to Razorpay Test Mode.',
      'info'
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Payment Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure payment execution mode and gateway preferences.
        </p>
      </div>

      {/* Execution Mode */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Execution Mode</h3>
        </div>
        <p className="text-xs text-slate-500">
          Controls how payments are processed when the Transaction Guard approves a transaction.
        </p>

        <ModeCard
          id="DEMO_SIMULATED"
          label="Demo Simulated"
          description="Payments are fully simulated locally. No API calls, no real money. Ideal for demos and evaluation."
          icon={<FlaskConical className="w-5 h-5 text-amber-600" />}
          badge="Recommended for demos"
          badgeColor="amber"
          selected={executionMode === 'DEMO_SIMULATED'}
          onSelect={() => handleModeChange('DEMO_SIMULATED')}
        />

        <ModeCard
          id="RAZORPAY_TEST_MODE"
          label="Razorpay Test Mode"
          description="Connects to Razorpay test APIs. Creates real test orders. Use Razorpay test card numbers."
          icon={<Zap className="w-5 h-5 text-indigo-600" />}
          badge="Test API"
          badgeColor="indigo"
          selected={executionMode === 'RAZORPAY_TEST_MODE'}
          onSelect={() => handleModeChange('RAZORPAY_TEST_MODE')}
        />
      </div>

      {/* Payment Gateway */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Payment Gateway</h3>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="w-8 h-8 bg-[#072654] rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">R</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Razorpay</p>
            <p className="text-xs text-slate-500">razorgate-demo · Test credentials active</p>
          </div>
          <span className="ml-auto text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            Connected
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Secret keys (Razorpay Key Secret) must never be stored in client-side code. Use a backend server for production payment verification.
        </p>
      </div>
    </div>
  );
};

const ModeCard: React.FC<{
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: 'amber' | 'indigo';
  selected: boolean;
  onSelect: () => void;
}> = ({ label, description, icon, badge, badgeColor, selected, onSelect }) => {
  const badgeStyles = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
        selected ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-800">{label}</p>
          <span className={`text-xs border rounded-full px-2 py-0.5 ${badgeStyles[badgeColor]}`}>{badge}</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
        selected ? 'border-slate-900' : 'border-slate-300'
      }`}>
        {selected && <div className="w-2 h-2 bg-slate-900 rounded-full" />}
      </div>
    </button>
  );
};
