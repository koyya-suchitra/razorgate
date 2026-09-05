import React, { useState } from 'react';
import {
  Receipt,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Building2,
} from 'lucide-react';
import { useRazorGate } from '../../context/RazorGateContext';
import { DecisionBadge } from '../common/DecisionBadge';

export const TransactionsScreen: React.FC = () => {
  const { transactions, setSelectedTxForDrawer } = useRazorGate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filterTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'APPROVED', label: 'Approved' },
    { id: 'BLOCKED', label: 'Blocked' },
    { id: 'AWAITING_APPROVAL', label: 'Awaiting Approval' },
    { id: 'FAILED', label: 'Failed' },
  ];

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.product.name.toLowerCase().includes(search.toLowerCase()) ||
      t.product.merchant.name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'APPROVED' && t.decision === 'APPROVED') ||
      (statusFilter === 'BLOCKED' && t.decision === 'BLOCKED') ||
      (statusFilter === 'AWAITING_APPROVAL' &&
        (t.decision === 'HUMAN_APPROVAL_REQUIRED' || t.paymentStatus === 'PENDING_APPROVAL')) ||
      (statusFilter === 'FAILED' && t.paymentStatus === 'FAILED');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            Transactions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete history of AI-initiated transactions and authorization decisions.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Showing {filtered.length} of {transactions.length} Transactions
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by transaction ID, product, or merchant..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:border-blue-600 focus:outline-none shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Transaction ID</th>
                <th className="py-3.5 px-4 font-semibold">Product & Merchant</th>
                <th className="py-3.5 px-4 font-semibold">Amount</th>
                <th className="py-3.5 px-4 font-semibold">Guard Decision</th>
                <th className="py-3.5 px-4 font-semibold">Payment Status</th>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTxForDrawer(t)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700 group-hover:text-blue-800">
                    {t.id}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 truncate max-w-xs">
                      {t.product.name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{t.product.merchant.name}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                    ₹{t.finalPayable.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3.5 px-4">
                    <DecisionBadge decision={t.decision} size="sm" />
                  </td>

                  <td className="py-3.5 px-4">
                    <DecisionBadge paymentStatus={t.paymentStatus} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                    {new Date(t.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTxForDrawer(t);
                      }}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      title="Inspect Transaction Guard"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
