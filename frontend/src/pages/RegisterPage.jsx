import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  UserPlus, ArrowLeft, ShieldAlert, CheckCircle, Sparkles, Building2,
  Lock, User, Mail, Briefcase, Award, Calendar, Phone, Star, X, Eye, EyeOff
} from 'lucide-react';

const SENIORITY_LEVELS = ['Junior', 'Mid-level', 'Senior', 'Lead', 'Executive'];
const SPECIALTIES = [
  'Medical Billing & Coding', 'ICD-10-CM Coding', 'CPT Coding', 'Claims Processing',
  'Revenue Cycle Management', 'Quality Assurance & Audit', 'AR Follow-up',
  'Denial Management', 'Patient Registration', 'Insurance Verification',
  'Project Management', 'Team Leadership', 'HR Operations', 'System Administration',
  'Data Analytics', 'Compliance & Regulatory', 'General Operations'
];
const YEARS_OPTIONS = ['< 1 year', '1 year', '2 years', '3 years', '4 years', '5 years', '6–10 years', '10+ years'];

function InputField({ label, type = 'text', value, onChange, required, placeholder, suffix, icon: Icon }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400 font-medium">{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</label>
      <div className="relative flex items-center">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-500 absolute left-3" />}
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`w-full bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white py-2.5 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 ${Icon ? 'pl-9' : 'pl-3'} ${isPassword || suffix ? 'pr-10' : 'pr-3'}`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 text-slate-500 hover:text-white transition-colors">
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
        {suffix && !isPassword && <span className="absolute right-3 text-xs text-slate-500">{suffix}</span>}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400 font-medium">{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
      >
        {options.map(o => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function RegisterPage({ onNavigateLogin, onSuccessRegister }) {
  const { user, registerOrganization } = useAuth();

  // ── Organisation Registration (public, first-time setup) ──────────────────
  const [orgForm, setOrgForm] = useState({
    organizationName: '',
    organizationCode: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: ''
  });

  // ── HR Account Creation (logged-in HR/Admin/PM only) ──────────────────────
  const defaultEmpForm = {
    firstName: '', lastName: '', email: '', password: 'Welcome2026!',
    role: 'EMPLOYEE',
    jobTitle: 'RCM Billing Specialist',
    specialty: 'Medical Billing & Coding',
    seniorityLevel: 'Mid-level',
    yearsAtCompany: '< 1 year',
    employeeId: `EMP-${Date.now().toString().slice(-6)}`,
    departmentId: 'dept-01',
    phone: '',
    emergencyContact: '',
    monthlyBaseSalary: '',
    hourlyRate: '',
  };
  const [empForm, setEmpForm] = useState(defaultEmpForm);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine which mode to show
  const isHRUser = user && ['SYSTEM_ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER'].includes(user.role);

  // ── Organisation submit ──────────────────────────────────────────────────
  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setLoading(true);
    try {
      await registerOrganization(orgForm);
      setSuccessMsg(`Organization "${orgForm.organizationName}" registered successfully!`);
      setTimeout(() => {
        if (onSuccessRegister) onSuccessRegister();
        else if (onNavigateLogin) onNavigateLogin();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register organization.');
    } finally {
      setLoading(false);
    }
  };

  // ── HR Account Creation submit ────────────────────────────────────────────
  const handleEmpSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setLoading(true);
    try {
      await api.post('/auth/register', empForm);
      setSuccessMsg(`Account created for ${empForm.firstName} ${empForm.lastName} (${empForm.role}). Default password: ${empForm.password}`);
      setEmpForm({ ...defaultEmpForm, employeeId: `EMP-${Date.now().toString().slice(-6)}` });
    } catch (err) {
      setError(err.response?.data?.message || 'Account creation failed.');
    } finally {
      setLoading(false);
    }
  };

  const setEmp = (field, val) => setEmpForm(f => ({ ...f, [field]: val }));

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onNavigateLogin}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Smart HR RCM Platform
          </div>
        </div>

        {/* ── CASE 1: HR/Admin creating an employee account ── */}
        {isHRUser && (
          <div className="glass-panel border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-indigo-900/30 to-emerald-900/20">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl">
                  <UserPlus className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-white">Create Employee Account</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Accessible only to HR, Admin & Project Manager roles
                  </p>
                </div>
              </div>
            </div>

            {successMsg && (
              <div className="mx-6 mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-300">Account Created</p>
                  <p className="text-xs text-slate-300 mt-0.5">{successMsg}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleEmpSubmit} className="p-6 space-y-6">
              {/* Section: Personal Info */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-indigo-400" /> Personal Information
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="First Name" value={empForm.firstName} onChange={e => setEmp('firstName', e.target.value)} required placeholder="Jane" />
                  <InputField label="Last Name"  value={empForm.lastName}  onChange={e => setEmp('lastName',  e.target.value)} required placeholder="Doe" />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <InputField label="Email Address" type="email" value={empForm.email} onChange={e => setEmp('email', e.target.value)} required placeholder="jane.doe@company.com" icon={Mail} />
                  <InputField label="Phone Number" value={empForm.phone} onChange={e => setEmp('phone', e.target.value)} placeholder="+1 (555) 123-4567" icon={Phone} />
                </div>
                <div className="mt-3">
                  <InputField label="Emergency Contact" value={empForm.emergencyContact} onChange={e => setEmp('emergencyContact', e.target.value)} placeholder="Name & phone number" />
                </div>
              </div>

              {/* Section: Role & Position */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-400" /> Role & Position
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="System Role" required
                    value={empForm.role}
                    onChange={e => setEmp('role', e.target.value)}
                    options={[
                      { value: 'EMPLOYEE',        label: 'RCM Specialist (Employee)' },
                      { value: 'TEAM_LEADER',     label: 'Team Leader' },
                      { value: 'PROJECT_MANAGER', label: 'Project Manager' },
                      { value: 'HR_MANAGER',      label: 'HR Manager' },
                      { value: 'SYSTEM_ADMIN',    label: 'System Administrator' },
                    ]}
                  />
                  <InputField label="Job Title" value={empForm.jobTitle} onChange={e => setEmp('jobTitle', e.target.value)} required placeholder="e.g. RCM Billing Specialist" icon={Briefcase} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <SelectField
                    label="Seniority Level" required
                    value={empForm.seniorityLevel}
                    onChange={e => setEmp('seniorityLevel', e.target.value)}
                    options={SENIORITY_LEVELS}
                  />
                  <SelectField
                    label="Years at Company"
                    value={empForm.yearsAtCompany}
                    onChange={e => setEmp('yearsAtCompany', e.target.value)}
                    options={YEARS_OPTIONS}
                  />
                </div>
                <div className="mt-3">
                  <SelectField
                    label="Primary Specialty"
                    value={empForm.specialty}
                    onChange={e => setEmp('specialty', e.target.value)}
                    options={SPECIALTIES}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <InputField
                    label="Employee ID"
                    value={empForm.employeeId}
                    onChange={e => setEmp('employeeId', e.target.value)}
                    placeholder="EMP-000000"
                  />
                  <SelectField
                    label="Department"
                    value={empForm.departmentId}
                    onChange={e => setEmp('departmentId', e.target.value)}
                    options={[
                      { value: 'dept-01', label: 'Medical Billing & Coding' },
                      { value: 'dept-02', label: 'Claims Processing' },
                      { value: 'dept-03', label: 'Quality Assurance' },
                      { value: 'dept-04', label: 'Technology & Platforms' },
                      { value: 'dept-05', label: 'Human Resources' },
                    ]}
                  />
                </div>
              </div>

              {/* Section: Compensation */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-400" /> Compensation (Optional — defaults from seniority level)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Monthly Base Salary ($)" type="number" value={empForm.monthlyBaseSalary} onChange={e => setEmp('monthlyBaseSalary', e.target.value)} placeholder="Auto from seniority" />
                  <InputField label="Hourly Rate ($/hr)" type="number" value={empForm.hourlyRate} onChange={e => setEmp('hourlyRate', e.target.value)} placeholder="Auto from seniority" />
                </div>
              </div>

              {/* Section: Login Credentials */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-purple-400" /> Login Credentials
                </p>
                <InputField
                  label="Temporary Password"
                  type="password"
                  value={empForm.password}
                  onChange={e => setEmp('password', e.target.value)}
                  required
                  placeholder="Employee's initial password"
                  icon={Lock}
                />
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Share this password with the employee. They can change it after first login.
                </p>
              </div>

              {/* Seniority Preview */}
              {empForm.seniorityLevel && (
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">Seniority Defaults Preview</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {empForm.seniorityLevel === 'Junior'     && <><span className="text-slate-400">Base Salary:</span><span className="text-white font-bold">$4,800/mo</span><span className="text-slate-400 ml-2">Hourly:</span><span className="text-white font-bold">$30/hr</span><span className="text-slate-400 ml-2">Grade:</span><span className="text-white font-bold">B1</span></>}
                    {empForm.seniorityLevel === 'Mid-level'  && <><span className="text-slate-400">Base Salary:</span><span className="text-white font-bold">$6,720/mo</span><span className="text-slate-400 ml-2">Hourly:</span><span className="text-white font-bold">$42/hr</span><span className="text-slate-400 ml-2">Grade:</span><span className="text-white font-bold">B2</span></>}
                    {empForm.seniorityLevel === 'Senior'     && <><span className="text-slate-400">Base Salary:</span><span className="text-white font-bold">$8,320/mo</span><span className="text-slate-400 ml-2">Hourly:</span><span className="text-white font-bold">$52/hr</span><span className="text-slate-400 ml-2">Grade:</span><span className="text-white font-bold">C2</span></>}
                    {empForm.seniorityLevel === 'Lead'       && <><span className="text-slate-400">Base Salary:</span><span className="text-white font-bold">$10,400/mo</span><span className="text-slate-400 ml-2">Hourly:</span><span className="text-white font-bold">$65/hr</span><span className="text-slate-400 ml-2">Grade:</span><span className="text-white font-bold">D1</span></>}
                    {empForm.seniorityLevel === 'Executive'  && <><span className="text-slate-400">Base Salary:</span><span className="text-white font-bold">$13,600/mo</span><span className="text-slate-400 ml-2">Hourly:</span><span className="text-white font-bold">$85/hr</span><span className="text-slate-400 ml-2">Grade:</span><span className="text-white font-bold">E1</span></>}
                    <span className="text-slate-500">(override in Compensation section above)</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 disabled:opacity-60 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? 'Creating Account…' : 'Create Employee Account'}
              </button>
            </form>
          </div>
        )}

        {/* ── CASE 2: Public visitor (not logged in as HR) ── */}
        {!isHRUser && (
          <div className="space-y-6">
            {/* Access Restriction Notice */}
            <div className="glass-panel border border-rose-500/30 rounded-3xl p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center">
                <Lock className="w-8 h-8 text-rose-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Account Creation Restricted</h2>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Employee account creation is managed exclusively by your <span className="text-indigo-300 font-semibold">HR Department</span> or <span className="text-indigo-300 font-semibold">System Administrator</span>.
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Please contact your HR team to get your account set up.
                </p>
              </div>
              <button
                onClick={onNavigateLogin}
                className="mx-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Go to Login
              </button>
            </div>

            {/* Org Registration — only for first-time setup */}
            <div className="glass-panel border border-slate-700/60 rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-slate-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">First-Time Organization Setup</h3>
                  <p className="text-xs text-slate-500">Create a new organization and System Admin account</p>
                </div>
              </div>

              {successMsg && (
                <div className="mx-5 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" /> {successMsg}
                </div>
              )}
              {error && (
                <div className="mx-5 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">{error}</div>
              )}

              <form onSubmit={handleOrgSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Organization Name" value={orgForm.organizationName} onChange={e => setOrgForm({...orgForm, organizationName: e.target.value})} required placeholder="Acme Healthcare" />
                  <InputField label="Organization Code" value={orgForm.organizationCode} onChange={e => setOrgForm({...orgForm, organizationCode: e.target.value})} placeholder="ACME" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Admin First Name" value={orgForm.adminFirstName} onChange={e => setOrgForm({...orgForm, adminFirstName: e.target.value})} required placeholder="John" />
                  <InputField label="Admin Last Name"  value={orgForm.adminLastName}  onChange={e => setOrgForm({...orgForm, adminLastName:  e.target.value})} required placeholder="Smith" />
                </div>
                <InputField label="Admin Email" type="email" value={orgForm.adminEmail} onChange={e => setOrgForm({...orgForm, adminEmail: e.target.value})} required placeholder="admin@company.com" icon={Mail} />
                <InputField label="Admin Password" type="password" value={orgForm.adminPassword} onChange={e => setOrgForm({...orgForm, adminPassword: e.target.value})} required placeholder="Minimum 8 characters" icon={Lock} />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Building2 className="w-4 h-4" />
                  {loading ? 'Setting up…' : 'Set Up Organization'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
