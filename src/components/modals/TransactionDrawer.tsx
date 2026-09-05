import React from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  History,
  Check,
  Ban,
  CreditCard,
} from 'lucide-react';
import { useRazorGate } from '../../context/RazorGateContext';
import { DecisionBadge } from '../common/DecisionBadge';

export const TransactionDrawer: React.FC = () => {
  const {
    selectedTxForDrawer,
    setSelectedTxForDrawer,
    auditEvents,
    setCheckoutModalOpen,
    setCurrentTransaction,
    approvePendingTransaction,
    rejectPendingTransaction,
  } = useRazorGate();

  if (!selectedTxForDrawer) return null;

  const tx = selectedTxForDrawer;
  const linkedAudits = auditEvents.filter((a) => a.transactionId === tx.id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white border-l border-slate-200 h-full overflow-y-auto shadow-2xl flex flex-col font-sans">
        {/* Drawer Header */}
        <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-blue-700">{tx.id}</span>
              <DecisionBadge decision={tx.decision} paymentStatus={tx.paymentStatus} size="sm" />
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono">
              Created: {new Date(tx.createdAt).toLocaleString('en-IN')}
            </div>
          </div>
          <button
            onClick={() => setSelectedTxForDrawer(null)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 flex-1 text-xs">
          {/* Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Target Product
                </span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{tx.product.name}</div>
                <div className="flex items-center gap-1.5 mt-1 text-slate-600">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{tx.product.merchant.name}</span>
                  {tx.product.merchant.verified && (
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      Verified
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">
                  Payable Amount
                </span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  ₹{tx.finalPayable.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-400">
                  Limit: ₹{tx.authorizedMaximum.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Financial itemization */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200 font-mono text-[11px]">
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-400 text-[9px] block font-sans">Unit Price</span>
                <span className="text-slate-800 font-semibold">
                  ₹{tx.unitPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-400 text-[9px] block font-sans">Shipping</span>
                <span className="text-slate-800 font-semibold">
                  ₹{tx.shippingAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-400 text-[9px] block font-sans">Tax</span>
                <span className="text-slate-800 font-semibold">
                  ₹{tx.taxAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-blue-50/60 p-2 rounded border border-blue-200">
                <span className="text-blue-700 text-[9px] block font-sans">Final Payable</span>
                <span className="text-blue-900 font-bold">
                  ₹{tx.finalPayable.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* User Intent Card */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
              User Intent
            </span>
            <p className="text-slate-800 font-medium">"{tx.intent.rawPrompt}"</p>
            <div className="text-[11px] text-slate-500 font-mono pt-1">
              Category: {tx.intent.category} · Authorized Ceiling: ₹{tx.authorizedMaximum.toLocaleString('en-IN')}
            </div>
          </div>

          {/* 6 Deterministic Checks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Deterministic Guard Checks
              </h4>
              <span className="text-[11px] font-mono text-slate-400">6 Checks Evaluated</span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white p-1">
              {tx.checks.map((chk) => {
                const isPass = chk.status === 'PASS';
                const isFail = chk.status === 'FAIL';

                return (
                  <div key={chk.id} className="p-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {isPass && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {isFail && <XCircle className="w-4 h-4 text-rose-600" />}
                        {!isPass && !isFail && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      </div>
                      <div>
                        <span className="text-slate-900 font-semibold">{chk.checkName}</span>
                        <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{chk.detail}</p>
                      </div>
                    </div>

                    <span
                      className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                        isPass
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isFail
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {chk.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Linked Audit Trail */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-500" />
              Traceable Audit Events ({linkedAudits.length})
            </h4>

            {linkedAudits.length === 0 ? (
              <div className="p-4 text-center rounded-lg bg-slate-50 text-slate-400 text-xs">
                No events recorded yet.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {linkedAudits.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono flex items-start gap-2.5"
                  >
                    <span className="text-slate-400 shrink-0 text-[10px]">{evt.timeLabel}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-800 font-semibold truncate">{evt.eventName}</div>
                      <div className="text-slate-500 text-[11px] font-sans truncate">{evt.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="sticky bottom-0 bg-white p-4 border-t border-slate-200 flex gap-3">
          {tx.decision === 'APPROVED' && tx.paymentStatus !== 'SUCCESS' && (
            <button
              onClick={() => {
                setCurrentTransaction(tx);
                setCheckoutModalOpen(true);
                setSelectedTxForDrawer(null);
              }}
              className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <CreditCard className="w-4 h-4" />
              <span>Launch Payment Checkout (₹{tx.finalPayable.toLocaleString('en-IN')})</span>
            </button>
          )}

          {tx.decision === 'HUMAN_APPROVAL_REQUIRED' && (
            <>
              <button
                onClick={() => {
                  approvePendingTransaction(tx.id);
                  setSelectedTxForDrawer(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Approve Transaction</span>
              </button>
              <button
                onClick={() => {
                  rejectPendingTransaction(tx.id);
                  setSelectedTxForDrawer(null);
                }}
                className="py-2.5 px-3 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Reject
              </button>
            </>
          )}

          {tx.decision === 'BLOCKED' && (
            <div className="flex-1 py-2 px-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-medium text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Payment was NOT initiated. Bounded safety enforced.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
