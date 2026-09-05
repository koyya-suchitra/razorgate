import React, { useState } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  ArrowRight,
  Eye,
  Check,
  Ban,
  Clock,
} from 'lucide-react';
import { useRazorGate } from '../../context/RazorGateContext';
import { Transaction } from '../../lib/razorgate/types';

export const ApprovalCenterScreen: React.FC = () => {
  const {
    transactions,
    approvePendingTransaction,
    rejectPendingTransaction,
    setSelectedTxForDrawer,
    setCheckoutModalOpen,
    setCurrentTransaction,
  } = useRazorGate();

  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const pendingList = transactions.filter(
    (t) => t.decision === 'HUMAN_APPROVAL_REQUIRED' || t.paymentStatus === 'PENDING_APPROVAL'
  );

  const handleApprove = (tx: Transaction) => {
    const note = reviewNotes[tx.id] || 'Approved by user.';
    approvePendingTransaction(tx.id, note);
    setCurrentTransaction({
      ...tx,
      decision: 'APPROVED',
      paymentStatus: 'NOT_INITIATED',
    });
    setCheckoutModalOpen(true);
  };

  const handleReject = (tx: Transaction) => {
    const note = reviewNotes[tx.id] || 'Rejected by user.';
    rejectPendingTransaction(tx.id, note);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-600" />
            Approvals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transactions requiring your authorization.
          </p>
        </div>

        {pendingList.length > 0 && (
          <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            {pendingList.length} Action{pendingList.length > 1 ? 's' : ''} Required
          </span>
        )}
      </div>

      {pendingList.length === 0 ? (
        /* Empty State (Section 20 requirement) */
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-card space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No transactions require your attention.
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your AI buyer is operating within the configured authorization boundaries.
          </p>
        </div>
      ) : (
        /* Pending List */
        <div className="space-y-4">
          {pendingList.map((tx) => (
            <div
              key={tx.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    Action Required
                  </span>
                  <span className="text-xs font-mono text-slate-400">TX: {tx.id}</span>
                </div>
                <button
                  onClick={() => setSelectedTxForDrawer(tx)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Details</span>
                </button>
              </div>

              {/* Transaction Spec Details (Section 20 requirement) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 font-medium block">Product</span>
                    <span className="font-bold text-slate-900 text-sm">{tx.product.name}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Merchant</span>
                    <span className="font-semibold text-slate-800">{tx.product.merchant.name}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Requested by</span>
                    <span className="text-slate-800">AI Buyer</span>
                  </div>
                </div>

                <div className="space-y-3 sm:text-right font-mono">
                  <div>
                    <span className="text-slate-400 font-medium block font-sans">Amount</span>
                    <span className="text-2xl font-bold text-slate-900">
                      ₹{tx.finalPayable.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block font-sans">Autonomous limit</span>
                    <span className="font-semibold text-slate-700">
                      ₹{tx.autonomousLimit.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block font-sans">Reason</span>
                    <span className="text-amber-800 font-sans">
                      Transaction exceeds autonomous authorization.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Section 20 requirement) */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleReject(tx)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Reject
                </button>

                <button
                  onClick={() => handleApprove(tx)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve ₹{tx.finalPayable.toLocaleString('en-IN')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
