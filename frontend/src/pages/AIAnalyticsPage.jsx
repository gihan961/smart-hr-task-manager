import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BrainCircuit, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  Activity, 
  ShieldCheck,
  Award
} from 'lucide-react';

export default function AIAnalyticsPage() {
  const [predictions, setPredictions] = useState([]);
  const [leaveRisk, setLeaveRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  const [leaveDays, setLeaveDays] = useState(3);
  const [urgentBatches, setUrgentBatches] = useState(2);
  const [staffCount, setStaffCount] = useState(4);
  const [calculating, setCalculating] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    fetchPredictions();
    runRiskSimulation();
  }, []);

  const fetchPredictions = async () => {
    try {
      const res = await api.get('/ai/predict-performance');
      setPredictions(res.data || []);
    } catch (err) {
      console.error('Predictions fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const runRiskSimulation = async () => {
    setCalculating(true);
    try {
      const res = await api.post('/ai/analyze-leave-risk', {
        leaveDays: parseInt(leaveDays) || 0,
        openUrgentClaimBatches: parseInt(urgentBatches) || 0,
        availableStaffCount: parseInt(staffCount) || 1
      });
      setLeaveRisk(res.data);
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 2000);
    } catch (err) {
      console.error('Risk simulation error:', err);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading AI Predictive Analytics Engine...</div>;
  }

  const getRiskStyle = (score, level) => {
    if (level === 'HIGH' || score > 50) {
      return {
        bg: 'bg-rose-950/50 border-rose-500/50 text-rose-300',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      };
    }
    if (level === 'MODERATE' || score > 30) {
      return {
        bg: 'bg-amber-950/50 border-amber-500/50 text-amber-300',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      };
    }
    return {
      bg: 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between glass-card p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <BrainCircuit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Python Scikit-Learn Predictive Analytics Engine
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Engine Online
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Workload optimization, leave revenue risk scoring, and staff performance trajectory modeling.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Live Risk Simulator + Performance Trend Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive Leave SLA Risk Simulator */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 border border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Interactive Leave SLA Risk Simulator
          </h3>
          <p className="text-xs text-slate-400">
            Simulate employee leave windows against active claim batch deadlines to predict timely-filing breach risk.
          </p>

          <div className="grid grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block font-medium">Leave Duration (Days)</label>
              <input
                type="number"
                min="0"
                value={leaveDays}
                onChange={(e) => setLeaveDays(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block font-medium">Urgent Claim Batches</label>
              <input
                type="number"
                min="0"
                value={urgentBatches}
                onChange={(e) => setUrgentBatches(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block font-medium">Active Staff Count</label>
              <input
                type="number"
                min="1"
                value={staffCount}
                onChange={(e) => setStaffCount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <button
            onClick={runRiskSimulation}
            disabled={calculating}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            {calculating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>Computing Scikit-Learn Model...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Compute AI Risk Assessment</span>
              </>
            )}
          </button>

          {leaveRisk && (() => {
            const style = getRiskStyle(leaveRisk.riskScore, leaveRisk.riskLevel);
            return (
              <div className={`p-4 rounded-xl border space-y-2 transition-all duration-500 ${style.bg} ${
                justUpdated ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/20 scale-[1.01]' : ''
              }`}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2">
                    Evaluated Risk Level: 
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] ${style.badge}`}>
                      {leaveRisk.riskLevel}
                    </span>
                  </span>
                  <span className="font-mono text-sm">{leaveRisk.riskScore}% Risk</span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">{leaveRisk.reasoning || leaveRisk.recommendation}</p>
                {leaveRisk.source && (
                  <div className="pt-1 border-t border-white/10 text-[10px] opacity-75 font-mono flex items-center justify-between">
                    <span>Engine: {leaveRisk.source}</span>
                    {justUpdated && <span className="text-indigo-400 font-sans animate-pulse">✓ Updated</span>}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Right: Staff Performance & Attrition Predictions */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 border border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Performance & Attrition Trajectory Predictions
          </h3>
          <p className="text-xs text-slate-400">
            Real-time Scikit-Learn task accuracy ratings and productivity scores per employee.
          </p>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {predictions.map(p => (
              <div key={p.userId} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white">{p.userName}</h4>
                  <p className="text-[11px] text-slate-400">{p.jobTitle} • {p.completedTasks} tasks completed</p>
                </div>

                <div className="flex items-center space-x-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Accuracy</span>
                    <span className="font-bold text-emerald-400">{p.accuracyRate}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Performance</span>
                    <span className={`font-bold px-2 py-0.5 rounded-md border text-[10px] ${
                      p.performanceTrend === 'HIGH_PERFORMER' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    }`}>
                      {p.performanceTrend}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
