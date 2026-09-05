import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Lock,
  FileText,
} from 'lucide-react';
import { useRazorGate } from '../../context/RazorGateContext';

export const PaymentFailureModal: React.FC = () => {
  const navigate = useNavigate();
  const {
    failureReportModalOpen,
    setFailureReportModalOpen,
    currentTransaction,
  } = useRazorGate();

  if (!failureReportModalOpen || !currentTransaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-xl bg-white border border-rose-200 shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Payment Failed</h3>
              <div className="text-xs text-slate-500 font-mono">
                {currentTransaction.id}
              </div>
            </div>
          </div>
          <button
            onClick={() => setFailureReportModalOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status & Error */}
          <div className="p-4 rounded-lg bg-rose-50/70 border border-rose-200 text-xs text-rose-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Gateway Declined by Bank Route</span>
            </div>
            <p className="text-slate-600">
              {currentTransaction.paymentFailureReason ||
                'Bank server reported insufficient authorization on merchant settlement route.'}
            </p>
            <div className="pt-1 text-[11px] font-mono text-rose-700">
              Status:{' '}
              <span className="font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                NOT COMPLETED
              </span>
            </div>
          </div>

          {/* Graceful Recovery Timeline */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Deterministic Safety & Recovery Steps
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5 text-xs font-mono">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Payment initiated</span>
              </div>
              <div className="flex items-center gap-2.5 text-rose-700 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Payment failed (Exception caught safely)</span>
              </div>
              <div className="flex items-center gap-2.5 text-emerald-700">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Duplicate prevention active (Idempotency lock held)</span>
              </div>
              <div className="flex items-center gap-2.5 text-emerald-700">
                <Lock className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Transaction safely closed</span>
              </div>
              <div className="flex items-center gap-2.5 text-emerald-700">
                <FileText className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Audit record created with failure telemetry</span>
              </div>
              <div className="flex items-center gap-2.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>User notified with diagnostic details</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            🛡️ <strong className="text-slate-700">Policy Safeguard:</strong> RazorGate never retries financial transactions automatically without explicit user re-authorization.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setFailureReportModalOpen(false);
                navigate('/audit');
              }}
              className="flex-1 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Inspect Audit Trail</span>
            </button>
            <button
              onClick={() => setFailureReportModalOpen(false)}
              className="py-2 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
