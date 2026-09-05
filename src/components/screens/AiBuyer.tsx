import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Sliders,
  Store,
  Star,
  ShieldCheck,
  ArrowRight,
  Check,
  AlertTriangle,
  Lock,
  Package,
  ExternalLink,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { useRazorGate } from '../../context/RazorGateContext';
import { Product } from '../../lib/razorgate/types';

export const AiBuyer: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentIntent,
    currentCandidates,
    selectedProduct,
    catalog,
    addProductToCatalog,
    isAgentThinking,
    agentStep,
    policies,
    searchNotice,
    searchError,
    runIntentQuery,
    selectProductForGuard,
    setEditIntentModalOpen,
  } = useRazorGate();

  const [promptInput, setPromptInput] = useState(
    'I want bangles under ₹500'
  );

  const suggestedPrompts = [
    'I want bangles under ₹500',
    'Find black sneakers under ₹3000',
    'Show watches between ₹1000 and ₹2000',
    'Find headphones under ₹1500',
    'something nice',
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    runIntentQuery(promptInput);
  };

  const handleSelectSuggested = (prompt: string) => {
    setPromptInput(prompt);
    runIntentQuery(prompt);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          AI Buyer
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Describe what you want to purchase. RazorGate will interpret the request and enforce your transaction controls.
        </p>
      </div>

      {/* Main Intent Input Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            What would you like RazorGate to purchase?
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Find Sony wireless headphones under ₹10,000"
              className="w-full pl-4 pr-36 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isAgentThinking}
              className="absolute right-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              {isAgentThinking ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Interpreting...</span>
                </>
              ) : (
                <>
                  <span>Analyze Intent</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Suggested Prompts */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-medium">Examples:</span>
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSuggested(p)}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors text-xs font-medium cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

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
      </div>

      {/* Distinction Principle Banner (Section 14 requirement) */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-700">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong className="text-blue-900">Architecture Separation:</strong> AI recommends products based on intent; RazorGate Transaction Guard determines payment authorization.
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-700 shrink-0">
          <span>AI Recommend</span>
          <span className="text-slate-400">→</span>
          <span>Guard Authorize</span>
          <span className="text-slate-400">→</span>
          <span>Pay</span>
        </div>
      </div>

      {/* Structured Purchase Intent Card */}
      {currentIntent && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Purchase Intent
              </h3>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                AI interpreted intent
              </span>
            </div>

            <button
              onClick={() => setEditIntentModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Intent</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Category</div>
              <div className="text-slate-900 font-semibold truncate mt-0.5">
                {currentIntent.category}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Brand</div>
              <div className="text-slate-900 font-semibold mt-0.5">
                {currentIntent.preferredBrand || 'Any Brand'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Maximum Budget</div>
              <div className="text-emerald-700 font-mono font-bold mt-0.5">
                ₹{currentIntent.maxBudget.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Quantity</div>
              <div className="text-slate-900 font-semibold mt-0.5">
                {currentIntent.quantity} unit
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Merchant Requirement</div>
              <div className="text-slate-900 font-medium mt-0.5 truncate">
                {currentIntent.merchantRequirement === 'verified_only'
                  ? 'Verified merchants only'
                  : 'Any merchant'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Payment Authorization</div>
              <div className="text-blue-700 font-medium mt-0.5 truncate">
                Autonomous ≤ ₹{currentIntent.maxBudget.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-1">
            AI interpreted the request. The user remains in control.
          </div>
        </div>
      )}

      {/* AI Product Discovery Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              AI Product Discovery
            </h3>
            <p className="text-xs text-slate-500">
              Products discovered across registered merchant catalogs.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {currentCandidates.length} Candidates Discovered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentCandidates.map((product) => {
            const finalPayable = product.price + product.shippingCost + product.taxAmount;
            const isEligible = finalPayable <= policies.autonomousLimit && product.merchant.verified;
            const isTopMatch = product.id === 'prod_sony_ch720n' || (product.aiMatchScore || 0) >= 95;

            return (
              <div
                key={product.id}
                className={`bg-white border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between ${
                  isTopMatch ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Row: Merchant & Match Score */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">{product.merchant.name}</span>
                      {product.merchant.verified && (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          ✓ Verified
                        </span>
                      )}
                      {product.source && (
                        <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {product.source}
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      AI Match {product.aiMatchScore}%
                    </span>
                  </div>

                  {/* Product Details with Thumbnail */}
                  <div className="flex items-start gap-3">
                    {product.thumbnailUrl || product.imageUrl ? (
                      <img
                        src={product.thumbnailUrl || product.imageUrl}
                        alt={product.name}
                        className="w-14 h-14 object-contain rounded-lg border border-slate-100 bg-slate-50 p-1 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {product.name}
                      </h4>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Brand: <span className="text-slate-700 font-medium">{product.brand}</span> · Category: {product.category}
                      </div>
                    </div>
                  </div>

                  {/* Rating & Stock */}
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                    <span className="flex items-center gap-1 text-amber-600 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {product.rating}
                    </span>
                    <span>({product.reviewsCount} reviews)</span>
                    <span>•</span>
                    <span className={product.stockQuantity > 0 ? 'text-emerald-700 font-medium' : 'text-rose-600'}>
                      {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                    </span>
                  </div>

                  {/* Recommendation Reason */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Recommendation Reason
                    </span>
                    <p className="leading-relaxed">{product.recommendationReason}</p>
                  </div>

                  {/* Transaction Eligibility Status */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {isEligible ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Eligible for autonomous purchase
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        {finalPayable > policies.autonomousLimit
                          ? 'Exceeds autonomous limit — Requires human approval'
                          : 'Merchant review required'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Price & Select */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">
                      Payable Amount
                    </span>
                    <span className="text-xl font-bold font-mono text-slate-900">
                      ₹{finalPayable.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {product.productUrl && (
                      <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
                        title="View on Google Shopping"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => addProductToCatalog(product)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 border ${
                        catalog.some((p) => p.id === product.id)
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                      title="Save product to your permanent RazorGate Catalog"
                    >
                      {catalog.some((p) => p.id === product.id) ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>In Catalog</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Catalog</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        selectProductForGuard(product);
                        navigate('/guard');
                      }}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Select for Guard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
