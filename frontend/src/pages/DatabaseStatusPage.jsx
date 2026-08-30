import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Database, Server, RefreshCw, CheckCircle2, ShieldCheck, Trash2, Layers, HardDrive } from 'lucide-react';

export default function DatabaseStatusPage() {
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/database/status');
      setDbData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect to database status API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20 text-white">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              MongoDB Database Inspector
            </h1>
            <p className="text-xs text-slate-400">
              Real-time database connection metrics and collection schema telemetry.
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="px-4 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 border border-indigo-500/40 shadow-lg shadow-indigo-600/20 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh DB Telemetry
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs">
          {error}
        </div>
      )}

      {dbData && (
        <>
          {/* Main Grid: Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Database Engine</span>
                <Server className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-lg font-bold text-white">{dbData.database}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-mono text-indigo-300">{dbData.uri}</span>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Connection Status</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {dbData.status}
              </p>
              <p className="text-[11px] text-slate-400">Host: {dbData.host}:{dbData.port} / DB: {dbData.name}</p>
            </div>
          </div>

          {/* Collection Document Counts */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              MongoDB Collection Schema Telemetry
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
              {Object.entries(dbData.collections || {}).map(([key, count]) => (
                <div key={key} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-medium capitalize">
                    {key.replace('Count', '')}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-white font-mono">{count}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {count === 0 ? 'Empty' : `${count} docs`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
