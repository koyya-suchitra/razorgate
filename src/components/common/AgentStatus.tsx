import React, { useState } from 'react';
import { Activity, Check, Circle, Cpu, Zap } from 'lucide-react';
import { useRazorGate } from '../../context/RazorGateContext';

export const AgentStatus: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { agentMetrics, isAgentThinking, agentStep } = useRazorGate();
  const [showDetails, setShowDetails] = useState(false);

  if (compact) {
    return (
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 hover:border-blue-500/40 transition-colors text-xs font-mono"
        title="Agent Observability Status"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
              isAgentThinking ? 'bg-amber-400 opacity-75' : 'bg-emerald-400 opacity-75'
            }`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isAgentThinking ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          ></span>
        </span>
        <span className="text-slate-300 font-medium font-sans">RazorGate Agent</span>
        <span className={isAgentThinking ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
          {isAgentThinking ? 'Processing' : 'Online'}
        </span>
      </button>
    );
  }

  return (
    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-200">RazorGate Agent</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          ● Online
        </span>
      </div>

      {/* Pipeline Progress */}
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
          <Activity className="w-3 h-3 text-blue-400" /> Pipeline Execution
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="w-3 h-3" /> Intent
          </span>
          <span className="text-slate-600">→</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="w-3 h-3" /> Discovery
          </span>
          <span className="text-slate-600">→</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="w-3 h-3" /> Verify
          </span>
          <span className="text-slate-600">→</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Circle className="w-2.5 h-2.5" /> Pay
          </span>
          <span className="text-slate-600">→</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Circle className="w-2.5 h-2.5" /> Audit
          </span>
        </div>
      </div>

      {/* Latency Metrics */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" /> Agent Observability Metrics
        </div>
        <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
          <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800 text-center">
            <div className="text-[9px] text-slate-500 uppercase">Intent Parse</div>
            <div className="font-semibold text-blue-400">{agentMetrics.intentParseMs}ms</div>
          </div>
          <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800 text-center">
            <div className="text-[9px] text-slate-500 uppercase">Catalog Search</div>
            <div className="font-semibold text-cyan-400">{agentMetrics.catalogSearchMs}ms</div>
          </div>
          <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800 text-center">
            <div className="text-[9px] text-slate-500 uppercase">Policy Eval</div>
            <div className="font-semibold text-emerald-400">{agentMetrics.policyEvalMs}ms</div>
          </div>
        </div>
        <div className="mt-1.5 text-[10px] text-slate-500 text-right">
          Deterministic latency benchmarks
        </div>
      </div>
    </div>
  );
};
