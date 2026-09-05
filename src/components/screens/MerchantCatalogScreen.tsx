import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Star,
  ExternalLink,
} from 'lucide-react';
import { useRazorGate } from '../../context/RazorGateContext';

export const MerchantCatalogScreen: React.FC = () => {
  const navigate = useNavigate();
  const { catalog, selectProductForGuard } = useRazorGate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Dynamic categories including discovered ones
  const dynamicCategories = [
    'ALL',
    ...Array.from(new Set(catalog.map((p) => p.category).filter(Boolean))),
  ];

  const filtered = catalog.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.merchant.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Product & Merchant Catalog
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Structured product and merchant data for AI-driven commerce across registered merchants and Google Shopping.
        </p>
      </div>

      {/* Info Header Banner */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 block mb-0.5">Autonomous Commerce Registry</strong>
          RazorGate exposes structured commerce information so AI buyers can discover, evaluate, and transact with merchants programmatically without uncontrolled API credentials.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product, brand, or merchant..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:border-blue-600 focus:outline-none shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap capitalize ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Product & Brand</th>
                <th className="py-3.5 px-4 font-semibold">Merchant</th>
                <th className="py-3.5 px-4 font-semibold">Price</th>
                <th className="py-3.5 px-4 font-semibold">Availability</th>
                <th className="py-3.5 px-4 font-semibold">Source</th>
                <th className="py-3.5 px-4 font-semibold">AI Integration</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No matching products found in catalog.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        {prod.thumbnailUrl || prod.imageUrl ? (
                          <img
                            src={prod.thumbnailUrl || prod.imageUrl}
                            alt={prod.name}
                            className="w-10 h-10 object-contain rounded border border-slate-100 bg-slate-50 p-0.5 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : null}

                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 line-clamp-1">{prod.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                            <span>{prod.brand}</span>
                            <span>·</span>
                            <span className="capitalize">{prod.category}</span>
                            {prod.rating && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-0.5 text-amber-600 font-sans">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  {prod.rating}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{prod.merchant.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {prod.merchant.domain}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      ₹{prod.price.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {prod.stockQuantity > 0 ? (
                        <span className="text-emerald-700">{prod.stockQuantity} available</span>
                      ) : (
                        <span className="text-rose-600">0 available</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {prod.source || 'Direct Registry'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {prod.aiReady && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                          AI Ready
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {prod.productUrl && (
                          <a
                            href={prod.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
                            title="View external product"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => {
                            selectProductForGuard(prod);
                            navigate('/guard');
                          }}
                          className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-700 text-xs font-medium transition-colors cursor-pointer shadow-sm inline-flex items-center gap-1"
                        >
                          <span>Transact</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
