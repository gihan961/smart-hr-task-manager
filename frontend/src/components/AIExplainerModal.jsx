import React from 'react';
import { BrainCircuit, CheckCircle2, UserCheck, Sparkles, X, ShieldAlert } from 'lucide-react';

export default function AIExplainerModal({ recommendation, onClose, onConfirmAssign }) {
  if (!recommendation) return null;

  const { taskTitle, topRecommendation, allCandidates } = recommendation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl glass-panel rounded-2xl border border-indigo-500/30 p-6 space-y-6 shadow-2xl relative glow-indigo">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <BrainCircuit className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                AI Smart Workload Balancer
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Scikit-Learn Powered
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Optimal Task Matching for <span className="text-slate-200 font-semibold">{taskTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Recommendation Box */}
        {topRecommendation && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={topRecommendation.avatar}
                  alt={topRecommendation.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-400"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{topRecommendation.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      TOP MATCH #{topRecommendation.matchScore}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{topRecommendation.jobTitle}</p>
                </div>
              </div>
              <button
                onClick={() => onConfirmAssign(topRecommendation.userId)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
              >
                <UserCheck className="w-4 h-4" />
                Assign Immediately
              </button>
            </div>
            <p className="text-xs text-indigo-200/90 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-indigo-500/20">
              💡 {topRecommendation.recommendationReason}
            </p>
          </div>
        )}

        {/* Candidate Ranking Comparison Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            All Specialist Match Rankings
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {allCandidates && allCandidates.map((c, idx) => (
              <div
                key={c.userId}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-slate-500 font-bold">#{idx + 1}</span>
                  <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-lg object-cover" />
                  <div>
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="text-slate-400 ml-2">({c.accuracyRate}% Coding Acc.)</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-slate-400">
                    {c.activeTasksCount} active tasks ({100 - c.capacityLoadPercent}% free)
                  </span>
                  <span className="font-bold text-indigo-400 font-mono">
                    {c.matchScore}% Score
                  </span>
                  <button
                    onClick={() => onConfirmAssign(c.userId)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-lg text-[11px] font-medium"
                  >
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
