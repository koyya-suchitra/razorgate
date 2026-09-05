import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
  Building2,
  ArrowRight,
  Lock,
  RotateCcw,
  Check,
  Ban,
  FileText,
  AlertOctagon,
  ArrowLeft,
} from 'lucide-react';
import { useRazorGate } from '../../context/RazorGateContext';
import { DecisionBadge } from '../common/DecisionBadge';

export const TransactionGuardScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentTransaction,
    setCheckoutModalOpen,
    runDemoScenario,
  } = useRazorGate();

  if (!currentTransaction) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto shadow-card space-y-4">
        <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto opacity-80" />
        <h3 className="text-base font-bold text-slate-900">No Active Transaction in Guard</h3>
        <p className="text-xs text-slate-500">
          Run a query in AI Buyer or select one of the test scenarios to evaluate payment authorization.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => runDemoScenario('SUCCESS')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
          >
            Launch Success Demo
          </button>
          <button
            onClick={() => navigate('/ai-buyer')}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Open AI Buyer
          </button>
        </div>
      </div>
    );
  }

  const tx = currentTransaction;
  const isApproved = tx.decision === 'APPROVED';
  const isBlocked = tx.decision === 'BLOCKED';
  const isHumanApproval = tx.decision === 'HUMAN_APPROVAL_REQUIRED';
  const isPaid = tx.paymentStatus === 'SUCCESS';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Transaction Guard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Every AI-initiated payment passes through RazorGate before money can move.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono text-slate-500">TX: {tx.id}</span>
          <DecisionBadge decision={tx.decision} paymentStatus={tx.paymentStatus} size="md" />
        </div>
      </div>

      {/* Transaction Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Evaluated Product & Merchant
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {tx.product.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-slate-800">{tx.product.merchant.name}</span>
              <span>·</span>
              {tx.product.merchant.verified ? (
                <span className="text-emerald-700 font-medium">✓ Verified Merchant</span>
              ) : (
                <span className="text-rose-600 font-medium">✕ Unverified Merchant</span>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right font-mono">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Final Payable Amount
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              ₹{tx.finalPayable.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              User limit: ₹{tx.authorizedMaximum.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Itemization Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-sans">Unit Price</span>
            <span className="font-semibold text-slate-800">
              ₹{tx.unitPrice.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-sans">Shipping Fee</span>
            <span className="font-semibold text-slate-800">
              ₹{tx.shippingAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-sans">Applicable Tax</span>
            <span className="font-semibold text-slate-800">
              ₹{tx.taxAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
            <span className="text-[10px] text-blue-700 block uppercase font-sans">Autonomous Ceiling</span>
            <span className="font-bold text-blue-900">
              ₹{tx.autonomousLimit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Intent Drift Notice (if detected) */}
      {tx.intentDrift?.detected && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wide">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>Intent Drift Detected</span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-700">
              Difference: +₹{tx.intentDrift.difference.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
            <div className="p-2.5 rounded-md bg-white border border-rose-100">
              <span className="text-[10px] text-slate-400 block font-sans">Original Intent Limit</span>
              <span className="font-bold text-slate-900">
                ₹{tx.intentDrift.originalBudget.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-2.5 rounded-md bg-white border border-rose-100">
              <span className="text-[10px] text-rose-500 block font-sans">Final Transaction</span>
              <span className="font-bold text-rose-700">
                ₹{tx.intentDrift.finalPayable.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-2.5 rounded-md bg-white border border-rose-100">
              <span className="text-[10px] text-rose-500 block font-sans">Resolution</span>
              <span className="font-bold text-rose-700">BLOCKED</span>
            </div>
          </div>

          <p className="text-xs text-rose-800 leading-relaxed">
            {tx.intentDrift.explanation}
          </p>
        </div>
      )}

      {/* Six Deterministic Checks Rows */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Authorization Checklist
          </h3>
          <span className="text-xs font-mono text-slate-400">
            6 of 6 Evaluated
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {tx.checks.map((chk) => {
            const isPass = chk.status === 'PASS';
            const isFail = chk.status === 'FAIL';

            return (
              <div
                key={chk.id}
                className="py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {isPass && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {isFail && <XCircle className="w-4 h-4 text-rose-600" />}
                    {!isPass && !isFail && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">{chk.checkName}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                      {chk.detail}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 font-mono font-bold text-xs">
                  {isPass && (
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      ✓ PASS
                    </span>
                  )}
                  {isFail && (
                    <span className="text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                      ✕ FAIL
                    </span>
                  )}
                  {!isPass && !isFail && (
                    <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                      ⚠ REVIEW
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FINAL DECISION SECTION */}

      {/* APPROVED STATE (Section 17 requirement) */}
      {isApproved && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Final Decision
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              APPROVED
            </span>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1 text-xs text-emerald-900">
            <div className="font-semibold text-emerald-800">
              All required authorization checks passed.
            </div>
            <div className="font-mono text-emerald-700 pt-1">
              ₹{tx.finalPayable.toLocaleString('en-IN')} authorized · Authorized limit: ₹{tx.authorizedMaximum.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="text-xs text-slate-500 italic">
            The AI did not authorize payment. RazorGate authorized payment after deterministic checks.
          </div>

          <div className="pt-2">
            {isPaid ? (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="text-slate-700">
                  <span className="font-bold text-slate-900">Payment Completed:</span> Ref #{tx.paymentId}
                </div>
                <button
                  onClick={() => navigate('/audit')}
                  className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  View in Audit Trail
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCheckoutModalOpen(true)}
                className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Continue to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* BLOCKED STATE (Section 18 requirement) */}
      {isBlocked && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Final Decision
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs font-mono">
              <XCircle className="w-4 h-4 text-rose-600" />
              BLOCKED
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-rose-50/70 border border-rose-200 space-y-2 text-xs">
              <div className="font-bold text-rose-800 text-sm flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Autonomous limit exceeded</span>
              </div>
              <p className="text-rose-700 leading-relaxed">
                Reason: {tx.decisionReason || 'Transaction exceeds the user\'s autonomous authorization limit.'}
              </p>

              <div className="grid grid-cols-3 gap-2 font-mono pt-2 text-xs">
                <div className="p-2.5 rounded-md bg-white border border-rose-100">
                  <span className="text-[10px] text-slate-400 block font-sans">Requested</span>
                  <span className="font-bold text-slate-900">
                    ₹{tx.finalPayable.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2.5 rounded-md bg-white border border-rose-100">
                  <span className="text-[10px] text-slate-400 block font-sans">Allowed</span>
                  <span className="font-bold text-slate-900">
                    ₹{tx.authorizedMaximum.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2.5 rounded-md bg-white border border-rose-100">
                  <span className="text-[10px] text-rose-500 block font-sans">Difference</span>
                  <span className="font-bold text-rose-700">
                    +₹{(tx.finalPayable - tx.authorizedMaximum).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Critical Message */}
            <div className="p-3 rounded-lg bg-slate-100 text-slate-700 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <Lock className="w-4 h-4 text-slate-600" />
                <span className="font-bold text-slate-900">RazorGate prevented payment authorization.</span>
              </div>
              <span className="font-mono text-slate-500">No money was moved.</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/approvals')}
              className="flex-1 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Request Human Approval
            </button>
            <button
              onClick={() => navigate('/ai-buyer')}
              className="py-2.5 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Return to AI Buyer
            </button>
          </div>
        </div>
      )}

      {/* HUMAN APPROVAL REQUIRED STATE (Section 19 requirement) */}
      {isHumanApproval && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Final Decision
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              APPROVAL REQUIRED
            </span>
          </div>

          <div className="p-4 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <div className="font-bold text-amber-800">
              This transaction exceeds your autonomous authorization limit and requires your approval.
            </div>
            <div className="font-mono text-amber-800/80 pt-1">
              Payable: ₹{tx.finalPayable.toLocaleString('en-IN')} · Autonomous limit: ₹{tx.autonomousLimit.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/approvals')}
              className="w-full py-3 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Review Transaction in Approvals</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
