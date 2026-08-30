import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, Search, Filter, ShieldCheck, Clock } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [search]);

  const fetchLogs = async () => {
    try {
      const res = await api.get(`/admin/audit-logs?search=${encodeURIComponent(search)}`);
      setLogs(res.data || []);
    } catch (err) {
      console.error('Audit logs fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between glass-card p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              HIPAA & System Governance Audit Trail
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Immutable Logging
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Captures all user authentication, task status updates, leave approvals, and data mutations.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Action</th>
              <th className="p-4">Resource</th>
              <th className="p-4">IP Address</th>
              <th className="p-4">Audit Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-900/40 font-mono">
                <td className="p-4 text-slate-400 text-[11px]">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="p-4 font-bold text-white font-sans">{log.userName}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px]">
                    {log.userRole}
                  </span>
                </td>
                <td className="p-4 text-indigo-300 font-bold">{log.action}</td>
                <td className="p-4 text-slate-400">{log.resource}</td>
                <td className="p-4 text-emerald-400">{log.ipAddress}</td>
                <td className="p-4 font-sans text-slate-300 max-w-xs truncate">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
