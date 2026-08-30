import React, { useState, useEffect } from 'react';
import api from '../services/api';
import SlaCountdown from '../components/SlaCountdown';
import { Boxes, Plus, AlertTriangle, DollarSign, FileCheck, CheckCircle2 } from 'lucide-react';

export default function ClaimBatchesPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    batchName: '',
    payerName: 'Blue Cross Blue Shield',
    totalClaims: 120,
    totalDollarValue: 350000,
    timelyFilingDays: 3
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await api.get('/tasks/batches');
      setBatches(res.data || []);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks/batches', form);
      setShowModal(false);
      fetchBatches();
    } catch (err) {
      console.error('Error creating batch:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between glass-card p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            RCM Claim Batches & Timely-Filing SLAs
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {batches.length} Active Batches
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Monitor healthcare payer deadlines to prevent timely-filing revenue write-offs.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          Ingest Claim Batch
        </button>
      </div>

      {/* Grid of Claim Batches */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {batches.map(b => (
          <div key={b.id} className="glass-panel p-5 rounded-2xl space-y-4 border border-slate-800 hover:border-indigo-500/40 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {b.payerName}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">{b.batchName}</h3>
              </div>
              {b.isSlaWarning && (
                <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse" title="SLA Breach Risk Warning">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block">Total Encounters</span>
                <span className="font-bold text-white">{b.totalClaims} Claims</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Dollar Value</span>
                <span className="font-bold text-emerald-400">${b.totalDollarValue.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">Timely Filing SLA:</span>
              <SlaCountdown deadline={b.timelyFilingSlaDeadline} />
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-indigo-500/30 space-y-4">
            <h3 className="text-base font-bold text-white">Ingest New Claim Batch</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Batch Name</label>
                <input
                  type="text"
                  required
                  value={form.batchName}
                  onChange={(e) => setForm({ ...form, batchName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                  placeholder="e.g. Cigna-Cardiology-Aug-A1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Payer Name</label>
                <input
                  type="text"
                  required
                  value={form.payerName}
                  onChange={(e) => setForm({ ...form, payerName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Claims Count</label>
                  <input
                    type="number"
                    value={form.totalClaims}
                    onChange={(e) => setForm({ ...form, totalClaims: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">SLA Window (Days)</label>
                  <input
                    type="number"
                    value={form.timelyFilingDays}
                    onChange={(e) => setForm({ ...form, timelyFilingDays: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                >
                  Ingest Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
