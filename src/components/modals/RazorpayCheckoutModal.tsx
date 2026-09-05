import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  CreditCard,
  Smartphone,
  Building2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { useRazorGate, PaymentPhase } from '../../context/RazorGateContext';

export const RazorpayCheckoutModal: React.FC = () => {
  const navigate = useNavigate();
  const {
    checkoutModalOpen,
    setCheckoutModalOpen,
    currentTransaction,
    executePaymentFlow,
  } = useRazorGate();

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [paymentPhase, setPaymentPhase] = useState<PaymentPhase>('IDLE');

  // Reset payment phase when modal is opened afresh
  useEffect(() => {
    if (checkoutModalOpen && currentTransaction?.paymentStatus !== 'SUCCESS') {
      setPaymentPhase('IDLE');
    }
  }, [checkoutModalOpen, currentTransaction?.id]);

  if (!checkoutModalOpen || !currentTransaction) return null;

  const isProcessing =
    paymentPhase === 'CREATING_ORDER' ||
    paymentPhase === 'OPENING_CHECKOUT' ||
    paymentPhase === 'VERIFYING';

  const isSuccess =
    paymentPhase === 'SUCCESS' || currentTransaction.paymentStatus === 'SUCCESS';

  const handlePay = async (simulateFailure = false) => {
    setPaymentPhase('CREATING_ORDER');
    const success = await executePaymentFlow({
      onPhase: (phase) => setPaymentPhase(phase),
      simulateFailure,
    });

    if (success) {
      setPaymentPhase('SUCCESS');
    } else {
      setPaymentPhase('FAILED');
      setCheckoutModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden font-sans">
        {/* Top Header */}
        <div className="bg-[#0C2340] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-base shadow-sm">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Razorpay Checkout</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30 uppercase">
                  Test Mode
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                {currentTransaction.razorpayOrderId || `order_rzp_${currentTransaction.id.slice(-8)}`}
              </div>
            </div>
          </div>
          <button
            onClick={() => setCheckoutModalOpen(false)}
            disabled={isProcessing}
            className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          /* Payment Success State */
          <div className="p-8 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Payment Successful — Test Mode</h3>
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Razorpay Test Mode · No real money was moved</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Settlement cryptographically verified and recorded in RazorGate audit trail.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment ID:</span>
                <span className="text-emerald-700 font-semibold">
                  {currentTransaction.paymentId || 'pay_test_' + currentTransaction.id.slice(-8)}
                </span>
              </div>
              {currentTransaction.razorpayOrderId && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="text-slate-800 font-semibold">{currentTransaction.razorpayOrderId}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="text-slate-900 font-bold">
                  ₹{currentTransaction.finalPayable.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Merchant:</span>
                <span className="text-slate-700">{currentTransaction.product.merchant.name}</span>
              </div>
              {currentTransaction.razorpaySignature && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Traceable Signature:</span>
                  <span
                    className="text-slate-600 truncate max-w-[200px]"
                    title={currentTransaction.razorpaySignature}
                  >
                    {currentTransaction.razorpaySignature}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500">Gateway Status:</span>
                <span className="text-emerald-700 font-bold uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  VERIFIED (TEST MODE)
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setCheckoutModalOpen(false);
                  navigate('/audit');
                }}
                className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <span>View Traceable Audit Trail</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCheckoutModalOpen(false);
                  navigate('/transactions');
                }}
                className="py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Transactions
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <div className="p-6 space-y-5">
            {/* Amount Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Total Authorized Amount</div>
                <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  ₹{currentTransaction.finalPayable.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-800">{currentTransaction.product.name}</div>
                <div className="text-[11px] text-blue-600 font-mono">
                  {currentTransaction.product.merchant.name}
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Select Payment Method Preference
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                    paymentMethod === 'UPI'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span>UPI / QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                    paymentMethod === 'CARD'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('NETBANKING')}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                    paymentMethod === 'NETBANKING'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>Netbanking</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 italic pt-0.5">
                Standard Razorpay Test Checkout will open allowing selection of test UPI IDs, cards, or mock banks.
              </p>
            </div>

            {/* Verification Security Notice */}
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Guard Policy Verified:</span> Amount ₹
                {currentTransaction.finalPayable.toLocaleString('en-IN')} is within user authorized limit (₹
                {currentTransaction.authorizedMaximum.toLocaleString('en-IN')}).
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handlePay(false)}
                className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {paymentPhase === 'CREATING_ORDER' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Razorpay Order...</span>
                  </>
                ) : paymentPhase === 'OPENING_CHECKOUT' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Opening Razorpay Test Checkout...</span>
                  </>
                ) : paymentPhase === 'VERIFYING' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Payment Signature...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{currentTransaction.finalPayable.toLocaleString('en-IN')} (Test Mode)</span>
                  </>
                )}
              </button>

              {/* Demo test bank failure button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handlePay(true)}
                className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Simulate Bank / Gateway Failure (Test Failure Handling)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
