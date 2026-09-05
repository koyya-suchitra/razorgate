import React, { useState } from 'react';
import {
  History,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  UserCheck,
  Bot,
} from 'lucide-react';
import { useRazorGate } from '../../context/RazorGateContext';
import { ActorType, AuditEvent } from '../../lib/razorgate/types';

export const AuditTrailScreen: React.FC = () => {
  const { auditEvents } = useRazorGate();
  const [selectedTxId, setSelectedTxId] = useState<string>('ALL');
  const [selectedActor, setSelectedActor] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Extract unique transaction IDs for filter dropdown
  const uniqueTxIds = Array.from(
    new Set(auditEvents.map((a) => a.transactionId).filter(Boolean))
  ) as string[];

  const filtered = auditEvents.filter((evt) => {
    const matchTx = selectedTxId === 'ALL' || evt.transactionId === selectedTxId;
    const matchActor = selectedActor === 'ALL' || evt.actor === selectedActor;
    const matchStatus = selectedStatus === 'ALL' || evt.status === selectedStatus;
    return matchTx && matchActor && matchStatus;
  });

  const getActorBadge = (actor: ActorType) => {
    switch (actor) {
      case 'AI_BUYER':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
            <Bot className="w-3 h-3 text-purple-600" />
            AI_BUYER
          </span>
        );
      case 'POLICY_ENGINE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            POLICY_ENGINE
          </span>
        );
      case 'TRANSACTION_GUARD':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
            <ShieldCheck className="w-3 h-3 text-sky-600" />
            TRANSACTION_GUARD
          </span>
        );
      case 'HUMAN_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            <UserCheck className="w-3 h-3 text-amber-600" />
            HUMAN_ADMIN
          </span>
        );
      case 'RAZORPAY_GATEWAY':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CreditCard className="w-3 h-3 text-emerald-600" />
            PAYMENT_GATEWAY
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {actor}
          </span>
        );
    }
  };

  const getStatusIcon = (status: AuditEvent['status']) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'BLOCKED':
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-600 shrink-0" />;
    }
  };

  const exportAuditJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `razorgate_audit_trail_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Every AI decision and money action is traceable. Immutable provenance log.
          </p>
        </div>

        <button
          onClick={exportAuditJSON}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Transaction Filter Dropdown */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
              Transaction
            </label>
            <select
              value={selectedTxId}
              onChange={(e) => setSelectedTxId(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Transactions ({uniqueTxIds.length})</option>
              {uniqueTxIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          {/* Actor Filter */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
              Actor
            </label>
            <select
              value={selectedActor}
              onChange={(e) => setSelectedActor(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Actors</option>
              <option value="AI_BUYER">AI Buyer</option>
              <option value="POLICY_ENGINE">Policy Engine</option>
              <option value="TRANSACTION_GUARD">Transaction Guard</option>
              <option value="HUMAN_ADMIN">Human Supervisor</option>
              <option value="RAZORPAY_GATEWAY">Payment Gateway</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Outcomes</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="WARNING">WARNING</option>
              <option value="INFO">INFO</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing {filtered.length} Events
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-card">
        {filtered.map((evt) => {
          const isExpanded = expandedEventId === evt.id;
          const hasMeta = Object.keys(evt.metadata || {}).length > 0;

          return (
            <div key={evt.id} className="p-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">{getStatusIcon(evt.status)}</div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-500 font-semibold">
                        {evt.timeLabel}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-sm font-bold text-slate-900">{evt.eventName}</span>
                      {getActorBadge(evt.actor)}
                      {evt.transactionId && (
                        <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {evt.transactionId}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600">{evt.reason}</p>
                  </div>
                </div>

                {hasMeta && (
                  <button
                    onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
                    title="Toggle JSON telemetry payload"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Structured Payload Viewer */}
              {isExpanded && hasMeta && (
                <div className="mt-3 pt-3 border-t border-slate-100 font-mono text-[11px] bg-slate-50 p-3 rounded-lg text-slate-700 overflow-x-auto">
                  <pre>{JSON.stringify(evt.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
