import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Ban } from 'lucide-react';
import { TransactionDecision, PaymentStatus } from '../../lib/razorgate/types';

interface DecisionBadgeProps {
  decision?: TransactionDecision;
  paymentStatus?: PaymentStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const DecisionBadge: React.FC<DecisionBadgeProps> = ({
  decision,
  paymentStatus,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  if (paymentStatus === 'SUCCESS') {
    return (
      <span
        className={`inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium ${sizeClasses}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>SUCCESSFUL</span>
      </span>
    );
  }

  if (paymentStatus === 'FAILED') {
    return (
      <span
        className={`inline-flex items-center rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-medium ${sizeClasses}`}
      >
        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>PAYMENT FAILED</span>
      </span>
    );
  }

  if (paymentStatus === 'REJECTED') {
    return (
      <span
        className={`inline-flex items-center rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium ${sizeClasses}`}
      >
        <Ban className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>REJECTED</span>
      </span>
    );
  }

  if (paymentStatus === 'BLOCKED_PRE_PAYMENT' || decision === 'BLOCKED') {
    return (
      <span
        className={`inline-flex items-center rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-medium ${sizeClasses}`}
      >
        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>BLOCKED</span>
      </span>
    );
  }

  if (decision === 'HUMAN_APPROVAL_REQUIRED' || paymentStatus === 'PENDING_APPROVAL') {
    return (
      <span
        className={`inline-flex items-center rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium ${sizeClasses}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>APPROVAL REQUIRED</span>
      </span>
    );
  }

  if (decision === 'APPROVED') {
    return (
      <span
        className={`inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium ${sizeClasses}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>APPROVED</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-medium ${sizeClasses}`}
    >
      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span>PENDING</span>
    </span>
  );
};
