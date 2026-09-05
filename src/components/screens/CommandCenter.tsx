import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Plus,
  Clock,
  ChevronRight,
  TrendingUp,
  Activity,
  Check,
  Search,
  Sparkles,
  ExternalLink,
  Store,
  Star,
  Loader2,
  HelpCircle,
  PackageCheck,
} from 'lucide-react';
import { useRazorGate } from '../../context/RazorGateContext';
import { DecisionBadge } from '../common/DecisionBadge';

export const CommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const {
    transactions,
    policies,
    currentUser,
    runDemoScenario,
    setSelectedTxForDrawer,
    currentCandidates,
    isAgentThinking,
    agentStep,
    discoverySteps,
    agentMessage,
    searchError,
    searchNotice,
    runIntentQuery,
    selectProductForGuard,
    catalog,
    addProductToCatalog,
  } = useRazorGate();

  const [promptInput, setPromptInput] = useState('');

  const suggestedPrompts = [
    'I want bangles under ₹500',
    'Find black sneakers under ₹3000',
    'Show watches between ₹1000 and ₹2000',
    'Find headphones under ₹1500',
    'something nice',
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isAgentThinking) return;
    runIntentQuery(promptInput.trim());
  };

  const handleSelectPrompt = (prompt: string) => {
    setPromptInput(prompt);
    runIntentQuery(prompt);
  };

  // Dynamic calculations based on real transactions in state
  const totalCount = transactions.length;
  const approvedCount = transactions.filter((t) => t.decision === 'APPROVED').length;
  const blockedCount = transactions.filter((t) => t.decision === 'BLOCKED').length;
  const pendingCount = transactions.filter(
    (t) => t.decision === 'HUMAN_APPROVAL_REQUIRED' || t.paymentStatus === 'PENDING_APPROVAL'
  ).length;

  // Calculate authorized spend
  const todaySpend = transactions
    .filter((t) => t.decision === 'APPROVED')
    .reduce((sum, t) => sum + t.finalPayable, 0);

  const dailyLimit = policies.dailySpendingLimit;
  const remainingSpend = Math.max(0, dailyLimit - todaySpend);
  const spendPercentage = Math.min(100, Math.round((todaySpend / dailyLimit) * 100));

  // Recent transactions for activity feed
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      {/* Top Greeting & Protected Status Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Good morning, {currentUser.name.split(' ')[0]}
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Protected
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Your account is protected by RazorGate. AI shopping discovery is strictly bounded by your configured transaction guard and spending policies.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/ai-buyer')}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Start AI Purchase</span>
          </button>

          <button
            onClick={() => navigate('/approvals')}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Review Approvals</span>
            {pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate('/transactions')}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <span>View Transactions</span>
          </button>
        </div>
      </div>

      {/* ─── PRIMARY AI SHOPPING SEARCH GATEWAY ────────────────────────────── */}
      <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-card space-y-4 ring-1 ring-blue-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                AI Commerce Gateway · Product Discovery
              </h3>
              <p className="text-xs text-slate-500">
                Natural-language shopping intent with real-time Google Shopping search and policy enforcement.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium text-blue-700 bg-blue-50 border border-blue-200 self-start sm:self-auto">
            Google Shopping Engine
          </span>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. I want bangles under ₹500, Find black sneakers under ₹3000..."
              className="w-full pl-10 pr-36 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all shadow-sm"
            />
            <button
              type="submit"
              disabled={isAgentThinking || !promptInput.trim()}
              className="absolute right-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              {isAgentThinking ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Search</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Suggested Prompts */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-medium">Examples:</span>
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPrompt(prompt)}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-transparent text-slate-600 transition-all text-xs font-medium cursor-pointer"
            >
              "{prompt}"
            </button>
          ))}
        </div>

        {/* Agent Dialogue & Live Progress Feedback */}
        {(agentMessage || discoverySteps.length > 0 || searchNotice || searchError) && (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 animate-fadeIn">
            {/* Agent Message Bubble */}
            {agentMessage && (
              <div className="flex items-start gap-2.5 text-xs text-slate-800">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  RG
                </div>
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900">RazorGate Agent:</div>
                  <p className="text-slate-600">{agentMessage}</p>
                </div>
              </div>
            )}

            {/* Clarification Alert */}
            {searchNotice && (
              <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5">Clarification Required</strong>
                  {searchNotice}
                </div>
              </div>
            )}

            {/* Diagnostic Error Alert */}
            {searchError && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5">Search Notice</strong>
                  {searchError}
                </div>
              </div>
            )}

            {/* Live Checklist Steps */}
            {discoverySteps.length > 0 && (
              <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Discovery Sequence & Policy Enforcement
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {discoverySteps.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-2 p-1.5 rounded bg-white border border-slate-100"
                    >
                      {step.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : step.status === 'ACTIVE' ? (
                        <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
                      ) : step.status === 'ERROR' ? (
                        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span
                        className={`truncate ${
                          step.status === 'COMPLETED'
                            ? 'text-slate-800 font-medium'
                            : step.status === 'ACTIVE'
                            ? 'text-blue-700 font-semibold'
                            : step.status === 'ERROR'
                            ? 'text-rose-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Discovered Products Display */}
        {currentCandidates.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  <span>Found {currentCandidates.length} matching products</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Ranked by relevance, rating, and budget compliance. Saved to your isolated Firestore catalog.
                </p>
              </div>

              <button
                onClick={() => navigate('/catalog')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Catalog</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {currentCandidates.slice(0, 6).map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Top image and merchant badge */}
                    <div className="flex items-start gap-3">
                      {prod.thumbnailUrl || prod.imageUrl ? (
                        <img
                          src={prod.thumbnailUrl || prod.imageUrl}
                          alt={prod.name}
                          className="w-14 h-14 object-contain rounded-lg border border-slate-100 bg-slate-50 p-1 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <Store className="w-6 h-6" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 truncate">
                            {prod.source || 'Google Shopping'}
                          </span>
                          {prod.aiMatchScore && (
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-bold">
                              {prod.aiMatchScore}% Match
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-medium text-slate-500 truncate flex items-center gap-1">
                          <Store className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{prod.merchant.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Product Name */}
                    <h5
                      className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug"
                      title={prod.name}
                    >
                      {prod.name}
                    </h5>

                    {/* Rating and Delivery */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {prod.rating}
                      </span>
                      <span>({prod.reviewsCount})</span>
                      {prod.delivery && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400 truncate">{prod.delivery}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Price</div>
                      <div className="text-sm font-bold font-mono text-slate-900">
                        ₹{prod.price.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {prod.productUrl && (
                        <a
                          href={prod.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
                          title="View on Google Shopping"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => addProductToCatalog(prod)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1 border ${
                          catalog.some((p) => p.id === prod.id)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                        title="Save to permanent RazorGate catalog"
                      >
                        {catalog.some((p) => p.id === prod.id) ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>In Catalog</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          selectProductForGuard(prod);
                          navigate('/guard');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Transact</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Financial Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Transactions */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-slate-500">Transactions</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {totalCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {approvedCount} approved · {blockedCount} blocked
          </div>
        </div>

        {/* Metric 2: Approved */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-slate-500">Approved</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {approvedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            ₹{todaySpend.toLocaleString('en-IN')} authorized
          </div>
        </div>

        {/* Metric 3: Blocked */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-slate-500">Blocked</div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {blockedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            ₹0 money moved
          </div>
        </div>

        {/* Metric 4: Awaiting Approval */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-slate-500">Awaiting Approval</div>
          <div className={`text-2xl font-bold font-mono mt-1 ${pendingCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
            {pendingCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {pendingCount > 0 ? 'Action required' : 'No action required'}
          </div>
        </div>

        {/* Metric 5: Today's Spend */}
        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-slate-500">Today's Spend</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            ₹{todaySpend.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Limit: ₹{dailyLimit.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Spending Limit Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700">Daily Autonomous Spending Limit</span>
          <span className="font-mono text-slate-500">
            ₹{todaySpend.toLocaleString('en-IN')} of ₹{dailyLimit.toLocaleString('en-IN')} ({spendPercentage}%)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              spendPercentage > 90 ? 'bg-rose-500' : spendPercentage > 75 ? 'bg-amber-500' : 'bg-blue-600'
            }`}
            style={{ width: `${spendPercentage}%` }}
          />
        </div>
        <div className="text-[11px] text-slate-400 flex justify-between">
          <span>₹{remainingSpend.toLocaleString('en-IN')} remaining today</span>
          <span>Resets at midnight UTC</span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <span>Recent Transaction Activity</span>
            </h3>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-card overflow-hidden">
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No recent transactions
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTxForDrawer(tx)}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 truncate">
                        {tx.product.name}
                      </span>
                      <DecisionBadge decision={tx.decision} />
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{tx.product.merchant.name}</span>
                      <span>·</span>
                      <span className="font-mono">₹{tx.finalPayable.toLocaleString('en-IN')}</span>
                      <span>·</span>
                      <span className="text-slate-400">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Active Policies Summary (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>Active Guard Policies</span>
            </h3>
            <button
              onClick={() => navigate('/policies')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Autonomous Limit</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{policies.autonomousLimit.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Human Approval Above</span>
                <span className="font-mono font-bold text-amber-600">
                  ₹{policies.humanApprovalThreshold.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Daily Spending Limit</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{policies.dailySpendingLimit.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Verified Merchants Only</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Enforced</span>
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500">Intent Drift Tolerance</span>
                <span className="font-mono font-bold text-slate-900">
                  0% (Strict Budget)
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => navigate('/settings/spending')}
                className="w-full py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer text-center block"
              >
                Edit Spending Controls
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
