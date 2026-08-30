import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, UserPlus, Calendar, CheckCircle, XCircle, BrainCircuit, DollarSign,
  Clock, Award, Star, Plus, Search, Building2, Phone, Mail, ShieldCheck,
  MapPin, Sparkles, Edit3, CheckCircle2, AlertTriangle, TrendingUp, FileCheck,
  BarChart3, Layers, ChevronDown, ChevronUp, X, Save, CreditCard, Wallet,
  BadgeDollarSign, SlidersHorizontal, FileText, Eye, Printer, ArrowUpRight,
  Percent, Gift, RefreshCw, Target, Activity, AlertCircle
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_BADGES = {
  SYSTEM_ADMIN:    { label: 'System Admin',    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  PROJECT_MANAGER: { label: 'Project Manager', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  TEAM_LEADER:     { label: 'Team Lead',       color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  HR_MANAGER:      { label: 'HR Manager',      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  EMPLOYEE:        { label: 'RCM Specialist',  color: 'bg-slate-700/60 text-slate-300 border-slate-600' }
};

const MPR_STATUS_CONFIG = {
  DRAFT:        { label: 'Draft',       color: 'bg-slate-700/60 text-slate-300 border-slate-600' },
  IN_REVIEW:    { label: 'In Review',   color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  COMPLETED:    { label: 'Completed',   color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  ACKNOWLEDGED: { label: 'Acknowledged',color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' }
};

const PAYROLL_STATUS_CONFIG = {
  DRAFT:            { label: 'Draft',            color: 'bg-slate-700/60 text-slate-300 border-slate-600' },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  PAID:             { label: 'Paid',             color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
};

const PAY_GRADES = ['A1','A2','B1','B2','C1','C2','D1','D2','E1','E2'];

const CURRENT_PERIOD = new Date().toISOString().substring(0, 7);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return d.toISOString().substring(0, 7);
});

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'indigo', trend }) {
  const colors = {
    indigo: 'from-indigo-600/20 to-indigo-600/5 border-indigo-500/30 text-indigo-400',
    emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-600/20 to-amber-600/5 border-amber-500/30 text-amber-400',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/30 text-purple-400',
    rose: 'from-rose-600/20 to-rose-600/5 border-rose-500/30 text-rose-400',
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/30 text-blue-400',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 space-y-2`}>
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-xl bg-${color}-500/10`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />{trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-white font-mono tracking-tight">{value}</p>
        <p className="text-xs font-semibold text-slate-300 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function KpiBar({ label, value, max = 5, color = 'indigo' }) {
  const pct = Math.round((value / max) * 100);
  const clrMap = { indigo: 'bg-indigo-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', purple: 'bg-purple-500' };
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold text-white font-mono">{value ?? '–'} / {max}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${clrMap[color]} rounded-full transition-all duration-700`} style={{ width: `${value ? pct : 0}%` }} />
      </div>
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, required, min, max, step, prefix, suffix, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs text-slate-400 font-medium">{label}</label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-xs text-slate-500 font-bold">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          min={min}
          max={max}
          step={step}
          className={`w-full bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white py-2.5 focus:outline-none focus:border-indigo-500 transition-colors ${prefix ? 'pl-7' : 'px-3'} ${suffix ? 'pr-10' : 'pr-3'}`}
        />
        {suffix && <span className="absolute right-3 text-xs text-slate-500">{suffix}</span>}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs text-slate-400 font-medium">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SALARY DRAWER
// ─────────────────────────────────────────────────────────────────────────────
function SalaryDrawer({ employee, onClose, onSaved }) {
  const profile = employee?.profile || {};
  const [form, setForm] = useState({
    monthlyBaseSalary: profile.monthlyBaseSalary || 5000,
    hourlyRate: profile.hourlyRate || 35,
    housingAllowance: profile.housingAllowance || 0,
    transportAllowance: profile.transportAllowance || 0,
    otherAllowances: profile.otherAllowances || 0,
    otherDeductions: profile.otherDeductions || 0,
    payGrade: profile.payGrade || 'C2',
    paymentMethod: profile.paymentMethod || 'BANK_TRANSFER',
  });
  const [saving, setSaving] = useState(false);

  const gross = parseFloat(form.monthlyBaseSalary || 0) + parseFloat(form.housingAllowance || 0) +
    parseFloat(form.transportAllowance || 0) + parseFloat(form.otherAllowances || 0);
  const epfEmp = Math.round(gross * 0.08);
  const tax = Math.round(gross > 5000 ? (gross - 5000) * 0.06 : 0);
  const netEst = gross - epfEmp - tax - parseFloat(form.otherDeductions || 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/hr/employees/${employee.id}/salary`, form);
      onSaved();
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save salary configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#0f1420] border-l border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-emerald-900/30 to-slate-900/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BadgeDollarSign className="w-5 h-5 text-emerald-400" />
                Salary Configuration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{employee?.firstName} {employee?.lastName} — {profile.jobTitle || employee?.role}</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Pay Grade & Method */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Pay Classification
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Pay Grade"
                value={form.payGrade}
                onChange={e => setForm({ ...form, payGrade: e.target.value })}
                options={PAY_GRADES.map(g => ({ value: g, label: g }))}
              />
              <SelectField
                label="Payment Method"
                value={form.paymentMethod}
                onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                options={[
                  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                  { value: 'CHEQUE', label: 'Cheque' },
                  { value: 'CASH', label: 'Cash' }
                ]}
              />
            </div>
          </div>

          {/* Base Compensation */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Base Compensation
            </h4>
            <div className="space-y-3">
              <InputField
                label="Monthly Base Salary"
                type="number"
                value={form.monthlyBaseSalary}
                onChange={e => setForm({ ...form, monthlyBaseSalary: e.target.value })}
                prefix="$"
                step="50"
                min="0"
              />
              <InputField
                label="Hourly Rate"
                type="number"
                value={form.hourlyRate}
                onChange={e => setForm({ ...form, hourlyRate: e.target.value })}
                prefix="$"
                suffix="/hr"
                step="0.5"
                min="0"
              />
            </div>
          </div>

          {/* Allowances */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-blue-400" /> Allowances
            </h4>
            <div className="space-y-3">
              <InputField
                label="Housing Allowance"
                type="number"
                value={form.housingAllowance}
                onChange={e => setForm({ ...form, housingAllowance: e.target.value })}
                prefix="$"
                step="50"
                min="0"
              />
              <InputField
                label="Transport Allowance"
                type="number"
                value={form.transportAllowance}
                onChange={e => setForm({ ...form, transportAllowance: e.target.value })}
                prefix="$"
                step="25"
                min="0"
              />
              <InputField
                label="Other Allowances"
                type="number"
                value={form.otherAllowances}
                onChange={e => setForm({ ...form, otherAllowances: e.target.value })}
                prefix="$"
                step="25"
                min="0"
              />
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Percent className="w-3.5 h-3.5 text-rose-400" /> Additional Deductions
            </h4>
            <InputField
              label="Other Deductions (loans, advances, etc.)"
              type="number"
              value={form.otherDeductions}
              onChange={e => setForm({ ...form, otherDeductions: e.target.value })}
              prefix="$"
              step="10"
              min="0"
            />
          </div>

          {/* Estimated Pay Breakdown Preview */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-amber-400" /> Estimated Monthly Pay
            </h4>
            {[
              { label: 'Gross Pay', value: gross, color: 'text-white' },
              { label: 'EPF (Employee 8%)', value: -epfEmp, color: 'text-rose-400' },
              { label: 'Income Tax (est.)', value: -tax, color: 'text-rose-400' },
              { label: 'Other Deductions', value: -parseFloat(form.otherDeductions || 0), color: 'text-rose-400' },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-xs">
                <span className="text-slate-400">{row.label}</span>
                <span className={`font-bold font-mono ${row.color}`}>
                  {row.value >= 0 ? '+' : ''}${Math.round(row.value).toLocaleString()}
                </span>
              </div>
            ))}
            <div className="border-t border-slate-700 pt-2 flex justify-between">
              <span className="text-xs font-bold text-slate-300">Estimated Net Pay</span>
              <span className="text-base font-black text-emerald-400 font-mono">${Math.round(netEst).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Salary Config'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAY SLIP MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PaySlipModal({ record, onClose }) {
  if (!record) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#0f1420] border border-slate-700 rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900/50 to-emerald-900/30 border-b border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Pay Slip</span>
              </div>
              <h3 className="text-lg font-black text-white">{record.userName}</h3>
              <p className="text-xs text-slate-400">Period: {record.period} • {record.paymentMethod?.replace('_', ' ') || 'BANK TRANSFER'}</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Earnings */}
          <div>
            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Earnings</h4>
            <div className="space-y-1.5">
              {[
                ['Base Salary', record.baseSalary],
                ['Housing Allowance', record.housingAllowance],
                ['Transport Allowance', record.transportAllowance],
                ['Performance Bonus', record.performanceBonus],
                ['Overtime Pay', record.overtimePay],
                ['Other Allowances', record.otherAllowances],
              ].filter(([, v]) => v > 0).map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-white font-mono">${value?.toLocaleString() || '0'}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-bold border-t border-slate-800 pt-1.5">
                <span className="text-slate-300">Gross Pay</span>
                <span className="text-emerald-400 font-mono">${record.grossPay?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">Deductions</h4>
            <div className="space-y-1.5">
              {[
                ['EPF (Employee 8%)', record.epfEmployee],
                ['Income Tax', record.incomeTax],
                ['Other Deductions', record.otherDeductions],
              ].filter(([, v]) => v > 0).map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-rose-400 font-mono">-${value?.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-bold border-t border-slate-800 pt-1.5">
                <span className="text-slate-300">Total Deductions</span>
                <span className="text-rose-400 font-mono">-${record.totalDeductions?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* EPF Employer */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex justify-between text-xs">
              <span className="text-blue-300">EPF Employer Contribution (12%)</span>
              <span className="text-blue-300 font-mono font-bold">${record.epfEmployer?.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Paid by company — not deducted from employee salary</p>
          </div>

          {/* Net Pay */}
          <div className="bg-gradient-to-r from-emerald-900/40 to-indigo-900/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Net Pay</span>
              <p className="text-3xl font-black text-white font-mono">${record.netPay?.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${PAYROLL_STATUS_CONFIG[record.status]?.color || 'text-slate-300 border-slate-600'}`}>
                {record.status}
              </span>
              {record.paymentDate && <p className="text-[10px] text-slate-500 mt-1">Paid: {record.paymentDate}</p>}
            </div>
          </div>

          {record.notes && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-[10px] font-bold text-amber-400 mb-0.5">Notes</p>
              <p className="text-xs text-slate-300">{record.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYROLL EDIT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PayrollEditModal({ record, onClose, onSaved }) {
  const [form, setForm] = useState({
    baseSalary: record.baseSalary || 0,
    housingAllowance: record.housingAllowance || 0,
    transportAllowance: record.transportAllowance || 0,
    performanceBonus: record.performanceBonus || 0,
    overtimePay: record.overtimePay || 0,
    otherAllowances: record.otherAllowances || 0,
    epfEmployee: record.epfEmployee || 0,
    incomeTax: record.incomeTax || 0,
    otherDeductions: record.otherDeductions || 0,
    status: record.status || 'DRAFT',
    notes: record.notes || '',
    paymentDate: record.paymentDate || new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  const gross = [form.baseSalary, form.housingAllowance, form.transportAllowance, form.performanceBonus, form.overtimePay, form.otherAllowances]
    .reduce((s, v) => s + parseFloat(v || 0), 0);
  const totalDeduct = [form.epfEmployee, form.incomeTax, form.otherDeductions].reduce((s, v) => s + parseFloat(v || 0), 0);
  const netPay = gross - totalDeduct;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/hr/payroll/${record.id}`, form);
      onSaved();
      onClose();
    } catch (e) {
      alert('Failed to update payroll record.');
    } finally {
      setSaving(false);
    }
  };

  const F = ({ label, field, prefix = '$' }) => (
    <InputField
      label={label}
      type="number"
      value={form[field]}
      onChange={e => setForm({ ...form, [field]: e.target.value })}
      prefix={prefix}
      step="1"
      min="0"
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#0f1420] border border-slate-700 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-indigo-900/30 to-slate-900/30 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-400" /> Edit Payroll — {record.userName}
            </h3>
            <p className="text-xs text-slate-400">Period: {record.period}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">Earnings</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <F label="Base Salary" field="baseSalary" />
              <F label="Housing Allowance" field="housingAllowance" />
              <F label="Transport Allowance" field="transportAllowance" />
              <F label="Performance Bonus" field="performanceBonus" />
              <F label="Overtime Pay" field="overtimePay" />
              <F label="Other Allowances" field="otherAllowances" />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-3">Deductions</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <F label="EPF Employee (8%)" field="epfEmployee" />
              <F label="Income Tax" field="incomeTax" />
              <F label="Other Deductions" field="otherDeductions" />
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] text-slate-500">Gross</p>
              <p className="text-base font-black text-white font-mono">${Math.round(gross).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">Deductions</p>
              <p className="text-base font-black text-rose-400 font-mono">-${Math.round(totalDeduct).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">Net Pay</p>
              <p className="text-base font-black text-emerald-400 font-mono">${Math.round(netPay).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Payroll Status"
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              options={[
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
                { value: 'PAID', label: 'Paid' }
              ]}
            />
            {form.status === 'PAID' && (
              <InputField label="Payment Date" type="date" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} />
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MPR MODAL (create / edit)
// ─────────────────────────────────────────────────────────────────────────────
function MPRModal({ employees, existing, onClose, onSaved }) {
  const isEdit = !!existing;
  const [form, setForm] = useState(existing ? {
    userId: existing.userId,
    type: existing.type || 'MPR',
    reviewPeriod: existing.reviewPeriod || CURRENT_PERIOD,
    overallRating: existing.overallRating ?? '',
    kpiScores: existing.kpiScores || { quality: '', productivity: '', teamwork: '', attendance: '' },
    goalsMetCount: existing.goalsMetCount ?? 0,
    totalGoalsCount: existing.totalGoalsCount ?? 5,
    strengths: existing.strengths || '',
    areasForImprovement: existing.areasForImprovement || '',
    salaryAdjustmentPct: existing.salaryAdjustmentPct ?? 0,
    bonusAwarded: existing.bonusAwarded ?? 0,
    incrementEffectiveDate: existing.incrementEffectiveDate || '',
    notes: existing.notes || '',
    status: existing.status || 'IN_REVIEW',
  } : {
    userId: '',
    type: 'MPR',
    reviewPeriod: CURRENT_PERIOD,
    overallRating: '',
    kpiScores: { quality: '', productivity: '', teamwork: '', attendance: '' },
    goalsMetCount: 0,
    totalGoalsCount: 5,
    strengths: '',
    areasForImprovement: '',
    salaryAdjustmentPct: 0,
    bonusAwarded: 0,
    incrementEffectiveDate: '',
    notes: '',
    status: 'IN_REVIEW',
  });
  const [saving, setSaving] = useState(false);

  const avgKpi = Object.values(form.kpiScores).filter(v => v !== '' && v !== null).length > 0
    ? Object.values(form.kpiScores).filter(v => v !== '' && v !== null).reduce((s, v) => s + parseFloat(v), 0) / Object.values(form.kpiScores).filter(v => v !== '' && v !== null).length
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !form.userId) { alert('Please select an employee.'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/hr/appraisals/${existing.id}`, form);
      } else {
        await api.post('/hr/appraisals', form);
      }
      onSaved();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save appraisal.');
    } finally {
      setSaving(false);
    }
  };

  const kpiKeys = ['quality', 'productivity', 'teamwork', 'attendance'];
  const kpiColors = { quality: 'indigo', productivity: 'emerald', teamwork: 'purple', attendance: 'amber' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#0f1420] border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-purple-900/30 to-slate-900/30 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              {isEdit ? 'Edit Performance Review' : 'New Performance Review'}
            </h3>
            <p className="text-xs text-slate-400">Monthly Performance Review (MPR) / Quarterly / Annual</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Employee + Type */}
          <div className="grid grid-cols-2 gap-3">
            {!isEdit ? (
              <SelectField
                label="Employee"
                value={form.userId}
                onChange={e => setForm({ ...form, userId: e.target.value })}
                options={[{ value: '', label: '-- Select Employee --' }, ...employees.map(emp => ({ value: emp.id, label: `${emp.firstName} ${emp.lastName}` }))]}
              />
            ) : (
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Employee</label>
                <div className="py-2.5 px-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-xs text-white font-semibold">{existing.userName}</div>
              </div>
            )}
            <SelectField
              label="Review Type"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              options={[
                { value: 'MPR', label: 'MPR — Monthly' },
                { value: 'QPR', label: 'QPR — Quarterly' },
                { value: 'ANNUAL', label: 'Annual Review' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Review Period (YYYY-MM)"
              value={form.reviewPeriod}
              onChange={e => setForm({ ...form, reviewPeriod: e.target.value })}
            />
            <SelectField
              label="Review Status"
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              options={[
                { value: 'IN_REVIEW', label: 'In Review' },
                { value: 'COMPLETED', label: 'Completed' },
              ]}
            />
          </div>

          {/* KPI Scores */}
          <div>
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Target className="w-3.5 h-3.5" /> KPI Scores (1.0 – 5.0)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {kpiKeys.map(key => (
                <InputField
                  key={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  type="number"
                  value={form.kpiScores[key]}
                  onChange={e => setForm({ ...form, kpiScores: { ...form.kpiScores, [key]: e.target.value } })}
                  min="1"
                  max="5"
                  step="0.1"
                />
              ))}
            </div>
            {avgKpi > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: `${(avgKpi / 5) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-purple-300 font-mono">Avg {avgKpi.toFixed(1)}/5.0</span>
              </div>
            )}
          </div>

          {/* Overall Rating & Goals */}
          <div className="grid grid-cols-3 gap-3">
            <InputField
              label="Overall Rating (1–5)"
              type="number"
              value={form.overallRating}
              onChange={e => setForm({ ...form, overallRating: e.target.value })}
              min="1"
              max="5"
              step="0.1"
            />
            <InputField
              label="Goals Met"
              type="number"
              value={form.goalsMetCount}
              onChange={e => setForm({ ...form, goalsMetCount: e.target.value })}
              min="0"
            />
            <InputField
              label="Total Goals"
              type="number"
              value={form.totalGoalsCount}
              onChange={e => setForm({ ...form, totalGoalsCount: e.target.value })}
              min="1"
            />
          </div>

          {/* Salary Adjustment */}
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Salary & Compensation Outcome
            </p>
            <div className="grid grid-cols-3 gap-3">
              <InputField
                label="Salary Increment %"
                type="number"
                value={form.salaryAdjustmentPct}
                onChange={e => setForm({ ...form, salaryAdjustmentPct: e.target.value })}
                suffix="%"
                min="0"
                max="30"
                step="0.5"
              />
              <InputField
                label="Bonus Awarded ($)"
                type="number"
                value={form.bonusAwarded}
                onChange={e => setForm({ ...form, bonusAwarded: e.target.value })}
                prefix="$"
                min="0"
              />
              <InputField
                label="Effective Date"
                type="date"
                value={form.incrementEffectiveDate}
                onChange={e => setForm({ ...form, incrementEffectiveDate: e.target.value })}
              />
            </div>
          </div>

          {/* Narrative */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Key Strengths</label>
              <textarea
                rows={3}
                value={form.strengths}
                onChange={e => setForm({ ...form, strengths: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Employee's key strengths and achievements…"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Development Focus</label>
              <textarea
                rows={3}
                value={form.areasForImprovement}
                onChange={e => setForm({ ...form, areasForImprovement: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Areas for improvement and growth plan…"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Additional Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </form>

        <div className="p-6 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
          >
            <Award className="w-4 h-4" />
            {saving ? 'Saving…' : isEdit ? 'Update Review' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HR PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function HREmployeesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [payPeriod, setPayPeriod] = useState(CURRENT_PERIOD);

  // Data
  const [employees, setEmployees]   = useState([]);
  const [leaves, setLeaves]         = useState([]);
  const [payrolls, setPayrolls]     = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [appraisals, setAppraisals] = useState([]);
  const [analytics, setAnalytics]   = useState(null);
  const [loading, setLoading]       = useState(true);

  // UI Modals
  const [showAddEmpModal, setShowAddEmpModal]       = useState(false);
  const [showMPRModal, setShowMPRModal]             = useState(false);
  const [editingMPR, setEditingMPR]                 = useState(null);
  const [showAllocateLeave, setShowAllocateLeave]   = useState(false);
  const [salaryDrawerEmp, setSalaryDrawerEmp]       = useState(null);
  const [paySlipRecord, setPaySlipRecord]           = useState(null);
  const [editingPayroll, setEditingPayroll]         = useState(null);

  // Employee expanded card
  const [expandedEmpId, setExpandedEmpId] = useState(null);

  // Forms
  const emptyNewEmp = { firstName: '', lastName: '', email: '', role: 'EMPLOYEE', jobTitle: 'RCM Billing Specialist', hourlyRate: 35, monthlyBaseSalary: 5600, phone: '', address: '', emergencyContact: '' };
  const [newEmp, setNewEmp] = useState(emptyNewEmp);
  const [allocateLeaveForm, setAllocateLeaveForm] = useState({ userId: '', leaveType: 'ANNUAL', daysCount: 3, reason: 'HR Performance Bonus Days' });

  const fetchAll = useCallback(async () => {
    try {
      const [empRes, leaveRes, attRes, appRes] = await Promise.all([
        api.get('/hr/employees'),
        api.get('/hr/leaves'),
        api.get('/hr/attendance'),
        api.get('/hr/appraisals')
      ]);
      setEmployees(empRes.data || []);
      setLeaves(leaveRes.data || []);
      setAttendance(attRes.data || []);
      setAppraisals(appRes.data || []);
    } catch (err) {
      console.error('HR fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPayroll = useCallback(async (period) => {
    try {
      const res = await api.get(`/hr/payroll?period=${period}`);
      setPayrolls(res.data || []);
    } catch (err) {
      console.error('Payroll fetch error:', err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get('/hr/analytics');
      setAnalytics(res.data);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchAll();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchPayroll(payPeriod);
  }, [payPeriod]);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/employees', newEmp);
      setShowAddEmpModal(false);
      setNewEmp(emptyNewEmp);
      fetchAll();
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to onboard employee.');
    }
  };

  const handleAllocateLeave = async (e) => {
    e.preventDefault();
    if (!allocateLeaveForm.userId) { alert('Please select an employee.'); return; }
    try {
      const res = await api.post('/hr/leaves/allocate', allocateLeaveForm);
      alert(res.data.message || 'Leave allocated!');
      setShowAllocateLeave(false);
      setAllocateLeaveForm({ userId: '', leaveType: 'ANNUAL', daysCount: 3, reason: 'HR Performance Bonus Days' });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to allocate leave.');
    }
  };

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await api.patch(`/hr/leaves/${leaveId}/status`, { status });
      fetchAll();
    } catch (_) { alert('Leave action failed.'); }
  };

  const handleRunPayroll = async () => {
    try {
      const res = await api.post('/hr/payroll/generate', { period: payPeriod });
      alert(res.data.message || 'Payroll generated!');
      fetchPayroll(payPeriod);
      fetchAnalytics();
    } catch (err) {
      alert('Payroll generation error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleApproveAll = async () => {
    const draftIds = payrolls.filter(p => p.status === 'DRAFT').map(p => p.userId);
    if (draftIds.length === 0) { alert('No draft records to approve.'); return; }
    try {
      const res = await api.post('/hr/payroll/approve', { period: payPeriod, userIds: draftIds });
      alert(res.data.message);
      fetchPayroll(payPeriod);
      fetchAnalytics();
    } catch (err) {
      alert('Approve error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleMPRStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/hr/appraisals/${id}`, { status });
      fetchAll();
    } catch (_) { alert('Status update failed.'); }
  };

  // Filtered lists
  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase();
    return (
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
      (emp.email || '').toLowerCase().includes(q) ||
      (emp.role || '').toLowerCase().includes(q) ||
      (emp.profile?.jobTitle || '').toLowerCase().includes(q)
    );
  });

  const filteredAppraisals = appraisals.filter(a => {
    const q = searchQuery.toLowerCase();
    return (a.userName || '').toLowerCase().includes(q) || (a.reviewPeriod || '').includes(q) || (a.type || '').toLowerCase().includes(q);
  });

  const filteredLeaves = leaves.filter(l => (l.userName || '').toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Loading HR Management Hub…</p>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'employees', label: 'Staff Directory',     icon: Users,        count: filteredEmployees.length },
    { id: 'payroll',   label: 'Payroll',             icon: DollarSign,   count: payrolls.length },
    { id: 'appraisals',label: 'MPR / Appraisals',    icon: Award,        count: filteredAppraisals.length },
    { id: 'leaves',    label: 'Leave Requests',      icon: Calendar,     count: filteredLeaves.length },
    { id: 'attendance',label: 'Attendance',          icon: Clock,        count: attendance.length },
  ];

  return (
    <div className="space-y-5">

      {/* ── HERO BANNER ─────────────────────────────────────── */}
      <div className="glass-panel rounded-3xl border border-indigo-500/30 overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-gradient-to-tr from-emerald-600 to-indigo-600 rounded-2xl shadow-xl shadow-emerald-500/20 text-white">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                HR Operations Hub
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">HR & Admin</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Staff management • Advanced payroll • MPR workflow • Leave & attendance
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff, roles, reviews…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Analytics KPI Strip */}
        {analytics && (
          <div className="border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-slate-800/60">
            {[
              { label: 'Total Staff',        value: analytics.headcount?.total,              color: 'text-white' },
              { label: 'Monthly Salary Cost', value: `$${(analytics.payroll?.totalNetPay || 0).toLocaleString()}`, color: 'text-emerald-400' },
              { label: 'Avg Salary',          value: `$${(analytics.payroll?.avgMonthlySalary || 0).toLocaleString()}`, color: 'text-indigo-300' },
              { label: 'MPR Due',             value: analytics.appraisals?.mprDueCount,       color: analytics.appraisals?.mprDueCount > 0 ? 'text-amber-400' : 'text-emerald-400' },
              { label: 'Avg Rating',          value: `${analytics.appraisals?.avgRating || '–'}/5.0`, color: 'text-purple-300' },
              { label: 'Leaves Pending',      value: analytics.leaves?.pending,               color: analytics.leaves?.pending > 0 ? 'text-amber-400' : 'text-slate-400' },
            ].map(kpi => (
              <div key={kpi.label} className="p-4 text-center">
                <p className={`text-lg font-black font-mono ${kpi.color}`}>{kpi.value ?? '–'}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── TAB BAR ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-2 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-indigo-500/50 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'employees' && (
            <button
              onClick={() => setShowAddEmpModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <UserPlus className="w-4 h-4" /> Onboard Staff
            </button>
          )}
          {activeTab === 'appraisals' && (
            <button
              onClick={() => { setEditingMPR(null); setShowMPRModal(true); }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
            >
              <Award className="w-4 h-4" /> New Review
            </button>
          )}
          {activeTab === 'leaves' && (
            <button
              onClick={() => setShowAllocateLeave(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Grant Leave Days
            </button>
          )}
          {activeTab === 'payroll' && (
            <div className="flex items-center gap-2">
              <select
                value={payPeriod}
                onChange={e => setPayPeriod(e.target.value)}
                className="bg-slate-900/80 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                {MONTH_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button
                onClick={handleRunPayroll}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Run Payroll
              </button>
              {payrolls.some(p => p.status === 'DRAFT') && (
                <button
                  onClick={handleApproveAll}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve All
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 1 — STAFF DIRECTORY                               */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Analytics mini-cards */}
          {analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={Users}       label="Total Headcount"    value={analytics.headcount?.total}       color="indigo" />
              <StatCard icon={DollarSign}  label="Monthly Salary Cost" value={`$${(analytics.payroll?.totalNetPay || 0).toLocaleString()}`} color="emerald" />
              <StatCard icon={Award}       label="MPR Due This Month"  value={analytics.appraisals?.mprDueCount} color={analytics.appraisals?.mprDueCount > 0 ? 'amber' : 'emerald'} />
              <StatCard icon={Star}        label="Average Rating"      value={`${analytics.appraisals?.avgRating || '–'}/5`} color="purple" />
            </div>
          )}

          {filteredEmployees.length === 0 ? (
            <div className="glass-panel p-16 text-center rounded-3xl">
              <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No staff found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEmployees.map(emp => {
                const profile = emp.profile || {};
                const roleBadge = ROLE_BADGES[emp.role] || ROLE_BADGES.EMPLOYEE;
                const leaveBals = profile.leaveBalances || { annual: 14, sick: 7, casual: 5, medical: 10 };
                const isExpanded = expandedEmpId === emp.id;

                return (
                  <div
                    key={emp.id}
                    className={`glass-panel rounded-2xl border transition-all duration-300 flex flex-col ${
                      emp.mprDue ? 'border-amber-500/30' : 'border-slate-800'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={emp.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.firstName}`}
                              alt=""
                              className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/30 bg-slate-800"
                            />
                            <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${emp.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white leading-tight">{emp.firstName} {emp.lastName}</h3>
                            <p className="text-xs text-indigo-300 font-medium mt-0.5">{profile.jobTitle || emp.role}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge.color}`}>
                            {roleBadge.label}
                          </span>
                          {emp.mprDue && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" /> MPR Due
                            </span>
                          )}
                          {profile.payGrade && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              Grade {profile.payGrade}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Key Info */}
                      <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Email</span>
                          <span className="text-slate-200 font-mono truncate max-w-[170px]">{emp.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Joined</span>
                          <span className="text-slate-200 font-mono">{profile.joinedDate || '–'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Monthly Base</span>
                          <span className="text-emerald-400 font-bold font-mono">
                            ${(profile.monthlyBaseSalary || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tasks Completed</span>
                          <span className="text-indigo-300 font-bold font-mono">{emp.completedTasksCount || 0}</span>
                        </div>
                      </div>

                      {/* Leave Balance Pills */}
                      <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-mono">
                        {[
                          { key: 'annual', label: 'ANN', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' },
                          { key: 'sick',   label: 'SICK', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' },
                          { key: 'casual', label: 'CAS', color: 'bg-amber-500/10 border-amber-500/20 text-amber-300' },
                          { key: 'medical',label: 'MED', color: 'bg-purple-500/10 border-purple-500/20 text-purple-300' },
                        ].map(({ key, label, color }) => (
                          <div key={key} className={`p-1.5 rounded-lg border ${color}`}>
                            <span className="block text-slate-400 text-[9px]">{label}</span>
                            <span className="font-bold">{leaveBals[key] || 0}d</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expandable Detail */}
                    {isExpanded && (
                      <div className="px-5 pb-4 space-y-2 text-xs border-t border-slate-800/80 pt-4">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Phone</span>
                          <span className="text-slate-300 font-mono">{profile.phone || '–'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Hourly Rate</span>
                          <span className="text-slate-300 font-mono">${profile.hourlyRate || 0}/hr</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Housing Allowance</span>
                          <span className="text-slate-300 font-mono">${profile.housingAllowance || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Transport Allowance</span>
                          <span className="text-slate-300 font-mono">${profile.transportAllowance || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pay Method</span>
                          <span className="text-slate-300">{(profile.paymentMethod || 'BANK TRANSFER').replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">QA Accuracy</span>
                          <span className="text-emerald-400 font-bold font-mono">{profile.codingAccuracyRate || 98.5}%</span>
                        </div>
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="px-5 pb-5 mt-auto pt-3 border-t border-slate-800 flex gap-2">
                      <button
                        onClick={() => setExpandedEmpId(isExpanded ? null : emp.id)}
                        className="flex-1 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {isExpanded ? 'Collapse' : 'Details'}
                      </button>
                      <button
                        onClick={() => setSalaryDrawerEmp(emp)}
                        className="flex-1 py-2 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <BadgeDollarSign className="w-3.5 h-3.5" /> Salary
                      </button>
                      <button
                        onClick={() => {
                          setEditingMPR(null);
                          setShowMPRModal(true);
                        }}
                        className="py-2 px-3 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 2 — PAYROLL                                        */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {/* Payroll summary KPIs */}
          {payrolls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={DollarSign} label="Total Gross Pay"   value={`$${payrolls.reduce((s,p) => s+(p.grossPay||0),0).toLocaleString()}`} color="blue" />
              <StatCard icon={Wallet}     label="Total Net Pay"     value={`$${payrolls.reduce((s,p) => s+(p.netPay||0),0).toLocaleString()}`}   color="emerald" />
              <StatCard icon={Percent}    label="Total Deductions"  value={`$${payrolls.reduce((s,p) => s+(p.totalDeductions||0),0).toLocaleString()}`} color="rose" />
              <StatCard icon={CheckCircle} label="Records Paid"     value={`${payrolls.filter(p=>p.status==='PAID').length} / ${payrolls.length}`} color="indigo" />
            </div>
          )}

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            {payrolls.length === 0 ? (
              <div className="p-16 text-center">
                <DollarSign className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-1">No payroll records for {payPeriod}</p>
                <p className="text-xs text-slate-600">Click "Run Payroll" to generate records from employee salary profiles</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Base</th>
                      <th className="p-4">Allowances</th>
                      <th className="p-4">Bonus/OT</th>
                      <th className="p-4">Gross</th>
                      <th className="p-4 text-rose-400">Deductions</th>
                      <th className="p-4 text-emerald-400">Net Pay</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {payrolls
                      .filter(p => (p.userName || '').toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(p => {
                        const stCfg = PAYROLL_STATUS_CONFIG[p.status] || PAYROLL_STATUS_CONFIG.DRAFT;
                        const allw = (p.housingAllowance || 0) + (p.transportAllowance || 0) + (p.otherAllowances || 0);
                        const bonusOt = (p.performanceBonus || 0) + (p.overtimePay || 0);
                        return (
                          <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-white">{p.userName}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{p.userRole} • {p.payGrade || '–'}</p>
                            </td>
                            <td className="p-4 font-mono">${(p.baseSalary || 0).toLocaleString()}</td>
                            <td className="p-4 font-mono text-blue-300">+${allw.toLocaleString()}</td>
                            <td className="p-4 font-mono text-amber-300">+${bonusOt.toLocaleString()}</td>
                            <td className="p-4 font-mono font-bold text-white">${(p.grossPay || 0).toLocaleString()}</td>
                            <td className="p-4 font-mono text-rose-400">-${(p.totalDeductions || 0).toLocaleString()}</td>
                            <td className="p-4 font-mono font-black text-emerald-400 text-sm">${(p.netPay || 0).toLocaleString()}</td>
                            <td className="p-4">
                              <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${stCfg.color}`}>
                                {stCfg.label}
                              </span>
                              {p.paymentDate && <p className="text-[10px] text-slate-500 mt-0.5">{p.paymentDate}</p>}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setPaySlipRecord(p)}
                                  title="View Pay Slip"
                                  className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingPayroll(p)}
                                  title="Edit Record"
                                  className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 3 — MPR / APPRAISALS                             */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'appraisals' && (
        <div className="space-y-4">
          {/* Summary */}
          {analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={FileCheck}  label="Total Reviews"          value={appraisals.length}                                  color="purple" />
              <StatCard icon={Star}       label="Avg Rating"             value={`${analytics.appraisals?.avgRating || '–'}/5.0`}    color="amber" />
              <StatCard icon={AlertTriangle} label="MPR Due"             value={analytics.appraisals?.mprDueCount}                  color={analytics.appraisals?.mprDueCount > 0 ? 'rose' : 'emerald'} />
              <StatCard icon={CheckCircle2} label="Completed This Month" value={analytics.appraisals?.mprCompletedThisMonth}        color="emerald" />
            </div>
          )}

          {filteredAppraisals.length === 0 ? (
            <div className="glass-panel p-16 text-center rounded-3xl">
              <Award className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No reviews found. Click "New Review" to create one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppraisals.map(a => {
                const stCfg = MPR_STATUS_CONFIG[a.status] || MPR_STATUS_CONFIG.DRAFT;
                const avgKpi = a.kpiScores
                  ? Object.values(a.kpiScores).filter(v => v !== null && v !== '').reduce((s, v) => s + parseFloat(v), 0) /
                    (Object.values(a.kpiScores).filter(v => v !== null && v !== '').length || 1)
                  : 0;

                return (
                  <div key={a.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-2xl text-purple-300 shrink-0">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                            {a.userName}
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                              {a.type || 'MPR'} — {a.reviewPeriod}
                            </span>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${stCfg.color}`}>
                              {stCfg.label}
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400">
                            Reviewer: <strong className="text-slate-300">{a.reviewerName}</strong>
                            {a.submittedAt ? ` • ${a.submittedAt}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Rating Badge */}
                      {a.overallRating && (
                        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400">Overall Rating</span>
                            <p className="text-base font-black text-white font-mono">{a.overallRating} / 5.0</p>
                          </div>
                          <div className="flex text-amber-400">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.floor(a.overallRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* KPI Bars */}
                    {a.kpiScores && Object.values(a.kpiScores).some(v => v) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-900/40 rounded-2xl border border-slate-800/60">
                        <KpiBar label="Quality"      value={parseFloat(a.kpiScores.quality || 0)}      color="indigo" />
                        <KpiBar label="Productivity" value={parseFloat(a.kpiScores.productivity || 0)} color="emerald" />
                        <KpiBar label="Teamwork"     value={parseFloat(a.kpiScores.teamwork || 0)}     color="purple" />
                        <KpiBar label="Attendance"   value={parseFloat(a.kpiScores.attendance || 0)}   color="amber" />
                      </div>
                    )}

                    {/* Compensation Outcome */}
                    {(a.salaryAdjustmentPct > 0 || a.bonusAwarded > 0) && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {a.salaryAdjustmentPct > 0 && (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-slate-400">Salary Increment</p>
                              <p className="text-sm font-black text-emerald-400">+{a.salaryAdjustmentPct}%</p>
                            </div>
                          </div>
                        )}
                        {a.bonusAwarded > 0 && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                            <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-slate-400">Bonus Awarded</p>
                              <p className="text-sm font-black text-amber-400">${a.bonusAwarded.toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                        {a.incrementEffectiveDate && (
                          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-slate-400">Effective Date</p>
                              <p className="text-sm font-black text-blue-300">{a.incrementEffectiveDate}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Narrative */}
                    {(a.strengths || a.areasForImprovement) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {a.strengths && (
                          <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 space-y-1">
                            <span className="font-bold text-emerald-400 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" /> Key Strengths
                            </span>
                            <p className="text-slate-300 leading-relaxed">{a.strengths}</p>
                          </div>
                        )}
                        {a.areasForImprovement && (
                          <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-1">
                            <span className="font-bold text-amber-400 flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5" /> Development Focus
                            </span>
                            <p className="text-slate-300 leading-relaxed">{a.areasForImprovement}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {a.notes && a.status === 'DRAFT' && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
                        <span className="font-bold">Note: </span>{a.notes}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => { setEditingMPR(a); setShowMPRModal(true); }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Review
                      </button>

                      {a.status === 'IN_REVIEW' && (
                        <button
                          onClick={() => handleMPRStatusUpdate(a.id, 'COMPLETED')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                        </button>
                      )}

                      {a.status === 'DRAFT' && (
                        <button
                          onClick={() => handleMPRStatusUpdate(a.id, 'IN_REVIEW')}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Start Review
                        </button>
                      )}

                      <div className="ml-auto flex items-center gap-2">
                        {a.goals && (
                          <span className="text-xs text-slate-400 font-mono">
                            Goals: {a.goalsMetCount}/{a.totalGoalsCount}
                          </span>
                        )}
                        {a.acknowledgedAt && (
                          <span className="text-xs text-blue-400 font-mono flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" /> Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 4 — LEAVE REQUESTS                               */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          {filteredLeaves.length === 0 ? (
            <div className="glass-panel p-16 text-center rounded-3xl">
              <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No active leave requests found.</p>
            </div>
          ) : (
            filteredLeaves.map(leave => {
              const isHighRisk = leave.aiRiskScore > 50;
              return (
                <div key={leave.id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">{leave.userName}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                        {leave.leaveType} — {leave.daysCount} days
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      <span className="font-mono text-slate-200">{leave.startDate} → {leave.endDate}</span>
                      <span className="ml-2 text-slate-500">· {leave.reason}</span>
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border text-xs space-y-0.5 min-w-[180px] ${
                    isHighRisk ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1"><BrainCircuit className="w-3.5 h-3.5" /> AI Risk</span>
                      <span className="font-mono">{leave.aiRiskScore}%</span>
                    </div>
                    <p className="text-[10px] leading-tight opacity-80 truncate">{leave.aiRiskReason}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {leave.status === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => handleLeaveAction(leave.id, 'APPROVED')}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleLeaveAction(leave.id, 'REJECTED')}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    ) : (
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                        leave.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        leave.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                        'bg-slate-700/60 text-slate-300 border-slate-600'
                      }`}>
                        {leave.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 5 — ATTENDANCE                                    */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Shift Attendance & Time Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Clock In</th>
                  <th className="p-4">Clock Out</th>
                  <th className="p-4">Hours</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {attendance
                  .filter(a => (a.userName || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(a => (
                    <tr key={a.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 font-bold text-white">{a.userName}</td>
                      <td className="p-4 font-mono text-slate-400">{a.date}</td>
                      <td className="p-4 font-mono text-emerald-400">{a.clockIn || '–'}</td>
                      <td className="p-4 font-mono text-amber-400">{a.clockOut || 'Active'}</td>
                      <td className="p-4 font-mono font-bold text-white">{a.hoursWorked}h</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {attendance.filter(a => (a.userName || '').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <div className="p-12 text-center text-xs text-slate-500">No attendance records found.</div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODAL — ONBOARD EMPLOYEE                             */}
      {/* ══════════════════════════════════════════════════════ */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-indigo-900/30 to-slate-900/30 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" /> Onboard New Staff Member
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">A first MPR review will be auto-created in Draft state</p>
              </div>
              <button onClick={() => setShowAddEmpModal(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="First Name" value={newEmp.firstName} onChange={e => setNewEmp({ ...newEmp, firstName: e.target.value })} required />
                <InputField label="Last Name"  value={newEmp.lastName}  onChange={e => setNewEmp({ ...newEmp, lastName:  e.target.value })} required />
              </div>
              <InputField label="Email Address" type="email" value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })} required />
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Role"
                  value={newEmp.role}
                  onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}
                  options={[
                    { value: 'EMPLOYEE',        label: 'RCM Specialist' },
                    { value: 'TEAM_LEADER',     label: 'Team Lead' },
                    { value: 'PROJECT_MANAGER', label: 'Project Manager' },
                    { value: 'HR_MANAGER',      label: 'HR Manager' },
                  ]}
                />
                <InputField label="Job Title" value={newEmp.jobTitle} onChange={e => setNewEmp({ ...newEmp, jobTitle: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Monthly Base Salary" type="number" value={newEmp.monthlyBaseSalary} onChange={e => setNewEmp({ ...newEmp, monthlyBaseSalary: e.target.value })} prefix="$" />
                <InputField label="Hourly Rate" type="number" value={newEmp.hourlyRate} onChange={e => setNewEmp({ ...newEmp, hourlyRate: e.target.value })} prefix="$" suffix="/hr" />
              </div>
              <InputField label="Phone" value={newEmp.phone} onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })} />

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddEmpModal(false)} className="px-4 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Onboard Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL — ALLOCATE LEAVE */}
      {showAllocateLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel border border-emerald-500/30 rounded-3xl shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" /> Grant Leave Days
              </h3>
              <button onClick={() => setShowAllocateLeave(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAllocateLeave} className="p-6 space-y-4">
              <SelectField
                label="Employee"
                value={allocateLeaveForm.userId}
                onChange={e => setAllocateLeaveForm({ ...allocateLeaveForm, userId: e.target.value })}
                options={[{ value: '', label: '-- Select Employee --' }, ...employees.map(emp => ({ value: emp.id, label: `${emp.firstName} ${emp.lastName}` }))]}
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Leave Type"
                  value={allocateLeaveForm.leaveType}
                  onChange={e => setAllocateLeaveForm({ ...allocateLeaveForm, leaveType: e.target.value })}
                  options={[
                    { value: 'ANNUAL', label: 'Annual' },
                    { value: 'SICK', label: 'Sick' },
                    { value: 'CASUAL', label: 'Casual' },
                    { value: 'MEDICAL', label: 'Medical' }
                  ]}
                />
                <InputField label="Days Count" type="number" value={allocateLeaveForm.daysCount} onChange={e => setAllocateLeaveForm({ ...allocateLeaveForm, daysCount: e.target.value })} min="1" />
              </div>
              <InputField label="Reason" value={allocateLeaveForm.reason} onChange={e => setAllocateLeaveForm({ ...allocateLeaveForm, reason: e.target.value })} />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAllocateLeave(false)} className="px-4 py-2.5 bg-slate-800 text-slate-300 text-xs rounded-xl">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20">
                  Grant Leave Days
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SALARY DRAWER ── */}
      {salaryDrawerEmp && (
        <SalaryDrawer
          employee={salaryDrawerEmp}
          onClose={() => setSalaryDrawerEmp(null)}
          onSaved={() => { fetchAll(); fetchAnalytics(); }}
        />
      )}

      {/* ── PAY SLIP MODAL ── */}
      {paySlipRecord && <PaySlipModal record={paySlipRecord} onClose={() => setPaySlipRecord(null)} />}

      {/* ── PAYROLL EDIT MODAL ── */}
      {editingPayroll && (
        <PayrollEditModal
          record={editingPayroll}
          onClose={() => setEditingPayroll(null)}
          onSaved={() => fetchPayroll(payPeriod)}
        />
      )}

      {/* ── MPR MODAL ── */}
      {showMPRModal && (
        <MPRModal
          employees={employees}
          existing={editingMPR}
          onClose={() => { setShowMPRModal(false); setEditingMPR(null); }}
          onSaved={() => { fetchAll(); fetchAnalytics(); }}
        />
      )}
    </div>
  );
}
